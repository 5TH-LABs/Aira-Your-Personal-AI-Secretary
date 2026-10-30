import AsyncStorage from '@react-native-async-storage/async-storage';
import {storage} from './kv';
export async function loadLegacyOffice(key:string){const current=await storage.getItem(key);if(current!==null)return current;const legacy=await AsyncStorage.getItem(key);if(legacy!==null){JSON.parse(legacy);await storage.setItem(key,legacy);}return legacy;}
export async function saveLegacyOffice(key:string,value:string){await storage.setItem(key,value);}
