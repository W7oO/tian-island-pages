(()=>{const $=id=>document.getElementById(id),esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),paragraph=p=>`<p>${p.strong?'<strong>':''}${esc(p.text)}${p.strong?'</strong>':''}</p>`;
$('stage-intro-copy').innerHTML=window.tianHomeCopy.map(paragraph).join('');$('stages').innerHTML=window.tianStageData.map((s,i)=>`<details ${i===0?'open':''}><summary>${esc(s.label)} · ${esc(s.title)}</summary>${(s.lead||[]).map(paragraph).join('')}${(s.sections||[]).map(x=>`<section>${x.title?`<h3>${esc(x.title)}</h3>`:''}${(x.paragraphs||[]).map(paragraph).join('')}</section>`).join('')}</details>`).join('');$('stage-open').onclick=()=>$('stage-dialog').showModal();document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
let shareRequest=0,posterUrl;
async function share(scope,id=0){
 const request=++shareRequest;
 const u=new URL(location.href);
 u.search='';
 u.hash='';
 const catalog=scope==='分享全部作品';
 const work=window.aliyWorks.find(w=>w.id===id);
 const title=work?.workName||work?.name||(catalog?'全部作品':'');
 if(work){
  u.searchParams.set('work',id);
  u.searchParams.set('single','1');
 }else if(catalog)u.searchParams.set('catalog','1');
 const label=work?'当前作品':catalog?'作品目录':'整座小岛';
 $('share-heading').textContent=work?'分享作品 · '+title:scope;
 $('share-link').value=u.href;
 $('copy-status').textContent='';
 const local=['localhost','127.0.0.1','0.0.0.0'].includes(location.hostname);
 $('share-notice').textContent=local?'当前分享链接仅在本机可打开。':'链接将打开'+label+'。';
 $('poster-status').textContent='正在生成海报…';
 $('poster-open').hidden=true;
 $('poster-save').hidden=true;
 $('share-dialog').showModal();
 try{
  const {renderTianPoster}=await import('./tian-poster.js?rev=1');
  const poster=await renderTianPoster(u.href,title,label);
  if(request!==shareRequest)return;
  if(posterUrl)URL.revokeObjectURL(posterUrl);
  posterUrl=URL.createObjectURL(poster);
  $('share-poster').src=posterUrl;
  $('poster-open').href=posterUrl;
  $('poster-save').href=posterUrl;
  $('poster-open').hidden=false;
  $('poster-save').hidden=false;
  $('poster-status').textContent='长按海报保存，或点图片查看大图。';
 }catch{
  if(request===shareRequest)$('poster-status').textContent='海报暂时无法加载，关闭后可重新打开分享。';
 }
}
$('share-island').onclick=()=>share('分享小岛');$('share-current-work').onclick=()=>share('分享作品',window.currentTianWork());document.addEventListener('click',e=>{if(e.target.closest('.catalog-share'))share('分享全部作品')});$('copy-link').onclick=async()=>{try{await navigator.clipboard.writeText($('share-link').value);$('copy-status').textContent='已复制链接'}catch{$('share-link').select();$('copy-status').textContent='请长按链接复制'}};window.addEventListener('galleryviewchange',()=>{$('gallery-dialog').dataset.expanded='false'});
})();
