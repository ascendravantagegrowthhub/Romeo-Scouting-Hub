import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { writeEmail } from "@/lib/ai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req) {
  const a = await currentAccess();
  if (a.state !== "approved") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const offer = String(b.offer || "").trim().slice(0, 800);
  if (offer.length < 15) return NextResponse.json({ error: "Describe what you offer first (a sentence or two)." }, { status: 400 });
  try {
    const d = await writeEmail({
      domain: String(b.domain || "").slice(0, 100), name: String(b.name || "").slice(0, 40), niche: String(b.niche || "").slice(0, 80),
      title: String(b.title || "").slice(0, 120), profile: b.profile && typeof b.profile === "object" ? b.profile : {},
      offer, tone: ["friendly", "direct", "curious"].includes(b.tone) ? b.tone : "friendly",
      language: String(b.language || "").slice(0, 8), mode: b.mode === "followup" ? "followup" : "first",
      previous: b.previous && typeof b.previous === "object" ? { subject: String(b.previous.subject || "").slice(0, 120), body: String(b.previous.body || "").slice(0, 800) } : null,
    });
    return NextResponse.json(d);
  } catch (e) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 502 });
  }
}
