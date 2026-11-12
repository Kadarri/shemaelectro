/* Shema Electro service worker: serves /_blob/<id> from Firestore (blobs collection) */
var TOKEN=null, PROJECT='united-yeti-472800-n6', CACHE='se-blobs-v1';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('message', function(e){ if (e.data && e.data.type==='token'){ TOKEN=e.data.token; if (e.data.project) PROJECT=e.data.project; } });

function askToken(clientId){
  return self.clients.get(clientId||'').then(function(c){ return c?[c]:self.clients.matchAll({type:'window'}); }).then(function(list){
    list=Array.isArray(list)?list:[list]; var c=list[0]; if (!c) return null;
    return new Promise(function(res){ var ch=new MessageChannel(); var t=setTimeout(function(){ res(null); }, 4000);
      ch.port1.onmessage=function(ev){ clearTimeout(t); if (ev.data&&ev.data.token){ TOKEN=ev.data.token; if (ev.data.project) PROJECT=ev.data.project; } res(TOKEN); };
      c.postMessage({type:'need-token'},[ch.port2]); });
  });
}
function dataUrlToResponse(d){
  var m=/^data:([^;,]+)?(;base64)?,(.*)$/s.exec(d||''); if (!m) return new Response('', {status:404});
  var type=m[1]||'application/octet-stream', body;
  if (m[2]){ var bin=atob(m[3]), arr=new Uint8Array(bin.length); for (var i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); body=arr; }
  else body=decodeURIComponent(m[3]);
  return new Response(body, {status:200, headers:{'Content-Type':type, 'Cache-Control':'max-age=31536000'}});
}
function fetchBlob(id, clientId, retry){
  var go=function(tok){
    if (!tok) return new Response('', {status:401});
    return fetch('https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/blobs/'+encodeURIComponent(id), {headers:{Authorization:'Bearer '+tok}})
      .then(function(r){
        if (r.status===401 && !retry){ TOKEN=null; return fetchBlob(id, clientId, true); }
        if (!r.ok) return new Response('', {status:r.status});
        return r.json().then(function(j){ var d=j&&j.fields&&j.fields.d&&j.fields.d.stringValue; return dataUrlToResponse(d); });
      });
  };
  return TOKEN?go(TOKEN):askToken(clientId).then(go);
}
self.addEventListener('fetch', function(e){
  var u=new URL(e.request.url);
  if (u.origin!==self.location.origin) return;
  var m=u.pathname.match(/\/_blob\/([^\/?#]+)/); if (!m) return;
  var id=decodeURIComponent(m[1]), key=new Request(self.location.origin+'/_blob/'+id);
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(key).then(function(hit){
      if (hit) return hit;
      return fetchBlob(id, e.clientId).then(function(resp){ if (resp.ok) c.put(key, resp.clone()); return resp; });
    });
  }).catch(function(){ return new Response('', {status:503}); }));
});
