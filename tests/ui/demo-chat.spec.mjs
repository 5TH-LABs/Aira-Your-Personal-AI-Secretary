import {test,expect} from '@playwright/test';

const request='Can you create an email saying that next week will be work from home for every employee?';
const reply={text:'I prepared a work-from-home announcement for your review.',action:{type:'letter',title:'Work from home next week',body:'Dear team,\n\nAll employees will work from home next week.\n\nThank you.',recipient:'All employees',siteId:null,due:''}};

test.beforeEach(async({page})=>{
 await page.route('**/api/status',route=>route.fulfill({json:{connected:true,model:'test-provider'}}));
 await page.route('**/api/assistant',async route=>{await new Promise(resolve=>setTimeout(resolve,600));await route.fulfill({json:reply});});
});

for(const start of ['/assistant','/home'])test(`email request returns a reviewable draft from ${start}`,async({page})=>{
 await page.goto(start);
 await page.getByRole('textbox',{name:'Message your office assistant',exact:true}).fill(request);
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await expect(page.getByText(reply.text,{exact:true})).toBeVisible({timeout:10000});
 await page.getByRole('button',{name:'Review draft',exact:true}).click();
 await expect(page.getByRole('textbox',{name:'Message draft',exact:true})).toHaveValue(reply.action.body);
});

test('an in-flight draft survives tab navigation and browser reload preserves its result',async({page})=>{
 await page.goto('/assistant');
 await page.getByRole('textbox',{name:'Message your office assistant',exact:true}).fill(request);
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByRole('tab',{name:'Agents',exact:true}).click();
 await page.waitForTimeout(1000);
 await page.getByRole('tab',{name:'Chat',exact:true}).click();
 await expect(page.getByText(reply.text,{exact:true})).toBeVisible({timeout:10000});
 await page.reload();
 await expect(page.getByRole('button',{name:'Review draft',exact:true})).toBeVisible();
});

test('a failed request offers a working retry',async({page})=>{
 let calls=0;
 await page.route('**/api/assistant',route=>++calls===1?route.fulfill({status:502,json:{error:'Test connection interrupted.'}}):route.fulfill({json:reply}));
 await page.goto('/assistant');
 await page.getByRole('textbox',{name:'Message your office assistant',exact:true}).fill(request);
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByRole('button',{name:'Retry request',exact:true}).click();
 await expect(page.getByRole('button',{name:'Review draft',exact:true})).toBeVisible();
 expect(calls).toBe(2);
});

test('approval saves the edited subject, audience and email body',async({page})=>{
 await page.goto('/assistant');
 await page.getByRole('textbox',{name:'Message your office assistant',exact:true}).fill(request);
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByRole('button',{name:'Review draft',exact:true}).click();
 await page.getByRole('textbox',{name:'Subject',exact:true}).fill('Updated work arrangements');
 await page.getByRole('textbox',{name:'Recipient / audience',exact:true}).fill('Office employees');
 await page.getByRole('textbox',{name:'Message draft',exact:true}).fill('Office employees will work from home next week.');
 await page.getByRole('button',{name:'Approve draft',exact:true}).click();
 await page.getByRole('tab',{name:'Profile',exact:true}).click();
 await page.getByRole('button',{name:'Preview outbox',exact:true}).click();
 await expect(page.getByText('Updated work arrangements',{exact:true})).toBeVisible();
 await expect(page.getByText('Prepared for Office employees',{exact:true})).toBeVisible();
 await expect(page.getByText('Office employees will work from home next week.',{exact:true})).toBeVisible();
});
