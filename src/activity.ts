export function dateKey(value:string){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Colombo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
export function activityDay(entry:any,now=new Date()){
 if(!entry.createdAt||!Number.isFinite(Date.parse(entry.createdAt)))return 'Earlier activity';
 const day=dateKey(entry.createdAt),today=dateKey(now.toISOString());if(day===today)return 'Today';
 const yesterday=dateKey(new Date(now.getTime()-86400000).toISOString());if(day===yesterday)return 'Yesterday';
 return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',day:'numeric',month:'short',year:'numeric'}).format(new Date(entry.createdAt));
}
export function activityTime(entry:any){return entry.createdAt?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Colombo',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(entry.createdAt)):entry.time||'—';}
