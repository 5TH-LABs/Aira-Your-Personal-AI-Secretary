import type {Database} from './db.ts';
export interface AIScope {companyId:string;userId?:string;runId?:string;jobId?:string}
/** Persist provider-reported usage without saving prompts, audio or response content. */
export function trackedAI(db:Database,scope?:AIScope):typeof fetch {
 if(!scope)return db.fetcher;
 return async(input,options)=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(!url.startsWith('https://generativelanguage.googleapis.com/'))return db.fetcher(input,options);
  const model=decodeURIComponent(url.split('/models/')[1]?.split(':')[0]||db.env.GEMINI_MODEL||'gemini-3.5-flash-lite');
  let response:Response;
  try{response=await db.fetcher(input,options);}catch(error){await save('failed',null,null);throw error;}
  let metadata:any=null;try{metadata=(await response.clone().json()).usageMetadata;}catch{}
  await save(response.ok?'responded':'failed',metadata,response.status);
  return response;
  async function save(status:string,usage:any,httpStatus:number|null){const count=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0?value:null;await db.request('/rest/v1/ai_usage',{method:'POST',body:JSON.stringify({company_id:scope!.companyId,user_id:scope!.userId||null,run_id:scope!.runId||null,job_id:scope!.jobId||null,model,status,http_status:httpStatus,input_tokens:count(usage?.promptTokenCount),output_tokens:count(usage?.candidatesTokenCount),total_tokens:count(usage?.totalTokenCount)})},true);}
 };
}
