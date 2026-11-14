import { redirect } from "next/navigation";
import { currentAccess } from "@/lib/guard";
import { listUsers } from "@/lib/db";
import { isAdmin } from "@/lib/admins";
import Header from "@/components/Header";
import Decision from "@/components/Decision";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const a = await currentAccess();
  if (!a.admin) redirect("/");
  let users = [], err = "";
  try { users = await listUsers(); } catch (e) { err = "Could not load users. Check your Supabase settings."; }
  const order = { pending: 0, approved: 1, denied: 2 };
  users.sort((x, y) => (order[x.status] ?? 3) - (order[y.status] ?? 3));
  const cls = { pending: "warn", approved: "ok", denied: "bad" };
  return (
    <>
      <Header user={a.user} admin />
      <div className="wrap">
        <h1>Approvals</h1>
        <p className="sub">{users.filter((u) => u.status === "pending").length} waiting. Owners are always approved.</p>
        {err && <p className="note">{err}</p>}
        <div className="card tw">
          {users.length ? (
            <table style={{ minWidth: 560 }}>
              <thead><tr><th>Person</th><th>Status</th><th>Last sign-in</th><th></th></tr></thead>
              <tbody>{users.map((u) => (
                <tr key={u.email}>
                  <td><span className="dom">{u.name || u.email}</span><div style={{ fontSize: 12, color: "var(--mute)" }}>{u.email}</div></td>
                  <td><span className={"badge " + (cls[u.status] || "")}>{isAdmin(u.email) ? "owner" : u.status}</span></td>
                  <td style={{ fontSize: 13 }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : ""}</td>
                  <td>{!isAdmin(u.email) && <Decision email={u.email} status={u.status} />}</td>
                </tr>))}</tbody>
            </table>
          ) : <div className="empty">Nobody has requested access yet.</div>}
        </div>
      </div>
    </>
  );
}
