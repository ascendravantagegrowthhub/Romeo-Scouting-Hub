import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { scanStore } from "@/lib/scan";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req) {
  const a = await currentAccess();
  if (a.state !== "approved") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const list = (Array.isArray(body.domains) ? body.domains : []).slice(0, 3);
  const results = await Promise.all(list.map((d) => scanStore(d)));
  return NextResponse.json({ results });
}
