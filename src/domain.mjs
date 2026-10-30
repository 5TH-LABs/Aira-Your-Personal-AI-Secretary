import {Decimal} from 'decimal.js';
export function checkBill(bill,bills=[]) {
 const issues=[];let sum=new Decimal(0);
 for(const line of bill.lines||[]){try{const qty=new Decimal(line.qty),rate=new Decimal(line.rate);if(!qty.isFinite()||!rate.isFinite()||qty.isNegative()||rate.isNegative())throw Error();sum=sum.plus(qty.mul(rate));}catch{issues.push('Invalid quantity or rate.');}}
 const total=sum.toDecimalPlaces(2,Decimal.ROUND_HALF_UP).toNumber();
 try{const stated=new Decimal(bill.total);if(!stated.isFinite()||stated.isNegative())throw Error();if(!sum.toDecimalPlaces(2,Decimal.ROUND_HALF_UP).eq(stated.toDecimalPlaces(2,Decimal.ROUND_HALF_UP)))issues.push('Line totals do not match the stated invoice total.');}catch{issues.push('The stated invoice total is invalid.');}
 const norm=s=>String(s||'').trim().toLowerCase();
 if(bills.some(b=>b.id!==bill.id&&norm(b.number)===norm(bill.number)&&norm(b.supplier)===norm(bill.supplier)))issues.push('Possible duplicate: this supplier and invoice number already exist.');
 let deliveryVariance=null;
 if(bill.delivered!==null&&bill.delivered!==undefined&&bill.delivered!==''&&bill.lines?.length===1){try{const delivered=new Decimal(bill.delivered);if(!delivered.isFinite()||delivered.isNegative())throw Error();deliveryVariance=new Decimal(bill.lines[0].qty).minus(delivered).mul(bill.lines[0].rate).toDecimalPlaces(2,Decimal.ROUND_HALF_UP).toNumber();if(deliveryVariance>0)issues.push('Invoiced quantity exceeds the recorded delivery.');else if(deliveryVariance<0)issues.push('Recorded delivery exceeds the invoiced quantity.');}catch{issues.push('Invalid delivered quantity.');}}
 return {total,issues,deliveryVariance};
}
export function transitionApproval(record,status){if(record.status!=='pending')throw Error('This approval has already been resolved.');if(!['approved','rejected'].includes(status))throw Error('Invalid decision.');return {...record,status,decidedAt:new Date().toISOString()};}
