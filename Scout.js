"use client";
import { useEffect, useRef, useState } from "react";
import Outreach from "./Outreach";

const STAGES = ["new", "contacted", "replied", "won", "skip"];
const CFG = { niche: "", mode: "existing", provider: "serper", depth: 1, country: "us", autoScan: true };

const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function parseHosts(text) {
  const out = new Set();
  for (const raw of text.split(/[\s,;"'<>]+/)) {
    const t = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0].replace(/:\d+$/, "");
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(t) && t.length < 100 && !/\.(png|jpe?g|gif|svg|css|js)$/.test(t)) out.add(t);
  }
  return [...out];
}

function status(l) {
  if (l.scan === "queued") return ["Queued", ""];
  if (l.scan === "scanning") return ["Scanning", "warn"];
  if (l.scan === "error") return ["Error", "bad"];
  if (!l.isShopify) return ["Not Shopify", ""];
  return l.emails?.length || l.email ? ["Email found", "ok"] : ["No email", "warn"];
}

export default function Scout() {
  const [tab, setTab] = useState("find");
  const [leads, setLeads] = useState([]);
  const [cfg, setCfg] = useState(CFG);
  const [suppress, setSuppress] = useState("");
  const [conf, setConf] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [prog, setProg] = useState({ done: 0, total: 0 });
  const [msg, setMsg] = useState("");
  const [paste, setPaste] = useState("");
  const [filter, setFilter] = useState("all");
  const leadsRef = useRef([]);
  const runRef = useRef(false);
  const stopRef = useRef(false);

  useEffect(() => {
    const L = load("ss-leads", []).map((l) => (l.scan === "scanning" ? { ...l, scan: "queued" } : l));
    leadsRef.current = L; setLeads(L);
    setCfg({ ...CFG, ...load("ss-cfg", {}) });
    setSuppress(load("ss-supp", ""));
    fetch("/api/config").then((r) => r.json()).then(setConf).catch(() => {});
    if (new URLSearchParams(location.search).get("gmail")) setTab("out");
    setReady(true);
  }, []);
  useEffect(() => { if (ready) save("ss-cfg", cfg); }, [cfg, ready]);
  useEffect(() => { if (ready) save("ss-supp", suppress); }, [suppress, ready]);

  const commit = (n) => { leadsRef.current = n; setLeads(n); save("ss-leads", n); };
  const patch = (domain, f) => commit(leadsRef.current.map((l) => (l.domain === domain ? { ...l, ...f } : l)));
  const blocked = () => suppress.toLowerCase().split(/[\s,;]+/).filter(Boolean);
  const isBlocked = (l) => { const b = blocked(); return b.includes((l.site || l.domain).toLowerCase()) || (l.email && b.includes(l.email.toLowerCase())); };

  async function api(path, body) {
    const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (r.status === 401) throw new Error("Your session expired. Refresh the page and sign in again.");
    if (!r.ok && !j.error) throw new Error("Request failed (" + r.status + ")");
    return j;
  }

  function addDomains(list, niche) {
    const have = new Set(leadsRef.current.flatMap((l) => [l.domain, l.site].filter(Boolean)));
    const b = blocked();
    const fresh = list.filter((d) => !have.has(d) && !b.includes(d)).map((d) => ({
      domain: d, site: d, niche: niche || "", scan: "queued", isShopify: false, emails: [], email: "", name: "", stage: "new", title: "", error: "", added: Date.now(),
    }));
    commit([...leadsRef.current, ...fresh]);
    return fresh.length;
  }

  async function runQueue() {
    if (runRef.current) return;
    runRef.current = true; stopRef.current = false; setRunning(true);
    const todo = leadsRef.current.filter((l) => l.scan === "queued").map((l) => l.domain);
    let i = 0, done = 0;
    setProg({ done: 0, total: todo.length });
    const worker = async () => {
      while (!stopRef.current) {
        const d = todo[i++];
        if (!d) return;
        patch(d, { scan: "scanning" });
        try {
          const r = await api("/api/scan", { domains: [d] });
          const res = r.results?.[0];
          if (!res) throw new Error(r.error || "No result");
          patch(d, { scan: res.error && !res.isShopify ? "error" : "done", isShopify: res.isShopify, site: res.site || d, title: res.title, emails: res.emails, email: res.emails[0] || "", profile: res.profile, error: res.error || "" });
        } catch (e) { patch(d, { scan: "error", error: String(e.message || e) }); }
        done++; setProg({ done, total: todo.length });
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    runRef.current = false; setRunning(false);
  }

  async function discover() {
    setBusy(true); setMsg("Searching…");
    try {
      const r = await api("/api/discover", { niche: cfg.niche, mode: cfg.mode, provider: cfg.provider, depth: cfg.depth, country: cfg.country });
      if (r.error) throw new Error(r.error);
      const added = addDomains(r.domains, cfg.niche);
      setMsg(`${r.domains.length} candidates found, ${added} new. Used ${r.calls} search calls.${r.errors?.length ? " Some calls failed: " + r.errors[0] : ""}`);
      if (cfg.autoScan && added) runQueue();
    } catch (e) { setMsg(String(e.message || e)); }
    setBusy(false);
  }

  function doImport() {
    const hosts = parseHosts(paste);
    if (!hosts.length) return setMsg("No store domains found in that text.");
    const added = addDomains(hosts, cfg.niche);
    setMsg(`${hosts.length} domains found, ${added} new.`);
    setPaste("");
    if (added) { setTab("leads"); runQueue(); }
  }

  function exportCsv() {
    const rows = [["domain", "site", "shopify", "email", "all_emails", "name", "niche", "stage"],
      ...leadsRef.current.map((l) => [l.domain, l.site, l.isShopify ? "yes" : "no", l.email, (l.emails || []).join(" "), l.name, l.niche, l.stage])];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "store-scout.csv"; a.click();
  }

  const c = (f) => leads.filter(f).length;
  const shown = leads.filter((l) => {
    const [s] = status(l);
    return filter === "all" || (filter === "email" && s === "Email found") || (filter === "noemail" && s === "No email") || (filter === "notshop" && s === "Not Shopify") || (filter === "queued" && s === "Queued") || (filter === "error" && s === "Error");
  });
  const set = (k) => (e) => setCfg({ ...cfg, [k]: e.target.value });
  const noKeys = conf && !conf.serper && !conf.brave;

  return (
    <div className="wrap">
      <nav role="tablist">
        {[["find", "Find stores"], ["import", "Import links"], ["leads", "Leads"], ["out", "Outreach"]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}{k === "leads" && <span className="n">{leads.length}</span>}</button>
        ))}
      </nav>

      {(running || prog.total > 0) && (
        <div className="card">
          <div>{running ? "Scanning stores for emails" : "Last scan"}: {prog.done} of {prog.total}</div>
          <div className="bar"><i style={{ width: (prog.total ? (prog.done / prog.total) * 100 : 0) + "%" }} /></div>
          {running ? <button className="b g" onClick={() => { stopRef.current = true; }}>Stop</button>
            : c((l) => l.scan === "queued") > 0 && <button className="b" onClick={runQueue}>Scan {c((l) => l.scan === "queued")} queued</button>}
        </div>
      )}

      {tab === "find" && (<>
        <div className="card">
          <h2>Automatic discovery</h2>
          <p className="h">Searches Google or Brave with Shopify footprints, then checks each hit to confirm it is a Shopify store and finds its email.</p>
          {noKeys && <p className="note">No search key is configured yet. Add SERPER_API_KEY or BRAVE_API_KEY in your Vercel environment variables.</p>}
          <label htmlFor="niche">Niche or product (leave empty for any store)</label>
          <input id="niche" value={cfg.niche} onChange={set("niche")} placeholder="e.g. organic dog treats" />
          <div className="row">
            <div><label>Which stores</label><div className="seg">
              <button aria-pressed={cfg.mode === "existing"} onClick={() => setCfg({ ...cfg, mode: "existing" })}>Existing</button>
              <button aria-pressed={cfg.mode === "new"} onClick={() => setCfg({ ...cfg, mode: "new" })}>New (past month)</button></div></div>
            <div><label htmlFor="prov">Search source</label><select id="prov" value={cfg.provider} onChange={set("provider")}>
              <option value="serper" disabled={conf && !conf.serper}>Google (Serper)</option>
              <option value="brave" disabled={conf && !conf.brave}>Brave Search</option></select></div>
            <div><label htmlFor="dep">Depth</label><select id="dep" value={cfg.depth} onChange={(e) => setCfg({ ...cfg, depth: +e.target.value })}>
              <option value={1}>Light (4 searches)</option><option value={2}>Medium (8)</option><option value={3}>Deep (12)</option></select></div>
            <div><label htmlFor="cc">Country code</label><input id="cc" maxLength={2} value={cfg.country} onChange={set("country")} /></div>
          </div>
          <label><input type="checkbox" checked={cfg.autoScan} onChange={(e) => setCfg({ ...cfg, autoScan: e.target.checked })} /> Scan for emails as soon as stores are found</label>
          <button className="b" disabled={busy || noKeys} onClick={discover}>{busy ? "Searching…" : "Find stores"}</button>
          {msg && <div className="msg">{msg}</div>}
        </div>
      </>)}

      {tab === "import" && (
        <div className="card">
          <h2>Import your own list</h2>
          <p className="h">Paste store links or domains, or upload a CSV or text file. Up to a few thousand at once is fine.</p>
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"brand.com\nhttps://another-store.co/products/x"} />
          <label htmlFor="f">Or upload a file</label>
          <input id="f" type="file" accept=".csv,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) f.text().then((t) => setPaste((p) => p + "\n" + t)); }} />
          <div style={{ marginTop: 12 }}><button className="b" onClick={doImport}>Add and scan</button></div>
          {msg && <div className="msg">{msg}</div>}
        </div>
      )}

      {tab === "leads" && (<>
        <div className="stat">
          <div><b>{leads.length}</b>stores</div>
          <div><b>{c((l) => l.isShopify)}</b>confirmed Shopify</div>
          <div><b>{c((l) => l.isShopify && l.email)}</b>with email</div>
          <div><b>{c((l) => l.stage === "contacted")}</b>contacted</div>
        </div>
        <div className="card">
          <div className="row">
            <div><label htmlFor="flt">Show</label><select id="flt" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option><option value="email">Email found</option><option value="noemail">No email</option><option value="notshop">Not Shopify</option><option value="queued">Queued</option><option value="error">Errors</option></select></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="b g" onClick={exportCsv}>Download CSV</button>
            <button className="b g" onClick={() => { commit(leadsRef.current.map((l) => (l.scan === "error" ? { ...l, scan: "queued", error: "" } : l))); runQueue(); }}>Retry errors</button>
            <button className="b g" onClick={() => { if (confirm("Delete all leads?")) commit([]); }}>Clear all</button>
          </div>
        </div>
        <div className="card tw">
          {shown.length ? (<table>
            <thead><tr><th>Store</th><th>Status</th><th>Email</th><th>Name</th><th>Stage</th><th></th></tr></thead>
            <tbody>{shown.map((l) => { const [s, k] = status(l); return (
              <tr key={l.domain}>
                <td><a className="dom" href={"https://" + (l.site || l.domain)} target="_blank" rel="noopener noreferrer">{l.site || l.domain}</a>{l.title && <div style={{ fontSize: 12, color: "var(--mute)" }}>{l.title.slice(0, 48)}</div>}</td>
                <td><span className={"badge " + k} title={l.error}>{s}</span></td>
                <td><input list={"em-" + l.domain} value={l.email} onChange={(e) => patch(l.domain, { email: e.target.value.trim() })} placeholder="email" /><datalist id={"em-" + l.domain}>{(l.emails || []).map((e) => <option key={e} value={e} />)}</datalist></td>
                <td><input value={l.name} onChange={(e) => patch(l.domain, { name: e.target.value })} placeholder="first name" /></td>
                <td><select value={l.stage} onChange={(e) => patch(l.domain, { stage: e.target.value })}>{STAGES.map((x) => <option key={x}>{x}</option>)}</select></td>
                <td><button className="b g" aria-label={"Delete " + l.domain} onClick={() => commit(leadsRef.current.filter((x) => x.domain !== l.domain))}>✕</button></td>
              </tr>); })}</tbody></table>) : <div className="empty">Nothing here yet. Find stores or import a list.</div>}
        </div>
      </>)}

      {tab === "out" && <Outreach leads={leads} patch={patch} isBlocked={isBlocked} suppress={suppress} setSuppress={setSuppress} />}
    </div>
  );
}
