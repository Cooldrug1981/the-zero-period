import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const plan=JSON.parse(await fs.readFile(path.join(root,'production.json'),'utf8'));
async function files(dir){try{return (await fs.readdir(path.join(root,dir))).filter(f=>f.endsWith('.json')).sort();}catch{return [];}}
const han=t=>(String(t).match(/\p{Script=Han}/gu)||[]).length;
const seen=new Set();let uniqueHan=0,duplicates=[];
function countText(t,where){if(typeof t!=='string')return 0;const normalized=t.replace(/\s+/g,'');const n=han(t);if(n>=40&&seen.has(normalized)){duplicates.push(where);return 0;}if(n>=40)seen.add(normalized);uniqueHan+=n;return n;}
const categories={},problems=[],warnings=[];
for(const [kind,dir] of [['chapters','content/chapters'],['sideStories','content/side-stories'],['endings','content/endings'],['research','content/research']]){
 const entries=[];
 for(const file of await files(dir)){
  try{
   const doc=JSON.parse(await fs.readFile(path.join(root,dir,file),'utf8'));let mainHan=0,branchHan=0;const art=[];
   for(const p of doc.paragraphs||[])mainHan+=countText(typeof p==='string'?p:p.text,file);
   for(const o of doc.epilogueChoice?.options||[])for(const p of o.reply||[])branchHan+=countText(p.text,file+'/epilogue/'+o.id);
   art.push(...(doc.art||[]));
   for(const s of doc.scenes||[]){
    for(const p of s.paragraphs||[])mainHan+=countText(p.text,file+'/'+s.id);
    for(const o of s.choice?.options||[])for(const p of o.reply||[])branchHan+=countText(p.text,file+'/'+s.id+'/'+o.id);
    for(const e of s.evidence||[]){countText(e.text,file+'/evidence');countText(e.uncertain,file+'/uncertain');}
    art.push(...(s.art||[]));
   }
   entries.push({file,id:doc.id,status:doc.status||'draft',mainHan,branchHan,plannedArt:art.length});
   if(kind==='chapters'&&mainHan<6100)problems.push(file+': main text below 6100 Han ('+mainHan+')');
   if(kind==='sideStories'&&mainHan<3000)problems.push(file+': side story below 3000 Han');
   if(kind==='endings'&&mainHan+branchHan<4500)problems.push(file+': ending below 4500 Han');
  }catch(e){problems.push(file+': '+e.message);}
 }
 categories[kind]=entries;
}
let catalog={entries:{},masters:[]};try{catalog=JSON.parse(await fs.readFile(path.join(root,'art/catalog.json'),'utf8'));}catch{}
const approvedPanels=Object.values(catalog.entries||{}).filter(a=>a.status==='approved');
const approvedMasters=(catalog.masters||[]).filter(a=>a.status==='approved');
for(const a of approvedPanels){try{await fs.access(path.join(root,a.path));}catch{problems.push('Approved image absent: '+a.path);}}
for(const [kind,expected] of Object.entries({chapters:36,sideStories:12,endings:6}))if(categories[kind].length!==expected)problems.push(`${kind}: ${categories[kind].length}/${expected}`);
if(uniqueHan<plan.target.uniqueNarrativeHan)problems.push(`Narrative Han: ${uniqueHan}/${plan.target.uniqueNarrativeHan}`);
if(approvedPanels.length<plan.target.uniquePanels)problems.push(`Approved panels: ${approvedPanels.length}/${plan.target.uniquePanels}`);
if(approvedMasters.length<plan.target.approvedMasters)problems.push(`Approved masters: ${approvedMasters.length}/${plan.target.approvedMasters}`);
const unreviewed=Object.values(categories).flat().filter(e=>e.status!=='reviewed');
if(unreviewed.length){
 if(plan.releaseScope?.editorialReviewRequired===false){
  if(!plan.releaseScope.acceptedByUser)problems.push('Editorial waiver has no recorded user authorization');
  warnings.push(unreviewed.length+' unreviewed content files included under the accepted release scope');
 }else problems.push(unreviewed.length+' content files await editorial review');
}
if(plan.originalTarget){
 warnings.push(`Former illustration target waived: ${approvedPanels.length}/${plan.originalTarget.uniquePanels} panels and ${approvedMasters.length}/${plan.originalTarget.approvedMasters} masters`);
}
if(duplicates.length)problems.push(duplicates.length+' repeated long paragraphs excluded from count');
const report={at:new Date().toISOString(),releaseReady:problems.length===0,target:plan.target,originalTarget:plan.originalTarget||null,releaseScope:plan.releaseScope||null,uniqueNarrativeHan:uniqueHan,approvedPanels:approvedPanels.length,approvedMasters:approvedMasters.length,unreviewedContentFiles:unreviewed.length,categories,duplicates,warnings,problems};
await fs.mkdir(path.join(root,'qa'),{recursive:true});await fs.writeFile(path.join(root,'qa/production-audit.json'),JSON.stringify(report,null,2));
export {report};
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 console.log(JSON.stringify(report,null,2));
 if(process.argv.includes('--release')&&!report.releaseReady)process.exitCode=1;
}
