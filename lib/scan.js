import { safeFetch } from "./net";
import { extractEmails, rankEmails, sameSite, emailQuality } from "./extract";
import { buildProfile } from "./profile";

const PATHS = ["/policies/privacy-policy", "/pages/contact", "/pages/contact-us", "/pages/about-us", "/pages/about", "/policies/contact-information"];

export function scoreStore(emails, site, profile) {
  const p = profile || {}, n = (p.products || []).length, soc = (p.socials || []).length;
  let sc = 40 + (n >= 4 ? 20 : n >= 1 ? 8 : -25) + emailQuality(emails[0], site) + (soc >= 2 ? 7 : soc ? 3 : 0) + ((p.apps || []).length ? 5 : 0) + (p.desc ? 3 : 0);
  return Math.max(0, Math.min(100, Math.round(sc)));
}

export function normalizeHost(input) {
  const h = String(input || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0].replace(/:\d+$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) ? h : null;
}

function isShopify(res) {
  const h = res.headers;
  return /cdn\.shopify\.com|Shopify\.theme|myshopify\.com|shopify-section/i.test(res.text) ||
    h.has("x-shopid") || h.has("x-shopify-stage") || h.has("x-sorting-hat-shopid");
}

async function getHome(host) {
  try { return await safeFetch("https://" + host + "/"); }
  catch { return await safeFetch("http://" + host + "/"); }
}

// Never throws; always returns a result object.
export async function scanStore(input) {
  const host = normalizeHost(input);
  const out = { domain: input, site: host, isShopify: false, title: "", emails: [], sources: {}, error: "" };
  if (!host) { out.error = "Invalid domain"; return out; }
  try {
    const home = await getHome(host);
    const site = new URL(home.url).hostname.replace(/^www\./, "");
    out.site = site;
    out.title = (home.text.match(/<title[^>]*>([^<]{1,120})/i)?.[1] || "").trim();
    out.isShopify = isShopify(home);
    if (!out.isShopify) return out;
    const all = new Map();
    const take = (html, src) => extractEmails(html).forEach((e) => { if (!all.has(e)) all.set(e, src); });
    take(home.text, "/");
    const origin = new URL(home.url).origin;
    for (const p of PATHS) {
      if ([...all.keys()].some((e) => sameSite(e, site))) break;
      try {
        const r = await safeFetch(origin + p, { timeout: 6000 });
        if (r.status < 400) take(r.text, p);
      } catch {}
    }
    out.emails = rankEmails([...all.keys()], site).slice(0, 6);
    out.sources = Object.fromEntries(out.emails.map((e) => [e, all.get(e)]));
    if (out.emails.length) { try { out.profile = await buildProfile(home.text, origin); } catch {} }
    out.score = scoreStore(out.emails, site, out.profile);
  } catch (e) {
    out.error = e.name === "AbortError" ? "Timed out" : (e.message || "Failed");
  }
  return out;
}
