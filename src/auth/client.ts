import {createClient} from '@supabase/supabase-js';
import {sessionStorage} from './sessionStorage';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL,key=process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const cloudConfigured=!!url&&!!key;
export const supabase=cloudConfigured?createClient(url!,key!,{auth:{flowType:'pkce',storage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}):null;
