import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { isAdmin } from "./admins";
import { getUser } from "./db";

// state: "anon" | "pending" | "denied" | "approved"
export async function currentAccess() {
  const s = await getServerSession(authOptions);
  const email = s?.user?.email?.toLowerCase();
  if (!email) return { state: "anon" };
  if (isAdmin(email)) return { state: "approved", admin: true, email, user: s.user };
  let u = null;
  try { u = await getUser(email); } catch {}
  const state = u?.status === "approved" ? "approved" : u?.status === "denied" ? "denied" : "pending";
  return { state, admin: false, email, user: s.user };
}
