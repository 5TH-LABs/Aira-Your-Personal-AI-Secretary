import {Platform} from 'react-native';
import Constants from 'expo-constants';
const hostname=Platform.OS==='web'?(globalThis as any).location?.hostname:(Constants.expoConfig?.hostUri||'localhost').split(':')[0];
export const API=process.env.EXPO_PUBLIC_API_URL||`http://${hostname||'127.0.0.1'}:4184`;
export async function api(path:string,body?:any){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);try{const r=await fetch(API+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});const data=await r.json();if(!r.ok)throw Error(data.error||'The demo server could not complete the request.');return data;}finally{clearTimeout(timeout);}}
