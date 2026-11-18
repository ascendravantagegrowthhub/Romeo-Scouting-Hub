"use client";
import { useEffect, useRef, useState } from "react";

const DEF = { offer: "", signature: "", optout: "If this isn’t relevant, just reply “no” and I won’t email again.", tone: "friendly", langMode: "auto", gap: "normal" };
const DAY = 864e5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = async (path, body) => {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || "Request failed (" + r.status + ")"); e.code = j.code; throw e; }
  return j;
};

export default function Outreach({ leads, patch, isBlocked, suppress, setSuppress }) {
  const [s, setS] = useState(DEF);
  const [ready, setReady] = useState(false);
  const [gm, setGm] = useState(null);
  const [msg, setMsg] = useState("");
  const [vis, setVis] = useState(12);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [wait, setWait] = useState(0);
  const stopRef = useRef(false);
  const leadsRef = useRef(leads);
  leadsRef.current = leads;

  useEffect(() => {
    try { const v = localStorage.getItem("ss-out"); if (v) setS({ ...DEF, ...JSON.parse(v) }); } catch {}
    setReady(true);
    const p = new URLSearchParams(location.search).get("gmail");
    if (p) { setMsg(p === "connected" ? "Gmail connected." : "Gmail connection failed. Try again."); history.replaceState(null, "", "/"); }
    loadGmail();
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("ss-out", JSON.stringify(s)); } catch {} }, [s, ready]);

  async function loadGmail() {
    try { const r = await fetch("/api/gmail/status"); setGm(r.ok ? await r.json() : { error: true }); } catch { setGm({ error: true }); }
  }

  const queue = leads.filter((l) => l.isShopify && l.email && l.stage === "new" && !isBlocked(l)).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const due = leads.filter((l) => l.stage === "contacted" && l.contactedAt && Date.now() - l.contactedAt > 3 * DAY && l.email && l.fu?.status !== "sent" && !isBlocked(l)).sort((a, b) => a.contactedAt - b.contactedAt);
  const setFu = (l, f) => patch(l.domain, { fu: { ...(leadsRef.current.find((x) => x.domain === l.domain)?.fu || {}), ...f } });
  const st = (l) => l.draft?.status || "none";
  const nNone = queue.filter((l) => ["none", "error"].includes(st(l))).length;
  const nReady = queue.filter((l) => st(l) === "ready").length;
  const nApproved = queue.filter((l) => st(l) === "approved").length;
  const sent = leads.filter((l) => l.draft?.status === "sent").length;

  const compose = (body, translatedOptout) => [body.trim(), s.signature.trim(), (s.langMode === "auto" && translatedOptout ? translatedOptout : s.optout).trim()].filter(Boolean).join("\n\n");
  const setDraft = (l, f) => patch(l.domain, { draft: { ...(leadsRef.current.find((x) => x.domain === l.domain)?.draft || {}), ...f } });

  async function draftOne(l) {
    setDraft(l, { status: "drafting", error: "" });
    try {
      const d = await post("/api/draft", { domain: l.site || l.domain, name: l.name, niche: l.niche, title: l.title, profile: l.profile, offer: s.offer, tone: s.tone, langMode: s.langMode, optout: s.optout });
      setDraft(l, { status: "ready", subject: d.subject, body: compose(d.body, d.optout), angle: d.angle, error: "" });
    } catch (e) { setDraft(l, { status: "error", error: e.message }); }
  }

  async function draftAll() {
    if (s.offer.trim().length < 15) return setMsg("Describe what you offer first. The drafts are built around it.");
    setDrafting(true); stopRef.current = false; setMsg("");
    const todo = queue.filter((l) => ["none", "error"].includes(st(l)));
    let i = 0;
    const worker = async () => { while (!stopRef.current) { const l = todo[i++]; if (!l) return; await draftOne(l); await sleep(3000); } };
    await worker();
    setDrafting(false);
  }

  async function sendOne(l) {
    setDraft(l, { status: "sending", error: "" });
    try {
      await post("/api/gmail/send", { to: l.email, subject: l.draft.subject, body: l.draft.body, domain: l.site || l.domain });
      patch(l.domain, { stage: "contacted", contactedAt: Date.now(), draft: { ...leadsRef.current.find((x) => x.domain === l.domain).draft, status: "sent" } });
      loadGmail();
      return true;
    } catch (e) {
      setDraft(l, { status: "failed", error: e.message });
      if (e.code === "cap" || e.code === "noauth") { stopRef.current = true; setMsg(e.message); loadGmail(); }
      return false;
    }
  }

  async function draftFollow(l) {
    if (s.offer.trim().length < 15) return setMsg("Describe what you offer first.");
    setFu(l, { status: "drafting", error: "" });
    try {
      const d = await post("/api/draft", { mode: "followup", domain: l.site || l.domain, name: l.name, niche: l.niche, title: l.title, profile: l.profile, offer: s.offer, tone: s.tone, langMode: s.langMode, optout: s.optout, previous: { subject: l.draft?.subject, body: l.draft?.body } });
      setFu(l, { status: "ready", subject: d.subject, body: compose(d.body, d.optout), angle: d.angle, error: "" });
    } catch (e) { setFu(l, { status: "error", error: e.message }); }
  }

  async function sendFollow(l) {
    setFu(l, { status: "sending", error: "" });
    try {
      await post("/api/gmail/send", { to: l.email, subject: l.fu.subject, body: l.fu.body, domain: l.site || l.domain, followup: true });
      setFu(l, { status: "sent" });
      loadGmail();
    } catch (e) {
      setFu(l, { status: "ready", error: e.message });
      if (e.code === "cap" || e.code === "noauth") { setMsg(e.message); loadGmail(); }
    }
  }

  async function sendApproved() {
    setSending(true); stopRef.current = false; setMsg("");
    while (!stopRef.current) {
      const next = leadsRef.current.find((l) => l.draft?.status === "approved" && l.stage === "new");
      if (!next) break;
      await sendOne(next);
      const more = leadsRef.current.some((l) => l.draft?.status === "approved" && l.stage === "new");
      if (!more || stopRef.current) break;
      const [lo, hi] = { fast: [15, 30], normal: [45, 90], slow: [90, 180] }[s.gap] || [45, 90];
      let secs = lo + Math.floor(Math.random() * (hi - lo));
      while (secs > 0 && !stopRef.current) { setWait(secs--); await sleep(1000); }
      setWait(0);
    }
    setSending(false); setWait(0);
  }

  const approveAll = () => queue.filter((l) => st(l) === "ready").forEach((l) => setDraft(l, { status: "approved" }));
  const edit = (l, f) => setDraft(l, { ...f, status: st(l) === "approved" ? "ready" : st(l) });
  const connected = gm?.connected;

  return (
    <>
      <div className="card">
        <h2>Your offer</h2>
        <p className="h">Drafts are built from what you say here plus what each store sells. Be specific: the better the offer, the better the hook.</p>
        <label htmlFor="of">What do you offer?</label>
        <textarea id="of" value={s.offer} onChange={(e) => setS({ ...s, offer: e.target.value })} placeholder="e.g. I rewrite product pages for Shopify stores so they convert better. I’ll do one page for free to show the difference." />
        <div className="row">
          <div><label htmlFor="sg">Signature (name, business, address)</label><textarea id="sg" style={{ minHeight: 70 }} value={s.signature} onChange={(e) => setS({ ...s, signature: e.target.value })} placeholder={"Romeo\nAscendra Vantage\n12 Example St, City"} /></div>
          <div><label htmlFor="lg">Language</label><select id="lg" value={s.langMode} onChange={(e) => setS({ ...s, langMode: e.target.value })}><option value="auto">Auto: write in each store’s language</option><option value="en">Always English</option></select>
            <label htmlFor="gp">Pause between sends</label><select id="gp" value={s.gap} onChange={(e) => setS({ ...s, gap: e.target.value })}><option value="fast">Fast (15 to 30 sec)</option><option value="normal">Normal (45 to 90 sec)</option><option value="slow">Careful (90 to 180 sec)</option></select>
            <label htmlFor="tn">Tone</label><select id="tn" value={s.tone} onChange={(e) => setS({ ...s, tone: e.target.value })}><option value="friendly">Friendly</option><option value="direct">Direct</option><option value="curious">Curious</option></select>
            <label htmlFor="oo">Opt-out line</label><input id="oo" value={s.optout} onChange={(e) => setS({ ...s, optout: e.target.value })} /></div>
        </div>
      </div>

      <div className="card">
        <h2>Gmail</h2>
        {gm === null ? <p className="h">Checking…</p> : gm.error ? <p className="h">Couldn’t check Gmail status.</p> : connected ? (
          <>
            <p className="h">Sending from <b>{gm.address}</b>. {gm.sentToday} of {gm.cap} sent in the last 24 hours.</p>
            <button className="b g" onClick={async () => { await post("/api/gmail/disconnect"); loadGmail(); }}>Disconnect</button>
          </>
        ) : (
          <>
            <p className="h">Connect the Gmail account you want to send from. Romeo Hub can only send mail, never read it.</p>
            <a className="b" href="/api/gmail/connect">Connect Gmail</a>
          </>
        )}
        {msg && <div className="msg">{msg}</div>}
      </div>

      <div className="card">
        <h2>Queue</h2>
        <div className="stat"><div><b>{queue.length}</b>stores with email</div><div><b>{nReady}</b>drafts to review</div><div><b>{nApproved}</b>approved</div><div><b>{sent}</b>sent</div></div>
        <button className="b" disabled={drafting || !nNone} onClick={draftAll}>{drafting ? "Writing drafts…" : `Write drafts (${nNone})`}</button>
        <button className="b g" disabled={!nReady} onClick={approveAll}>Approve all ({nReady})</button>
        <button className="b" disabled={sending || !nApproved || !connected} onClick={sendApproved}>{sending ? (wait ? `Next send in ${wait}s` : "Sending…") : `Send approved (${nApproved})`}</button>
        {(drafting || sending) && <button className="b g" onClick={() => { stopRef.current = true; }}>Stop</button>}
        <p className="note">Approved emails go out one at a time with the pause you chose above, to protect your Gmail reputation. Keep this page open while they send.</p>
      </div>

      {due.length > 0 && (
        <div className="card">
          <h2>Follow-ups due ({due.length})</h2>
          <p className="h">Emailed 3 or more days ago. Most replies come after a gentle follow-up. Mark a store Replied in Leads to remove it from this list. Each store gets one follow-up.</p>
          {due.slice(0, 8).map((l) => {
            const f = l.fu || {}, k = f.status || "none";
            return (
              <div key={l.domain} style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 10 }}>
                <span className="dom">{l.site || l.domain}</span> <span style={{ color: "var(--mute)", fontSize: 13 }}>{l.email}</span>
                {f.error && <p className="note">{f.error}</p>}
                {["ready", "sending"].includes(k) && (
                  <>
                    <label>Subject</label><input value={f.subject || ""} onChange={(e) => setFu(l, { subject: e.target.value })} />
                    <label>Message</label><textarea style={{ minHeight: 160 }} value={f.body || ""} onChange={(e) => setFu(l, { body: e.target.value })} />
                  </>
                )}
                <div style={{ marginTop: 8 }}>
                  {["none", "error"].includes(k) && <button className="b" onClick={() => draftFollow(l)}>Write follow-up</button>}
                  {k === "drafting" && <span className="h">Writing…</span>}
                  {k === "ready" && <><button className="b" disabled={!connected} onClick={() => sendFollow(l)}>Send follow-up</button><button className="b g" onClick={() => draftFollow(l)}>Rewrite</button></>}
                  {k === "sending" && <span className="h">Sending…</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {queue.slice(0, vis).map((l) => {
        const d = l.draft || {}, k = st(l);
        return (
          <div className="card" key={l.domain}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div><span className="dom">{l.site || l.domain}</span> <span style={{ color: "var(--mute)", fontSize: 13 }}>{l.email}</span>{l.score != null && <span className={"badge " + (l.score >= 70 ? "ok" : l.score >= 45 ? "warn" : "bad")} style={{ marginLeft: 6 }}>{l.score}</span>}</div>
              <span className={"badge " + (k === "approved" ? "ok" : k === "failed" || k === "error" ? "bad" : k === "ready" ? "warn" : "")}>{k === "none" ? "no draft" : k}</span>
            </div>
            {d.angle && <p className="h" style={{ margin: "6px 0 0" }}>Hook: {d.angle}</p>}
            {d.error && <p className="note">{d.error}</p>}
            {["ready", "approved", "failed", "sending"].includes(k) && (
              <>
                <label>Subject</label><input value={d.subject || ""} onChange={(e) => edit(l, { subject: e.target.value })} />
                <label>Message</label><textarea style={{ minHeight: 190 }} value={d.body || ""} onChange={(e) => edit(l, { body: e.target.value })} />
              </>
            )}
            <div style={{ marginTop: 10 }}>
              {["none", "error"].includes(k) && <button className="b" disabled={drafting} onClick={() => (s.offer.trim().length < 15 ? setMsg("Describe what you offer first.") : draftOne(l))}>Write draft</button>}
              {k === "drafting" && <span className="h">Writing…</span>}
              {["ready", "failed"].includes(k) && <><button className="b" onClick={() => setDraft(l, { status: "approved" })}>Approve</button><button className="b g" onClick={() => draftOne(l)}>Rewrite</button></>}
              {k === "approved" && <><button className="b" disabled={!connected || sending} onClick={() => sendOne(l)}>Send now</button><button className="b g" onClick={() => setDraft(l, { status: "ready" })}>Unapprove</button></>}
              {k !== "sending" && <button className="b g" onClick={() => patch(l.domain, { stage: "skip" })}>Skip</button>}
            </div>
          </div>
        );
      })}
      {queue.length > vis && <button className="b g" onClick={() => setVis(vis + 12)}>Show more ({queue.length - vis})</button>}
      {!queue.length && <div className="card"><div className="empty">No one in the queue yet. Scan stores, and any Shopify store with an email shows up here.</div></div>}

      <div className="card">
        <h2>Do-not-contact list</h2>
        <p className="h">Domains or emails, separated by spaces or commas. They never appear in the queue.</p>
        <textarea value={suppress} onChange={(e) => setSuppress(e.target.value)} />
      </div>
    </>
  );
}
