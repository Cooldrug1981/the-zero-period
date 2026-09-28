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
assert.equal(S.releaseReady,true,'accepted formal scope must pass the release audit');
assert.equal(S.releaseScope.approvedPanels,48);
assert.equal(S.releaseScope.approvedMasters,12);
assert.equal(S.releaseScope.unreviewedContentFiles,57);
const {chromium}=await import(pathToFileURL('C:/Users/320096551/Pocket-Star-Game/node_modules/playwright-core/index.mjs'));

function traverse(name,choose){
 let state=M.fresh(),steps=0,checkpoint=null;
 while(!['pending','complete'].includes(S.nodes[state.node].kind)){
  if(++steps>10000)throw Error(`${name}: route loop`);
  const n=S.nodes[state.node];
  if(n.kind==='choice'&&n.key===(name==='E'?'ch28_departure':'device_policy'))checkpoint=structuredClone(state);
  const choice=n.kind==='choice'?choose(n,state):undefined;
  if(n.kind==='choice')assert.ok(n.options.some(o=>o.id===choice&&M.matches(o.when,state.flags)),`${name}: unavailable ${n.key}=${choice}`);
  state=M.advance(state,choice);
 }
 assert.equal(M.validate(JSON.parse(JSON.stringify(state))).node,state.node,`${name}: save replay`);
 return {state,steps,kind:S.nodes[state.node].kind,chapter:S.nodes[state.node].chapter||null,checkpoint};
}
const defaults={ch28_departure:'stay'};
const route=(name,overrides)=>traverse(name,n=>overrides[n.key]||defaults[n.key]||(n.key.startsWith('offer-')?'skip':n.options[0].id));
const routes={
 A:route('A',{}),
 B:route('B',{device_policy:'obey'}),
 C:route('C',{ch26_external_route:'hold',ch29_roster_update:'families'}),
 D:route('D',{device_policy:'watch'}),
 E:route('E',{ch28_departure:'leave'}),
 F:route('F',{ch26_external_route:'hold',ch29_roster_update:'families',ch31_delegation:'central',ch31_ground_response:'wait',ch33_ground_response:'wait'})
};
const allSides=traverse('all side stories',n=>n.key.startsWith('offer-')?'read':defaults[n.key]||n.options[0].id);
assert.equal(S.nodes[allSides.state.node].ending,'A');
for(let i=1;i<=12;i++)assert.ok(allSides.state.trail.some(id=>id.startsWith(`side-s${String(i).padStart(2,'0')}.`)),`missing side s${i}`);
let previousTime=0,previousScene='';
for(const id of allSides.state.trail){
 const n=S.nodes[id];
 if(n?.kind!=='text'||!id.endsWith('.p0')||id.startsWith('end-'))continue;
 const clock=/^(\d{2}):(\d{2})/.exec(n.time||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(n.date||'')||!clock)continue;
 const time=Date.parse(`${n.date}T${clock[1]}:${clock[2]}:00Z`);
 assert.ok(time>=previousTime,`time reversal: ${previousScene} -> ${id} (${n.date} ${n.time})`);
 previousTime=time;previousScene=id;
}
assert.equal(S.nodes['ch1.paper_at_door.p2'].art,'ch01-paper_at_door-02');
assert.equal(S.nodes['ch1.teacher_rollcall.p3'].art,'ch01-teacher_rollcall-02');
const familyLoss=route('F family loss',{ch26_external_route:'hold',ch29_roster_update:'workers',ch31_delegation:'central',ch31_ground_response:'wait',ch33_ground_response:'wait'});
assert.equal(S.nodes[familyLoss.state.node].ending,'F');
assert.equal(familyLoss.state.flags.ch33_loss_family,'child');
for(const [ending,r] of Object.entries(routes)){
 assert.equal(r.kind,'complete',`${ending}: incomplete route`);
 assert.equal(S.nodes[r.state.node].ending,ending,`${ending}: wrong ending`);
 if(ending!=='E')assert.equal(r.state.flags.obligations_sent,true,`${ending}: unsent obligation`);
}
assert.equal(routes.A.state.flags.ch32_last_packet_received,true);
assert.equal(routes.A.state.flags.ch32_new_inputs_stopped,true);
assert.equal(routes.F.state.flags.ch33_loss_worker,'ma');
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
const url=process.env.ZERO_PERIOD_URL||`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[],browserRoutes={};
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(`${width}: ${e.message}`));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${width}: HTTP ${r.status()} ${r.url()}`);});
  await page.goto(url);
  assert.equal(await page.locator('.cover-version').innerText(),'正式网页版 1.0.0');
  assert.match(await page.locator('.cover-meta').innerText(),/未配画面的场景仍可阅读/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`cover overflow ${width}`);
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
  assert.match(await page.locator('#panel-body').innerText(),/36 · 明天仍要点名/);
  await page.getByRole('button',{name:'关闭窗口'}).click();
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
  if(width===1440){
   await page.evaluate(([key,raw])=>localStorage.setItem(key,JSON.stringify(raw)),[M.key,routes.A.state]);
   await page.reload();await page.getByRole('button',{name:'继续阅读'}).click();
   assert.match(await page.locator('.story-text').innerText(),/本路线完/);
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
   for(const [ending,result] of Object.entries(routes)){
    assert.ok(result.checkpoint,`${ending}: missing browser checkpoint`);
    await page.evaluate(([key,raw])=>localStorage.setItem(key,JSON.stringify(raw)),[M.key,result.checkpoint]);
    await page.reload();await page.getByRole('button',{name:'继续阅读'}).click();
    let expected=structuredClone(result.checkpoint),steps=0;
    while(S.nodes[expected.node].kind!=='complete'){
     if(++steps>600)throw Error(`${ending}: browser route loop`);
     const current=S.nodes[expected.node];
     let choice;
     if(current.kind==='choice'){
      choice=ending==='E'&&current.key==='ch28_departure'?'leave':({B:'obey',D:'watch'}[ending]||'shutdown');
      if(!current.options.some(o=>o.id===choice&&M.matches(o.when,expected.flags)))choice=current.options.find(o=>M.matches(o.when,expected.flags)).id;
      await page.locator(`[data-choice="${choice}"]`).click();
     }
     await page.locator('[data-action=next]').click();
     expected=M.advance(expected,choice);
     if(steps%25===0||S.nodes[expected.node].kind==='complete')assert.equal(await page.locator('.story-text').textContent(),S.nodes[expected.node].text||'',`${ending}: browser/model divergence`);
    }
    assert.equal(S.nodes[expected.node].ending,ending);
    browserRoutes[ending]=steps;
   }
  }
  results.push({width,autosave:true,manualSave:true,overflow:false,importExport:true});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 const report={testedAt:new Date().toISOString(),routes:Object.fromEntries(Object.entries(routes).map(([ending,r])=>[ending,{steps:r.steps,terminal:r.kind,obligationsSent:r.state.flags.obligations_sent===true}])),browserRoutes,sideStoriesRead:12,familyLossVariant:true,results,errors};
 fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa/web-test.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
