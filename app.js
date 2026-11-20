const lightbox = document.getElementById('lightbox');
let lastFocus;
document.querySelectorAll('[data-zoom]').forEach(button => {
  button.addEventListener('click', () => {
    lastFocus = button;
    const image = document.getElementById('lightbox-img');
    image.src = button.dataset.zoom;
    image.alt = button.dataset.caption || '';
    document.getElementById('lightbox-caption').textContent = image.alt;
    lightbox.showModal();
    document.body.style.overflow = 'hidden';
  });
});
function closeImage() { lightbox.close(); }
document.getElementById('close-lightbox').addEventListener('click', closeImage);
lightbox.addEventListener('click', event => { if (event.target === lightbox) closeImage(); });
lightbox.addEventListener('close', () => {
  document.body.style.overflow = '';
  lastFocus?.focus({preventScroll:true});
});
const names = ['西班牙甲级联赛','95年传奇','巴塞罗那','皇家马德里','马德里竞技','四城物语','观赛体验'];
let currentSlide = 1;
function selectSlide(n) {
  currentSlide = ((n - 1 + 7) % 7) + 1;
  const number = String(currentSlide).padStart(2, '0');
  const image = document.getElementById('slide-image');
  image.src = `assets/laliga/slide-${number}.webp`;
  image.alt = `第${currentSlide}页：${names[currentSlide-1]}`;
  image.parentElement.dataset.zoom = image.src;
  image.parentElement.dataset.caption = image.alt;
  document.getElementById('slide-count').textContent = number;
  document.getElementById('slide-title').textContent = names[currentSlide-1];
  document.querySelectorAll('.slide-tab').forEach(button => {
    const selected = Number(button.dataset.slide) === currentSlide;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
document.querySelectorAll('.slide-tab').forEach(button => button.addEventListener('click', () => selectSlide(Number(button.dataset.slide))));
document.getElementById('slide-prev')?.addEventListener('click', () => selectSlide(currentSlide - 1));
document.getElementById('slide-next')?.addEventListener('click', () => selectSlide(currentSlide + 1));
document.querySelector('.slides')?.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault(); selectSlide(currentSlide + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
