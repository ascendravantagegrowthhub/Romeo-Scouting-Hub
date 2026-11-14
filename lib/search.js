const NOISE = /(^|\.)(google|bing|duckduckgo|yahoo|facebook|instagram|youtube|twitter|x|linkedin|pinterest|reddit|tiktok|quora|amazon|etsy|ebay|walmart|alibaba|aliexpress|wikipedia|shopify|medium|yelp|trustpilot|tripadvisor|github|wordpress|blogspot|substack|forbes|g2|capterra|crunchbase|apple|microsoft|cloudflare|wix|squarespace|bigcommerce|woocommerce)\.[a-z.]+$/i;

export function hostFromUrl(u) {
  try {
    const h = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
    return NOISE.test(h) ? null : h;
  } catch { return null; }
}

export function buildQueries(niche) {
  const n = (niche || "").trim();
  return [
    `"powered by shopify" ${n}`,
    `${n} inurl:/collections/ "add to cart"`,
    `site:myshopify.com ${n}`,
    `${n} inurl:/products/ "powered by shopify"`,
  ].map((s) => s.replace(/\s+/g, " ").trim());
}

async function serper(q, page, country, mode) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ q, page, num: 10, gl: (country || "us").toLowerCase(), ...(mode === "new" ? { tbs: "qdr:m" } : {}) }),
  });
  if (!res.ok) throw new Error("Serper " + res.status);
  const j = await res.json();
  return (j.organic || []).map((r) => r.link);
}

async function brave(q, page, country, mode) {
  const p = new URLSearchParams({ q, count: "20", offset: String(page - 1), country: (country || "us").toUpperCase() });
  if (mode === "new") p.set("freshness", "pm");
  const res = await fetch("https://api.search.brave.com/res/v1/web/search?" + p, {
    headers: { "X-Subscription-Token": process.env.BRAVE_API_KEY, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Brave " + res.status);
  const j = await res.json();
  return (j.web?.results || []).map((r) => r.url);
}

export async function discover({ niche, provider, mode, depth, country }) {
  const fn = provider === "brave" ? brave : serper;
  const pages = Math.min(Math.max(+depth || 1, 1), 3);
  const jobs = [];
  for (const q of buildQueries(niche)) for (let p = 1; p <= pages; p++) jobs.push(fn(q, p, country, mode));
  const settled = await Promise.allSettled(jobs);
  const hosts = new Set(), errors = new Set();
  for (const s of settled) {
    if (s.status === "fulfilled") s.value.forEach((u) => { const h = hostFromUrl(u); if (h) hosts.add(h); });
    else errors.add(s.reason?.message || "Search failed");
  }
  return { domains: [...hosts], calls: jobs.length, errors: [...errors] };
}
