import {defineConfig} from '@playwright/test';import fs from 'node:fs';
const chrome=process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
export default defineConfig({testDir:'./tests/ui',testMatch:'*.spec.mjs',timeout:45000,workers:1,reporter:'list',use:{baseURL:'http://127.0.0.1:8090',viewport:{width:390,height:844},launchOptions:chrome&&fs.existsSync(chrome)?{executablePath:chrome}:{}},webServer:{command:'node tests/ui/serve.mjs',url:'http://127.0.0.1:8090',reuseExistingServer:false},outputDir:'qa/playwright'});
