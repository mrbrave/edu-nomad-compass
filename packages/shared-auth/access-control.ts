import { timingSafeEqual } from "node:crypto";
export function accessStatus(request: Request, token?: string): "ready" | "locked" | "misconfigured" {
  if (!token?.trim()) return "misconfigured";
  const supplied = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "");
  const a = Buffer.from(token), b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b) ? "ready" : "locked";
}
