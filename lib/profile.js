import { safeFetch } from "./net";

const dec = (s) => String(s).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;/g, "’").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const strip = (h) => dec(h.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const meta = (html, name) => {
  const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i")) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"));
  return m ? dec(m[1]).trim() : "";
};

const APPS = {
  Klaviyo: /klaviyo/i, "Judge.me": /judge\.?me/i, Loox: /loox\.io/i, Yotpo: /yotpo/i, Okendo: /okendo/i, Stamped: /stamped\.io/i,
  Gorgias: /gorgias/i, Tidio: /tidio/i, Recharge: /rechargepayments/i, Omnisend: /omnisend/i, Mailchimp: /mailchimp|chimpstatic/i,
  Afterpay: /afterpay/i, Klarna: /klarna/i, "Meta Pixel": /connect\.facebook\.net/i, "TikTok Pixel": /analytics\.tiktok\.com/i,
};

// Facts about the store that a personalized email can truthfully reference.
export async function buildProfile(html, origin) {
  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)].map((m) => strip(m[1]).slice(0, 90)).filter((t) => t.length > 2).slice(0, 8);
  const socials = ["instagram", "tiktok", "facebook", "youtube", "pinterest"].filter((s) => new RegExp(s + "\\.com/[A-Za-z0-9_.@-]", "i").test(html));
  const apps = Object.entries(APPS).filter(([, re]) => re.test(html)).map(([k]) => k);
  let products = [];
  try {
    const r = await safeFetch(origin + "/products.json?limit=8", { timeout: 5000, maxBytes: 400000 });
    if (r.status < 400) {
      products = (JSON.parse(r.text).products || []).slice(0, 6).map((p) => {
        const prices = (p.variants || []).map((v) => parseFloat(v.price)).filter((n) => n > 0);
        return { t: String(p.title || "").slice(0, 80), type: String(p.product_type || "").slice(0, 40), price: prices.length ? Math.min(...prices) : undefined };
      });
    }
  } catch {}
  return {
    name: meta(html, "og:site_name").slice(0, 60),
    desc: (meta(html, "og:description") || meta(html, "description")).slice(0, 240),
    lang: ((html.match(/<html[^>]*\blang=["']([a-zA-Z-]+)/i) || [])[1] || "").slice(0, 8),
    headings, products, apps, socials,
  };
}
