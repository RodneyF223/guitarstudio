// GuitarStudio — con internet carga siempre la última versión (y la guarda);
// sin internet (o si la red tarda más de 4 s) abre la copia guardada.
const C='guitarstudio-v1';
const BASE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()));});
// solo borra cachés antiguas de GuitarStudio: otras apps del mismo sitio (p. ej. Matribox Hub) guardan las suyas aquí también
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('guitarstudio-')&&n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const copia=()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'));
  e.respondWith(new Promise(resolve=>{
    let hecho=false;
    const fin=r=>{if(!hecho&&r){hecho=true;resolve(r);}};
    const espera=setTimeout(()=>copia().then(fin),4000);
    fetch(e.request).then(r=>{
      clearTimeout(espera);
      if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}
      if(hecho)return;
      if(r&&r.ok)fin(r);else copia().then(c=>fin(c||r));
    }).catch(()=>{clearTimeout(espera);copia().then(c=>{if(c)fin(c);else if(!hecho){hecho=true;resolve(Response.error());}});});
  }));
});
