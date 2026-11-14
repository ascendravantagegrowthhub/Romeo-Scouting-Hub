import { redirect } from "next/navigation";
import { currentAccess } from "@/lib/guard";
import AutoRefresh from "@/components/AutoRefresh";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function Pending() {
  const a = await currentAccess();
  if (a.state === "anon") redirect("/login");
  if (a.state === "approved") redirect("/");
  const denied = a.state === "denied";
  return (
    <main className="center">
      <div className="card auth">
        <img className="mark" src="/logo.png" alt="" width="44" height="44" />
        <h1>{denied ? "Access not granted" : "Waiting for approval"}</h1>
        <p className="sub">
          {denied
            ? `The request for ${a.email} was not approved.`
            : `Your request for ${a.email} has been sent. You will get in as soon as it is approved. This page updates by itself.`}
        </p>
        {!denied && <AutoRefresh />}
        <SignOutButton />
      </div>
    </main>
  );
}
