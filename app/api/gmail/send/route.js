import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { getToken, delToken, countSends, hasSent, countTo, logSend } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { refreshAccess, buildRaw, sendMail } from "@/lib/gmail";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@<>,;]+@[^\s@<>,;]+\.[a-z]{2,}$/i;
const fail = (error, status = 400, code) => NextResponse.json({ error, code }, { status });

export async function POST(req) {
  const a = await currentAccess();
  if (a.state !== "approved") return fail("Unauthorized", 401);
  const b = await req.json().catch(() => ({}));
  const to = String(b.to || "").trim(), subject = String(b.subject || "").trim(), body = String(b.body || "").trim();
  if (!EMAIL.test(to) || !subject || body.length < 20 || body.length > 4000) return fail("Invalid message.");
  try {
    const t = await getToken(a.email);
    if (!t) return fail("Connect Gmail first.", 400, "noauth");
    const limit = Number(process.env.MAX_SENDS_PER_DAY) || 40;
    if ((await countSends(a.email, new Date(Date.now() - 24 * 3600 * 1000).toISOString())) >= limit) return fail(`Daily limit of ${limit} reached. Sending resumes tomorrow.`, 429, "cap");
    if (b.followup) { if ((await countTo(a.email, to)) !== 1) return fail("A follow-up is only allowed after exactly one earlier email.", 409, "dupe"); }
    else if (await hasSent(a.email, to)) return fail("You already emailed this address.", 409, "dupe");
    let access;
    try { access = (await refreshAccess(decrypt(t.refresh_token_enc))).access_token; }
    catch (e) {
      if (e.code === "invalid_grant") { await delToken(a.email).catch(() => {}); return fail("Reconnect Gmail: Google ended the connection.", 401, "noauth"); }
      throw e;
    }
    await sendMail(access, buildRaw({ from: t.gmail_address, to, subject, body }));
    await logSend({ sender: a.email, to, domain: String(b.domain || "").slice(0, 100), subject }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(String(e.message || "Send failed"), 502);
  }
}
