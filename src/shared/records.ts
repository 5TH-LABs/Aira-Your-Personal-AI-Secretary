import {z} from 'zod';
export const roles=['owner','office_manager','accountant','supervisor','staff'] as const;
export const kinds=['site','contact','task','note','meeting','reminder','document','letter','contract','permit','report','attendance','payroll','staff','leave','subcontract','estimate','invoice','expense','payment','finding','announcement','rate','wage_policy','payment_plan'] as const;
export const kindSchema=z.enum(kinds);
export type RecordKind=z.infer<typeof kindSchema>;
export type Role=typeof roles[number];
export const recordSchema=z.object({id:z.uuid(),companyId:z.uuid(),kind:kindSchema,siteId:z.uuid().nullable(),version:z.number().int().positive(),title:z.string().trim().min(1).max(250),data:z.record(z.string(),z.json()),updatedAt:z.iso.datetime({offset:true}),deletedAt:z.iso.datetime({offset:true}).nullable()});
export type OfficeRecord=z.infer<typeof recordSchema>;
export const mutationSchema=z.object({operationId:z.uuid(),record:recordSchema,expectedVersion:z.number().int().nonnegative()});
export type Mutation=z.infer<typeof mutationSchema>;
export type PendingMutation=Mutation & {state:'pending'|'failed'|'conflict';error?:string};
export const offlineKinds:readonly RecordKind[]=['task','note','attendance','report'];
export const privateKinds:readonly RecordKind[]=['staff','leave','payroll','wage_policy','payment_plan'];
export interface Membership {companyId:string;userId:string;role:Role;siteIds:string[]}
export function canRead(member:Membership,record:OfficeRecord){if(member.companyId!==record.companyId)return false;if(member.role==='owner')return true;if(record.kind==='site'&&['supervisor','staff'].includes(member.role))return member.siteIds.includes(record.id);if(privateKinds.includes(record.kind)&&['staff','leave','wage_policy'].includes(record.kind)&&record.data.assigneeId===member.userId)return true;if(privateKinds.includes(record.kind))return ['payroll','payment_plan','wage_policy'].includes(record.kind)?member.role==='accountant':member.role==='office_manager';if(member.role==='office_manager'||member.role==='accountant')return true;if(record.siteId&&!member.siteIds.includes(record.siteId))return false;if(!record.siteId&&!['site','announcement','rate'].includes(record.kind)&&record.data.assigneeId!==member.userId)return false;if(member.role==='staff')return ['task','note','attendance','report','document'].includes(record.kind)&&record.data.assigneeId===member.userId;return true;}
export const statusSchema=z.enum(['prepared','awaiting_approval','queued','completed','failed','uncertain','cancelled']);
export type ExecutionStatus=z.infer<typeof statusSchema>;
export interface ApprovalSnapshot {revision:number;recordId:string;recipient:string;attachments:string[];amount:string|null;body:string}
export interface AgentRun {id:string;companyId:string;status:ExecutionStatus;steps:{agent:string;status:ExecutionStatus;sourceIds:string[];error?:string}[]}
