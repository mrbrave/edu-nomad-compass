import { recoverOperation } from "@/lib/studio";
import { errorResponse, protect } from "@/lib/http";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const blocked=protect(request);if(blocked)return blocked;
  try{const {id}=await params;return Response.json(await recoverOperation(id),{headers:{"Cache-Control":"no-store"}});}catch(error){return errorResponse(error);}
}
