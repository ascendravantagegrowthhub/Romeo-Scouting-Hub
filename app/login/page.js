import { redirect } from "next/navigation";
import { currentAccess } from "@/lib/guard";
import GoogleButton from "@/components/GoogleButton";

export const dynamic = "force-dynamic";

export default async function Login() {
  const a = await currentAccess();
  if (a.state === "approved") redirect("/");
  if (a.state !== "anon") redirect("/pending");
  return (
    <main className="center">
      <div className="card auth">
        <img className="me big" src="/romeo.jpg" alt="Romeo" width="112" height="112" />
        <img className="mark" src="/logo.png" alt="" width="44" height="44" />
        <h1>Romeo Hub</h1>
        <p className="sub">Sign in with your Google account. New accounts are reviewed before access is granted.</p>
        <GoogleButton />
        <p className="fine"><a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms of Service</a></p>
      </div>
    </main>
  );
}
