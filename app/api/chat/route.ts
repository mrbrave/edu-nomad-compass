import { chatSchema } from "@/lib/contracts";
import { errorResponse, protect } from "@/lib/http";
import { reviewCourse } from "@/lib/review";
export const runtime="nodejs";
export const maxDuration=180;
export async function POST(request:Request){
  const blocked=protect(request);if(blocked)return blocked;
  try{
    const body=await request.text();
    if(body.length>90000)return Response.json({error:"This conversation is too large. Start a new review."},{status:413});
    const input=chatSchema.parse(JSON.parse(body));
    return Response.json(await reviewCourse(input),{headers:{"Cache-Control":"no-store"}});
  }catch(error){return errorResponse(error);}
}
