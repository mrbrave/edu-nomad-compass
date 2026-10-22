import { defineTool } from "eve/tools";
import { chatSchema } from "../../lib/contracts";
import { reviewCourse } from "../../lib/review";
export default defineTool({description:"Retrieve official qualification and unit evidence, check register facts, run JEV, and explain the result with Gemini. All suitability recommendations must use this tool.",inputSchema:chatSchema,execute:reviewCourse});
