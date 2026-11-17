// Minimal Supabase (PostgREST) client using the service key. Server-side only.
const base = () => process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/users";
const headers = (extra = {}) => ({
  apikey: process.env.SUPABASE_SERVICE_KEY,
  ...(String(process.env.SUPABASE_SERVICE_KEY).startsWith("sb_") ? {} : { Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY }),
  "Content-Type": "application/json",
  ...extra,
});
const eq = (email) => "?email=eq." + encodeURIComponent(email.toLowerCase());

async function check(res) {
  if (!res.ok) throw new Error("Database error " + res.status + ": " + (await res.text()).slice(0, 200));
  return res;
}

export async function getUser(email) {
  const res = await check(await fetch(base() + eq(email) + "&select=*", { headers: headers(), cache: "no-store" }));
  return (await res.json())[0] || null;
}

export async function createUser({ email, name, image, status }) {
  await check(await fetch(base(), {
    method: "POST", headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ email: email.toLowerCase(), name, image, status, last_login: new Date().toISOString() }),
  }));
}

export async function touchUser(email, { name, image }) {
  await check(await fetch(base() + eq(email), {
    method: "PATCH", headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ name, image, last_login: new Date().toISOString() }),
  }));
}

export async function setStatus(email, status) {
  await check(await fetch(base() + eq(email), {
    method: "PATCH", headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ status, decided_at: new Date().toISOString() }),
  }));
}

export async function listUsers() {
  const res = await check(await fetch(base() + "?select=*&order=created_at.desc", { headers: headers(), cache: "no-store" }));
  return res.json();
}

// ---- Gmail connection and send log ----
const tbl = (name) => process.env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + name;

export async function getToken(email) {
  const res = await check(await fetch(tbl("gmail_tokens") + eq(email) + "&select=*", { headers: headers(), cache: "no-store" }));
  return (await res.json())[0] || null;
}
export async function saveToken(email, address, enc) {
  await check(await fetch(tbl("gmail_tokens") + "?on_conflict=email", {
    method: "POST", headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ email: email.toLowerCase(), gmail_address: address, refresh_token_enc: enc, connected_at: new Date().toISOString() }),
  }));
}
export async function delToken(email) {
  await check(await fetch(tbl("gmail_tokens") + eq(email), { method: "DELETE", headers: headers({ Prefer: "return=minimal" }) }));
}
export async function countSends(sender, sinceIso) {
  const url = tbl("sends") + "?sender=eq." + encodeURIComponent(sender.toLowerCase()) + "&sent_at=gte." + encodeURIComponent(sinceIso) + "&select=id";
  const res = await check(await fetch(url, { headers: headers(), cache: "no-store" }));
  return (await res.json()).length;
}
export async function hasSent(sender, to) {
  const url = tbl("sends") + "?sender=eq." + encodeURIComponent(sender.toLowerCase()) + "&to_email=eq." + encodeURIComponent(to.toLowerCase()) + "&select=id&limit=1";
  const res = await check(await fetch(url, { headers: headers(), cache: "no-store" }));
  return (await res.json()).length > 0;
}
export async function logSend({ sender, to, domain, subject }) {
  await check(await fetch(tbl("sends"), {
    method: "POST", headers: headers({ Prefer: "return=minimal" }),
    body: JSON.stringify({ sender: sender.toLowerCase(), to_email: to.toLowerCase(), domain, subject }),
  }));
}
export async function countTo(sender, to) {
  const url = tbl("sends") + "?sender=eq." + encodeURIComponent(sender.toLowerCase()) + "&to_email=eq." + encodeURIComponent(to.toLowerCase()) + "&select=id";
  const res = await check(await fetch(url, { headers: headers(), cache: "no-store" }));
  return (await res.json()).length;
}
