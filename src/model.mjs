export function matches(when,flags){return !when||Object.entries(when).every(([k,v])=>flags[k]===v);}
export function resolveEnding(f){
 if(f.departure==='leave')return'E';
 const people=f.roster_workers===true&&f.roster_families===true;
 const help=['both','radio','teacher'].includes(f.external_contact);
 if(!people&&f.ground_response!==true&&!help)return'F';
 if(f.device_policy==='obey')return'B';
 if(f.device_policy==='watch')return'D';
 return people&&help&&f.work_delegated===true&&f.ground_response===true&&f.evidence_outside===true&&f.obligations_sent===true?'A':'C';
}
export function makeModel(story){
 const S=story, app='the-zero-period',version=2,maxSteps=16000;
 function blank(){return{app,version,trail:[],decisions:{},flags:{luo_leg_injury:false},evidence:[],updated:Date.now()};}
 function apply(state,n){for(const [k,v] of Object.entries(n.set||{})){if(['__proto__','constructor','prototype'].includes(k)||!['string','number','boolean'].includes(typeof v))throw Error('Invalid flag');state.flags[k]=v;}for(const e of n.grant||[])if(!state.evidence.includes(e))state.evidence.push(e);}
 function nextOf(n,v,selected){
  if(n.kind==='choice'){const o=n.options.find(o=>o.id===selected&&matches(o.when,v.flags));if(!o)throw Error('请先选一项。');return o.next;}
  if(n.kind==='gate')return matches(n.when,v.flags)?n.yes:n.no;
  if(n.kind==='departure-router')return v.flags.departure==='leave'?n.yes:n.no;
  if(n.kind==='ending-router')return n.endings[v.flags.endingId||resolveEnding(v.flags)];
  return n.next;
 }
 const automatic=n=>['apply','gate','resolve','departure-router','ending-router'].includes(n.kind);
 function enter(v,id){
  let steps=0;
  while(id){
   if(++steps>500||v.trail.length>=maxSteps)throw Error('剧情连接异常。');
   const n=S.nodes[id];if(!n)throw Error('后续内容尚未完成。');
   v.trail.push(id);v.node=id;apply(v,n);if(n.kind==='resolve')v.flags.endingId=resolveEnding(v.flags);
   if(!automatic(n)&&matches(n.when,v.flags))return v;
   id=nextOf(n,v);
  }throw Error('剧情没有后续节点。');
 }
 function fresh(){return enter(blank(),S.entry);}
 function advance(state,selected){
  const v=structuredClone(state),n=S.nodes[v.node];
  if(['complete','pending'].includes(n.kind))return v;
  const next=nextOf(n,v,selected);if(n.kind==='choice')v.decisions[n.id]=selected;
  v.updated=Date.now();return enter(v,next);
 }
 function validate(input){
  if(!input||input.app!==app||input.version!==version||!Array.isArray(input.trail)||!input.trail.length||input.trail.length>maxSteps||!input.decisions||typeof input.decisions!=='object'||Array.isArray(input.decisions))throw Error('这不是当前预览版的有效存档。');
  const v=blank(),seen=new Set();
  if(input.trail[0]!==S.entry)throw Error('存档起点不正确。');
  for(let i=0;i<input.trail.length;i++){
   const id=input.trail[i],n=S.nodes[id];if(!n)throw Error('此版本缺少存档中的章节。');
   if(seen.has(id))throw Error('存档存在重复行程。');seen.add(id);v.node=id;v.trail.push(id);apply(v,n);
   if(n.kind==='resolve')v.flags.endingId=resolveEnding(v.flags);
   if(i<input.trail.length-1){
    const selected=input.decisions[id],next=nextOf(n,v,selected);
    if(next!==input.trail[i+1])throw Error('存档中的选择与后续剧情不符。');
    if(n.kind==='choice')v.decisions[id]=selected;
   }else if(automatic(n)||!matches(n.when,v.flags))throw Error('存档停在无效位置。');
  }
  if(input.node!==v.node||Object.keys(input.decisions).some(k=>v.decisions[k]!==input.decisions[k]))throw Error('存档有尚未发生的选择。');
  v.updated=Number.isFinite(input.updated)?input.updated:Date.now();return v;
 }
 return{fresh,advance,validate,matches,resolveEnding,key:'the-zero-period-autosave-v2'};
}
