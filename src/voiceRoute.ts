export function voiceRoute(text:string):string|null {
 const command=text.toLowerCase().trim().replace(/\s+/g,' ').replace(/[.!?]+$/,'').replace(/^(please\s+)/,'');
 const routes:Record<string,string>={home:'home',overview:'home','my office':'home',bills:'bills','my bills':'bills',invoices:'bills',approvals:'approvals','pending approvals':'approvals',documents:'documents',files:'documents',tasks:'tasks','team tasks':'tasks',sites:'sites',assistant:'assistant',chat:'assistant',profile:'settings',agents:'agents',activity:'activity',settings:'settings'};
 Object.assign(routes,{attendance:'agent-wages',wages:'agent-wages',payroll:'agent-wages',hr:'agent-hr',staff:'agent-hr',contracts:'agent-contracts',permits:'agent-permits',insurance:'agent-permits',reports:'agent-reports',estimates:'agent-estimates',boq:'agent-estimates',accounting:'agent-accountant',accountant:'agent-accountant',subcontractors:'agent-subcontractors',audit:'agent-auditor',auditor:'agent-auditor','team plans':'agent-team',notes:'agent-personal',meetings:'agent-personal',reminders:'agent-personal','email writer':'agent-writer'});
 const match=command.match(/^(?:open|show|go to|take me to) (.+?)(?: please)?$/);
 return match?routes[match[1]]||null:null;
}
