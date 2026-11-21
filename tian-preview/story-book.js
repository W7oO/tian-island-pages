'use strict';
const data=JSON.parse(document.getElementById('story-data').textContent),$=id=>document.getElementById(id);
document.body.classList.toggle('embedded',window.self!==window.top);

if(new URLSearchParams(location.search).get('reading')==='long'){
  document.body.classList.add('long-reading');
  document.querySelector('main').hidden=true;
  const viewLink=$('reading-mode');
  viewLink.href='./story-book.html';
  viewLink.removeAttribute('target');
  viewLink.textContent='翻页阅读';
  const story=$('full-story');
  for(const [index,block] of data.blocks.entries()){
    const illustration=data.illustrations.find(item=>item.anchor===index);
    if(illustration){
      const image=document.createElement('img');
      image.src=illustration.src;
      image.alt=illustration.title;
      image.loading='lazy';
      story.append(image);
    }
    const paragraph=document.createElement(index===0?'h1':block.tag);
    paragraph.innerHTML=block.html;
    story.append(paragraph);
  }
  story.hidden=false;
}else{
  initializeBook();
}
function initializeBook(){

const media=matchMedia('(max-width:680px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
let pages=[],chapters=[],at=0,step=media.matches?1:2,busy=false,resizeTimer;
const plain=html=>{const e=document.createElement('div');e.innerHTML=html;return e.textContent;};
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allOriginal=data.blocks.map(b=>plain(b.html)).join('');
const leaf=document.createElement('section');leaf.hidden=true;leaf.setAttribute('aria-hidden','true');$('book').appendChild(leaf);
function shell(page,index){return `<div class="page-content">${page?.html||'<div class="frontispiece"><span class="ornament">✦</span><h2>故事读完了。</h2><p>感谢你走进田田的想象世界。</p><button class="restart">重新翻开</button></div>'}</div><div class="running"><span>${escape(page?.chapter||'钢铁少年')}</span><span>${index<pages.length?String(index+1).padStart(2,'0'):'终'}</span></div>`;}
function render(){at=Math.max(0,Math.min(at,Math.floor((pages.length-1)/step)*step));$('left-page').innerHTML=shell(pages[at],at);$('right-page').innerHTML=shell(pages[at+1],at+1);$('prev').disabled=at===0;$('next').disabled=at+step>=pages.length;$('next').querySelector('span').textContent=at===0?'翻开故事':'下一页';$('page-label').textContent=`${at+1}${step===2&&at+1<pages.length?'—'+(at+2):''} / ${pages.length} 页`;$('page-range').max=pages.length-1;$('page-range').value=at;$('chapters').value=String([...chapters].reverse().find(c=>c.page<=at)?.page||0);document.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>go(Number(b.dataset.chapter)));document.querySelectorAll('.restart').forEach(b=>b.onclick=()=>go(0));window.bookDebug.current=at;}
function go(n,animate=true){if(busy)return;const target=Math.floor(Math.max(0,Math.min(pages.length-1,n))/step)*step;if(target===at)return;const forward=target>at;if(animate&&!reduce.matches){leaf.innerHTML=(step===1?$('left-page'):forward?$('right-page'):$('left-page')).innerHTML;leaf.className='sheet turning-leaf '+(forward?'forward':'backward');leaf.hidden=false;busy=true;setTimeout(()=>{leaf.hidden=true;busy=false;},650);}at=target;render();}
function paginate(){
 const oldIndex=at,oldPage=pages[at],oldAnchor=oldPage?.anchor??-1;const oldNode=document.createElement('div');oldNode.innerHTML=oldPage?.html||'';const oldToken=oldNode.querySelector('[data-source]')?.textContent.slice(0,40)||'';step=media.matches?1:2;pages=[];chapters=[];
 const measure=$('measure'),rect=$('left-page').getBoundingClientRect();measure.style.width=rect.width+'px';measure.style.height=rect.height+'px';measure.innerHTML='<div class="page-content"></div>';const box=measure.firstElementChild;
 let current=[],chapter='钢铁少年',anchor=-1;
 const flush=()=>{if(current.length){pages.push({html:current.join(''),chapter,anchor});current=[];}};
 const fits=parts=>{box.innerHTML=parts.join('');return box.scrollHeight<=box.clientHeight+1;};
 pages.push({html:`<div class="cover"><div class="cover-kicker">田田 · 文学改编作品</div><h2>钢铁少年</h2><img src="${data.illustrations[0].src}" alt="钢铁少年 · 来到盖茨海德"><p>保尔·柯察金在盖茨海德的岁月<br>完整故事 × 15 幅原作分镜</p></div>`,chapter:'封面',anchor:-1});pages.push({html:'',chapter:'目录',anchor:-1});
 for(const [i,b]of data.blocks.entries()){
  const illustration=data.illustrations.find(x=>x.anchor===i);
  if(illustration){if(!current.every(x=>x.startsWith('<h2')))flush();pages.push({html:`<figure class="illustration"><img src="${illustration.src}" alt="${escape(illustration.title)}"><figcaption><small>原作分镜 / ${String(data.illustrations.indexOf(illustration)+1).padStart(2,'0')}—15</small>${escape(illustration.title)}</figcaption></figure>`,chapter,anchor:i,illustration:true});}
  if(b.tag.startsWith('h')){if(i>1)flush();if(i>0){chapter=plain(b.html);chapters.push({name:chapter,page:pages.length});}anchor=i;current.push(`<h2 data-source="${i}">${b.html}</h2>`);continue;}
  if(!current.length)anchor=i;let remaining=plain(b.html);
  while(remaining.length){const markup=`<p data-source="${i}">${escape(remaining)}</p>`;
   if(fits([...current,markup])){current.push(markup);remaining='';}
   else{let lo=0,hi=remaining.length;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(fits([...current,`<p data-source="${i}">${escape(remaining.slice(0,mid))}</p>`]))lo=mid;else hi=mid-1;}
    if(lo<20&&current.length){flush();anchor=i;continue;}if(lo===0)throw Error('阅读窗口过小，无法分页');
    let cut=lo;const punctuation=[...remaining.slice(0,lo).matchAll(/[。！？；，]/g)].at(-1);if(punctuation&&punctuation.index>lo*.7)cut=punctuation.index+1;
    current.push(`<p data-source="${i}">${escape(remaining.slice(0,cut))}</p>`);remaining=remaining.slice(cut);flush();anchor=i;
   }
  }
 }flush();
 pages[1].html=`<div class="frontispiece"><span class="ornament">✦</span><h2>把故事，一页页读下去。</h2><p>同样的遭遇，换一种性格，会走向怎样的人生？</p><div class="chapter-list">${chapters.map(c=>`<button data-chapter="${c.page}">${escape(c.name)} <span>↗</span></button>`).join('')}</div></div>`;
 $('chapters').innerHTML='<option value="0">封面与目录</option>'+chapters.map(c=>`<option value="${c.page}">${escape(c.name)}</option>`).join('');at=oldIndex<2?oldIndex:oldAnchor<0?0:Math.max(0,pages.findIndex(p=>p.anchor>=oldAnchor));
 if(oldIndex>=2&&oldToken){const match=pages.findIndex(p=>!p.illustration&&plain(p.html).includes(oldToken));if(match>=0)at=match;}
 window.bookDebug={ready:true,pages,chapters,current:at,originalText:allOriginal,reconstructedText:pages.slice(2).filter(p=>!p.illustration).map(p=>plain(p.html)).join(''),go:n=>go(n,false)};
 if(window.bookDebug.originalText!==window.bookDebug.reconstructedText)throw Error('正文完整性核对未通过');render();
}
$('next').onclick=()=>go(at+step);$('prev').onclick=()=>go(at-step);$('page-range').oninput=e=>go(Number(e.target.value),false);$('chapters').onchange=e=>go(Number(e.target.value));
addEventListener('keydown',e=>{if(['SELECT','INPUT'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();go(at+step);}if(e.key==='ArrowLeft'){e.preventDefault();go(at-step);}});
let start;const book=$('book');book.addEventListener('touchstart',e=>{if(e.touches.length===1)start={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});book.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(at+(dx<0?step:-step));start=null;},{passive:true});
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(paginate,180);});window.bookDebug={ready:false};document.fonts.ready.then(()=>requestAnimationFrame(paginate));
}
