import {test,expect} from '@playwright/test';
import fs from 'node:fs';
const chrome=process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':'';
test.use({permissions:['microphone'],launchOptions:{...(chrome&&fs.existsSync(chrome)?{executablePath:chrome}:{}),args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}});
test.beforeEach(async({page})=>{await page.route('**/api/status',route=>route.fulfill({json:{connected:true}}));});

test('voice capture, editable transcription and navigation use the same command path',async({page})=>{
 await page.route('**/api/transcribe',route=>{const body=route.request().postDataJSON();expect(body.attachment.mimeType).toBe('audio/webm');expect(body.attachment.data.length).toBeGreaterThan(0);return route.fulfill({json:{text:'Open permits'}});});
 await page.goto('/home');await page.getByRole('button',{name:'Speak to office',exact:true}).click();await page.getByRole('button',{name:'Start recording',exact:true}).click();await expect(page.getByText('1s / 60s',{exact:true})).toBeVisible({timeout:10000});await page.getByRole('button',{name:'Stop recording',exact:true}).click();await expect(page.getByRole('textbox',{name:'Voice transcript',exact:true})).toHaveValue('Open permits');await page.getByRole('textbox',{name:'Voice transcript',exact:true}).fill('Open estimates');await page.getByRole('button',{name:'Use voice request',exact:true}).click();await expect(page.getByText('Cost calculator',{exact:true}).last()).toBeVisible();
});
test('denied microphone permission leaves the app usable',async({page})=>{
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Permission denied','NotAllowedError');};});
 await page.goto('/home');await page.getByRole('button',{name:'Speak to office',exact:true}).click();await page.getByRole('button',{name:'Start recording',exact:true}).click();await expect(page.getByRole('alert')).toContainText(/denied|permission|microphone/i);await page.getByRole('button',{name:'Close dialog',exact:true}).click();await expect(page.getByRole('tab',{name:'Home',exact:true})).toBeVisible();
});
test('closing an active recording does not leave a recorder error',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/home');await page.getByRole('button',{name:'Speak to office',exact:true}).click();await page.getByRole('button',{name:'Start recording',exact:true}).click();await expect(page.getByRole('button',{name:'Stop recording',exact:true})).toBeVisible();await page.getByRole('button',{name:'Close dialog',exact:true}).click();await page.getByRole('tab',{name:'Agents',exact:true}).click();await expect(page.getByText('Your agents',{exact:true})).toBeVisible();expect(errors).toEqual([]);
});
