import React,{useState} from 'react';
import {View,Text} from 'react-native';
import * as Crypto from 'expo-crypto';
import {agents,agentKinds} from '../../shared/agents';
import {useDemoOffice} from '../office/useDemoOffice';
import {prepareDemoCommands} from '../../shared/demoCommands';
import type {RecordKind} from '../../shared/records';
import RecordEditor from '../records/RecordEditor';
import {Button,ui} from '../shared/ui';
export default function AgentWorkspace({agentId,onReview,onOpenRecord,onAsk}:{agentId:string;onReview:(id:string)=>void;onOpenRecord:(id:string)=>void;onAsk:(text:string)=>void}){
 const demo=useDemoOffice(),agent=agents.find(a=>a.id===agentId),kinds=agentKinds[agentId]||['note','meeting','reminder'];
 const [kind,setKind]=useState<RecordKind>(agent?.kind||'note'),[creating,setCreating]=useState(false),[error,setError]=useState('');
 if(creating)return <><Button title="Back to saved records" secondary onPress={()=>setCreating(false)}/><RecordEditor kind={kind} workspace={demo.workspace} onSaved={()=>setCreating(false)}/></>;
 return <View><Text style={ui.title}>{agent?.name||'Personal assistant'}</Text><Text style={ui.sub}>{agent?.description||'Notes, meetings and reminders, alongside your site records.'}</Text><Text style={ui.tag}>Device workspace · shared with Chat on this device</Text><Button title="Ask this agent" secondary onPress={()=>onAsk('Help me with '+(agent?.name.toLowerCase()||'my notes, meetings and reminders')+'.')}/>{kinds.map(k=><Button key={k} title={'New '+k.replaceAll('_',' ')} secondary onPress={()=>{setKind(k);setCreating(true);}}/>)}<Text style={[ui.title,{fontSize:19,marginTop:18}]}>Saved records</Text>{demo.records.filter(r=>kinds.includes(r.kind)).map(record=><View key={record.id} style={ui.card}><Text style={{fontWeight:'600'}}>{record.title}</Text><Text style={ui.sub}>{record.kind} · {record.data.posted?'Approved':'Draft'}{record.data.calculatedTotal?' · Rs. '+record.data.calculatedTotal:''}</Text><Button title={'Open '+record.title} secondary onPress={()=>onOpenRecord(record.id)}/>{['invoice','expense','payment','payroll','payment_plan'].includes(record.kind)&&!record.data.posted&&<Button title={'Review and record '+record.title} onPress={()=>{try{const commands=prepareDemoCommands([{tool:'post',targetId:record.id}],demo.records,demo.directory,Crypto.randomUUID);onReview(demo.review(commands,record.title));}catch(e){setError(e instanceof Error?e.message:'Review unavailable.');}}}/>}</View>)}{!demo.records.some(r=>kinds.includes(r.kind))&&<Text style={ui.sub}>No saved records in this workflow yet. Create one or ask your office.</Text>}{!!error&&<Text accessibilityRole="alert" style={ui.error}>{error}</Text>}</View>;
}
