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
  css=css.replace(/#se-login([^{,]*)([{,])/g, function(m,sel,end){ return '#se-login'+sel+',#se-code'+sel+end; });
  function el(h){ var d=document.createElement('div'); d.innerHTML=h; return d.firstChild; }
  function showLogin(){
    if (document.getElementById('se-login')) return;
    var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    var box=el('<div id="se-login"><div class="bx"><div class="lg">SE</div><h1>Shema Electro</h1><p>دخل بالحساب ديالك</p>'+
      '<input id="se-em" type="email" autocomplete="username" placeholder="Email"><input id="se-pw" type="password" autocomplete="current-password" placeholder="Mot de passe">'+
      '<button type="button" id="se-go">دخول</button><div style="margin:14px 0 4px;color:#7d776a;font-size:13px">ولا</div><button type="button" id="se-g" style="background:#fff;color:#1f1f1f;display:flex;align-items:center;justify-content:center;gap:10px"><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>دخول بـ Gmail</button><div class="er" id="se-er"></div></div></div>');
    if (window.__seDenied){ setTimeout(function(){ var e=document.getElementById('se-er'); if (e) e.textContent=window.__seDenied; },0); }
    (document.body||document.documentElement).appendChild(box);
    function go(){ var em=document.getElementById('se-em').value.trim(), pw=document.getElementById('se-pw').value; var er=document.getElementById('se-er'); er.textContent='⏳';
      auth.signInWithEmailAndPassword(em,pw).catch(function(e){ var c=(e&&e.code)||''; er.textContent=/wrong-password|invalid-credential|user-not-found|invalid-login/.test(c)?'الإيميل ولا كلمة السر غالطين':(/too-many/.test(c)?'بزاف ديال المحاولات، تسنى شوية':(/network/.test(c)?'ما كاينش الأنترنيت':'ما دخلش: '+c)); }); }
    box.querySelector('#se-go').addEventListener('click', go);
    box.querySelector('#se-g').addEventListener('click', function(){ var er=document.getElementById('se-er'); er.textContent='⏳'; var pr=new firebase.auth.GoogleAuthProvider(); pr.setCustomParameters({prompt:'select_account'}); auth.signInWithPopup(pr).catch(function(e){ var c=(e&&e.code)||''; if (/popup-blocked|operation-not-supported|web-storage/.test(c)) return auth.signInWithRedirect(pr); er.textContent=/popup-closed|cancelled/.test(c)?'':'ما دخلش: '+c; }); });
    box.querySelector('#se-pw').addEventListener('keydown', function(e){ if (e.key==='Enter') go(); });
  }
  function hideLogin(){ var b=document.getElementById('se-login'); if (b) b.remove(); }
  var readyRes; var ready=new Promise(function(r){ readyRes=r; });
  var wasIn=null;
  auth.onAuthStateChanged(function(u){
    if (u){
      fs.doc('settings/main').get({source:'server'}).catch(function(e){ return e; }).then(function(r){
        if (r && r.code==='permission-denied'){ showCode(u); return; }
        return fs.doc('members/'+u.uid).get().catch(function(){ return null; }).then(function(m){
          if (m && m.exists && m.data().dev && m.data().dev!==devId()){ try{ sessionStorage.setItem('se-denied','📵 هاد الحساب مربوط بتيليفون آخر. طلب من مول المحل يعطيك كود جديد.'); }catch(x){} auth.signOut(); return; }
          hideLogin(); hideCode(); postToken(); if (wasIn===false){ location.reload(); return; } wasIn=true; readyRes(u); syncWebImgs();
        });
      });
    }
    else { try{ window.__seDenied=sessionStorage.getItem('se-denied'); sessionStorage.removeItem('se-denied'); }catch(x){} if (wasIn===true){ location.reload(); return; } wasIn=false; if (document.body) showLogin(); else document.addEventListener('DOMContentLoaded', showLogin); }
  });
  auth.onIdTokenChanged(function(){ postToken(); });
  window.seLogout=function(){ auth.signOut(); };


  /* ---------- invite codes (one code = one Gmail + one phone) ---------- */
  function devId(){ var d=null; try{ d=localStorage.getItem('se-dev'); if (!d){ d=rid(); localStorage.setItem('se-dev', d); } }catch(e){ d='nodev'; } return d; }
  function hideCode(){ var b=document.getElementById('se-code'); if (b) b.remove(); }
  function showCode(u){
    hideLogin(); if (document.getElementById('se-code')) return;
    if (!document.getElementById('se-css')){ var st=document.createElement('style'); st.id='se-css'; st.textContent=css; document.head.appendChild(st); }
    var box=el('<div id="se-login" class="se-code-wrap"><div class="bx"><div class="lg">SE</div><h1>Shema Electro</h1><p>داخل بـ <b style="direction:ltr;display:inline-block">'+String(u.email||'').replace(/</g,'&lt;')+'</b><br>دخل الكود اللي عطاك مول المحل</p>'+
      '<input id="se-cd" placeholder="SE-XXXX-XXXX" autocomplete="off" style="text-transform:uppercase;letter-spacing:2px;text-align:center">'+
      '<button type="button" id="se-cd-go">✅ تأكيد</button><button type="button" id="se-cd-out" style="background:transparent;color:#bdb6a6;border:1px solid #3a3a36">🚪 خروج / حساب آخر</button><div class="er" id="se-cd-er"></div></div></div>');
    box.id='se-code'; (document.body||document.documentElement).appendChild(box);
    box.querySelector('#se-cd-out').addEventListener('click', function(){ auth.signOut(); });
    function go(){ var code=(box.querySelector('#se-cd').value||'').trim().toUpperCase().replace(/\s+/g,''); var er=box.querySelector('#se-cd-er');
      if (!/^SE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)){ er.textContent='الكود خاصو يكون بحال SE-XXXX-XXXX'; return; }
      er.textContent='⏳'; var now=Date.now(), dev=devId();
      fs.doc('redeem/'+code).get().then(function(s){
        if (s.exists){ er.textContent='⛔ هاد الكود تستعمل من قبل'; return; }
        var b=fs.batch(); b.set(fs.doc('redeem/'+code), {uid:u.uid, email:u.email||'', dev:dev, at:now}); b.set(fs.doc('members/'+u.uid), {code:code, email:u.email||'', dev:dev, at:now});
        return b.commit().then(function(){ er.textContent='✅ مرحبا!'; setTimeout(function(){ location.reload(); }, 700); });
      }).catch(function(e){ er.textContent=(e&&e.code==='permission-denied')?'⛔ الكود غالط':'⚠️ '+((e&&e.code)||e); });
    }
    box.querySelector('#se-cd-go').addEventListener('click', go);
    box.querySelector('#se-cd').addEventListener('keydown', function(e){ if (e.key==='Enter') go(); });
  }
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
      '<h2 style="margin-top:16px">👥 شكون يقدر يدخل</h2><p class="small" style="margin:0 0 6px">زيد الإيميل (Gmail) ديال خوك ولا الخدام. كيدخل بـ «دخول بـ Gmail».</p><div style="display:flex;gap:6px"><input id="se-st-e" type="email" placeholder="exemple@gmail.com" style="flex:1;direction:ltr"><button type="button" class="btn btn-gold" id="se-st-add">➕</button></div><div id="se-st-l" class="small" style="margin-top:6px"></div>'+
      '<div id="se-own" style="display:none"><h2 style="margin-top:16px">🔑 الكودات</h2><p class="small" style="margin:0 0 6px">كل كود كيخدم مرة وحدة: Gmail واحد وتيليفون واحد. ✕ كيحيّد الشخص (خاصو كود جديد).</p><div id="se-mem" class="small"></div><button type="button" class="btn btn-line full" id="se-newcode" style="margin-top:8px">➕ صاوب كود جديد</button><div id="se-codes" class="small" style="margin-top:6px;line-height:1.9"></div></div>'+
      '<p class="small" style="margin:10px 0 0;opacity:.7" id="se-me"></p><button type="button" class="btn btn-line full" id="se-out" style="margin-top:10px">🚪 خروج من الحساب</button></div>');
    v.appendChild(c);
    c.querySelector('#se-imp-f').addEventListener('change', function(){ var f=this.files&&this.files[0]; if (!f) return; var s=document.getElementById('se-imp-s');
      importFile(f, function(m){ s.textContent=m; }).then(function(r){ s.textContent='✅ تزادو '+r.ok+' من '+r.all+(r.bad.length?(' · ⚠️ ما تزادوش: '+r.bad.slice(0,6).join('، ')):'')+'. غادي نعاودو نحلّو التطبيق…'; setTimeout(function(){ location.reload(); }, 3000); }).catch(function(e){ s.textContent='⚠️ '+(e.message||e); }); });
    c.querySelector('#se-out').addEventListener('click', function(){ auth.signOut(); });
    var me=auth.currentUser; c.querySelector('#se-me').textContent=me?('داخل بـ: '+(me.email||'')):'';
    function drawStaff(){ fs.collection('staff').get().then(function(q){ var l=c.querySelector('#se-st-l'); l.innerHTML=q.docs.length?q.docs.map(function(d){ return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px solid var(--line)"><span style="direction:ltr">'+d.id.replace(/</g,'&lt;')+'</span><button type="button" class="chip" data-sedel="'+d.id.replace(/"/g,'&quot;')+'">✕</button></div>'; }).join(''):'<span style="opacity:.7">غير نتا دابا.</span>'; }).catch(function(){}); }
    drawStaff();
    var own=c.querySelector('#se-own');
    fs.collection('codes').limit(1).get().then(function(){ own.style.display='block'; drawMembers(); }, function(){ own.remove(); });
    function drawMembers(){
      Promise.all([fs.collection('members').get(), fs.collection('redeem').get(), fs.collection('codes').get()]).then(function(r){
        var ms=r[0].docs, used={}; r[1].docs.forEach(function(d){ used[d.id]=d.data(); });
        c.querySelector('#se-mem').innerHTML=ms.length?ms.map(function(d){ var x=d.data(); return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px solid var(--line)"><span><span style="direction:ltr;display:inline-block">'+String(x.email||'').replace(/</g,'&lt;')+'</span> · <code>'+x.code+'</code></span><button type="button" class="chip" data-semem="'+d.id+'">✕</button></div>'; }).join(''):'<span style="opacity:.7">حتى واحد ما دخل بكود دابا.</span>';
        var mine=r[2].docs.map(function(d){ return d.id; });
        c.querySelector('#se-codes').innerHTML=mine.length?('<b>كودات جداد:</b> '+mine.map(function(k){ return '<code style="'+(used[k]?'text-decoration:line-through;opacity:.5':'')+'">'+k+'</code>'; }).join(' · ')):'';
      }).catch(function(){});
    }
    c.querySelector('#se-newcode').addEventListener('click', function(){ var A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', a=new Uint8Array(8); crypto.getRandomValues(a); var k='SE-'; for (var i=0;i<8;i++){ if (i===4) k+='-'; k+=A[a[i]%A.length]; }
      fs.doc('codes/'+k).set({at:Date.now()}).then(function(){ drawMembers(); try{ navigator.clipboard.writeText(k); }catch(e){} c.querySelector('#se-codes').insertAdjacentHTML('afterbegin','<div>✅ كود جديد: <b style="direction:ltr">'+k+'</b> (تنسخ)</div>'); }); });
    c.addEventListener('click', function(ev){ var t=ev.target.closest&&ev.target.closest('[data-semem]'); if (!t) return; if (t.dataset.ok!=='1'){ t.dataset.ok='1'; t.textContent='متأكد؟'; return; } fs.doc('members/'+t.dataset.semem).delete().then(drawMembers); });
    c.querySelector('#se-st-add').addEventListener('click', function(){ var e=(c.querySelector('#se-st-e').value||'').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){ alertish('إيميل ماشي صحيح'); return; } fs.collection('staff').doc(e).set({at:Date.now(), by:(me&&me.email)||''}).then(function(){ c.querySelector('#se-st-e').value=''; drawStaff(); }); });
    c.addEventListener('click', function(ev){ var t=ev.target.closest&&ev.target.closest('[data-sedel]'); if (!t) return; if (t.dataset.ok!=='1'){ t.dataset.ok='1'; t.textContent='متأكد؟'; return; } fs.collection('staff').doc(t.dataset.sedel).delete().then(drawStaff); });
    function alertish(m){ c.querySelector('#se-st-l').textContent=m; }
  }
  var mo=new MutationObserver(function(){ addCard(); });
  document.addEventListener('DOMContentLoaded', function(){ addCard(); mo.observe(document.body,{childList:true,subtree:false}); });
})();
