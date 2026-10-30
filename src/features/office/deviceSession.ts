/** A restart must expose an interrupted request rather than leave an unanswered message. */
export function recoverDeviceRequests(office:any){
 const messages=office.messages||[];
 const pending=messages.filter((message:any,index:number)=>message.requestState==='pending'||(index===messages.length-1&&message.role==='user'&&!message.requestState));
 if(!pending.length)return office;
 const next=JSON.parse(JSON.stringify(office));
 for(const message of pending){
  next.messages.find((item:any)=>item.id===message.id).requestState='failed';
  next.messages.push({id:message.id+'-interrupted',role:'assistant',createdAt:new Date().toISOString(),error:true,text:'This request was interrupted before a reply arrived. You can retry it.',retryRequest:{text:message.requestText||message.text,attachment:message.requestAttachment||null}});
 }
 return next;
}
