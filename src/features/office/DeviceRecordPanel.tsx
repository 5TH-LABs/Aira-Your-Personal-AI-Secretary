import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {useDemoOffice} from './useDemoOffice';
import RecordSummary from '../records/RecordSummary';
import RecordEditor from '../records/RecordEditor';
import {Button,ui} from '../shared/ui';

export default function DeviceRecordPanel({recordId,onOpenRecord}:{recordId:string;onOpenRecord:(id:string)=>void}){
 const demo=useDemoOffice(),[editing,setEditing]=useState(false),record=demo.records.find(r=>r.id===recordId);
 if(!record)return <Text>This record is no longer available.</Text>;
 if(editing)return <><Button title="Back to record" secondary onPress={()=>setEditing(false)}/><RecordEditor kind={record.kind} existing={record} workspace={demo.workspace} onSaved={()=>setEditing(false)}/></>;
 const immutable=record.data.posted&&['invoice','expense','payment','payroll','payment_plan'].includes(record.kind);
 return <View><Text style={ui.title}>{record.title}</Text><Text style={ui.tag}>{record.kind} · {record.data.posted?'Approved':'Saved record'}</Text><RecordSummary record={record} workspace={{...demo.workspace,onOpenRecord:(r:any)=>onOpenRecord(r.id)}}/>{!immutable&&<Button title="Edit this record" secondary onPress={()=>setEditing(true)}/>}</View>;
}
