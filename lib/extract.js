const EMAIL = /[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}/gi;
const JUNK_DOMAIN = /(sentry|wixpress|example\.|yourdomain|domain\.com|email\.com|shopify\.com|myshopify\.com|schema\.org|w3\.org|godaddy|squarespace|your-?email|test\.com)/i;
const FILE_EXT = /\.(png|jpe?g|gif|svg|webp|css|js|woff2?|ico|avif)$/i;
const ROLE = ["hello", "info", "contact", "support", "hi", "team", "care", "help", "sales", "shop", "orders", "customerservice", "wholesale"];

function decodeCf(hex) {
  const k = parseInt(hex.slice(0, 2), 16);
  let s = "";
  for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ k);
  return s;
}

function normalize(html) {
  return html
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&commat;/gi, "@").replace(/&period;/gi, ".")
    .replace(/\\u0040/gi, "@").replace(/\\u002e/gi, ".")
    .replace(/\s*[\[(]\s*at\s*[\])]\s*/gi, "@")
    .replace(/\s*[\[(]\s*dot\s*[\])]\s*/gi, ".");
}

function clean(e) {
  e = e.toLowerCase().replace(/[.,;:]+$/, "");
  if (e.length > 80 || e.split("@")[0].length > 40) return null;
  const dom = e.split("@")[1] || "";
  if (FILE_EXT.test(e) || JUNK_DOMAIN.test(dom) || /^\d/.test(dom)) return null;
  return e;
}

export function extractEmails(html) {
  const found = new Set();
  const add = (s) => { const c = clean(s); if (c) found.add(c); };
  for (const m of html.matchAll(/data-cfemail="([0-9a-f]+)"/gi)) { try { add(decodeCf(m[1])); } catch {} }
  const text = normalize(html);
  for (const m of text.matchAll(/mailto:([^"'?\s<>]+)/gi)) {
    let v = m[1]; try { v = decodeURIComponent(v); } catch {}
    (v.match(EMAIL) || []).forEach(add);
  }
  (text.match(EMAIL) || []).forEach(add);
  return [...found];
}

export const sameSite = (email, host) => {
  const d = email.split("@")[1];
  return d === host || d.endsWith("." + host) || host.endsWith("." + d);
};

export function rankEmails(emails, host) {
  const score = (e) => (sameSite(e, host) ? 10 : 0) + (ROLE.includes(e.split("@")[0]) ? 3 : 0);
  return [...emails].sort((a, b) => score(b) - score(a));
}
