import {spawn} from 'node:child_process';import fs from 'node:fs/promises';import net from 'node:net';import QRCode from 'qrcode';import {fileURLToPath} from 'node:url';import {detectLanAddress} from './network.mjs';
const root=new URL('../',import.meta.url),lan=process.argv.includes('--lan'),development=process.argv.includes('--dev-client');
async function available(port){return new Promise(resolve=>{const server=net.createServer();server.once('error',()=>resolve(false));server.listen(port,()=>server.close(()=>resolve(true)));});}
try{
 for(const port of [4184,8081])if(!await available(port))throw Error(`Port ${port} is in use. Stop the running Site Office demo before starting a new one.`);
 const address=lan?await detectLanAddress():'127.0.0.1';if(!address)throw Error('No active Wi-Fi or Ethernet address found. Connect the laptop to your phone’s Wi-Fi and retry.');
 const connection={mode:lan?'lan':'local',host:address,metroPort:8081,apiPort:4184,expoUrl:development?`winklabz://expo-development-client/?url=${encodeURIComponent('http://'+address+':8081')}`:`exp://${address}:8081`,webUrl:'http://localhost:8081',createdAt:new Date().toISOString()};
 await fs.mkdir(new URL('.expo/',root),{recursive:true});await fs.writeFile(new URL('.expo/demo-connection.json',root),JSON.stringify(connection,null,2));
 if(lan){await QRCode.toFile(fileURLToPath(new URL('.expo/android-qr.png',root)),connection.expoUrl,{width:400,margin:2});await QRCode.toFile(fileURLToPath(new URL('.expo/android-qr.svg',root)),connection.expoUrl,{type:'svg',margin:2});console.log('\nANDROID PHONE DEMO\nInstall Expo Go for SDK 57. Connect to the same Wi-Fi and scan:\n');console.log(await QRCode.toString(connection.expoUrl,{type:'terminal',small:true}));console.log(`Expo Go: ${connection.expoUrl}\nPhone connection check: http://${address}:4184/api/status\nLaptop preview: ${connection.webUrl}\nQR image: http://${address}:4184/demo/qr.svg\n`);}
 const env={...process.env,...(lan?{REACT_NATIVE_PACKAGER_HOSTNAME:address}:{})};
 const children=[spawn(process.execPath,['server/index.mjs',...(lan?['--lan']:[])],{cwd:root,stdio:'inherit',env}),spawn(process.execPath,['node_modules/expo/bin/cli','start','--web',development?'--dev-client':'--go',lan?'--lan':'--localhost','--port','8081','--max-workers','2'],{cwd:root,stdio:'inherit',env})];let stopping=false;
 function stop(){if(stopping)return;stopping=true;for(const child of children){if(!child.pid)continue;if(process.platform==='win32')spawn('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else child.kill('SIGTERM');}}
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
 for(const child of children){child.on('error',e=>{console.error(e.message);stop();process.exitCode=1;});child.on('exit',code=>{if(!stopping){process.exitCode=code||0;stop();}});}
}catch(e){console.error(e.message);process.exitCode=1;}
