import type { Product, RuleCheck } from "./contracts.ts";

export function checkRules(qualification:Product, unit:Product):RuleCheck {
  const row=qualification.grid.find(r=>r.code.toUpperCase()===unit.code.toUpperCase());
  const status=row?(row.isEssential?"core":"listed_elective"):"not_listed";
  const blockers:string[]=[];
  if(qualification.status!=="current") blockers.push(`${qualification.code} is ${qualification.status}. Review transition arrangements.`);
  if(unit.status!=="current") blockers.push(`${unit.code} is ${unit.status}. Review replacement and transition arrangements.`);
  const checksRequired=["Check the complete selection against packaging rules, elective groups, exclusions and AQF requirements.","Confirm the RTO's scope, trainer capability, assessment resources and industry consultation."];
  if(status==="not_listed") checksRequired.unshift("This unit is not listed in this qualification. Check importing rules and evidence of the required qualification level before considering inclusion.");
  if(unit.prerequisiteStatus==="unavailable") checksRequired.unshift("Prerequisite data could not be verified.");
  else if(unit.prerequisites.length) checksRequired.unshift(`Verify prerequisites: ${unit.prerequisites.map(p=>p.code).join(", ")}.`);
  return {code:unit.code,status,label:status==="core"?"Core unit":status==="listed_elective"?"Listed elective":"Importing review required",blockers,checksRequired};
}

export function recommendation(fit:number|null,confidence:number|null,sufficiency:number|null,blockers:string[]):"strong"|"possible"|"weak"|"insufficient" {
  if(fit===null||confidence===null||sufficiency===null||sufficiency<0.75||confidence<0.5||blockers.length) return "insufficient";
  return fit>=75?"strong":fit>=45?"possible":"weak";
}
