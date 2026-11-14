import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { getToken, countSends } from "@/lib/db";

export const dynamic = "force-dynamic";
const cap = () => Number(process.env.MAX_SENDS_PER_DAY) || 40;

export async function GET() {
  const a = await currentAccess();
  if (a.state !== "approved") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const t = await getToken(a.email);
    const sentToday = await countSends(a.email, new Date(Date.now() - 24 * 3600 * 1000).toISOString());
    return NextResponse.json({ connected: !!t, address: t?.gmail_address || "", sentToday, cap: cap() });
  } catch { return NextResponse.json({ error: "Database error" }, { status: 500 }); }
}
