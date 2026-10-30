import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
const key=(v:string)=>v.replace(/[^a-zA-Z0-9._-]/g,'_');
type Manifest={prefix:string;count:number};
async function manifest(k:string):Promise<Manifest|null>{const raw=await SecureStore.getItemAsync(key(k));return raw?JSON.parse(raw):null;}
export const sessionStorage={
 async getItem(k:string){const m=await manifest(k);if(!m)return null;const chunks=await Promise.all(Array.from({length:m.count},(_,i)=>SecureStore.getItemAsync(m.prefix+'.'+i)));return chunks.some(c=>c===null)?null:chunks.join('');},
 async setItem(k:string,value:string){const old=await manifest(k),prefix=key(k)+'.'+Crypto.randomUUID(),chunks=value.match(/[\s\S]{1,1000}/g)||[''];await Promise.all(chunks.map((v,i)=>SecureStore.setItemAsync(prefix+'.'+i,v)));await SecureStore.setItemAsync(key(k),JSON.stringify({prefix,count:chunks.length}));if(old)await Promise.all(Array.from({length:old.count},(_,i)=>SecureStore.deleteItemAsync(old.prefix+'.'+i)));},
 async removeItem(k:string){const old=await manifest(k);await SecureStore.deleteItemAsync(key(k));if(old)await Promise.all(Array.from({length:old.count},(_,i)=>SecureStore.deleteItemAsync(old.prefix+'.'+i)));}
};
