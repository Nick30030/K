import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generate,validateInput,generateImageFromReference} from './generation.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
// Load only the explicit local configuration file. It is ignored by Git.
try { process.loadEnvFile(path.join(root,'.env')); } catch(e) { if(e.code!=='ENOENT')throw e; }
const port=Number(process.env.PORT||3000),host=process.env.HOST||'0.0.0.0';
const production=process.env.NODE_ENV==='production';
const vite=production?null:await (await import('vite')).createServer({root,server:{middlewareMode:true,allowedHosts:true},appType:'spa'});
function json(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));}
async function bodyJSON(req){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>10000000)throw Object.assign(Error('Requête trop volumineuse.'),{status:413});}try{return JSON.parse(raw);}catch{throw Object.assign(Error('JSON invalide.'),{status:400});}}

let inFlight=0;let requests=[];
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')){const origin=req.headers.origin;const allowed=process.env.APP_ORIGIN;const hostHeader=req.headers.host;
 if(origin){const originHost=origin.replace(/^https?:\/\//,'').replace(/\/$/,'');const isSameHost=originHost===hostHeader||origin===`http://${hostHeader}`||origin===`https://${hostHeader}`;if(allowed&&origin!==allowed&&!isSameHost){json(res,403,{error:'Origine non autorisée.'});return;}}
 if(url.pathname==='/api/status'&&req.method==='GET'){json(res,200,{textAI:Boolean(process.env.GEMINI_API_KEY),imageAI:Boolean(process.env.GEMINI_API_KEY),storage:'local',auth:false});return;}
 if(url.pathname==='/api/generate-image'&&req.method==='POST'){
  if(!(req.headers['content-type']||'').includes('application/json')){json(res,415,{error:'Le contenu doit être JSON.'});return;}
  try{const input=await bodyJSON(req);json(res,200,await generateImageFromReference(input));}catch(e){json(res,e.status||502,{error:e.message||'La génération d’image a échoué.'});}
  return;
 }
 if(url.pathname!=='/api/generate'||req.method!=='POST'){json(res,404,{error:'Route introuvable.'});return;}
 if(!(req.headers['content-type']||'').includes('application/json')){json(res,415,{error:'Le contenu doit être JSON.'});return;}
 requests=requests.filter(t=>t>Date.now()-60000);if(requests.length>=20||inFlight>=3){json(res,429,{error:'Trop de générations. Attendez un instant.'});return;}requests.push(Date.now());inFlight++;
 try{const input=validateInput(await bodyJSON(req));json(res,200,await generate(input));}catch(e){json(res,e.status||502,{error:e.name==='TimeoutError'?'La génération a pris trop de temps. Réessayez.':e.status?e.message:'La génération a échoué. Vérifiez le service et réessayez.'});}finally{inFlight--;}return;}
 if(vite){vite.middlewares(req,res);return;}
 try{const decoded=decodeURIComponent(url.pathname);let target=path.resolve(root,'dist','.'+decoded);const base=path.join(root,'dist')+path.sep;if(target!==path.join(root,'dist')&&!target.startsWith(base)){res.writeHead(403);res.end();return;}try{if(!(await stat(target)).isFile())throw Error();}catch{if(path.extname(decoded)){res.writeHead(404);res.end('Not found');return;}target=path.join(root,'dist/index.html');}const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'}[path.extname(target)]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':target.includes('/assets/')?'public,max-age=31536000,immutable':'no-cache'});res.end(await readFile(target));}catch{res.writeHead(500);res.end('Application non construite. Exécutez npm run build.');}
});
server.listen(port,host,()=>console.log(`NickShop Content Studio démarré sur ${host}:${port} · ${production?'production':'développement'} · IA ${process.env.GEMINI_API_KEY?'configurée':'non connectée'}`));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await vite?.close();server.close(()=>process.exit(0));});
