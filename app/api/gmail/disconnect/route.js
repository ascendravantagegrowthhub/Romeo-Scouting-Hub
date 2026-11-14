import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { delToken } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const a = await currentAccess();
  if (a.state !== "approved") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await delToken(a.email).catch(() => {});
  return NextResponse.json({ ok: true });
}
