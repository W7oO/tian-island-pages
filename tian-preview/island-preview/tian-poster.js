import qrcode from './vendor/qrcode/qrcode.mjs';

const font = '"Helvetica Neue","PingFang SC","Microsoft YaHei",Arial,sans-serif';
const asset = name => new URL('../assets/' + name, import.meta.url);
const images = new Map();

function loadImage(url) {
  const key = String(url);
  if (!images.has(key)) {
    images.set(key, new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        images.delete(key);
        reject(new Error('海报图片加载失败'));
      };
      image.src = key;
    }));
  }
  return images.get(key);
}

function contain(ctx, image, x, y, width, height) {
  const scale = Math.min(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
}

export async function renderTianPoster(url, title, scope) {
  const code = qrcode(0, 'M');
  code.addData(url);
  code.make();
  const [scene, mark, contact] = await Promise.all([
    loadImage(asset('share-island-scene.webp')),
    loadImage(new URL('./assets/course-mark.svg', import.meta.url)),
    loadImage(asset('weiguang-qr.png')),
    document.fonts.ready,
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f0e7';
  ctx.fillRect(0, 0, 1200, 1600);
  const wash = ctx.createLinearGradient(0, 0, 1200, 1030);
  wash.addColorStop(0, '#e1e9da');
  wash.addColorStop(1, '#f5f0e700');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 1200, 1600);

  ctx.drawImage(mark, 72, 64, 44, 44);
  ctx.fillStyle = '#42635e';
  ctx.font = '400 30px ' + font;
  ctx.fillText('AI思维训练', 128, 100);
  ctx.font = '400 26px ' + font;
  ctx.fillText('第一阶段学习汇报', 80, 148);
  ctx.fillStyle = '#254742';
  ctx.font = '550 94px ' + font;
  ctx.fillText('田田的创作小岛', 80, 305, 1040);
  ctx.font = '400 36px ' + font;
  if (title) ctx.fillText(title, 84, 377, 1032);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(40, 433, 1120, 535, 22);
  ctx.clip();
  ctx.drawImage(scene, 0, 55, scene.width, scene.height - 110, 40, 433, 1120, 535);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#42635e';
  ctx.font = '400 38px ' + font;
  ctx.fillText('从兴趣出发，让想法经得起探索与检验。', 600, 1050);

  const modules = code.getModuleCount();
  const cell = Math.floor(224 / (modules + 8));
  const offset = 488 + Math.floor((224 - cell * modules) / 2);
  const top = 1148 + Math.floor((224 - cell * modules) / 2);
  ctx.fillStyle = '#fff';
  ctx.fillRect(488, 1148, 224, 224);
  ctx.fillStyle = '#142822';
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (code.isDark(row, col)) ctx.fillRect(offset + col * cell, top + row * cell, cell, cell);
    }
  }
  ctx.imageSmoothingEnabled = false;
  contain(ctx, contact, 968, 1320, 160, 160);
  ctx.fillStyle = '#345751';
  ctx.font = '500 32px ' + font;
  ctx.fillText('扫码查看', 600, 1414);
  ctx.font = '400 24px ' + font;
  ctx.fillText(scope, 600, 1450);
  ctx.font = '400 26px ' + font;
  ctx.fillText('扫码预约试听', 1048, 1516);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('无法导出海报')), 'image/png');
  });
}
