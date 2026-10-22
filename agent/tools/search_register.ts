import { defineTool } from "eve/tools";
import { z } from "zod";
import { searchTraining } from "../../lib/training";
export default defineTool({description:"Search the official training.gov.au JSON API for real qualifications and units.",inputSchema:z.object({query:z.string().min(2).max(100)}),execute:({query})=>searchTraining(query)});
