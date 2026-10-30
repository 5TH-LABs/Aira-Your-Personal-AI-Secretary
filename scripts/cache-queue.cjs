// Metro can request thousands of cached modules at once across Android and web.
// Bound actual file I/O without changing Expo's cache format or transform behavior.
function limitCacheIO(store,limit=16){
 let active=0;const pending=[];
 function drain(){while(active<limit&&pending.length){const job=pending.shift();active++;Promise.resolve().then(job.run).then(job.resolve,job.reject).finally(()=>{active--;drain();});}}
 function queued(run){return new Promise((resolve,reject)=>{pending.push({run,resolve,reject});drain();});}
 async function retry(run){for(let attempt=0;;attempt++){try{return await run();}catch(error){if(!['EMFILE','ENFILE'].includes(error.code)||attempt>=3)throw error;await new Promise(resolve=>setTimeout(resolve,25*(attempt+1)));}}}
 return {get:key=>queued(()=>retry(()=>store.get(key))),set:(key,value)=>queued(()=>retry(()=>store.set(key,value))),clear:()=>store.clear()};
}
module.exports={limitCacheIO};
