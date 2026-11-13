import dns from "node:dns/promises";
import net from "node:net";

const UA = "Mozilla/5.0 (compatible; StoreScout/1.0)";
const BLOCKED = /(^|\.)(localhost|local|internal|lan|home|corp|intranet)$/i;

function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const l = ip.toLowerCase();
    return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") ||
      l.startsWith("fe80") || l.startsWith("::ffff:");
  }
  return true;
}

// Blocks SSRF: only public hostnames, never IPs or internal names.
export async function assertPublicHost(host) {
  if (!host || net.isIP(host) || BLOCKED.test(host) || !host.includes(".")) throw new Error("blocked host");
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivate(a.address))) throw new Error("blocked host");
}

async function readLimited(res, max) {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const dec = new TextDecoder();
  let out = "", size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    out += dec.decode(value, { stream: true });
    if (size > max) { try { await reader.cancel(); } catch {} break; }
  }
  return out;
}

export async function safeFetch(url, { timeout = 7000, maxBytes = 900000, hops = 4 } = {}) {
  let current = url;
  for (let i = 0; i <= hops; i++) {
    const u = new URL(current);
    if (!["http:", "https:"].includes(u.protocol)) throw new Error("bad protocol");
    await assertPublicHost(u.hostname);
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeout);
    try {
      const res = await fetch(u, {
        redirect: "manual", signal: ac.signal,
        headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
      });
      const loc = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && loc) { current = new URL(loc, u).toString(); continue; }
      const text = await readLimited(res, maxBytes);
      return { status: res.status, url: u.toString(), headers: res.headers, text };
    } finally { clearTimeout(timer); }
  }
  throw new Error("too many redirects");
}
