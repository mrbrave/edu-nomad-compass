"use client";
import type { WorkspaceCredits } from "../usage-ledger/public-projection";
export function UsageMeter({ credits, isDemo, onRefresh }: { credits: WorkspaceCredits; isDemo: boolean; onRefresh?: () => void }) {
  const available = credits.remainingPercent !== null;
  return <section className="credits-card" aria-label="Available credits"><div className="credits-heading"><span>USAGE REMAINING</span>{onRefresh && <button onClick={onRefresh} aria-label="Refresh available credits">Refresh</button>}</div>
    {!isDemo && <small role="status">{credits.liveEnabled===false?"Live requests disabled":credits.status!=="available"?credits.label:""}</small>}<div className="credits-value">{isDemo ? "No credits needed" : available ? <><strong>{credits.belowOnePercent?"<1":credits.remainingPercent}%</strong> remaining</> : credits.label}</div>
    {available && <progress value={credits.remainingPercent ?? 0} max={100} aria-label="Workspace credits remaining" aria-valuetext={credits.belowOnePercent?"Less than one percent remaining":`${credits.remainingPercent}% remaining`} />}
    <p>{isDemo ? "Explore the sample without using your Studio allowance." : available ? "Internal workspace allowance, not a provider account balance. Pending reservations can temporarily reduce it." : "Usage is controlled by the server. Contact your workspace operator if an allowance is unavailable."}</p>
    {available && credits.updatedAt && <small>Last checked {new Date(credits.updatedAt).toLocaleString("en-AU")}</small>}
  </section>;
}
