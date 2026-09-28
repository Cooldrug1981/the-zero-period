import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {makeModel} from '../src/model.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const webRoot=path.join(root,'web');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(webRoot,'story.js'),'utf8'),sandbox);
const S=sandbox.window.ZERO_PERIOD,M=makeModel(S);
const {chromium}=await import(pathToFileURL('C:/Users/320096551/Pocket-Star-Game/node_modules/playwright-core/index.mjs'));

function traverse(name,choose){
 let state=M.fresh(),steps=0;
 while(!['pending','complete'].includes(S.nodes[state.node].kind)){
  if(++steps>10000)throw Error(`${name}: route loop`);
  const n=S.nodes[state.node];
  const choice=n.kind==='choice'?choose(n,state):undefined;
  if(n.kind==='choice')assert.ok(n.options.some(o=>o.id===choice&&M.matches(o.when,state.flags)),`${name}: unavailable ${n.key}=${choice}`);
  state=M.advance(state,choice);
 }
 assert.equal(M.validate(JSON.parse(JSON.stringify(state))).node,state.node,`${name}: save replay`);
 return {state,steps,kind:S.nodes[state.node].kind,chapter:S.nodes[state.node].chapter||null};
}
const active=traverse('active',n=>n.key==='ch28_departure'?'stay':n.key.startsWith('offer-')?'read':n.options[0].id);
const left=traverse('left',n=>n.key==='ch28_departure'?'leave':n.key.startsWith('offer-')?'skip':n.options[0].id);
assert.equal(active.kind,'pending');assert.equal(active.chapter,33);
assert.equal(left.kind,'complete');assert.equal(S.nodes[left.state.node].ending,'E');
assert.equal(active.state.flags.ch32_last_packet_received,true);
assert.equal(active.state.flags.ch32_new_inputs_stopped,true);
assert.equal(active.state.flags.obligations_sent,undefined);
for(const a of Object.values(S.art))if(a.status==='approved')assert.ok(fs.existsSync(path.join(root,a.path)),`missing approved art ${a.path}`);
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(webRoot,'.'+pathname);
 if(!file.startsWith(webRoot+path.sep)&&file!==webRoot){res.writeHead(403).end();return;}
 const target=fs.statSync(file,{throwIfNoEntry:false})?.isDirectory()?path.join(file,'index.html'):file;
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp'}[path.extname(target)]||'application/octet-stream';
 fs.createReadStream(target).on('error',()=>res.writeHead(404).end()).once('open',()=>res.writeHead(200,{'content-type':mime})).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[];
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(`${width}: ${e.message}`));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${width}: HTTP ${r.status()} ${r.url()}`);});
  await page.goto(url);
  assert.match(await page.locator('.cover-version').innerText(),/开发预览版.*制作中/);
  await page.getByRole('button',{name:'从晚自习开始'}).click();
  assert.match(await page.locator('.story-text').innerText(),/晚饭/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`reader overflow ${width}`);
  const first=await page.locator('.story-text').innerText();
  await page.locator('[data-action=next]').click();
  const second=await page.locator('.story-text').innerText();assert.notEqual(second,first);
  await page.reload();await page.getByRole('button',{name:'继续阅读'}).click();
  assert.equal(await page.locator('.story-text').innerText(),second,'autosave resumes');
  await page.getByRole('button',{name:'存档',exact:true}).click();
  await page.locator('[data-action=slot-save][data-slot="0"]').click();
  assert.equal(await page.locator('[data-action=slot-load][data-slot="0"]').isEnabled(),true);
  await page.getByRole('button',{name:'关闭窗口'}).click();
  await page.locator('[data-action=history]').click();
  assert.match(await page.locator('#panel-body').innerText(),/已读记录/);
  await page.getByRole('button',{name:'关闭窗口'}).click();
  await page.getByRole('button',{name:'目录',exact:true}).click();
  assert.match(await page.locator('#panel-body').innerText(),/仍在制作/);
  await page.getByRole('button',{name:'关闭窗口'}).click();
  if(width===1440){
   await page.getByRole('button',{name:'存档',exact:true}).click();
   const downloadPromise=page.waitForEvent('download');
   await page.locator('[data-action=export]').click();
   const download=await downloadPromise;
   const exported=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
   assert.equal(M.validate(exported).node,exported.node);
   await page.getByRole('button',{name:'关闭窗口'}).click();
   await page.getByRole('button',{name:'存档',exact:true}).click();
   await page.locator('#import-file').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(exported))});
   await page.waitForFunction(()=>document.querySelector('#panel-title')?.textContent==='导入存档');
   await page.locator('[data-action=import-confirm]').click();
   assert.equal(await page.locator('.story-text').innerText(),second);
   await page.evaluate(([key,raw])=>localStorage.setItem(key,JSON.stringify(raw)),[M.key,active.state]);
   await page.reload();await page.getByRole('button',{name:'继续阅读'}).click();
   assert.match(await page.locator('.story-text').innerText(),/仍在制作/);
   await page.getByRole('button',{name:'笔记',exact:true}).click();
   assert.ok(await page.locator('[data-evidence]').count()>0);
   await page.getByRole('button',{name:'关闭窗口'}).click();
   await page.locator('[data-action=history]').click();
   assert.ok(await page.locator('[data-action=history-page]').count()>0);
   await page.locator('[data-action=history-page]').first().click();
   assert.match(await page.locator('#panel-body').innerText(),/更早的记录/);
   await page.getByRole('button',{name:'关闭窗口'}).click();
   await page.locator('[data-action=research]').click();
   assert.match(await page.locator('#panel-body').innerText(),/虚构前提/);
   assert.ok(await page.locator('#panel-body a[href^="https://"]').count()>0);
   await page.getByRole('button',{name:'关闭窗口'}).click();
  }
  results.push({width,autosave:true,manualSave:true,overflow:false,importExport:width===1440});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 const report={testedAt:new Date().toISOString(),routes:{active:{steps:active.steps,terminal:active.kind,chapter:active.chapter},left:{steps:left.steps,terminal:left.kind,ending:'E'}},results,errors};
 fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa/web-test.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
