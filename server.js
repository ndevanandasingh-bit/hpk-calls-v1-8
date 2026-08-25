'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const PORT=Number(process.env.PORT||8080);
const HOST=process.env.HOST||'0.0.0.0';
const ROOT=path.resolve(__dirname);
const VERSION='1.11.2';
const MAX_BODY=220*1024;
const ROOM_MINUTES_MAX=120;
const rooms=new Map();
const rate=new Map();
const ALLOWED=(process.env.HPK_ALLOWED_ORIGINS||'*').split(',').map(s=>s.trim()).filter(Boolean);
const CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_STUN=(process.env.HPK_STUN_URLS||'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302').split(',').map(s=>s.trim()).filter(Boolean);
const TURN_URLS=(process.env.HPK_TURN_URLS||'').split(',').map(s=>s.trim()).filter(Boolean);
const TURN_USERNAME=process.env.HPK_TURN_USERNAME||'';
const TURN_CREDENTIAL=process.env.HPK_TURN_CREDENTIAL||'';
const TURN_SHARED_SECRET=process.env.HPK_TURN_SHARED_SECRET||'';
function now(){return Date.now()}
function cleanup(){const t=now();for(const[id,room]of rooms)if(room.expiresAt<=t)rooms.delete(id);for(const[key,item]of rate)if(item.resetAt<=t)rate.delete(key)}
setInterval(cleanup,30_000).unref();
function cors(req,res){const origin=req.headers.origin||'';let allow='*';if(!ALLOWED.includes('*'))allow=ALLOWED.includes(origin)?origin:'null';res.setHeader('Access-Control-Allow-Origin',allow);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-HPK-Token');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Permissions-Policy','microphone=(self), camera=(self)')}
function json(req,res,status,data){cors(req,res);res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data))}
function clientKey(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim()}
function allowRate(req,bucket='general',limit=90,windowMs=60_000){const k=`${clientKey(req)}:${bucket}`,t=now();let item=rate.get(k);if(!item||item.resetAt<=t)item={count:0,resetAt:t+windowMs};item.count++;rate.set(k,item);return item.count<=limit}
function readJson(req){return new Promise((resolve,reject)=>{let size=0,chunks=[];req.on('data',c=>{size+=c.length;if(size>MAX_BODY){reject(Object.assign(new Error('Request too large'),{status:413}));req.destroy();return}chunks.push(c)});req.on('end',()=>{try{const raw=Buffer.concat(chunks).toString('utf8');resolve(raw?JSON.parse(raw):{})}catch{reject(Object.assign(new Error('Invalid JSON'),{status:400}))}});req.on('error',reject)})}
function randomRoomId(){for(let attempt=0;attempt<10;attempt++){const bytes=crypto.randomBytes(6);let suffix='';for(let i=0;i<6;i++)suffix+=CHARS[bytes[i]%CHARS.length];const id=`HPK-${suffix}`;if(!rooms.has(id))return id}throw new Error('Could not allocate room')}
function token(){return crypto.randomBytes(24).toString('base64url')}
function roomIdFromPath(p){const m=p.match(/^\/api\/rooms\/(HPK-[A-Z0-9]{4,10})(?:\/.*)?$/i);return m?m[1].toUpperCase():null}
function safeMeta(meta){if(!meta||typeof meta!=='object')return{};const clean=v=>String(v||'').replace(/[<>]/g,'').slice(0,80);return{fromName:clean(meta.fromName),toName:clean(meta.toName),mode:meta.mode==='video'?'video':'audio',route:meta.route&&typeof meta.route==='object'?{from:clean(meta.route.from).slice(0,3),to:clean(meta.route.to).slice(0,3)}:undefined}}
function validateCode(v){return typeof v==='string'&&v.length>=20&&v.length<=190_000&&(v.startsWith('DCP2.')||v.startsWith('DCP1.'))}
function publicRoom(room){return{roomId:room.id,status:room.status,offer:room.offer,meta:room.meta,createdAt:room.createdAt,ringingAt:room.ringingAt||0,endedBy:room.endedBy||'',expiresAt:room.expiresAt}}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&aa.length>0&&crypto.timingSafeEqual(aa,bb)}
function suppliedToken(req,url){return url.searchParams.get('token')||req.headers['x-hpk-token']||''}
function ownerOk(req,url,room){return safeEqual(suppliedToken(req,url),room.ownerToken)}
function participantOk(req,url,room){const s=suppliedToken(req,url);return safeEqual(s,room.ownerToken)||safeEqual(s,room.responderToken)}
function turnConfig(){const iceServers=[];if(DEFAULT_STUN.length)iceServers.push({urls:DEFAULT_STUN});let turnConfigured=false;if(TURN_URLS.length){if(TURN_SHARED_SECRET){const expiry=Math.floor(Date.now()/1000)+3600,username=`${expiry}:hpk`;const credential=crypto.createHmac('sha1',TURN_SHARED_SECRET).update(username).digest('base64');iceServers.push({urls:TURN_URLS,username,credential});turnConfigured=true}else if(TURN_USERNAME&&TURN_CREDENTIAL){iceServers.push({urls:TURN_URLS,username:TURN_USERNAME,credential:TURN_CREDENTIAL});turnConfigured=true}}return{iceServers,turnConfigured}}
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css; charset=utf-8'};
function serveStatic(req,res,url){let rel=decodeURIComponent(url.pathname);if(rel==='/'||rel==='')rel='/index.html';const file=path.resolve(ROOT,'.'+rel);if(!file.startsWith(ROOT+path.sep)&&file!==ROOT)return json(req,res,403,{error:'Forbidden'});fs.stat(file,(err,st)=>{if(err||!st.isFile()){if(!path.extname(rel))return serveFile(path.join(ROOT,'index.html'),req,res);return json(req,res,404,{error:'Not found'})}serveFile(file,req,res)})}
function serveFile(file,req,res){cors(req,res);res.statusCode=200;res.setHeader('Content-Type',MIME[path.extname(file).toLowerCase()]||'application/octet-stream');if(['index.html','sw.js','manifest.webmanifest'].includes(path.basename(file)))res.setHeader('Cache-Control','no-store, max-age=0');else res.setHeader('Cache-Control','public, max-age=300, immutable');if(req.method==='HEAD')return res.end();fs.createReadStream(file).pipe(res)}
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(req.method==='OPTIONS'){cors(req,res);res.statusCode=204;return res.end()}
if(url.pathname==='/api/health'&&req.method==='GET'){const tc=turnConfig();return json(req,res,200,{ok:true,service:'HPK Calls Quick Connect',version:VERSION,rooms:rooms.size,turnConfigured:tc.turnConfigured,time:new Date().toISOString()})}
if(url.pathname==='/api/config'&&req.method==='GET'){if(!allowRate(req,'config',120,60_000))return json(req,res,429,{error:'Too many requests'});const tc=turnConfig();return json(req,res,200,{ok:true,version:VERSION,iceServers:tc.iceServers,turnConfigured:tc.turnConfigured})}
if(url.pathname==='/api/rooms'&&req.method==='POST'){if(!allowRate(req,'create',20,60_000))return json(req,res,429,{error:'Too many room requests. Try again shortly.'});const body=await readJson(req);if(!validateCode(body.offer))return json(req,res,400,{error:'Invalid WebRTC offer'});const mins=Math.min(ROOM_MINUTES_MAX,Math.max(5,Number(body.expiresInMinutes)||30));const id=randomRoomId(),createdAt=now(),ownerToken=token();rooms.set(id,{id,ownerToken,responderToken:'',offer:body.offer,answer:null,meta:safeMeta(body.meta),responderMeta:{},status:'waiting',createdAt,ringingAt:0,expiresAt:createdAt+mins*60_000,endedBy:''});return json(req,res,201,{roomId:id,ownerToken,createdAt,expiresAt:createdAt+mins*60_000,status:'waiting'})}
const id=roomIdFromPath(url.pathname);if(id){const room=rooms.get(id);if(!room||room.expiresAt<=now()){rooms.delete(id);return json(req,res,404,{error:'Room not found or expired'})}
if(url.pathname===`/api/rooms/${id}`&&req.method==='GET'){if(!allowRate(req,'read',120,60_000))return json(req,res,429,{error:'Too many requests'});return json(req,res,200,publicRoom(room))}
if(url.pathname===`/api/rooms/${id}/status`&&req.method==='GET'){if(!ownerOk(req,url,room))return json(req,res,403,{error:'Invalid room owner token'});return json(req,res,200,{roomId:id,status:room.status,answer:room.answer,responderMeta:room.responderMeta,ringingAt:room.ringingAt||0,endedBy:room.endedBy,expiresAt:room.expiresAt})}
if(url.pathname===`/api/rooms/${id}/ringing`&&req.method==='POST'){if(room.status==='waiting'){room.status='ringing';room.ringingAt=now()}return json(req,res,200,{ok:true,status:room.status,ringingAt:room.ringingAt||0})}
if(url.pathname===`/api/rooms/${id}/answer`&&req.method==='POST'){if(!['waiting','ringing'].includes(room.status))return json(req,res,409,{error:`Room is already ${room.status}`});const body=await readJson(req);if(!validateCode(body.answer))return json(req,res,400,{error:'Invalid WebRTC answer'});room.answer=body.answer;room.responderMeta=safeMeta(body.meta);room.responderToken=token();room.status='answered';return json(req,res,200,{ok:true,status:'answered',responderToken:room.responderToken})}
if(url.pathname===`/api/rooms/${id}/decline`&&req.method==='POST'){const body=await readJson(req);if(['waiting','ringing'].includes(room.status)){room.status=body.reason==='missed'?'missed':'declined';room.endedBy='receiver';room.expiresAt=Math.min(room.expiresAt,now()+2*60_000)}return json(req,res,200,{ok:true,status:room.status})}
if(url.pathname===`/api/rooms/${id}/cancel`&&req.method==='POST'){if(!ownerOk(req,url,room))return json(req,res,403,{error:'Invalid room owner token'});if(['waiting','ringing','answered'].includes(room.status)){room.status='cancelled';room.endedBy='caller';room.expiresAt=Math.min(room.expiresAt,now()+2*60_000)}return json(req,res,200,{ok:true,status:room.status})}
if(url.pathname===`/api/rooms/${id}/control`&&req.method==='GET'){if(!participantOk(req,url,room))return json(req,res,403,{error:'Invalid call token'});return json(req,res,200,{roomId:id,status:room.status,endedBy:room.endedBy,expiresAt:room.expiresAt})}
if(url.pathname===`/api/rooms/${id}/connected`&&req.method==='POST'){if(!participantOk(req,url,room))return json(req,res,403,{error:'Invalid call token'});if(['answered','connected'].includes(room.status))room.status='connected';return json(req,res,200,{ok:true,status:room.status})}
if(url.pathname===`/api/rooms/${id}/hangup`&&req.method==='POST'){if(!participantOk(req,url,room))return json(req,res,403,{error:'Invalid call token'});const body=await readJson(req);room.status='ended';room.endedBy=String(body.by||'participant').slice(0,20);room.expiresAt=Math.min(room.expiresAt,now()+2*60_000);return json(req,res,200,{ok:true,status:'ended'})}
if(url.pathname===`/api/rooms/${id}`&&req.method==='DELETE'){if(!ownerOk(req,url,room))return json(req,res,403,{error:'Invalid room owner token'});rooms.delete(id);return json(req,res,200,{ok:true,status:'deleted'})}}
if(url.pathname.startsWith('/api/'))return json(req,res,404,{error:'API endpoint not found'});if(!['GET','HEAD'].includes(req.method))return json(req,res,405,{error:'Method not allowed'});if(url.pathname==='/'||url.pathname==='/index.html')return serveFile(path.join(ROOT,'index.html'),req,res);return serveStatic(req,res,url)}catch(e){if(!res.writableEnded)json(req,res,e.status||500,{error:e.status?e.message:'Server error'})}});
server.listen(PORT,HOST,()=>console.log(`HPK Calls V${VERSION} listening on http://${HOST}:${PORT}`));
