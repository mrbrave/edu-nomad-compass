import { protect } from "@/lib/http";
import { workspaceCredits } from "@/lib/workspace";
export const runtime="nodejs";
export async function GET(request:Request){
  const blocked=protect(request);if(blocked)return blocked;
  return Response.json(await workspaceCredits(),{headers:{"Cache-Control":"no-store"}});
}
