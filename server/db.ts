export type Environment=Record<string,string|undefined>;
export class HttpError extends Error{status:number;constructor(status:number,message:string){super(message);this.status=status;}}
export class Database {
 env:Environment;authorization?:string;fetcher:typeof fetch;
 constructor(env:Environment,authorization?:string,fetcher:typeof fetch=fetch){this.env=env;this.authorization=authorization;this.fetcher=fetcher;}
 async request(route:string,options:RequestInit={},admin=false):Promise<any>{const key=admin?this.env.SUPABASE_SERVICE_ROLE_KEY:this.env.SUPABASE_ANON_KEY;if(!this.env.SUPABASE_URL||!key)throw new HttpError(503,'Cloud service configuration is incomplete.');const r=await this.fetcher(this.env.SUPABASE_URL+route,{...options,headers:{apikey:key,Authorization:admin?'Bearer '+key:this.authorization||'','Content-Type':'application/json',Prefer:'return=representation',...options.headers},signal:AbortSignal.timeout(30000)});const text=await r.text();let body;try{body=text?JSON.parse(text):null;}catch{body={message:'Upstream returned an unreadable response.'};}if(!r.ok)throw new HttpError(r.status,body?.message||body?.error_description||body?.error||'Cloud request failed.');return body;}
 rpc(name:string,body:unknown,admin=false){return this.request('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(body)},admin);}
 async user(){if(!this.authorization?.startsWith('Bearer '))throw new HttpError(401,'Sign in first.');return this.request('/auth/v1/user');}
 async membership(companyId:string,owner=false){const user=await this.user();const rows=await this.request('/rest/v1/memberships?select=*&company_id=eq.'+encodeURIComponent(companyId)+'&user_id=eq.'+user.id+'&active=eq.true');if(!rows.length||owner&&rows[0].role!=='owner')throw new HttpError(403,owner?'Owner access required.':'Company access unavailable.');return {...rows[0],user};}
 async records(companyId:string,admin=false){const rows=[];for(let offset=0;;offset+=1000){const batch=await this.request('/rest/v1/office_records?company_id=eq.'+companyId+'&order=id&limit=1000&offset='+offset,{},admin);rows.push(...batch);if(batch.length<1000)break;}return rows;}
}
export const fromRow=(r:any)=>({id:r.id,companyId:r.company_id,kind:r.kind,siteId:r.site_id,title:r.title,data:r.data,version:r.version,updatedAt:r.updated_at,deletedAt:r.deleted_at});
