(()=>{const $=id=>document.getElementById(id),esc=s=>String(s||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),paragraph=p=>`<p>${p.strong?'<strong>':''}${esc(p.text)}${p.strong?'</strong>':''}</p>`;
const stage = $('stage-review');
const stageButton = $('stage-open');
const gallery = $('gallery-dialog');
const pageHeader = gallery.querySelector('.gallery-top');
const stageReturn = stage.querySelector('.island-reading-close');
let background = [];

$('stages').innerHTML = window.tianStageData.map((section, index) => `
  <details class="stage-phase" ${index === 0 ? 'open' : ''}>
    <summary class="stage-phase-summary">
      <strong class="stage-phase-heading">${esc(section.label)}</strong>
      <span class="stage-phase-action" aria-hidden="true"></span>
    </summary>
    <div class="stage-phase-body">
      <h2>${esc(section.title)}</h2>
      ${(section.lead || []).map(paragraph).join('')}
      ${(section.sections || []).map(part => `<section>${part.title ? `<h3>${esc(part.title)}</h3>` : ''}${(part.paragraphs || []).map(paragraph).join('')}</section>`).join('')}
    </div>
  </details>`).join('');

function fitStage() {
  stage.style.top = pageHeader.getBoundingClientRect().height + 'px';
}

function closeStage(restoreFocus = true) {
  if (stage.hidden) return;
  stage.hidden = true;
  stageButton.setAttribute('aria-expanded', 'false');
  for (const [element, wasInert] of background) element.inert = wasInert;
  background = [];
  if (restoreFocus) stageButton.focus({preventScroll: true});
}

stageButton.setAttribute('aria-controls', stage.id);
stageButton.setAttribute('aria-expanded', 'false');
stageButton.onclick = () => {
  background = [...gallery.children]
    .filter(element => element !== stage && element !== pageHeader)
    .map(element => [element, element.inert]);
  for (const [element] of background) element.inert = true;
  fitStage();
  stage.hidden = false;
  stageButton.setAttribute('aria-expanded', 'true');
  $('stage-review-title').focus({preventScroll: true});
};

stageReturn.onclick = () => closeStage();
pageHeader.addEventListener('click', event => {
  if (event.target.closest('button,a')) closeStage(false);
}, true);
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || stage.hidden) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  closeStage();
}, true);
gallery.addEventListener('close', () => closeStage(false));
window.addEventListener('galleryviewchange', () => closeStage(false));
window.addEventListener('resize', () => {
  if (!stage.hidden) fitStage();
});
document.querySelectorAll('[data-close]').forEach(button => {
  button.onclick = () => $(button.dataset.close).close();
});
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
 const local=['localhost','127.0.0.1','0.0.0.0'].includes(location.hostname);
 $('share-notice').textContent=local?'当前分享链接仅在本机可打开。':'链接将打开'+label+'。';
 $('poster-status').textContent='正在生成海报…';
 $('poster-open').hidden=true;
 $('poster-save').hidden=true;
 $('share-dialog').showModal();
 let timeout;
 try{
  const file=work?'work-'+work.id:catalog?'catalog':'island';
  const published=u.origin==='https://w7oo.github.io'&&u.pathname==='/tian-island-pages/tian-preview/';
  const staticUrl=published?new URL('../assets/share-posters/'+file+'.jpg',document.baseURI).href:null;
  const generated=staticUrl
   ? Object.assign(new Image(),{src:staticUrl}).decode().then(()=>null)
   : import('./tian-poster.js?rev=bounded').then(({renderTianPoster})=>renderTianPoster(u.href,title,label));
  const deadline=new Promise((_,reject)=>{
   timeout=setTimeout(()=>{
    if(!staticUrl){reject(new Error('海报加载超时'));return;}
    if(request===shareRequest&&$('share-dialog').open)$('poster-status').textContent='海报加载较慢，图片加载完成后会自动显示。';
   },12000);
  });
  const poster=await Promise.race([generated,deadline]);
  if(request!==shareRequest||!$('share-dialog').open)return;
  if(posterUrl)URL.revokeObjectURL(posterUrl);
  posterUrl=poster?URL.createObjectURL(poster):null;
  const imageUrl=staticUrl||posterUrl;
  $('share-poster').src=imageUrl;
  $('poster-open').href=imageUrl;
  $('poster-save').href=imageUrl;
  $('poster-save').download='田田的创作小岛'+(staticUrl?'.jpg':'.png');
  $('poster-open').hidden=false;
  $('poster-save').hidden=false;
  $('poster-status').textContent='长按海报保存，或点图片查看大图。';
 }catch{
  if(request===shareRequest&&$('share-dialog').open)$('poster-status').textContent='海报暂时无法加载，请关闭后重新打开分享。';
 }finally{
  clearTimeout(timeout);
 }
}
$('share-island').onclick=()=>share('分享小岛');$('share-current-work').onclick=()=>share('分享作品',window.currentTianWork());document.addEventListener('click',e=>{if(e.target.closest('.catalog-share'))share('分享全部作品')});window.addEventListener('galleryviewchange',()=>{$('gallery-dialog').dataset.expanded='false'});
})();
