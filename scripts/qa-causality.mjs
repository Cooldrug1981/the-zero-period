import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {validateLedger,makeRelay,payloadBytes} from '../src/causality.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const packets=[],attempts=[],citations=[],problems=[];
const zoned=s=>!s?null:/[+-]\d\d:\d\d$|Z$/.test(s)?s:s+'+08:00';
for(const name of ['early','middle','late']){
 const f=path.join(root,'docs',`${name}-causality-ledger.json`);if(!fs.existsSync(f))continue;
 const doc=JSON.parse(fs.readFileSync(f,'utf8'));
 for(const p of doc.packets||[]){const receivedAt=p.receivedAt||p.receiveAt;const q={...p,channel:p.channel==='A'?0:p.channel==='B'?1:p.channel,receivedAt:zoned(receivedAt||p.expectedReceiveAt),sentAt:zoned(p.sentAt||p.sendAt),sender:p.sender||p.source,meaning:p.meaning||p.source,observedValid:!!receivedAt};
  if(p.netBytes!==undefined&&payloadBytes(q).length!==p.netBytes)problems.push(`${p.id}: declared ${p.netBytes}, actual ${payloadBytes(q).length} bytes`);
  packets.push(q);
 }
 attempts.push(...(doc.attempts||[]));citations.push(...(doc.resolvedEarlierPackets||[]));
}
packets.push(...makeRelay().map(p=>({...p,observedValid:true})));
try{validateLedger(packets);}catch(e){problems.push(e.message);}
for(const c of citations){const p=packets.find(p=>p.id===c.id);if(!p||p.payload!==c.payload||p.sentAt!==c.sentAt||p.receivedAt!==c.receivedAt)problems.push('Recollection does not match original '+c.id);}
for(const a of attempts){if(a.receivedValidPayload!==false||a.sentValidPayload!==false)problems.push('Contradiction experiment needs explicit valid/invalid distinction '+a.id);}
const report={at:new Date().toISOString(),valid:!problems.length,packets:packets.length,validReceipts:packets.filter(p=>p.observedValid).length,unsuccessfulAttempts:attempts.length,problems,ledger:packets,attempts};
fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa/causality-audit.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,ledger:undefined,attempts:undefined},null,2));if(problems.length)process.exitCode=1;
