import { protect } from "@/lib/http";
import { workspaceCredits } from "@/lib/workspace";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const blocked = protect(request);
  if (blocked) return Response.json({ access: "locked" }, { status: blocked.status, headers: { "Cache-Control": "no-store" } });
  return Response.json({ access: "ready", credits: await workspaceCredits() }, { headers: { "Cache-Control": "no-store" } });
}
