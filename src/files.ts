import {Platform} from 'react-native';import * as FS from 'expo-file-system/legacy';import * as Sharing from 'expo-sharing';
let db:IDBDatabase|undefined;
async function database(){if(db)return db;return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('winklabz-mobile-files',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>{db=r.result;resolve(db);};r.onerror=()=>reject(r.error);});}
export async function saveFile(id:string,uri:string){if(Platform.OS!=='web'){const dir=FS.documentDirectory+'office/';await FS.makeDirectoryAsync(dir,{intermediates:true});await FS.copyAsync({from:uri,to:dir+id});return;}const blob=await(await fetch(uri)).blob(),d=await database();await new Promise<void>((resolve,reject)=>{const t=d.transaction('files','readwrite');t.objectStore('files').put(blob,id);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}
export async function fileData(uri:string){if(Platform.OS!=='web')return FS.readAsStringAsync(uri,{encoding:FS.EncodingType.Base64});const blob=await(await fetch(uri)).blob();return blobBase64(blob);}
export function blobBase64(blob:Blob){return new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=reject;r.readAsDataURL(blob);});}
export async function readFile(id:string){if(Platform.OS!=='web')return {uri:FS.documentDirectory+'office/'+id,data:await fileData(FS.documentDirectory+'office/'+id)};const d=await database(),blob=await new Promise<Blob>((resolve,reject)=>{const r=d.transaction('files').objectStore('files').get(id);r.onsuccess=()=>r.result?resolve(r.result):reject(Error('Original file not found on this device.'));r.onerror=()=>reject(r.error);});return {uri:URL.createObjectURL(blob),data:await blobBase64(blob)};}
export async function readTextFile(id:string){if(Platform.OS!=='web')return FS.readAsStringAsync(FS.documentDirectory+'office/'+id);const {uri}=await readFile(id);try{return await(await fetch(uri)).text();}finally{URL.revokeObjectURL(uri);}}
export async function shareDoc(doc:any){
 let original:{uri:string;data:string}|null=null;
 try{original=await readFile(doc.id);}catch{if(!doc.text||(doc.mime&&doc.mime!=='text/plain'))throw Error('The original file is unavailable on this device. The extracted text remains visible.');}
 const filename=doc.name||'Site Office document.txt';
 if(Platform.OS==='web'){
  try{const blob=original?await(await fetch(original.uri)).blob():new Blob([doc.text],{type:'text/plain'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}finally{if(original?.uri.startsWith('blob:'))URL.revokeObjectURL(original.uri);}
  return;
 }
 let uri=original?.uri;
 if(!uri){const target=FS.cacheDirectory+filename.replace(/[^\w.-]/g,'_');await FS.writeAsStringAsync(target,doc.text);uri=target;}
 if(uri&&await Sharing.isAvailableAsync())await Sharing.shareAsync(uri,{mimeType:doc.mime||'text/plain',dialogTitle:filename});else throw Error('Sharing is unavailable on this device.');
}


export async function removeCachedFile(id:string){if(!/^[a-f0-9-]{36}$/i.test(id))throw Error('Invalid cached file identity.');if(Platform.OS!=='web'){await FS.deleteAsync(FS.documentDirectory+'office/'+id,{idempotent:true});return;}const d=await database();await new Promise<void>((resolve,reject)=>{const t=d.transaction('files','readwrite');t.objectStore('files').delete(id);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}
