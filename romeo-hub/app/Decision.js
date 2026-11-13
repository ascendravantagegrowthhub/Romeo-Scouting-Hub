"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Decision({ email, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function go(next) {
    setBusy(true);
    await fetch("/api/admin/decision", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, status: next }) });
    setBusy(false);
    router.refresh();
  }
  return (
    <>
      {status !== "approved" && <button className="b" disabled={busy} onClick={() => go("approved")}>Approve</button>}
      {status === "pending" && <button className="b g" disabled={busy} onClick={() => go("denied")}>Deny</button>}
      {status === "approved" && <button className="b g" disabled={busy} onClick={() => go("denied")}>Revoke</button>}
    </>
  );
}
