import { NextResponse } from "next/server";
import { currentAccess } from "@/lib/guard";
import { sign, baseUrl } from "@/lib/sign";
import { authUrl } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await currentAccess();
  if (a.state !== "approved") return NextResponse.redirect(baseUrl() + "/login");
  const ts = Date.now();
  return NextResponse.redirect(authUrl(`${ts}.${sign(a.email, "gmail" + ts)}`));
}
