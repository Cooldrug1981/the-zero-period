import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const playwrightPath=[path.join(root,'node_modules/playwright-core/index.mjs'),process.env.ZERO_PERIOD_NODE_MODULES&&path.join(process.env.ZERO_PERIOD_NODE_MODULES,'playwright-core/index.mjs')].filter(Boolean).find(fs.existsSync);
if(!playwrightPath)throw Error('Install development dependencies, or set ZERO_PERIOD_NODE_MODULES to an existing node_modules directory');
const {_electron}=await import(pathToFileURL(playwrightPath));
const results=[];
const qaDir=path.join(root,'qa');fs.mkdirSync(qaDir,{recursive:true});
const zip=path.join(root,'release/windows/The-Zero-Period-0.3.0-alpha.1-win-x64.zip');assert.ok(fs.existsSync(zip));
const zipDir=fs.mkdtempSync(path.join(qaDir,'zip-unpacked-'));
execFileSync('tar',['-xf',zip,'-C',zipDir],{timeout:120000,windowsHide:true});
for(const [kind,executablePath] of [['unpacked',path.join(root,'release/windows/win-unpacked/The Zero Period.exe')],['zip',path.join(zipDir,'The Zero Period.exe')],['portable',path.join(root,'release/windows/The-Zero-Period-0.3.0-alpha.1-win-x64.exe')]]){
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
  fs.writeFileSync(path.join(root,'qa/desktop-test.json'),JSON.stringify({testedAt:new Date().toISOString(),results,complete:results.length===3},null,2));
  console.log(`${kind} startup and save restoration passed.`);
 }finally{await instance.close();}
}
fs.writeFileSync(path.join(root,'qa/desktop-test.json'),JSON.stringify({testedAt:new Date().toISOString(),results,complete:true},null,2));console.log(JSON.stringify(results,null,2));
