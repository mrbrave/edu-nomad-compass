import { errorResponse, protect } from "@/lib/http";
import { getProduct, searchTraining } from "@/lib/training";
export const runtime="nodejs";
export const maxDuration=60;
export async function GET(request:Request){
  const blocked=protect(request);if(blocked)return blocked;
  try{
    const p=new URL(request.url).searchParams;
    const result=p.get("code")?await getProduct(p.get("code")!):await searchTraining(p.get("q")??"");
    return Response.json(result,{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorResponse(error);}
}
