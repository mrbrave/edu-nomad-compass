import { errorResponse, protect } from "@/lib/http";
import { studioTurn } from "@/lib/studio";
export const runtime="nodejs";
export const maxDuration=300;
export async function POST(request:Request){
  const blocked=protect(request);if(blocked)return blocked;
  try{
    const body=await request.text();
    if(body.length>90000)return Response.json({error:"This conversation is too large. Start a new review."},{status:413});
    return Response.json(await studioTurn(JSON.parse(body)),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorResponse(error);}
}
