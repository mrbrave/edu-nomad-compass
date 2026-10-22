import { z } from "zod";
import { codeSchema, type Product, type Source } from "./contracts.ts";
import { contentText } from "./text.ts";

const origin = "https://training.gov.au";
const releaseSummary = z.object({ releaseNumber:z.string(), currency:z.string() });
const metaSchema = z.object({ code:z.string(), title:z.string(), type:z.string(), usageRecommendation:z.string(), releases:z.array(releaseSummary).min(1) });
const releaseSchema = z.object({
  currency:z.string(), releaseNumber:z.string(), contentBundles:z.array(z.object({id:z.string().uuid()})).default([]),
  packagingInformation:z.object({core:z.number(),elective:z.number()}).optional(),
});
const bundleSchema = z.object({items:z.array(z.object({id:z.string(),title:z.string(),contentType:z.string(),content:z.string()}))});
const gridSchema = z.array(z.object({code:z.string(),title:z.string(),isEssential:z.boolean(),usageRecommendation:z.string()}));
const prereqSchema = z.object({value:z.array(z.object({code:z.string(),title:z.string().optional()}))});
const cache = new Map<string,{expires:number;value:unknown}>();

export async function trainingJson(path: string): Promise<unknown> {
  if (!/^\/api\/(training|content|search)\//.test(path) || path.includes("..")) throw new Error("Unsupported register request.");
  const url = new URL(path, origin);
  if (url.origin !== origin) throw new Error("Unsupported source host.");
  const cached = cache.get(url.href);
  if (cached && cached.expires > Date.now()) return cached.value;
  const response = await fetch(url, {headers:{Accept:"application/json"}, signal:AbortSignal.timeout(15000), redirect:"error", cache:"no-store"});
  if (!response.ok) throw new Error(`The training register returned ${response.status}. Please retry or check the product code.`);
  const text = await response.text();
  if (text.length > 1800000) throw new Error("The register response is too large for this review.");
  const value: unknown = JSON.parse(text);
  if (cache.size > 200) cache.clear();
  cache.set(url.href,{expires:Date.now()+5*60*1000,value});
  return value;
}

export async function getProduct(input: string): Promise<Product> {
  const code = codeSchema.parse(input);
  const meta = metaSchema.parse(await trainingJson(`/api/training/${code}`));
  const selected = meta.releases.find(r=>r.currency==="current") ?? meta.releases[0];
  const release = releaseSchema.parse(await trainingJson(`/api/training/${code}/releases/${encodeURIComponent(selected.releaseNumber)}`));
  const retrievedAt = new Date().toISOString();
  const sources:Source[] = [{id:code,title:`${code} ${meta.title}`,url:`${origin}/training/details/${code}`,release:selected.releaseNumber,retrievedAt}];
  const bundles = await Promise.all(release.contentBundles.map(async b=>{
    const path=`/api/content/bundle/${b.id}`;
    const bundle=bundleSchema.parse(await trainingJson(path));
    sources.push({id:b.id,title:`${code} official content bundle`,url:origin+path,release:selected.releaseNumber,retrievedAt});
    return bundle.items.map(i=>({id:i.id,title:i.title,type:i.contentType,text:contentText(i.content)}));
  }));
  const sections=bundles.flat().filter(s=>!['ModificationHistory','UnitSelector','UnitMappingInformation'].includes(s.type));
  if (!sections.length) throw new Error(`No official content was available for ${code}. No assessment was made.`);
  let prerequisiteStatus:Product["prerequisiteStatus"]="verified";
  let prerequisites:Product["prerequisites"]=[];
  let grid:Product["grid"]=[];
  if (meta.type === "qualification" || meta.type === "skillSet") {
    grid=gridSchema.parse(await trainingJson(`/api/training/${code}/releases/${encodeURIComponent(selected.releaseNumber)}/unitgrid`));
    sources.push({id:`${code}-grid`,title:`${code} unit grid`,url:`${origin}/api/training/${code}/releases/${selected.releaseNumber}/unitgrid`,release:selected.releaseNumber,retrievedAt});
  } else if(meta.type === "unit") {
    try { prerequisites=prereqSchema.parse(await trainingJson(`/api/training/${code}/prerequisites`)).value.map(p=>({code:p.code,title:p.title??p.code})); }
    catch { prerequisiteStatus="unavailable"; }
  }
  return {code:meta.code,title:meta.title,type:meta.type,status:meta.usageRecommendation,release:release.releaseNumber,sections,prerequisites,prerequisiteStatus,sources,grid,packaging:release.packagingInformation};
}

export async function searchTraining(query: string, unitsOnly=false) {
  const q=z.string().trim().min(2).max(100).parse(query);
  const params=new URLSearchParams({searchText:q,pageSize:"12",includeTotalCount:"true",...(unitsOnly?{filter:"Type/Id eq 4 and Status/Id eq 0"}:{})});
  const schema=z.object({data:z.array(z.object({code:z.string(),title:z.string(),type:z.object({id:z.string()}),status:z.object({name:z.string()})}))});
  const r=schema.parse(await trainingJson(`/api/search/training?${params}`));
  return r.data.map(p=>({code:p.code,title:p.title,type:p.type.id,status:p.status.name,url:`${origin}/training/details/${p.code}`}));
}
