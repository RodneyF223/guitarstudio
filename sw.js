// GuitarStudio — con internet carga siempre la última versión (y la guarda);
// sin internet (o si la red tarda más de 4 s) abre la copia guardada.
// Los archivos propios se piden con cache:'no-cache': GitHub Pages deja que el navegador reutilice su copia
// 10 min, y así se comprueba siempre con el servidor (si no ha cambiado, la respuesta es mínima).
const C='guitarstudio-v1';
const BASE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(BASE)).then(()=>self.skipWaiting()));});
// solo borra cachés antiguas de GuitarStudio: otras apps del mismo sitio (p. ej. Matribox Hub) guardan las suyas aquí también
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('guitarstudio-')&&n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // version.txt va siempre directo a la red: es con lo que la app comprueba si hay una versión nueva
  if(url.origin===self.location.origin&&url.pathname.endsWith('/version.txt'))return;
  const copia=()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'));
  e.respondWith(new Promise(resolve=>{
    let hecho=false;
    const fin=r=>{if(!hecho&&r){hecho=true;resolve(r);}};
    const espera=setTimeout(()=>copia().then(fin),4000);
    const red=url.origin===self.location.origin?fetch(e.request.url,{cache:'no-cache'}):fetch(e.request);
    red.then(r=>{
      clearTimeout(espera);
      if(r&&r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}
      if(hecho)return;
      if(r&&r.ok)fin(r);else copia().then(c=>fin(c||r));
    }).catch(()=>{clearTimeout(espera);copia().then(c=>{if(c)fin(c);else if(!hecho){hecho=true;resolve(Response.error());}});});
  }));
});
