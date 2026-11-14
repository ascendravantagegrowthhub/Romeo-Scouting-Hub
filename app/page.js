import { redirect } from "next/navigation";
import { currentAccess } from "@/lib/guard";
import Header from "@/components/Header";
import Scout from "@/components/Scout";
import Landing from "@/components/Landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const a = await currentAccess();
  if (a.state === "anon") return <Landing />;
  if (a.state !== "approved") redirect("/pending");
  return (
    <>
      <Header user={a.user} admin={a.admin} />
      <div className="wrap">
        <section className="hero">
          <img className="me" src="/romeo.jpg" alt="Romeo" width="84" height="84" />
          <div>
            <h1>Romeo Hub</h1>
            <p className="sub">Find Shopify stores, collect contact emails, work the pipeline.</p>
          </div>
        </section>
        <Scout />
      </div>
    </>
  );
}
