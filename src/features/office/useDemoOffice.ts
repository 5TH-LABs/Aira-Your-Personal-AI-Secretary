import * as Crypto from 'expo-crypto';
import {useDeviceOffice} from './DeviceOfficeProvider';
import {DEMO_COMPANY,demoRecords,demoDirectory,deriveDemoRecord,putDemoRecord,demoActivity} from '../../shared/demoRecords';
import {type PreparedCommand,mutationCommands} from '../../shared/demoCommands';
import type {OfficeRecord,RecordKind} from '../../shared/records';

export function useDemoOffice(){
 const device=useDeviceOffice(),records=device.office?demoRecords(device.office):[],directory=device.office?demoDirectory(device.office):[];
 async function save(kind:RecordKind,title:string,input:any,siteId:string|null,existing?:OfficeRecord){
  if(!title.trim()||title.trim().length>250)throw Error('Use a title between 1 and 250 characters.');
  if(kind==='site')siteId=null;
  const id=existing?.id||Crypto.randomUUID();
  device.setOffice((previous:any)=>{
   const office=JSON.parse(JSON.stringify(previous)),currentRecords=demoRecords(office),current=currentRecords.find(r=>r.id===id);
   if(existing&&(current?.version!==existing.version||!current))throw Error('This record changed. Open its current version before editing.');
   if(current?.data.posted&&['invoice','payroll','expense','payment','payment_plan'].includes(kind))throw Error('Posted entries need a separate correcting record.');
   if(siteId&&!currentRecords.some(r=>r.kind==='site'&&r.id===siteId))throw Error('Choose an available site.');
   const values={...input};if(kind==='staff'&&!values.assigneeId){const known=demoDirectory(office).find(person=>person.name.toLowerCase()===String(values.name||'').toLowerCase());if(known)values.assigneeId=known.user_id;}if(kind==='document'){values.filename=values.filename||title;values.mimeType=values.mimeType||'text/plain';values.storagePath=values.storagePath||'generated';}
   const data=deriveDemoRecord(kind,values,currentRecords.filter(r=>r.id!==id),siteId);
   const record:OfficeRecord={id,companyId:DEMO_COMPANY,kind,title,siteId,version:(current?.version||0)+1,updatedAt:new Date().toISOString(),deletedAt:null,data:{...data,...(current?.data.legacyId?{legacyId:current.data.legacyId}:{})}};
   putDemoRecord(office,record);demoActivity(office,'Saved draft: '+title);return office;
  });
  return id;
 }
 function review(commands:PreparedCommand[],title:string,id=Crypto.randomUUID()){
  const mutations=mutationCommands(commands);if(!mutations.length)throw Error('There are no record changes to review.');
  device.setOffice((previous:any)=>{const office=JSON.parse(JSON.stringify(previous));office.commandReviews=office.commandReviews||[];if(!office.commandReviews.some((r:any)=>r.id===id)){office.commandReviews.unshift({id,title,commands:mutations,status:'pending',createdAt:new Date().toISOString()});demoActivity(office,'Prepared changes: '+title,{commandReviewId:id});}return office;});return id;
 }
 const workspace={records,role:'owner',overview:{directory},save,request:async()=>{throw Error('Open the source in Documents.');}};
 return {...device,records,directory,workspace,save,review};
}
