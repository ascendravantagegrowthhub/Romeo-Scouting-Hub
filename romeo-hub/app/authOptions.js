import GoogleProvider from "next-auth/providers/google";
import { isAdmin } from "./admins";
import { getUser, createUser, touchUser } from "./db";
import { notifyNewUser } from "./mail";

export const authOptions = {
  providers: [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user, profile }) {
      const email = (user.email || "").toLowerCase();
      if (!email || profile?.email_verified === false) return false;
      const admin = isAdmin(email);
      try {
        const existing = await getUser(email);
        if (!existing) {
          await createUser({ email, name: user.name, image: user.image, status: admin ? "approved" : "pending" });
          if (!admin) await notifyNewUser({ email, name: user.name, image: user.image }).catch((e) => console.error("mail", e));
        } else {
          await touchUser(email, { name: user.name, image: user.image });
        }
      } catch (e) {
        console.error(e);
        if (!admin) return false; // fail closed for everyone except the owners
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) session.user.email = String(token.email || session.user.email || "").toLowerCase();
      return session;
    },
  },
};
