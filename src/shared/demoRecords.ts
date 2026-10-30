import {v5 as uuid} from 'uuid';
import {deriveRecord} from './business.ts';
import type {OfficeRecord,RecordKind} from './records.ts';

export const DEMO_COMPANY='00000000-0000-4000-8000-000000000001';
export const demoId=(kind:string,id:string)=>/^[0-9a-f-]{36}$/i.test(id)?id:uuid('site-office-demo:'+kind+':'+id,uuid.DNS);
export function demoDirectory(office:any){
 const people=new Map<string,{user_id:string;name:string;role:string}>();
 for(const name of [office.owner,...office.sites.map((s:any)=>s.lead),...office.tasks.map((t:any)=>t.assignee)].filter(Boolean))people.set(name.toLowerCase(),{user_id:demoId('person',name.toLowerCase()),name,role:'staff'});
 for(const r of office.records||[])if(r.kind==='staff'&&!r.deletedAt)people.set(String(r.data.name).toLowerCase(),{user_id:r.data.assigneeId||r.id,name:r.data.name,role:r.data.role});
 return [...new Map([...people.values()].map(person=>[person.user_id,person])).values()];
}

/** A single view combines the original demo records and every specialist's saved work. */
export function demoRecords(office:any):OfficeRecord[]{
 const records=new Map<string,OfficeRecord>((office.records||[]).filter((r:any)=>!r.deletedAt).map((r:OfficeRecord)=>[r.id,r]));
 const directory=demoDirectory(office),assignee=(name:string)=>directory.find(p=>p.name.toLowerCase()===String(name).toLowerCase())?.user_id||demoId('person',String(name).toLowerCase());
 const add=(kind:RecordKind,item:any,title:string,data:Record<string,any>)=>{
  const id=demoId(kind,item.id),existing=records.get(id);
  records.set(id,{id,companyId:DEMO_COMPANY,kind,title,siteId:item.site?demoId('site',item.site):null,version:item.version||existing?.version||1,updatedAt:item.updatedAt||existing?.updatedAt||'1970-01-01T00:00:00Z',deletedAt:null,data:{...existing?.data,...data,legacyId:item.id,undated:!item.updatedAt}});
 };
 for(const s of office.sites)add('site',s,s.name,{location:s.location,lead:s.lead,progress:s.progress,phase:s.phase});
 for(const t of office.tasks)add('task',t,t.title,{assigneeId:assignee(t.assignee),body:t.notes||t.title,due:t.due,status:t.status,dependencies:t.dependencies||[]});
 for(const b of office.bills)add('invoice',b,b.number,{counterparty:b.supplier,reference:b.number,direction:b.direction||'payable',amount:String(b.total),date:b.date,lines:b.lines.map((l:any)=>({description:l.name,quantity:String(l.qty),rate:String(l.rate),unit:l.unit||'item',...(b.lines.length===1&&b.delivered!=null?{delivered:String(b.delivered)}:{})})),deliveryReference:b.deliveryRef||''});
 for(const d of office.documents)add('document',d,d.name,{filename:d.name,mimeType:d.mime||'text/plain',storagePath:'device:'+d.id,fileId:d.id,text:d.text||'',category:['Invoice','Delivery note','Contract','Permit','Report','Photo','Other'].includes(d.type)?d.type:'Other'});
 return [...records.values()];
}

export function deriveDemoRecord(kind:RecordKind,input:any,records:OfficeRecord[],siteId:string|null){
 if(kind==='letter'){
  if(typeof input.body!=='string'||!input.body.trim())throw Error('Add the email message.');
  const attachments=input.attachments||[];
  if(!Array.isArray(attachments)||attachments.some((id:string)=>!records.some(r=>r.id===id&&r.kind==='document')))throw Error('An email attachment is unavailable.');
  return {recipient:typeof input.recipient==='string'?input.recipient.trim():'',subject:String(input.subject||''),body:input.body,attachments};
 }
 const data=deriveRecord(kind,input,records,siteId);
 if(kind==='document'&&data.pages?.length&&data.text!==data.pages.map((page:any)=>page.text).join('\n\n'))data.pages=[];
 if(kind==='contract')for(const citation of data.citations){const source=records.find(r=>r.id===citation.sourceId),page=(source?.data.pages as any[])?.find(p=>p.page===citation.page);if(!page?.text.includes(citation.quote))throw Error('A contract citation does not match its source page.');}

 return data;
}

/** Project canonical edits back into the existing screens, retaining file originals. */
export function putDemoRecord(office:any,record:OfficeRecord){
 office.records=(office.records||[]).filter((r:any)=>r.id!==record.id).concat(record);
 const legacy=(record.data.legacyId as string)||record.id,site=record.siteId?office.sites.find((s:any)=>demoId('site',s.id)===record.siteId)?.id||record.siteId:null;
 const common={id:legacy,version:record.version,updatedAt:record.updatedAt};
 const replace=(key:string,value:any)=>{office[key]=office[key].filter((item:any)=>item.id!==legacy);if(!record.deletedAt)office[key].unshift(value);};
 if(record.kind==='site')replace('sites',{...common,name:record.title,location:record.data.location,lead:record.data.lead||'',progress:Number(record.data.progress||0),phase:record.data.phase||'Planning'});
 if(record.kind==='task'){const person=demoDirectory(office).find(p=>p.user_id===record.data.assigneeId);replace('tasks',{...common,title:record.title,site,assignee:person?.name||String(record.data.staffName||'Unassigned'),notes:record.data.body,due:record.data.due,status:record.data.status==='draft'?'To do':record.data.status||'To do',dependencies:record.data.dependencies||[]});}
 if(record.kind==='invoice')replace('bills',{...common,supplier:record.data.counterparty,number:record.data.reference,site,date:record.data.date||record.updatedAt.slice(0,10),direction:record.data.direction,total:String(record.data.amount),lines:(record.data.lines as any[]).map(l=>({name:l.description,qty:String(l.quantity),rate:String(l.rate),unit:l.unit})),delivered:(record.data.lines as any[]).length===1?(record.data.lines as any[])[0].delivered??null:null,deliveryRef:record.data.deliveryReference||'',status:record.data.posted?'Recorded':'Review needed'});
 if(record.kind==='document')replace('documents',{...common,id:String(record.data.fileId||legacy),name:record.title,site,date:record.updatedAt.slice(0,10),text:record.data.text,mime:record.data.mimeType,type:record.data.category||'Other'});
}

export function demoActivity(office:any,text:string,extra:Record<string,unknown>={}){
 office.activity.unshift({id:demoId('event',text+':'+Date.now()+':'+office.activity.length),text,detail:'Office assistant · Device workspace',createdAt:new Date().toISOString(),...extra});
}
