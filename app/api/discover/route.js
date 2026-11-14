import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { discover } from "@/lib/search";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req) {
  const a = await currentAccess();
  if (a.state !== "approved") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const provider = b.provider === "brave" ? "brave" : "serper";
  const key = provider === "brave" ? process.env.BRAVE_API_KEY : process.env.SERPER_API_KEY;
  if (!key) return NextResponse.json({ error: `Add ${provider === "brave" ? "BRAVE_API_KEY" : "SERPER_API_KEY"} in your environment variables.` }, { status: 400 });
  const r = await discover({ niche: String(b.niche || "").slice(0, 120), provider, mode: b.mode === "new" ? "new" : "existing", depth: b.depth, country: String(b.country || "us").slice(0, 2) });
  if (!r.domains.length && r.errors.length) return NextResponse.json({ error: r.errors[0] }, { status: 502 });
  return NextResponse.json(r);
}
