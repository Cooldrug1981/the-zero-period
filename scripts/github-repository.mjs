import {spawnSync} from 'node:child_process';
const owner='Cooldrug1981',repo='the-zero-period';
const mode=process.argv[2]||'check';
if(!['check','create'].includes(mode))throw Error('Supported: check or create');
const credential=spawnSync('git',['credential','fill'],{input:`protocol=https\nhost=github.com\nusername=${owner}\n\n`,encoding:'utf8',windowsHide:true,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
if(credential.status!==0)throw Error('GitHub credential helper has no noninteractive credential for this account');
const fields=Object.fromEntries(credential.stdout.trim().split(/\r?\n/).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)];}));
if(!fields.password)throw Error('GitHub credential is unavailable');
const headers={Authorization:`Bearer ${fields.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','User-Agent':'The-Zero-Period-Delivery','Content-Type':'application/json'};
async function request(endpoint,method='GET',body){const r=await fetch('https://api.github.com'+endpoint,{method,headers,body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});const data=await r.json();return{status:r.status,data};}
const profile=await request('/user');if(profile.status!==200||profile.data.login.toLowerCase()!==owner.toLowerCase())throw Error('Authenticated GitHub account does not match the authorized repository owner');
let result=await request(`/repos/${owner}/${repo}`),created=false;
if(result.status===404&&mode==='create'){result=await request('/user/repos','POST',{name:repo,description:'第零节晚自习 / The Zero Period — original illustrated science-fiction mystery (in production)',private:false,auto_init:false,has_wiki:false,has_projects:false});created=result.status===201;}
if(![200,201,404].includes(result.status))throw Error('GitHub repository request failed with HTTP '+result.status);
console.log(JSON.stringify({owner,repository:repo,status:result.status,created,url:result.data.html_url||null,empty:result.data.size===0,pagesPublished:!!result.data.has_pages},null,2));
