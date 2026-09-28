import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const playwrightPath=[path.join(root,'node_modules/playwright-core/index.mjs'),process.env.ZERO_PERIOD_NODE_MODULES&&path.join(process.env.ZERO_PERIOD_NODE_MODULES,'playwright-core/index.mjs')].filter(Boolean).find(fs.existsSync);
if(!playwrightPath)throw Error('Install development dependencies, or set ZERO_PERIOD_NODE_MODULES to an existing node_modules directory');
const {chromium}=await import(pathToFileURL(playwrightPath));
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[];
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'web/index.html')).href);
  await page.getByRole('button',{name:'从晚自习开始'}).click();
  await page.locator('.story-text').waitFor();
  assert.match(await page.locator('.story-text').innerText(),/晚饭/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`reader overflow ${width}`);
  const before=await page.locator('.story-text').innerText();await page.locator('[data-action=next]').click();
  assert.notEqual(await page.locator('.story-text').innerText(),before);
  const after=await page.locator('.story-text').innerText();await page.reload();await page.getByRole('button',{name:'继续阅读'}).click();
  assert.equal(await page.locator('.story-text').innerText(),after,'autosave resumes');
  await page.getByRole('button',{name:'存档',exact:true}).click();await page.locator('[data-action=slot-save][data-slot="0"]').click();
  assert.equal(await page.locator('[data-action=slot-load][data-slot="0"]').isEnabled(),true);
  await page.getByRole('button',{name:'关闭窗口'}).click();
  let pages=2,choices=0;
  while(pages<500){
   if(await page.locator('.reader-controls [data-action=home]').count())break;
   if(await page.locator('.choice').count()){await page.locator('.choice').first().click();choices++;}
   await page.locator('[data-action=next]').click();pages++;
  }
  assert.ok(pages>100,'long-form first two chapters traversed');assert.ok(choices>=3);
  assert.match(await page.locator('.story-text').innerText(),/仍在制作/);
  await page.getByRole('button',{name:'笔记',exact:true}).click();assert.ok(await page.locator('[data-evidence]').count()>0);
  await page.getByRole('button',{name:'关闭窗口'}).click();
  await page.screenshot({path:path.join(root,`qa/reader-${width}.png`),fullPage:true});
  results.push({width,pages,choices,autosave:true,manualSave:true,overflow:false});await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(root,'qa/web-test.json'),JSON.stringify({testedAt:new Date().toISOString(),results,errors},null,2));
 console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
