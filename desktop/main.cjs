const {app,BrowserWindow,session}=require('electron');
const path=require('node:path');const {pathToFileURL}=require('node:url');
if(process.env.ZERO_PERIOD_QA_PROFILE)app.setPath('userData',process.env.ZERO_PERIOD_QA_PROFILE);
const entry=path.join(__dirname,'..','web','index.html');
const root=pathToFileURL(path.join(__dirname,'..','web')+path.sep).href;
app.whenReady().then(()=>{
 session.defaultSession.setPermissionRequestHandler((_w,_p,cb)=>cb(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 session.defaultSession.webRequest.onBeforeRequest((d,cb)=>cb({cancel:!(d.url.startsWith(root)||d.url.startsWith('data:')||d.url.startsWith('blob:'))}));
 const w=new BrowserWindow({width:1280,height:900,minWidth:560,minHeight:540,show:false,autoHideMenuBar:true,backgroundColor:'#112321',title:'第零节晚自习',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 w.removeMenu();w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 w.webContents.on('will-navigate',(e,url)=>{if(url!==pathToFileURL(entry).href)e.preventDefault();});
 w.once('ready-to-show',()=>w.show());w.loadFile(entry);
});
app.on('window-all-closed',()=>app.quit());
