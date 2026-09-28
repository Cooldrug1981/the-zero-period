export const OFFSET_SECONDS=704;
export const MAX_PAYLOAD_BYTES=128;
export const RUN_START='1997-10-20T08:00:00+08:00';
const at=s=>Date.parse(s);
// A deliberately low-information, one-bit diagnostic reconstruction. It is not
// an illustration count or a photographic identification of the repair worker.
export const MAINTENANCE_BITMAP_HEX=[
 'ffffffff','80000001','80000001','87ffffe1','84000021','84000021','84000021','84000021',
 '8403c021','8407e021','8407e021','8403c021','84018021','8407e021','840ff021','841ff821',
 '8437ec21','8467e621','8447e221','8407e021','8407e021','84066021','84066021','84066021',
 '840c3021','840c3021','84181821','84381c21','84000021','87ffffe1','80000001','ffffffff'
].join('');
export function payloadBytes(packet){
 if(String(packet.encoding).toLowerCase()==='ascii'){
  if(typeof packet.payload!=='string'||/[^\x00-\x7f]/.test(packet.payload))throw Error('Non-ASCII payload '+packet.id);
  return Buffer.from(packet.payload,'ascii');
 }
 if(packet.encoding==='hex'){
  if(!/^(?:[0-9a-f]{2})*$/i.test(packet.payload))throw Error('Invalid hexadecimal payload '+packet.id);
  return Buffer.from(packet.payload,'hex');
 }
 if(typeof packet.payload!=='string')throw Error('Payload must contain exact encoded bytes '+packet.id);
 if(packet.encoding&&packet.encoding!=='utf8')throw Error('Unsupported payload encoding '+packet.id);
 return Buffer.from(packet.payload,'utf8');
}
export function validateLedger(packets){
 const ids=new Set(),channels=new Map();
 for(const p of packets){
  if(ids.has(p.id))throw Error('Duplicate packet '+p.id);ids.add(p.id);
  if(![0,1].includes(p.channel))throw Error('Unknown channel '+p.id);
  if(!Number.isFinite(at(p.receivedAt))||!Number.isFinite(at(p.sentAt)))throw Error('Invalid packet time '+p.id);
  if(at(p.sentAt)-at(p.receivedAt)!==OFFSET_SECONDS*1000)throw Error('Offset mismatch '+p.id);
  if(at(p.receivedAt)<at(RUN_START))throw Error('Crossed continuous run boundary '+p.id);
  if(payloadBytes(p).length>MAX_PAYLOAD_BYTES)throw Error('Payload too large '+p.id);
  if(!p.sender||!p.meaning)throw Error('Unattributed packet '+p.id);
  if(!channels.has(p.channel))channels.set(p.channel,[]);channels.get(p.channel).push(p);
 }
 for(const values of channels.values()){
  values.sort((a,b)=>at(a.sentAt)-at(b.sentAt));
  for(let i=1;i<values.length;i++)if(at(values[i].sentAt)-at(values[i-1].sentAt)<OFFSET_SECONDS*1000)throw Error('Overbooked channel '+values[i].id);
 }
 return true;
}
export function makeRelay(){
 const start=at('1997-10-31T20:00:00+08:00');
 return Array.from({length:256},(_,i)=>({id:'safe-relay-'+String(i+1).padStart(3,'0'),channel:0,receivedAt:new Date(start+i*OFFSET_SECONDS*1000).toISOString(),sentAt:new Date(start+(i+1)*OFFSET_SECONDS*1000).toISOString(),payload:'DEMO|REGISTERED=117|REMAINING=0|ALL_SAFE',sender:i===255?'演示登记汇总程序':'连续运行转发器',meaning:'仅针对117名已登记人员的软件输出，未知可被错误当作无人；不证明137人现场全部安全。',nextSource:i===255?'demo-program':'safe-relay-'+String(i+2).padStart(3,'0')}));
}
export function initialPackets(){return [
 {id:'rollcall-1020',channel:0,receivedAt:'1997-10-20T20:28:16+08:00',sentAt:'1997-10-20T20:40:00+08:00',payload:'CLASS=31|EXPECTED=43|PRESENT=43',sender:'20:40班级签到汇总程序',meaning:'20:39:40现场点名已完成，本地声音索引播放答到。'},
 {id:'shencen-1020',channel:0,receivedAt:'1997-10-20T20:40:16+08:00',sentAt:'1997-10-20T20:52:00+08:00',payload:'CLASS=31|ID=SC|STATUS=NOT_RETURNED',sender:'20:52位置登记程序',meaning:'沈岑离开指定教室位置，不表示死亡。'},
 {id:'maintenance-1020',channel:1,receivedAt:'1997-10-20T20:47:00+08:00',sentAt:'1997-10-20T20:58:44+08:00',encoding:'hex',payload:MAINTENANCE_BITMAP_HEX,sender:'北楼固定摄像端',meaning:'32×32单色低信息位图的游戏内示意重建，恰好128字节。仅可判断门边有人形，不能由图辨认韩师傅；不含姓名、音频，时间在固定包头中。'},
 {id:'worker-fall-1021',channel:0,receivedAt:'1997-10-21T20:54:16+08:00',sentAt:'1997-10-21T21:06:00+08:00',payload:'LOCATION=NORTH_ENTRY|EVENT=FALL|HELP=NEEDED',sender:'现场值班员',meaning:'跌倒需要扶助，不包含重伤结论。'}
];}
