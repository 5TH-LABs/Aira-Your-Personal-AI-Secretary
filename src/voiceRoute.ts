export function voiceRoute(text:string):string|null {
 const command=text.toLowerCase().trim().replace(/[.!?]+$/,'').replace(/^(please\s+)/,'');
 const routes:Record<string,string>={home:'home',overview:'home','my office':'home',bills:'bills','my bills':'bills',invoices:'bills',approvals:'approvals','pending approvals':'approvals',documents:'documents',files:'documents',tasks:'tasks','team tasks':'tasks',sites:'sites',assistant:'assistant',chat:'assistant',profile:'settings',agents:'agents',activity:'activity',settings:'settings'};
 const match=command.match(/^(?:open|show|go to|take me to) (.+?)(?: please)?$/);
 return match?routes[match[1]]||null:null;
}
