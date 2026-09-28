import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const opens=new Map([['“','”'],['‘','’'],['「','」'],['『','』'],['《','》']]);
function pronouns(text){
 const stack=[];let narration=0,dialogue=0;
 for(const ch of text){
  if(opens.has(ch)){stack.push(opens.get(ch));continue;}
  if(stack.at(-1)===ch){stack.pop();continue;}
  if(ch==='你'){if(stack.length)dialogue++;else narration++;}
 }
 return {narration,dialogue};
}
function collect(value,key='',out=[]){
 if(typeof value==='string'&&['text','prompt','detail','offer'].includes(key))out.push(value);
 else if(Array.isArray(value))value.forEach(v=>collect(v,key,out));
 else if(value&&typeof value==='object')Object.entries(value).forEach(([k,v])=>collect(v,k,out));
 return out;
}
test('all authored narration uses first person while direct address remains in dialogue',()=>{
 let files=0,narration=0,dialogue=0;
 for(const dir of ['chapters','side-stories','endings']){
  for(const file of fs.readdirSync(path.join(root,'content',dir)).filter(f=>f.endsWith('.json'))){
   const doc=JSON.parse(fs.readFileSync(path.join(root,'content',dir,file)));
   files++;
   for(const text of collect(doc)){
    const count=pronouns(text);narration+=count.narration;dialogue+=count.dialogue;
   }
  }
 }
 assert.equal(files,54);
 assert.equal(narration,0);
 assert.ok(dialogue>0);
});
