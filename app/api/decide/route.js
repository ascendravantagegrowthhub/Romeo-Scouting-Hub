import { verify } from "@/lib/sign";
import { setStatus } from "@/lib/db";
import { isAdmin } from "@/lib/admins";

export const dynamic = "force-dynamic";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const page = (body) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Romeo Hub</title>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f5f5f5"><div style="background:#fff;padding:28px;border-radius:12px;max-width:380px;box-shadow:0 1px 6px #0002">${body}</div>`,
  { headers: { "content-type": "text/html; charset=utf-8" } });

// GET only shows a confirmation button, so link scanners cannot approve anyone by accident.
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  const email = p.get("email") || "", action = p.get("action") || "", sig = p.get("sig") || "";
  if (!["approve", "deny"].includes(action) || !verify(email, action, sig)) return page("<h3>Link not valid</h3><p>This link is invalid or has been altered.</p>");
  return page(`<h3>${action === "approve" ? "Approve" : "Deny"} access?</h3><p>${esc(email)}</p>
<form method="POST"><input type="hidden" name="email" value="${esc(email)}"><input type="hidden" name="action" value="${esc(action)}"><input type="hidden" name="sig" value="${esc(sig)}">
<button style="padding:10px 18px;border:0;border-radius:8px;background:${action === "approve" ? "#1f8a5b" : "#c23b3b"};color:#fff;font-weight:600;cursor:pointer">Confirm ${action}</button></form>`);
}

export async function POST(req) {
  const f = await req.formData();
  const email = String(f.get("email") || ""), action = String(f.get("action") || ""), sig = String(f.get("sig") || "");
  if (!["approve", "deny"].includes(action) || !verify(email, action, sig)) return page("<h3>Link not valid</h3>");
  if (isAdmin(email)) return page("<h3>Owner accounts cannot be changed.</h3>");
  try { await setStatus(email, action === "approve" ? "approved" : "denied"); }
  catch { return page("<h3>Something went wrong</h3><p>Try again from the admin page.</p>"); }
  return page(`<h3>Done</h3><p>${esc(email)} is now <b>${action === "approve" ? "approved" : "denied"}</b>.</p>`);
}
