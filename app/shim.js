/* Shema Electro – standalone platform layer (Firebase) */
(function(){
  var CFG={apiKey:"AIzaSyDq-9621rLb7KaCx6ruXuNVPS7nSXDSXz0",authDomain:"united-yeti-472800-n6.firebaseapp.com",projectId:"united-yeti-472800-n6",storageBucket:"united-yeti-472800-n6.firebasestorage.app",messagingSenderId:"481171214396",appId:"1:481171214396:web:b5a7a949bb7ed867da3339"};
  firebase.initializeApp(CFG);
  var auth=firebase.auth(), fs=firebase.firestore();
  try{ fs.settings({ignoreUndefinedProperties:true, merge:true}); }catch(e){}
  try{ fs.enablePersistence({synchronizeTabs:true}).catch(function(){}); }catch(e){}
  window.SE={auth:auth, fs:fs};

  /* ---------- service worker: serves /_blob/<id> from Firestore ---------- */
  var swReady=null;
  function postToken(){ var u=auth.currentUser; if (!u || !navigator.serviceWorker || !navigator.serviceWorker.controller) return; u.getIdToken().then(function(t){ try{ navigator.serviceWorker.controller.postMessage({type:'token', token:t, project:CFG.projectId}); }catch(e){} }); }
  if ('serviceWorker' in navigator){
    swReady=navigator.serviceWorker.register('sw.js').then(function(reg){ return navigator.serviceWorker.ready; }).catch(function(){ return null; });
    navigator.serviceWorker.addEventListener('message', function(ev){
      if (ev.data && ev.data.type==='need-token'){ var u=auth.currentUser; if (!u){ ev.ports[0]&&ev.ports[0].postMessage({token:null}); return; } u.getIdToken().then(function(t){ ev.ports[0]&&ev.ports[0].postMessage({token:t, project:CFG.projectId}); }); }
    });
    navigator.serviceWorker.addEventListener('controllerchange', function(){ postToken(); setTimeout(function(){ document.querySelectorAll('img[src*="/_blob/"],video[src*="/_blob/"]').forEach(function(im){ var u=im.getAttribute('src'); im.setAttribute('src',''); im.setAttribute('src',u); }); }, 400); });
  }

  /* ---------- login gate ---------- */
  var css='#se-login{position:fixed;inset:0;z-index:99999;background:#141413;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Cairo,system-ui,sans-serif;direction:rtl}'+
    '#se-login .bx{width:min(360px,92vw);background:#1E1E1E;border:1px solid #3a3a36;border-radius:20px;padding:26px 22px;text-align:center}'+
    '#se-login .lg{width:64px;height:64px;border-radius:18px;background:#C9A227;color:#141413;font-weight:800;font-size:24px;display:grid;place-items:center;margin:0 auto 10px}'+
    '#se-login h1{margin:0 0 4px;font-size:22px}#se-login p{margin:0 0 16px;color:#bdb6a6;font-size:14px}'+
    '#se-login input{width:100%;box-sizing:border-box;margin:6px 0;padding:12px 14px;border-radius:12px;border:1.5px solid #3a3a36;background:#141413;color:#fff;font:inherit;font-size:16px;direction:ltr;text-align:left}'+
    '#se-login button{width:100%;margin-top:10px;padding:12px;border:0;border-radius:12px;background:#C9A227;color:#141413;font:inherit;font-weight:800;font-size:16px;cursor:pointer}'+
    '#se-login .er{color:#ff8a80;font-size:14px;min-height:20px;margin-top:8px}';
  function el(h){ var d=document.createElement('div'); d.innerHTML=h; return d.firstChild; }
  function showLogin(){
    if (document.getElementById('se-login')) return;
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var box=el('<div id="se-login"><div class="bx"><div class="lg">SE</div><h1>Shema Electro</h1><p>دخل بالحساب ديالك</p>'+
      '<input id="se-em" type="email" autocomplete="username" placeholder="Email"><input id="se-pw" type="password" autocomplete="current-password" placeholder="Mot de passe">'+
      '<button type="button" id="se-go">دخول</button><div class="er" id="se-er"></div></div></div>');
    (document.body||document.documentElement).appendChild(box);
    function go(){ var em=document.getElementById('se-em').value.trim(), pw=document.getElementById('se-pw').value; var er=document.getElementById('se-er'); er.textContent='⏳';
      auth.signInWithEmailAndPassword(em,pw).catch(function(e){ var c=(e&&e.code)||''; er.textContent=/wrong-password|invalid-credential|user-not-found|invalid-login/.test(c)?'الإيميل ولا كلمة السر غالطين':(/too-many/.test(c)?'بزاف ديال المحاولات، تسنى شوية':(/network/.test(c)?'ما كاينش الأنترنيت':'ما دخلش: '+c)); }); }
    box.querySelector('#se-go').addEventListener('click', go);
    box.querySelector('#se-pw').addEventListener('keydown', function(e){ if (e.key==='Enter') go(); });
  }
  function hideLogin(){ var b=document.getElementById('se-login'); if (b) b.remove(); }
  var readyRes; var ready=new Promise(function(r){ readyRes=r; });
  var wasIn=null;
  auth.onAuthStateChanged(function(u){
    if (u){ hideLogin(); postToken(); if (wasIn===false){ location.reload(); return; } wasIn=true; readyRes(u); syncWebImgs(); }
    else { if (wasIn===true){ location.reload(); return; } wasIn=false; if (document.body) showLogin(); else document.addEventListener('DOMContentLoaded', showLogin); }
  });
  auth.onIdTokenChanged(function(){ postToken(); });
  window.seLogout=function(){ auth.signOut(); };

  /* ---------- images ---------- */
  function rid(){ var a=new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a,function(b){return ('0'+b.toString(16)).slice(-2);}).join(''); }
  function blobToDataURL(b){ return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){res(r.result);}; r.onerror=rej; r.readAsDataURL(b); }); }
  function shrink(blob, max, q){
    return new Promise(function(res){
      if (!/^image\//.test(blob.type||'') || /svg/.test(blob.type)){ blobToDataURL(blob).then(res,function(){res(null);}); return; }
      var url=URL.createObjectURL(blob), im=new Image();
      im.onload=function(){ var s=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight)), w=Math.max(1,Math.round(im.naturalWidth*s)), h=Math.max(1,Math.round(im.naturalHeight*s));
        var c=document.createElement('canvas'); c.width=w; c.height=h; var g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,w,h); g.drawImage(im,0,0,w,h); URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg',q)); };
      im.onerror=function(){ URL.revokeObjectURL(url); blobToDataURL(blob).then(res,function(){res(null);}); };
      im.src=url;
    });
  }
  window.SE.shrink=shrink;
  var assetsApi={ upload:function(blob){
    return ready.then(function(){ return shrink(blob,1100,0.78); }).then(function(d){
      if (!d) throw new Error('read');
      if (d.length>950000) throw new Error('too-large');
      var id=rid(); var type=(d.match(/^data:([^;,]+)/)||[])[1]||blob.type||'application/octet-stream';
      return fs.collection('blobs').doc(id).set({d:d, t:type, at:Date.now()}).then(function(){ return {id:id, sizeBytes:Math.round(d.length*0.75), contentType:type}; });
    }); } };

  /* public website photos: copy small versions of catalog photos into webimg/ */
  var webSyncing=false;
  function syncWebImgs(){
    if (webSyncing) return; webSyncing=true;
    fs.doc('webcat/main').onSnapshot(function(s){
      var d=s.exists?s.data():null; if (!d || !d.items) return;
      var done={}; try{ done=JSON.parse(localStorage.getItem('se-webimg')||'{}')||{}; }catch(e){}
      d.items.forEach(function(it){ var ph=it.ph; if (!ph || done[ph]) return;
        fs.doc('webimg/'+ph).get().then(function(w){ if (w.exists){ done[ph]=1; localStorage.setItem('se-webimg',JSON.stringify(done)); return; }
          return fs.doc('blobs/'+ph).get().then(function(b){ if (!b.exists) return; var src=b.data().d; return fetch(src).then(function(r){return r.blob();}).then(function(bl){ return shrink(bl,640,0.72); }).then(function(small){ if (!small) return; return fs.doc('webimg/'+ph).set({d:small, at:Date.now()}).then(function(){ done[ph]=1; localStorage.setItem('se-webimg',JSON.stringify(done)); }); }); });
        }).catch(function(){});
      });
    }, function(){});
  }

  /* ---------- downloads ---------- */
  var downloadsApi={ save:function(o){ return new Promise(function(res){ var b=o.data instanceof Blob?o.data:new Blob([o.data]); var u=URL.createObjectURL(b), a=document.createElement('a'); a.href=u; a.download=o.filename||'file'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(u); a.remove(); res(); }, 1500); }); } };

  /* ---------- the platform object the app expects ---------- */
  var caps={
    db: function(){ return ready.then(function(){ return fs; }); },
    assets: function(){ return ready.then(function(){ return assetsApi; }); },
    downloads: function(){ return Promise.resolve(downloadsApi); }
  };
  window.claude={ use:function(name){ return caps[name]?caps[name]():Promise.resolve(null); } };

  /* ---------- import / logout card in the backup view ---------- */
  function isArrDeep(v){ if (Array.isArray(v)) return v.some(function(x){ return Array.isArray(x) || (x&&typeof x==='object'&&isArrDeep(x)); }); if (v&&typeof v==='object') return Object.keys(v).some(function(k){ return isArrDeep(v[k]); }); return false; }
  function importFile(file, log){
    return file.text().then(function(txt){
      var J=JSON.parse(txt); if (!J || J.app!=='wash-nchriha-export') throw new Error('هاد الملف ماشي ديال التطبيق');
      var cols=J.collections||{}, names=Object.keys(cols), total=0, okN=0, bad=[];
      names.forEach(function(c){ total+=cols[c].length; });
      var jobs=[];
      names.forEach(function(c){ cols[c].forEach(function(d){ jobs.push(function(){
        if (isArrDeep(d.data)){ bad.push(c+'/'+d.id); return Promise.resolve(); }
        return fs.collection(c).doc(String(d.id)).set(d.data).then(function(){ okN++; }, function(e){ bad.push(c+'/'+d.id+' ('+(e.code||e.message)+')'); });
      }); }); });
      var blobs=J.blobs||{}, bids=Object.keys(blobs);
      bids.forEach(function(id){ jobs.push(function(){ var v=blobs[id]; if (!v||!v.d) return Promise.resolve(); return fs.collection('blobs').doc(id).set({d:v.d,t:v.t||'image/jpeg',at:Date.now()}).then(function(){ okN++; }, function(e){ bad.push('blob '+id); }); }); });
      if (J.local) Object.keys(J.local).forEach(function(k){ try{ if (localStorage.getItem(k)==null) localStorage.setItem(k, J.local[k]); }catch(e){} });
      var i=0, all=jobs.length;
      function next(){ if (i>=all) return Promise.resolve(); var batch=jobs.slice(i,i+8); i+=8; log('⏳ '+Math.min(i,all)+' / '+all); return Promise.all(batch.map(function(f){return f();})).then(next); }
      return next().then(function(){ return {ok:okN, all:all, bad:bad}; });
    });
  }
  function addCard(){
    var ex=document.getElementById('exp-card'); if (ex) ex.remove();
    var v=document.getElementById('view-backup'); if (!v || document.getElementById('se-imp')) return;
    var c=el('<div class="card" id="se-imp"><h2>📥 استيراد البيانات القديمة</h2><p class="small" style="margin:0 0 8px">ختار الملف اللي تصدّر من التطبيق القديم (wash-nchriha-export.json). كيتزادو البيانات والفوطوات.</p>'+
      '<label class="btn btn-gold full" style="text-align:center;cursor:pointer">📂 ختار الملف<input type="file" accept="application/json,.json" style="display:none" id="se-imp-f"></label><p class="small" id="se-imp-s" style="margin:8px 0 0"></p>'+
      '<button type="button" class="btn btn-line full" id="se-out" style="margin-top:10px">🚪 خروج من الحساب</button></div>');
    v.appendChild(c);
    c.querySelector('#se-imp-f').addEventListener('change', function(){ var f=this.files&&this.files[0]; if (!f) return; var s=document.getElementById('se-imp-s');
      importFile(f, function(m){ s.textContent=m; }).then(function(r){ s.textContent='✅ تزادو '+r.ok+' من '+r.all+(r.bad.length?(' · ⚠️ ما تزادوش: '+r.bad.slice(0,6).join('، ')):'')+'. غادي نعاودو نحلّو التطبيق…'; setTimeout(function(){ location.reload(); }, 3000); }).catch(function(e){ s.textContent='⚠️ '+(e.message||e); }); });
    c.querySelector('#se-out').addEventListener('click', function(){ auth.signOut(); });
  }
  var mo=new MutationObserver(function(){ addCard(); });
  document.addEventListener('DOMContentLoaded', function(){ addCard(); mo.observe(document.body,{childList:true,subtree:false}); });
})();
