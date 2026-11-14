import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ serper: !!process.env.SERPER_API_KEY, brave: !!process.env.BRAVE_API_KEY });
}
