const {getDefaultConfig}=require('expo/metro-config');
const {limitCacheIO}=require('./scripts/cache-queue.cjs');
const config=getDefaultConfig(__dirname);
if(process.platform==='win32')config.cacheStores=config.cacheStores.map(store=>limitCacheIO(store));
module.exports=config;
