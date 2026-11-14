import crypto from "node:crypto";
const secret = () => process.env.NEXTAUTH_SECRET || "";
export const sign = (email, action) =>
  crypto.createHmac("sha256", secret()).update(`${email.toLowerCase()}|${action}`).digest("hex");
export function verify(email, action, sig) {
  if (!secret() || !email || !sig) return false;
  const a = Buffer.from(sign(email, action)), b = Buffer.from(String(sig));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export const baseUrl = () =>
  process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000");
