const {app,BrowserWindow,protocol,session,shell,dialog,ipcMain,safeStorage,Menu}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
app.setName('NickShop Content Studio');
if(!app.isPackaged&&process.env.NICKSHOP_TEST_USER_DATA)app.setPath('userData',process.env.NICKSHOP_TEST_USER_DATA);
let mainWindow;
const origin='app://nickshop';
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-src 'none'; form-action 'none'";
const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml'};
const reply=(body,status=200,type='application/json; charset=utf-8')=>new Response(type.startsWith('application/json')?JSON.stringify(body):body,{status,headers:{'Content-Type':type,'Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});
const canEncrypt=()=>safeStorage.isEncryptionAvailable()&&(process.platform!=='linux'||safeStorage.getSelectedStorageBackend()!=='basic_text');
const keyPath=()=>path.join(app.getPath('userData'),'gemini-key.encrypted');
function trustedFrame(event){return mainWindow&&!mainWindow.isDestroyed()&&event.sender===mainWindow.webContents&&event.senderFrame===mainWindow.webContents.mainFrame&&event.senderFrame.url.startsWith(origin+'/');}
async function openExternal(url){try{const parsed=new URL(url);if(parsed.protocol==='https:'&&parsed.hostname==='wa.me')await shell.openExternal(parsed.href);}catch{}}
function createWindow(){mainWindow=new BrowserWindow({width:1440,height:960,minWidth:900,minHeight:640,title:'NickShop Content Studio',backgroundColor:'#f8f9f6',icon:path.join(__dirname,'../build/icon.png'),show:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
 mainWindow.once('ready-to-show',()=>mainWindow.show());
 mainWindow.webContents.setWindowOpenHandler(({url})=>{void openExternal(url);return {action:'deny'};});
 mainWindow.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(origin+'/')){event.preventDefault();void openExternal(url);}});
 mainWindow.webContents.on('will-attach-webview',event=>event.preventDefault());
 mainWindow.webContents.on('render-process-gone',()=>{dialog.showErrorBox('NickShop Content Studio','La fenêtre a été interrompue. Fermez puis relancez l’application. Vos données sauvegardées sont conservées.');});
 mainWindow.loadURL(origin+'/index.html');
}
const single=app.requestSingleInstanceLock();if(!single){app.quit();}else{
 app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}});
 app.whenReady().then(async()=>{
  try{if(canEncrypt()){const key=await fs.readFile(keyPath());process.env.GEMINI_API_KEY=safeStorage.decryptString(key);}}catch(e){if(e.code!=='ENOENT')console.warn('La clé Gemini enregistrée doit être reconfigurée.');}
  const {generate,validateInput}=await import(pathToFileURL(path.join(__dirname,'../generation.mjs')).href);
  let pending=0;let times=[];
  protocol.handle('app',async request=>{
   const url=new URL(request.url);if(url.hostname!=='nickshop')return reply({error:'Origine non autorisée.'},403);
   if(url.pathname==='/api/status'&&request.method==='GET')return reply({textAI:Boolean(process.env.GEMINI_API_KEY),imageAI:false,storage:'local',auth:false,desktop:true});
   if(url.pathname.startsWith('/api/')){
    if(url.pathname!=='/api/generate'||request.method!=='POST')return reply({error:'Route introuvable.'},404);
    if(!(request.headers.get('content-type')||'').includes('application/json'))return reply({error:'JSON requis.'},415);
    times=times.filter(t=>t>Date.now()-60000);if(times.length>=20||pending>=3)return reply({error:'Trop de générations. Patientez un instant.'},429);
    times.push(Date.now());pending++;
    try{const raw=await request.text();if(Buffer.byteLength(raw)>100000)return reply({error:'Requête trop volumineuse.'},413);let parsed;try{parsed=JSON.parse(raw);}catch{return reply({error:'JSON invalide.'},400);}return reply(await generate(validateInput(parsed)));}
    catch(e){return reply({error:e.status?e.message:'La génération a échoué. Vérifiez votre connexion et réessayez.'},e.status||502);}finally{pending--;}
   }
   if(request.method!=='GET')return reply({error:'Méthode non autorisée.'},405);
   try{const base=path.resolve(__dirname,'../dist');const name=decodeURIComponent(url.pathname);const target=path.resolve(base,'.'+(name==='/'?'/index.html':name));if(!target.startsWith(base+path.sep))return reply({error:'Accès refusé.'},403);const data=await fs.readFile(target);return new Response(data,{headers:{'Content-Type':contentTypes[path.extname(target)]||'application/octet-stream','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});}catch{return reply({error:'Fichier introuvable.'},404);}
  });
  session.defaultSession.setPermissionRequestHandler((contents,permission,callback)=>callback(contents===mainWindow?.webContents&&permission==='clipboard-sanitized-write'));
  session.defaultSession.setPermissionCheckHandler((contents,permission)=>contents===mainWindow?.webContents&&permission==='clipboard-sanitized-write');
  session.defaultSession.on('will-download',(_event,item)=>{item.setSaveDialogOptions({title:'Enregistrer votre export NickShop',defaultPath:path.join(app.getPath('downloads'),path.basename(item.getFilename()))});});
  ipcMain.handle('nickshop:desktop-info',event=>{if(!trustedFrame(event))throw Error('Accès refusé.');return {version:app.getVersion(),platform:process.platform,keyConfigured:Boolean(process.env.GEMINI_API_KEY),encryptedStorage:canEncrypt()};});
  ipcMain.handle('nickshop:set-key',async(event,key)=>{if(!trustedFrame(event))throw Error('Accès refusé.');if(typeof key!=='string'||key.length>512)throw Error('Clé invalide.');const value=key.trim();if(value){if(!canEncrypt())throw Error('Le chiffrement système est indisponible. La clé ne peut pas être enregistrée.');await fs.mkdir(app.getPath('userData'),{recursive:true});await fs.writeFile(keyPath(),safeStorage.encryptString(value),{mode:0o600});process.env.GEMINI_API_KEY=value;}else{await fs.rm(keyPath(),{force:true});delete process.env.GEMINI_API_KEY;}return {configured:Boolean(value)};});
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Fichier',submenu:[{label:'Exporter / imprimer la page',accelerator:'CmdOrCtrl+P',click:()=>mainWindow?.webContents.print({printBackground:true})},{type:'separator'},{role:'quit',label:'Quitter'}]},{label:'Édition',submenu:[{role:'undo',label:'Annuler'},{role:'redo',label:'Rétablir'},{type:'separator'},{role:'cut',label:'Couper'},{role:'copy',label:'Copier'},{role:'paste',label:'Coller'},{role:'selectAll',label:'Tout sélectionner'}]},{label:'Affichage',submenu:[{role:'reload',label:'Actualiser'},{role:'resetZoom',label:'Taille réelle'},{role:'zoomIn',label:'Agrandir'},{role:'zoomOut',label:'Réduire'},{role:'togglefullscreen',label:'Plein écran'}]},{label:'Aide',submenu:[{label:'À propos de NickShop',click:()=>dialog.showMessageBox(mainWindow,{type:'info',title:'NickShop Content Studio',message:`NickShop Content Studio ${app.getVersion()}`,detail:'Votre atelier marketing pour Windows.\nLes données sont conservées sur cet ordinateur. Exportez régulièrement une sauvegarde depuis Paramètres.\nLa rédaction IA nécessite une clé Gemini et une connexion Internet.'})}]}]));
  createWindow();app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();});
 }).catch(()=>{dialog.showErrorBox('NickShop Content Studio','Impossible de démarrer l’application. Réinstallez-la ou consultez le guide de dépannage.');app.quit();});
 app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
