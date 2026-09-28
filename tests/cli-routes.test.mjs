import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {compileStory} from '../src/compile.mjs';
import {makeModel} from '../src/model.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const docs=dir=>fs.readdirSync(path.join(root,'content',dir))
  .filter(f=>f.endsWith('.json')).sort().map(f=>read(`content/${dir}/${f}`));
const story=compileStory({
  chapters:docs('chapters'), sideStories:docs('side-stories'),
  endings:docs('endings'), plan:read('production.json'), catalog:read('art/catalog.json')
});

// Smoke coverage of actual authored content, NOT exhaustive branch or release certification.
for(let route=0;route<6;route++){
  test(`authored route ${route}: eligible choices and authentic save replay`,()=>{
    const model=makeModel(story);
    let state=model.fresh(),steps=0,choices=0,seed=route+37;
    while(!['pending','complete'].includes(story.nodes[state.node].kind)){
      assert(++steps<15000,'Route exceeded the traversal limit');
      const node=story.nodes[state.node];
      let selected;
      if(node.kind==='choice'){
        const options=node.options.filter(o=>model.matches(o.when,state.flags));
        assert.ok(options.length,`No eligible option at ${node.id}`);
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        selected=options[route===0?0:route===1?options.length-1:seed%options.length].id;
        choices++;
      }
      state=model.advance(state,selected);
      if(node.kind==='choice'||steps%500===0){
        assert.deepEqual(model.validate(JSON.parse(JSON.stringify(state))),state);
      }
    }
    assert.ok(steps>100,'Unexpectedly short route');
    assert.ok(choices>3,'Expected real narrative decisions');
    assert.deepEqual(model.validate(state),state);
    assert.ok(Buffer.byteLength(JSON.stringify(state))<8*1024*1024,'Save exceeds import limit');
    const terminal=story.nodes[state.node];
    if(terminal.kind==='pending'){
      assert.equal(story.chapters[terminal.chapter],undefined,'Existing chapter incorrectly became pending');
    }else{
      assert.ok(story.endingEntries[terminal.ending],'Unknown ending reached');
    }
    console.log(JSON.stringify({route,steps,choices,terminal:state.node,kind:terminal.kind}));
  });
}
