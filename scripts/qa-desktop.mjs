import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import {createServer} from 'node:net';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const playwrightPath=[path.join(root,'node_modules/playwright-core/index.mjs'),process.env.ZERO_PERIOD_NODE_MODULES&&path.join(process.env.ZERO_PERIOD_NODE_MODULES,'playwright-core/index.mjs')].filter(Boolean).find(fs.existsSync);
if(!playwrightPath)throw Error('Install development dependencies, or set ZERO_PERIOD_NODE_MODULES to an existing node_modules directory');
const {_electron,chromium}=await import(pathToFileURL(playwrightPath));
const results=[];
const qaDir=path.join(root,'qa');fs.mkdirSync(qaDir,{recursive:true});
const zip=path.join(root,'release/windows/The-Zero-Period-0.3.0-alpha.1-win-x64.zip');assert.ok(fs.existsSync(zip));
const zipDir=fs.mkdtempSync(path.join(qaDir,'zip-unpacked-'));
execFileSync('tar',['-xf',zip,'-C',zipDir],{timeout:120000,windowsHide:true});
for(const [kind,executablePath] of [['unpacked',path.join(root,'release/windows/win-unpacked/The Zero Period.exe')],['zip',path.join(zipDir,'The Zero Period.exe')]]){
 assert.ok(fs.existsSync(executablePath),`${kind} executable missing`);
 console.log(`Checking ${kind} startup and save restoration...`);
 const instance=await _electron.launch({executablePath,env:{...process.env,ZERO_PERIOD_QA_PROFILE:path.join(root,'qa','desktop-profile-'+kind)},timeout:180000});
 try{
  const page=await instance.firstWindow();await page.waitForLoadState('domcontentloaded');
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('button',{name:'从晚自习开始'}).click();
  if(await page.locator('[data-action=new-confirm]').count())await page.locator('[data-action=new-confirm]').click();
  await page.locator('.story-text').waitFor();assert.match(await page.locator('.story-text').innerText(),/晚饭/);
  const security=await page.evaluate(()=>({node:typeof window.require,process:typeof window.process,url:location.protocol}));
  assert.equal(security.node,'undefined');assert.equal(security.process,'undefined');assert.equal(security.url,'file:');
  await page.locator('[data-action=next]').click();const text=await page.locator('.story-text').innerText();
  await page.reload();await page.getByRole('button',{name:'继续阅读'}).click();assert.equal(await page.locator('.story-text').innerText(),text);
  await page.screenshot({path:path.join(root,`qa/desktop-${kind}.png`)});assert.deepEqual(errors,[]);
  results.push({kind,starts:true,offlineLocalFiles:true,contextIsolation:true,saveRestores:true,errors});
  fs.writeFileSync(path.join(root,'qa/desktop-test.json'),JSON.stringify({testedAt:new Date().toISOString(),results,complete:false},null,2));
  console.log(`${kind} startup and save restoration passed.`);
 }finally{await instance.close();}
}
const portable=path.join(root,'release/windows/The-Zero-Period-0.3.0-alpha.1-win-x64.exe');
assert.ok(fs.existsSync(portable),'portable executable missing');
const portableProfile=fs.mkdtempSync(path.join(qaDir,'portable-profile-'));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function freePort(){return new Promise((resolve,reject)=>{const server=createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port));});});}
async function openPortable(){
 const port=await freePort();
 const child=spawn(portable,[`--remote-debugging-port=${port}`,'--remote-debugging-address=127.0.0.1'],{env:{...process.env,ZERO_PERIOD_QA_PROFILE:portableProfile},windowsHide:true,stdio:'ignore'});
 let browser,lastError;
 for(let i=0;i<150;i++){
  if(child.exitCode!==null)throw Error(`Portable launcher exited before the reader opened: ${child.exitCode}`);
  try{browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`,{timeout:1500});break;}catch(error){lastError=error;await delay(1000);}
 }
 if(!browser){child.kill();throw Error(`Portable reader did not open a debugging endpoint: ${lastError?.message}`);}
 const context=browser.contexts()[0];let page;
 for(let i=0;i<60;i++){page=context.pages().find(item=>item.url().startsWith('file:'));if(page)break;await delay(500);}
 if(!page){await browser.close();child.kill();throw Error('Portable reader window did not open');}
 await page.waitForLoadState('domcontentloaded');
 return {child,browser,page};
}
async function closePortable({child,browser,page}){
 try{await page.close();}finally{await browser.close();}
 if(child.exitCode===null){
  const exited=await Promise.race([new Promise(resolve=>child.once('exit',()=>resolve(true))),delay(20000).then(()=>false)]);
  if(!exited){child.kill();throw Error('Portable launcher did not exit after closing its window');}
 }
}
console.log('Checking portable startup and save restoration across two launches...');
let first=await openPortable();let savedText;const portableErrors=[];
try{
 first.page.on('pageerror',error=>portableErrors.push(error.message));
 await first.page.getByRole('button',{name:'从晚自习开始'}).click();
 await first.page.locator('.story-text').waitFor();assert.match(await first.page.locator('.story-text').innerText(),/晚饭/);
 const security=await first.page.evaluate(()=>({node:typeof window.require,process:typeof window.process,url:location.protocol}));
 assert.equal(security.node,'undefined');assert.equal(security.process,'undefined');assert.equal(security.url,'file:');
 await first.page.locator('[data-action=next]').click();savedText=await first.page.locator('.story-text').innerText();
 await first.page.screenshot({path:path.join(qaDir,'desktop-portable.png')});
}finally{await closePortable(first);}
let second=await openPortable();
try{
 second.page.on('pageerror',error=>portableErrors.push(error.message));
 await second.page.getByRole('button',{name:'继续阅读'}).click();
 assert.equal(await second.page.locator('.story-text').innerText(),savedText);
 assert.deepEqual(portableErrors,[]);
}finally{await closePortable(second);}
results.push({kind:'portable',starts:true,offlineLocalFiles:true,contextIsolation:true,saveRestores:true,relaunchRestores:true,errors:portableErrors});
console.log('portable startup and save restoration passed.');
fs.writeFileSync(path.join(root,'qa/desktop-test.json'),JSON.stringify({testedAt:new Date().toISOString(),results,complete:true},null,2));console.log(JSON.stringify(results,null,2));
