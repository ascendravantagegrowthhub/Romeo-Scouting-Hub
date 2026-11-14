import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { isAdmin } from "@/lib/admins";
import { setStatus } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const a = await currentAccess();
  if (!a.admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { email, status } = await req.json().catch(() => ({}));
  if (!email || !["approved", "denied", "pending"].includes(status)) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (isAdmin(email)) return NextResponse.json({ error: "Owners cannot be changed" }, { status: 400 });
  await setStatus(email, status);
  return NextResponse.json({ ok: true });
}
