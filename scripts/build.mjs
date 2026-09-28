import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileStory} from '../src/compile.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function docs(dir){const p=path.join(root,'content',dir);return fs.existsSync(p)?fs.readdirSync(p).filter(f=>f.endsWith('.json')).sort().map(f=>JSON.parse(fs.readFileSync(path.join(p,f),'utf8'))):[];}
const plan=JSON.parse(read('production.json'));
const catalog=fs.existsSync(path.join(root,'art/catalog.json'))?JSON.parse(read('art/catalog.json')):{entries:{}};
const S=compileStory({chapters:docs('chapters'),sideStories:docs('side-stories'),endings:docs('endings'),research:docs('research'),catalog,plan});
S.releaseReady=false;S.buildLabel='开发预览版 0.3.0-alpha.1 · 制作中';
fs.mkdirSync(path.join(root,'web'),{recursive:true});
fs.writeFileSync(path.join(root,'web/story.js'),'window.ZERO_PERIOD='+JSON.stringify(S).replace(/</g,'\\u003c')+';\n');
fs.writeFileSync(path.join(root,'web/app.js'),read('src/model.mjs').replace(/export function /g,'function ')+'\n'+read('src/app.js'));
fs.writeFileSync(path.join(root,'web/style.css'),read('src/base.css')+'\n.notebook-prose{white-space:pre-line}.archive-item .dialog-actions{margin-top:8px}.dialog-body{overflow-wrap:anywhere}.scene-meta{flex-wrap:wrap}.frame.asset-error{aspect-ratio:16/9;min-height:120px}.header-actions{flex-wrap:wrap}@media(max-width:400px){.reader .brand-title{font-size:11px}.utility{padding:9px 6px}.header-actions{gap:0}}\n');
fs.copyFileSync(path.join(root,'src/index.html'),path.join(root,'web/index.html'));
console.log(JSON.stringify({chapters:Object.keys(S.chapters).length,endings:Object.keys(S.endingEntries).length,nodes:Object.keys(S.nodes).length,plannedArt:Object.keys(S.art).length,storyBytes:fs.statSync(path.join(root,'web/story.js')).size,releaseReady:false},null,2));
