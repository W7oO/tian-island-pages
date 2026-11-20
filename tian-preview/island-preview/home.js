// One entry point, with an optional original welcome view retained for review.
const homeParams=new URLSearchParams(location.search);
if(homeParams.get('view')==='welcome'){
 import('./island.js?rev=20261116-realmap');
}else{
 document.body.dataset.start='island';
 const gallery=document.getElementById('gallery-dialog'),grid=document.getElementById('overview-grid');
 const all=document.getElementById('close-gallery'),brand=document.getElementById('leave-gallery'),list=document.getElementById('explore-list');
 brand.innerHTML='<span class="brand-name"><img class="course-mark" src="assets/course-mark.svg" alt="">AI思维训练</span><small>Tian’s Island</small>';
 all.textContent='全部作品';all.setAttribute('aria-label','查看全部作品');all.setAttribute('aria-expanded','false');all.setAttribute('aria-controls','overview-grid');
 brand.setAttribute('aria-label','回到创作小岛');
 document.querySelector('#gallery-overview .gallery-kicker').textContent='第一阶段 · 创作与探索';
 document.getElementById('gallery-title').textContent='刘踊田的创作小岛';
 document.querySelector('#gallery-overview .gallery-intro>p:not(.gallery-kicker)').textContent='从兴趣出发，让想法经得起探索与检验。';
 document.querySelector('#gallery-overview .chapter-count').hidden=true;
 document.querySelector('.explore-help').textContent='点击场景看作品，也可以查看全部作品。';
 document.getElementById('explore-reset').textContent='重置视角';
 // Current work row keeps the share action in its third column.
 for(const id of ['back-overview','exhibit-overview'])document.getElementById(id).textContent='回到小岛';
 list.textContent='全部作品';
 const heading=document.createElement('div');heading.className='catalog-heading';
 heading.innerHTML='<div><h2>全部作品</h2><p>10个展位 · 9件已有展示素材，1件作品已完成、素材待补。</p></div><button type="button" class="catalog-close">回到小岛 ↗</button><button type="button" class="catalog-share">分享全部作品</button>';
 grid.prepend(heading);
 grid.setAttribute('aria-label','全部作品预览');
 function catalog(open){
  if(gallery.dataset.view!=='overview')window.showIslandWork(0);
  grid.dataset.open=String(open);gallery.dataset.catalog=String(open);
  const pageURL=new URL(location.href);if(open)pageURL.searchParams.set('catalog','1');else pageURL.searchParams.delete('catalog');history.replaceState(history.state,'',pageURL);
  list.setAttribute('aria-expanded',String(open));all.setAttribute('aria-expanded',String(open));
  all.textContent=open?'回到小岛':'全部作品';
  all.setAttribute('aria-label',open?'关闭作品总览，回到小岛':'查看全部作品');
  if(open){grid.scrollTop=0;all.focus({preventScroll:true});}
 }
 function map(){window.showIslandWork(0);catalog(false);}
 all.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();catalog(gallery.dataset.view!=='overview'||grid.dataset.open!=='true');},true);
 list.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();catalog(grid.dataset.open!=='true');},true);
 brand.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();map();},true);
 heading.querySelector('button').addEventListener('click',()=>{catalog(false);all.focus({preventScroll:true});});if(homeParams.get('catalog')==='1')catalog(true);
 gallery.addEventListener('cancel',e=>{
  if(window.aliySingleWork){e.preventDefault();return;}
  if(gallery.querySelector('.game-frame[data-expanded="true"]:not([hidden])'))return;
  e.preventDefault();map();all.focus({preventScroll:true});
 },true);
 window.addEventListener('galleryviewchange',e=>{if(e.detail.id){grid.dataset.open='false';gallery.dataset.catalog='false';all.textContent='全部作品';all.setAttribute('aria-expanded','false');}});
}
