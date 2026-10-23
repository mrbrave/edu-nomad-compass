"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, Compass, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import type { WorkspaceCredits } from "@/lib/workspace";

export function WorkspaceAccess({ onDemo, children }: { onDemo: () => void; children: (key: string, credits: WorkspaceCredits, lock: () => void) => ReactNode }) {
  const [state, setState] = useState<"checking" | "locked" | "ready" | "error">("checking");
  const [key, setKey] = useState("");
  const [credits, setCredits] = useState<WorkspaceCredits | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function check(value: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/workspace", { headers: value ? { Authorization: `Bearer ${value}` } : {}, cache: "no-store" });
      if (response.status === 401) { setState("locked"); if (value) setError("That access key was not recognised. Check it and try again."); return; }
      if (!response.ok) throw new Error("Studio could not be reached. Please try again.");
      const data = await response.json(); setCredits(data.credits); setState("ready");
    } catch (e) { setState("error"); setError(e instanceof Error ? e.message : "Studio could not be reached."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void check(""); }, []);
  function submit(event: FormEvent) { event.preventDefault(); void check(key); }
  if (state === "ready" && credits) return children(key, credits, () => { setState("locked"); setKey(""); });
  return <main className="access-page">
    <header className="entry-brand"><Compass size={28} /><span>EDU-NOMAD<small>COURSE COMPASS</small></span></header>
    <button className="back-to-demo" onClick={onDemo}><ArrowLeft size={16} /> Explore the Demo</button>
    <section className="studio-entry" aria-labelledby="studio-title">
      <div className="entry-icon"><LockKeyhole size={28} /></div><div className="eyebrow">YOUR COURSE DESIGN WORKSPACE</div>
      <h1 id="studio-title">Welcome to Studio.</h1><p>Bring your course goals, explore current unit evidence and build a shortlist with confidence in the source.</p>
      {state === "checking" ? <div className="entry-checking" role="status"><LoaderCircle className="spin" size={18} /> Checking workspace access…</div> :
        <form onSubmit={submit} className="studio-key-form"><label htmlFor="studio-key">Studio access key</label><input id="studio-key" type="password" value={key} autoComplete="off" onChange={e => setKey(e.target.value)} required={state === "locked"} disabled={busy} aria-describedby="key-help" /><p id="key-help">Use the key supplied for your workspace. This is shared pilot access, not an individual account.</p>{error && <p className="entry-error" role="alert">{error}</p>}<button className="primary-action" disabled={busy || (state === "locked" && !key.trim())}>{busy ? <LoaderCircle className="spin" size={17} /> : <>Enter Studio <ArrowUpRight size={17} /></>}</button></form>}
      <div className="entry-assurance"><ShieldCheck size={15} /> Your access key stays in memory and is cleared when you leave Studio.</div>
    </section>
    <footer className="entry-footer">Just looking around? The Demo is free to explore and uses no live AI credits.</footer>
  </main>;
}

export function CreditsCard({ credits, isDemo, onRefresh }: { credits: WorkspaceCredits; isDemo: boolean; onRefresh?: () => void }) {
  const available = credits.status === "available";
  return <section className="credits-card" aria-label="Available credits"><div className="credits-heading"><span>YOUR CREDITS</span>{onRefresh && <button onClick={onRefresh} aria-label="Refresh available credits">Refresh</button>}</div>
    <div className="credits-value">{isDemo ? "No credits needed" : available ? <><strong>{credits.remainingPercent}%</strong> remaining</> : credits.label}</div>
    {available && <progress value={credits.remainingPercent ?? 0} max={100} aria-label="Workspace credits remaining" />}
    <p>{isDemo ? "Explore the sample without using your Studio allowance." : available ? "Shared workspace allowance. Your monetary budget stays private." : "A verified workspace allowance will appear here when connected. This does not indicate your AI provider balance."}</p>
    {available && credits.updatedAt && <small>Source updated {new Date(credits.updatedAt).toLocaleString("en-AU")}</small>}
  </section>;
}
