import {Decimal} from 'decimal.js';
Decimal.set({precision:28,rounding:Decimal.ROUND_HALF_UP});
export function amount(value:string|number){const input=String(value).trim();if(!/^[0-9]+(?:\.[0-9]+)?$/.test(input))throw Error('Enter a plain non-negative decimal, without commas or exponents.');const d=new Decimal(input);if(!d.isFinite()||d.isNegative())throw Error('Enter a valid non-negative amount.');return d;}
export function lineTotal(quantity:string,rate:string){return amount(quantity).mul(amount(rate)).toFixed(2);}
export function estimateTotal(lines:{quantity:string;rate:string}[]){return lines.reduce((sum,line)=>sum.plus(amount(line.quantity).mul(amount(line.rate))),new Decimal(0)).toFixed(2);}
export function wageTotal(hours:string,rate:string,overtime:string,otRate:string){return amount(hours).mul(amount(rate)).plus(amount(overtime).mul(amount(otRate))).toFixed(2);}
export function balance(total:string,paid:string){return amount(total).minus(amount(paid)).toFixed(2);}
