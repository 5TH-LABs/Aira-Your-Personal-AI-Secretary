import React,{useState} from 'react';
import {View,Text} from 'react-native';
import {useDemoOffice} from './useDemoOffice';
import {commitDemoReview,demoSourceVersions} from '../../shared/demoCommands';
import RecordSummary from '../records/RecordSummary';
import RecordEditor from '../records/RecordEditor';
import {deriveDemoRecord} from '../../shared/demoRecords';
import {Button,ui} from '../shared/ui';

export default function DeviceReview({reviewId,onClose,onOpenRecord}:{reviewId:string;onClose:()=>void;onOpenRecord:(id:string)=>void}){
 const demo=useDemoOffice(),[editing,setEditing]=useState<number|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const review=demo.office.commandReviews?.find((r:any)=>r.id===reviewId);
 if(!review)return <Text>This review is unavailable.</Text>;
 function decide(decision:'approve'|'reject'){if(busy)return;setBusy(true);setError('');try{demo.setOffice((office:any)=>commitDemoReview(office,reviewId,decision));onClose();}catch(e){setError(e instanceof Error?e.message:'Could not apply these changes.');setBusy(false);}}
 if(editing!==null){const command=review.commands[editing];return <><Button title="Back to review" secondary onPress={()=>setEditing(null)}/><RecordEditor kind={command.record.kind} existing={command.record} workspace={{...demo.workspace,save:async(kind,title,input,siteId)=>{const data=deriveDemoRecord(kind,input,demo.records.filter(r=>r.id!==command.record.id),siteId);demo.setOffice((previous:any)=>{const next=JSON.parse(JSON.stringify(previous)),current=next.commandReviews.find((r:any)=>r.id===reviewId);if(current.status!=='pending')throw Error('This review was already resolved.');current.commands[editing].record={...command.record,title,siteId,data};current.commands[editing].sourceVersions=demoSourceVersions(data,demo.records);return next;});return command.record.id;}}} onSaved={()=>setEditing(null)}/></>;}
 return <View><Text style={ui.title}>{review.title}</Text><Text style={ui.sub}>{review.status==='pending'?'Review each change before applying it. Originals are retained; no external messages or bank transfers are performed.':'Decision: '+review.status}</Text>{review.commands.map((command:any,index:number)=><View key={index} style={ui.card}><Text style={ui.tag}>{command.tool} · {command.record.kind} · reviewed revision {command.expectedVersion||'new'}</Text><Text style={{fontSize:17,fontWeight:'600'}}>{command.record.title}</Text><RecordSummary record={command.record} workspace={{...demo.workspace,onOpenRecord:(record:any)=>onOpenRecord(record.id)}}/>{review.status==='pending'&&command.tool!=='delete'&&<Button title={'Edit change '+(index+1)} secondary onPress={()=>setEditing(index)}/>}</View>)}{!!error&&<Text accessibilityRole="alert" style={ui.error}>{error}</Text>}{review.status==='pending'&&<><Button title="Approve these changes" disabled={busy} onPress={()=>decide('approve')}/><Button title="Reject these changes" secondary disabled={busy} onPress={()=>decide('reject')}/></>}</View>;
}

export function DeviceReviewList({onOpen,status='pending',limit=100}:{onOpen:(id:string)=>void;status?:string;limit?:number}){const {office}=useDemoOffice();return <>{(office.commandReviews||[]).filter((r:any)=>r.status===status).slice(0,limit).map((r:any)=><View key={r.id} style={ui.card}><Text style={{fontWeight:'600'}}>{r.title}</Text><Text style={ui.sub}>{r.commands.length} proposed changes · {r.status}</Text><Button title={'Review changes: '+r.title} secondary onPress={()=>onOpen(r.id)}/></View>)}</>;}
