import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { verify, baseUrl } from "@/lib/sign";
import { exchangeCode, idTokenEmail } from "@/lib/gmail";
import { encrypt } from "@/lib/crypto";
import { saveToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const done = (r) => NextResponse.redirect(baseUrl() + "/?gmail=" + r);
  const a = await currentAccess();
  if (a.state !== "approved") return NextResponse.redirect(baseUrl() + "/login");
  const p = new URL(req.url).searchParams;
  const [ts, sig] = (p.get("state") || "").split(".");
  if (!p.get("code") || !ts || Date.now() - Number(ts) > 10 * 60 * 1000 || !verify(a.email, "gmail" + ts, sig)) return done("error");
  try {
    const t = await exchangeCode(p.get("code"));
    if (!t.refresh_token) return done("error");
    await saveToken(a.email, idTokenEmail(t.id_token) || a.email, encrypt(t.refresh_token));
    return done("connected");
  } catch (e) { console.error(e); return done("error"); }
}
