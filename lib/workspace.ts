import { z } from "zod";

export interface WorkspaceCredits {
  status: "available" | "not_configured" | "unavailable" | "sample";
  remainingPercent: number | null;
  updatedAt: string | null;
  label: string;
  belowOnePercent?: boolean;
}

const balanceSchema = z.object({
  total: z.number().finite().positive(),
  remaining: z.number().finite().nonnegative(),
  updatedAt: z.iso.datetime(),
}).refine(v => v.remaining <= v.total);

export function normaliseCredits(input: unknown): WorkspaceCredits {
  const balance = balanceSchema.parse(input);
  const percent=balance.remaining / balance.total * 100;
  return { status: "available", remainingPercent: Math.floor(percent), belowOnePercent:percent>0&&percent<1, updatedAt: balance.updatedAt, label: "Workspace credits" };
}

// The source is controlled by the operator, never by a browser-supplied URL.
// Monetary amounts, identity data and source credentials are never returned.
export async function workspaceCredits(): Promise<WorkspaceCredits> {
  const source = process.env.COMPASS_CREDITS_URL;
  if (!source) return { status: "not_configured", remainingPercent: null, updatedAt: null, label: "Credits not assigned" };
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid credits source");
    const r = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
      headers: process.env.COMPASS_CREDITS_TOKEN ? { Authorization: `Bearer ${process.env.COMPASS_CREDITS_TOKEN}` } : {},
    });
    if (!r.ok) throw new Error("Credits unavailable");
    const body = await r.text();
    if (body.length > 10000) throw new Error("Credits response too large");
    return normaliseCredits(JSON.parse(body));
  } catch {
    return { status: "unavailable", remainingPercent: null, updatedAt: null, label: "Credits temporarily unavailable" };
  }
}
