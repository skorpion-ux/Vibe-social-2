(() => {
  'use strict';
  const SUPABASE_URL = 'https://qqjnejnjftvmtaogofrk.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_N5NQUqgijyRPSgxTAFVvvg_ZiBfVJ6i';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = n => (String(n||'V').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('')||'V').toUpperCase();
  const timeAgo = t => { const m=Math.max(1,Math.floor((Date.now()-new Date(t).getTime())/60000)); return m<60?`PŘED ${m} MIN`:m<1440?`PŘED ${Math.floor(m/60)} HOD`:`PŘED ${Math.floor(m/1440)} DNY`; };
  let user=null, profile=null, posts=[], currentView='feed', sortMode='latest', searchTerm='', toastTimer;
  const notify = msg => { const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); };
  const show = (id, yes=true) => $(id).classList.toggle('hidden',!yes);
  const dialog = (id, open=true) => { const d=$(id); if(open) d.showModal(); else d.close(); };
  const ownHandle = () => profile?.username || user?.email?.split('@')[0] || 'uzivatel';
  const updateProfileBits = () => {
    const name=profile?.display_name || user?.email?.split('@')[0] || 'Návštěvník';
    ['#sidebarName','#railName'].forEach(s=>{if($(s))$(s).textContent=name;});
    ['#sidebarHandle','#railHandle'].forEach(s=>{if($(s))$(s).textContent='@'+ownHandle();});
    ['#sidebarAvatar','#railAvatar'].forEach(s=>{if($(s))$(s).textContent=initials(name);});
    $('#authButton').textContent=user?'Odhlásit se':'Přihlásit se';
  };
  const postCard = p => {
    const name=p.profiles?.display_name || p.profiles?.username || 'Uživatel';
    const handle='@'+(p.profiles?.username||'uzivatel');
    const liked=(p.likes||[]).some(x=>x.user_id===user?.id);
    const image=p.image_url ? `<img class="post-image" src="${esc(p.image_url)}" alt="Fotografie v příspěvku" loading="lazy">` : `<div class="post-image placeholder"><span>VIBE moment ✦</span></div>`;
    const comments=(p.comments||[]).map(c=>`<div class="comment"><strong>${esc(c.profiles?.display_name||c.profiles?.username||'Uživatel')}</strong>${esc(c.content)}</div>`).join('');
    return `<article class="post-card" data-post="${esc(p.id)}"><header class="post-head"><div class="avatar">${esc(initials(name))}</div><div class="post-author"><strong>${esc(name)}</strong><small>${esc(handle)} · ${timeAgo(p.created_at)}</small></div></header>${image}<div class="post-body"><div class="post-actions"><button class="action-button ${liked?'liked':''}" data-action="like" aria-label="To se mi líbí">${liked?'♥':'♡'}</button><button class="action-button" data-action="focus-comment" aria-label="Komentáře">▢<span>${(p.comments||[]).length}</span></button></div><div class="post-likes">${(p.likes||[]).length} To se mi líbí</div><div class="post-caption"><strong>${esc(handle.slice(1))}</strong>${esc(p.content||'')}</div><div class="post-time">${timeAgo(p.created_at)}</div><section class="comments"><div class="comment-list">${comments||'<div class="comment muted-comment">Buď první, kdo přidá komentář.</div>'}</div><form class="comment-form"><input name="comment" maxlength="220" placeholder="Přidat komentář…" aria-label="Text komentáře"><button type="submit">Odeslat</button></form></section></div></article>`;
  };
  const render = () => {
    updateProfileBits();
    const profileView=$('#profileView'), feed=$('#feedList');
    profileView.classList.toggle('hidden',currentView!=='profile');
    $('.stories').classList.toggle('hidden',currentView==='profile'||currentView==='saved');
    $('#discoverSearch').classList.toggle('hidden',currentView!=='discover');
    if(currentView==='profile') profileView.innerHTML=`<div class="profile-cover"></div><div class="profile-info"><div class="avatar avatar-me">${esc(initials(profile?.display_name||'V'))}</div><div><h2>${esc(profile?.display_name||'Můj profil')}</h2><p>@${esc(ownHandle())}</p></div><button class="text-button" data-edit-profile>Upravit profil</button></div><p class="profile-bio">${esc(profile?.bio||'Zatím bez popisku.')}</p><div class="profile-stats"><span><strong>${posts.filter(p=>p.user_id===user?.id).length}</strong> příspěvků</span></div>`;
    else profileView.innerHTML='';
    let list=[...posts];
    if(currentView==='profile') list=list.filter(p=>p.user_id===user?.id);
    if(currentView==='saved') list=[]; // Ukládání příspěvků doplníme v další etapě.
    if(searchTerm) list=list.filter(p=>(p.content||'').toLowerCase().includes(searchTerm));
    list.sort((a,b)=>sortMode==='popular'?(b.likes?.length||0)-(a.likes?.length||0):new Date(b.created_at)-new Date(a.created_at));
    feed.innerHTML=list.map(postCard).join('');
    $('#emptyFeed').classList.toggle('hidden',list.length>0);
    const titles={feed:'Domů',discover:'Objevovat',saved:'Uložené',profile:'Tvůj profil'}; $('#pageTitle').textContent=titles[currentView]||'Domů';
    $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView));
    $$('.feed-switch button').forEach(b=>b.classList.toggle('selected',b.dataset.sort===sortMode));
  };
  async function loadData(){
    if(!user){posts=[];profile=null;render();return;}
    const [pr, po]=await Promise.all([
      db.from('profiles').select('*').eq('id',user.id).maybeSingle(),
      db.from('posts').select('*, profiles(username,display_name,avatar_url), comments(*, profiles(username,display_name)), likes(user_id)').order('created_at',{ascending:false}).limit(60)
    ]);
    if(pr.error) throw pr.error; if(po.error) throw po.error;
    profile=pr.data;
    if(!profile){const uname=(user.email?.split('@')[0]||'uzivatel').toLowerCase().replace(/[^a-z0-9_.]/g,'').slice(0,20)||'uzivatel'; await db.from('profiles').update({username:uname,display_name:uname}).eq('id',user.id); const again=await db.from('profiles').select('*').eq('id',user.id).maybeSingle(); profile=again.data;}
    posts=po.data||[]; render();
  }
  async function refresh(){try{await loadData();}catch(e){console.error(e);notify('Nepodařilo se načíst data: '+(e.message||'zkus to znovu'));}}
  document.addEventListener('click',async e=>{
    if(e.target.closest('#authButton')){if(user){const {error}=await db.auth.signOut();if(error)notify(error.message);else{user=null;await refresh();notify('Byl(a) jsi odhlášen(a).');}}else dialog('authDialog');return;}
    if(e.target.closest('[data-edit-profile]')){if(!user){notify('Nejdřív se přihlas.');return;}$('#profileName').value=profile?.display_name||'';$('#profileHandle').value=profile?.username||'';$('#profileBio').value=profile?.bio||'';dialog('profileDialog');return;}
    const v=e.target.closest('[data-view]');if(v){currentView=v.dataset.view;searchTerm='';$('#discoverSearch').value='';render();scrollTo({top:0,behavior:'smooth'});return;}
    const s=e.target.closest('[data-sort]');if(s){sortMode=s.dataset.sort;render();return;}
    const c=e.target.closest('[data-close]');if(c){dialog(c.dataset.close,false);return;}
    const a=e.target.closest('[data-action]');if(a){if(!user){notify('Pro tuto akci se nejdřív přihlas.');return;}const card=a.closest('[data-post]'),p=posts.find(x=>x.id===card?.dataset.post);if(!p)return;if(a.dataset.action==='focus-comment'){$('input[name="comment"]',card)?.focus();return;}if(a.dataset.action==='like'){const liked=(p.likes||[]).some(x=>x.user_id===user.id);const res=liked?await db.from('likes').delete().eq('post_id',p.id).eq('user_id',user.id):await db.from('likes').insert({post_id:p.id,user_id:user.id});if(res.error)notify(res.error.message);else await refresh();}return;}
  });
  $('#authForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('#authEmail').value.trim(),password=$('#authPassword').value;const mode=$('#authMode').value;const result=mode==='signup'?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});if(result.error){notify(result.error.message);return;}if(mode==='signup'&&!result.data.session){dialog('authDialog',false);notify('Účet byl vytvořen. Zkontroluj e-mail a potvrď registraci.');return;}user=result.data.user;dialog('authDialog',false);await refresh();notify(mode==='signup'?'Účet vytvořen.':'Přihlášení proběhlo.');});
  $('#authMode').addEventListener('change',e=>{$('#authSubmit').textContent=e.target.value==='signup'?'Vytvořit účet':'Přihlásit se';});
  $('#feedList').addEventListener('submit',async e=>{if(!e.target.matches('.comment-form'))return;e.preventDefault();if(!user){notify('Nejdřív se přihlas.');return;}const content=$('input[name="comment"]',e.target).value.trim();const p=posts.find(x=>x.id===e.target.closest('[data-post]')?.dataset.post);if(!content||!p)return;const {error}=await db.from('comments').insert({post_id:p.id,user_id:user.id,content});if(error)notify(error.message);else await refresh();});
  const openPost=()=>{if(!user){notify('Nejdřív se přihlas.');return;}$('#postCaption').value='';$('#postImageUrl').value='';$('#postImageFile').disabled=true;$('#postImageHint').textContent='Nahrávání fotografií do cloudu připravíme v dalším kroku. Zatím použij odkaz na obrázek.';dialog('postDialog');};
  $('#openPostDialog').addEventListener('click',openPost);$('#mobileCreate').addEventListener('click',openPost);$('#emptyCreate').addEventListener('click',openPost);
  $('#postForm').addEventListener('submit',async e=>{e.preventDefault();if(!user){notify('Nejdřív se přihlas.');return;}const content=$('#postCaption').value.trim(),image_url=$('#postImageUrl').value.trim()||null;if(!content&&!image_url){notify('Napiš text nebo vlož odkaz na fotku.');return;}const {error}=await db.from('posts').insert({user_id:user.id,content,image_url});if(error){notify(error.message);return;}dialog('postDialog',false);currentView='feed';await refresh();notify('Příspěvek byl uložen do Supabase.');});
  $('#profileForm').addEventListener('submit',async e=>{e.preventDefault();if(!user)return;const username=$('#profileHandle').value.trim().replace(/^@/,'').toLowerCase();if(!/^[a-z0-9_.]{3,24}$/.test(username)){notify('Uživatelské jméno: 3–24 znaků, písmena, čísla, tečka nebo _.');return;}const {error}=await db.from('profiles').update({username,display_name:$('#profileName').value.trim(),bio:$('#profileBio').value.trim()}).eq('id',user.id);if(error){notify(error.message);return;}dialog('profileDialog',false);await refresh();notify('Profil uložen.');});
  $('#discoverSearch').addEventListener('input',e=>{searchTerm=e.target.value.toLowerCase().trim();render();$('#discoverSearch').value=e.target.value;});
  $$('.story').forEach(s=>s.addEventListener('click',()=>notify('Příběhy doplníme později.')));
  $('#refreshSuggestions').addEventListener('click',()=>notify('Doporučování profilů doplníme později.'));
  db.auth.getSession().then(({data,error})=>{if(error)notify(error.message);user=data.session?.user||null;refresh();});
  db.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;refresh();});
})();
