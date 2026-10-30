export function checkBill(bill,bills=[]) {
 const issues=[];let total=0;
 for(const line of bill.lines||[]){const qty=Number(line.qty),rate=Number(line.rate);if(!Number.isFinite(qty)||!Number.isFinite(rate)||qty<0||rate<0){issues.push('Invalid quantity or rate.');continue;}total+=Math.round(qty*rate*100)/100;}
 total=Math.round(total*100)/100;
 const stated=Number(bill.total);if(!Number.isFinite(stated)||stated<0)issues.push('The stated invoice total is invalid.');else if(Math.abs(total-stated)>.01)issues.push('Line totals do not match the stated invoice total.');
 const norm=s=>String(s||'').trim().toLowerCase();
 if(bills.some(b=>b.id!==bill.id&&norm(b.number)===norm(bill.number)&&norm(b.supplier)===norm(bill.supplier)))issues.push('Possible duplicate: this supplier and invoice number already exist.');
 let deliveryVariance=null;
 if(bill.delivered!==null&&bill.delivered!==undefined&&bill.delivered!==''&&bill.lines?.length===1){const delivered=Number(bill.delivered);if(!Number.isFinite(delivered)||delivered<0)issues.push('Invalid delivered quantity.');else{deliveryVariance=Math.round((Number(bill.lines[0].qty)-delivered)*Number(bill.lines[0].rate)*100)/100;if(deliveryVariance>0)issues.push('Invoiced quantity exceeds the recorded delivery.');}}
 return {total,issues,deliveryVariance};
}
export function transitionApproval(record,status){if(record.status!=='pending')throw Error('This approval has already been resolved.');if(!['approved','rejected'].includes(status))throw Error('Invalid decision.');return {...record,status,decidedAt:new Date().toISOString()};}
