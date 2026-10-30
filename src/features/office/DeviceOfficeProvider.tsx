import React,{createContext,useContext,useEffect,useRef,useState,useCallback} from 'react';
import {loadLegacyOffice,saveLegacyOffice} from '../../storage/legacy';
import {seed} from '../../data';
import {recoverDeviceRequests} from './deviceSession';
import {Repository} from '../../storage/repository';

const KEY='winklabz-native-v1';
interface DeviceOfficeValue {
 office:any;
 setOffice:React.Dispatch<React.SetStateAction<any>>;
 busy:boolean;
 storageError:string;
 beginRequest:()=>boolean;
 endRequest:()=>void;
 draft:string;setDraft:React.Dispatch<React.SetStateAction<string>>;
 attachment:any;setAttachment:React.Dispatch<React.SetStateAction<any>>;
 selectedSite:string;setSelectedSite:React.Dispatch<React.SetStateAction<string>>;
 pendingControl:any;setPendingControl:React.Dispatch<React.SetStateAction<any>>;
 cancelRequest:()=>void;requestSignal:()=>AbortSignal|undefined;
}
const Context=createContext<DeviceOfficeValue|null>(null);
export function useDeviceOffice(){const value=useContext(Context);if(!value)throw Error('Device office provider unavailable.');return value;}

/** Keep device records and in-flight requests alive when Router replaces a screen. */
export function DeviceOfficeProvider({children}:{children:React.ReactNode}){
 const [office,setOfficeState]=useState<any>(null),[draft,setDraft]=useState(''),[attachment,setAttachment]=useState<any>(null),[selectedSite,setSelectedSite]=useState('all'),[pendingControl,setPendingControl]=useState<any>(null),[busy,setBusy]=useState(false),[storageError,setStorageError]=useState('');
 const saving=useRef(Promise.resolve()),requestLock=useRef(false),activeRequest=useRef<AbortController|null>(null),officeRef=useRef<any>(null);
 const setOffice=useCallback<React.Dispatch<React.SetStateAction<any>>>(value=>{const next=typeof value==='function'?value(officeRef.current):value;officeRef.current=next;setOfficeState(next);},[]);
 useEffect(()=>{
  let alive=true;
  Promise.all([loadLegacyOffice(KEY),new Repository('demo-complete').read().catch(()=>({records:[]}))]).then(([raw,specialists])=>{
   if(!alive)return;
   try{const restored=recoverDeviceRequests(raw?JSON.parse(raw):seed());restored.records=restored.records||[];for(const record of specialists.records)if(!restored.records.some((r:any)=>r.id===record.id))restored.records.push(record);restored.commandReviews=restored.commandReviews||[];setOffice(restored);}
   catch{setOffice(seed());setStorageError('Could not restore saved records. Sample data loaded.');}
  }).catch(()=>{if(alive){setOffice(seed());setStorageError('Device storage unavailable. Changes may not persist.');}});
  return()=>{alive=false;};
 },[setOffice]);
 useEffect(()=>{
  if(!office)return;
  const snapshot=JSON.stringify(office);
  saving.current=saving.current.then(()=>saveLegacyOffice(KEY,snapshot)).catch(()=>setStorageError('Storage is full. Your latest change may not be saved.'));
 },[office]);
 function beginRequest(){if(requestLock.current)return false;requestLock.current=true;activeRequest.current=new AbortController();setBusy(true);return true;}
 function endRequest(){activeRequest.current=null;requestLock.current=false;setBusy(false);}
 const validSelectedSite=office&&selectedSite!=='all'&&!office.sites.some((s:any)=>s.id===selectedSite)?'all':selectedSite;
 return <Context.Provider value={{office,setOffice,busy,storageError,beginRequest,endRequest,draft,setDraft,attachment,setAttachment,selectedSite:validSelectedSite,setSelectedSite,pendingControl,setPendingControl,cancelRequest:()=>activeRequest.current?.abort(),requestSignal:()=>activeRequest.current?.signal}}>{children}</Context.Provider>;
}
