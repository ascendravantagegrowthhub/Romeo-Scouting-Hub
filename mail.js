import { sign, baseUrl } from "./sign";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export async function notifyNewUser({ email, name, image }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.NOTIFY_EMAIL || "Ascendravantage@gmail.com";
  const link = (action) => `${baseUrl()}/api/decide?email=${encodeURIComponent(email)}&action=${action}&sig=${sign(email, action)}`;
  const btn = (href, label, bg) => `<a href="${href}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;margin-right:8px">${label}</a>`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px">
    <h2 style="margin:0 0 8px">New access request</h2>
    ${image ? `<img src="${esc(image)}" width="56" height="56" style="border-radius:50%" alt="">` : ""}
    <p><b>${esc(name || "Unknown")}</b><br>${esc(email)}</p>
    <p>${btn(link("approve"), "Approve", "#1f8a5b")}${btn(link("deny"), "Deny", "#c23b3b")}</p>
    <p style="color:#666;font-size:13px">You can also manage everyone at ${baseUrl()}/admin</p></div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM || "Romeo Hub <onboarding@resend.dev>", to: [to], subject: `Romeo Hub: ${name || email} wants access`, html }),
  });
}
