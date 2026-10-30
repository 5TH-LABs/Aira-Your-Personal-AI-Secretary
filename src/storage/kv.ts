import * as SQLite from 'expo-sqlite';
let database:Promise<SQLite.SQLiteDatabase>|undefined;
async function db(){if(!database)database=(async()=>{const d=await SQLite.openDatabaseAsync('site-office-v2.db');await d.execAsync('PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)');return d;})();return database;}
export const storage={async getItem(key:string){return (await(await db()).getFirstAsync<{value:string}>('SELECT value FROM kv WHERE key=?',key))?.value??null;},async setItem(key:string,value:string){await(await db()).runAsync('INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',key,value);},async removeItem(key:string){await(await db()).runAsync('DELETE FROM kv WHERE key=?',key);}};
