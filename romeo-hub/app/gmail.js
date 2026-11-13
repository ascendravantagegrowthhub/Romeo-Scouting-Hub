import { baseUrl } from "./sign";

const SCOPE = "openid email https://www.googleapis.com/auth/gmail.send";
export const redirectUri = () => baseUrl() + "/api/gmail/callback";

export function authUrl(state) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri(), response_type: "code",
    scope: SCOPE, access_type: "offline", prompt: "consent", state,
  });
  return "https://accounts.google.com/o/oauth2/v2/auth?" + p;
}

async function token(params) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, ...params }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(j.error_description || j.error || "Token error"); e.code = j.error; throw e; }
  return j;
}

export const exchangeCode = (code) => token({ code, redirect_uri: redirectUri(), grant_type: "authorization_code" });
export const refreshAccess = (refresh_token) => token({ refresh_token, grant_type: "refresh_token" });

export function idTokenEmail(idToken) {
  try { return JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString()).email || ""; } catch { return ""; }
}

const clean = (s) => String(s).replace(/[\r\n]+/g, " ").trim();
const b64 = (s) => Buffer.from(s, "utf8").toString("base64");

export function buildRaw({ from, to, subject, body }) {
  const lines = [
    `From: ${clean(from)}`, `To: ${clean(to)}`, `Subject: =?UTF-8?B?${b64(clean(subject))}?=`,
    "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "",
    b64(body.replace(/\r?\n/g, "\r\n")).replace(/(.{76})/g, "$1\r\n"),
  ];
  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

export async function sendMail(accessToken, raw) {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST", headers: { Authorization: "Bearer " + accessToken, "content-type": "application/json" }, body: JSON.stringify({ raw }),
  });
  if (!res.ok) throw new Error("Gmail rejected the message (" + res.status + ")");
  return res.json();
}
