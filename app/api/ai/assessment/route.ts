import { assessSavedReply } from "@/lib/studio";
import { errorResponse, protect } from "@/lib/http";
export const runtime="nodejs";
export const maxDuration=90;
export async function POST(request:Request){
  const blocked=protect(request);if(blocked)return blocked;
  try{const text=await request.text();if(text.length>4000)return Response.json({error:"Request too large."},{status:413});return Response.json(await assessSavedReply(JSON.parse(text)),{headers:{"Cache-Control":"no-store"}});}
  catch(error){return errorResponse(error);}
}
