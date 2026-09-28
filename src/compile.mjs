export function compileStory({chapters=[],sideStories=[],endings=[],research=[],catalog={entries:{}},plan}){
 const nodes={},evidence={},art={...catalog.entries},chaptersById={},decisions=new Set();
 const add=n=>{if(nodes[n.id])throw Error('Duplicate node '+n.id);nodes[n.id]=n;return n.id;};
 const stamp=(id,doc,scene)=>({chapter:Number(doc.id)||doc.afterChapter||0,title:doc.title,part:doc.part||Math.ceil((Number(doc.id)||doc.afterChapter||1)/4),date:doc.date||'',pov:scene.pov||doc.pov||'沈岑',location:scene.location||'',time:scene.time||'',scene:scene.title||doc.title,...id});
 function paras(items,next,prefix,doc,scene,shots){
  let first=next;for(let i=items.length-1;i>=0;i--){const p=items[i],id=prefix+'.p'+i;
   const reply=prefix.includes('.option');
   const index=reply?shots.length-1:scene.artMap?.[i]??Math.min(shots.length-1,Math.floor(i*Math.max(1,shots.length)/items.length));
   if(shots.length&&(!Number.isInteger(index)||index<0||index>=shots.length))throw Error('Invalid art map '+id);
   if(!shots.length&&scene.artMap?.[i]!==undefined)throw Error('Art map without shots '+id);
   const picture=p.art||shots[index]?.id||null;
   if(picture&&!art[picture])throw Error('Missing paragraph art '+picture+' from '+id);
   add(stamp({id,kind:'text',speaker:p.speaker||'旁白',text:p.text,art:picture,next:first,when:p.when||null},doc,scene));first=id;
  }return first;
 }
 function scenes(doc,next,prefix){
  let first=next;
  for(let i=doc.scenes.length-1;i>=0;i--){const scene=doc.scenes[i],base=prefix+'.'+scene.id,shots=scene.art||[],join=first;
   for(const shot of shots)if(!art[shot.id])art[shot.id]={id:shot.id,status:'planned',shot:shot.shot};
   let after=join;
   if(scene.choice){
    const choice=scene.choice;
    if(decisions.has(choice.key))throw Error('Duplicate decision key '+choice.key);decisions.add(choice.key);
    const options=choice.options.map((o,j)=>{
     const effect=base+'.option'+j;
     const body=paras(o.reply||[],join,effect,doc,scene,shots);
     add({id:effect,kind:'apply',set:o.set||{},next:body});
     return{id:o.id,label:o.label,detail:o.detail||'',next:effect,when:o.when||null};
    });
    after=add(stamp({id:base+'.choice',kind:'choice',speaker:doc.pov||'沈岑',text:choice.prompt||'你准备怎么做？',key:choice.key,options,art:shots.at(-1)?.id||null},doc,scene));
   }
   const grants=[];
   for(const e of scene.evidence||[]){if(evidence[e.id]&&JSON.stringify(evidence[e.id])!==JSON.stringify(e))throw Error('Conflicting evidence '+e.id);evidence[e.id]=e;grants.push(e.id);}
   after=add({id:base+'.record',kind:'apply',set:scene.set||{},effects:scene.effects||[],grant:grants,next:after});
   const body=paras(scene.paragraphs||[],after,base,doc,scene,shots);
   first=scene.when?add({id:base+'.gate',kind:'gate',when:scene.when,yes:body,no:join}):body;
  }return first;
 }
 const endingEntries={};
 for(const e of endings){
  const end=add({id:'end-'+e.id+'.complete',kind:'complete',ending:e.id,title:e.title,text:'本路线完'});
  for(const shot of e.art||[])if(!art[shot.id])art[shot.id]={id:shot.id,status:'planned',shot:shot.shot};
  const doc={id:e.id==='E'?28:36,title:e.title,pov:'沈岑'},scene={title:e.title,time:'后日谈',location:'鹭原及以后'};
  let after=end;
  if(e.epilogueChoice){
   const c=e.epilogueChoice;if(decisions.has(c.key))throw Error('Duplicate decision key '+c.key);decisions.add(c.key);
   const options=c.options.map((o,j)=>{const id='end-'+e.id+'.option'+j;const body=paras(o.reply||[],end,id,doc,scene,e.art||[]);add({id,kind:'apply',set:o.set||{},next:body});return{id:o.id,label:o.label,detail:o.detail||'',when:o.when||null,next:id};});
   after=add(stamp({id:'end-'+e.id+'.choice',kind:'choice',key:c.key,speaker:'沈岑',text:c.prompt,options},doc,scene));
  }
  endingEntries[e.id]=paras(e.paragraphs||[],after,'end-'+e.id,doc,scene,e.art||[]);
 }
 add({id:'resolve-ending',kind:'ending-router',endings:endingEntries});
 add({id:'finalize-route',kind:'resolve',next:'resolve-ending'});
 for(let num=36;num>=1;num--){
  const doc=chapters.find(c=>Number(c.id)===num);
  if(!doc){add({id:'ch'+num+'.start',kind:'pending',chapter:num,title:plan.chapters[num-1],text:'本章仍在制作，开发版本在此暂停。'});continue;}
  const target=num===36?'finalize-route':'ch'+(num+1)+'.start';
  let after=target;
  for(const side of sideStories.filter(s=>s.afterChapter===num).reverse()){
   const body=scenes(side,after,'side-'+side.id),offer='offer-'+side.id;
   add(stamp({id:offer,kind:'choice',speaker:'旁白',text:side.offer||side.title,key:offer,options:[{id:'read',label:side.title,detail:'进入这段调查',next:body},{id:'skip',label:'先继续眼前的事',detail:'不进入这段支线',next:after}]},doc,{}));after=offer;
  }
  if(num===28)after=add({id:'ch28.departure',kind:'departure-router',yes:endingEntries.E||'resolve-ending',no:after});
  const exit=add(stamp({id:'ch'+num+'.end',kind:'chapter-end',text:'第'+num+'章完',next:after},doc,{}));
  let first=scenes(doc,exit,'ch'+num);
  add({id:'ch'+num+'.start',kind:'apply',next:first});chaptersById[num]={id:num,title:doc.title,part:doc.part,date:doc.date,status:doc.status,entry:'ch'+num+'.start'};
 }
 for(const n of Object.values(nodes)){
  const links=[n.next,n.yes,n.no,...(n.options||[]).map(o=>o.next),...Object.values(n.endings||{})].filter(Boolean);
  for(const link of links)if(!nodes[link])throw Error('Missing target '+link+' from '+n.id);
 }
 return {title:plan.title,author:plan.author,version:2,entry:'ch1.start',nodes,evidence,art,chapters:chaptersById,chapterTitles:plan.chapters,research,endingEntries};
}
