// Mobile entry points reuse the existing catalog and guide controls.
const mobileEntry=matchMedia('(max-width:700px), (pointer:coarse) and (max-height:500px)');
const nav=document.querySelector('.mobile-explore'),controls=document.querySelector('.explore-controls'),overview=document.getElementById('gallery-overview'),all=document.getElementById('close-gallery');
const head=document.createElement('div');head.className='mobile-entry-head';head.innerHTML='<span class="mobile-progress" aria-live="polite">正在浏览 01 / 10</span><button type="button" class="mobile-all-works">查看全部10件作品 ↗</button>';nav.prepend(head);
head.querySelector('button').addEventListener('click',()=>all.click());
const kicker=overview.querySelector('.gallery-kicker'),savedKicker=kicker.textContent;
function labels(){if(!mobileEntry.matches)return;const open=all.getAttribute('aria-expanded')==='true';all.textContent=open?'回到小岛':'全部作品';all.setAttribute('aria-label',open?'关闭全部作品，回到小岛':'查看全部10件作品');}
function apply(){if(mobileEntry.matches){nav.appendChild(controls);kicker.textContent='第一阶段 · 创作与探索';}else{overview.insertBefore(controls,nav);kicker.textContent=savedKicker;}labels();}
new MutationObserver(labels).observe(all,{attributes:true,attributeFilter:['aria-expanded']});mobileEntry.addEventListener('change',apply);apply();
