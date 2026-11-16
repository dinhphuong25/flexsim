const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 1. Chuẩn bị bảng CRC32
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, getPixelRgba) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixelRgba(x, y);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIcoFromPng(pngBuffer, width, height) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(1, 4); // 1 image
  header.writeUInt8(width >= 256 ? 0 : width, 6);
  header.writeUInt8(height >= 256 ? 0 : height, 7);
  header.writeUInt8(0, 8); // color count
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(pngBuffer.length, 14); // image size
  header.writeUInt32LE(22, 18); // offset
  return Buffer.concat([header, pngBuffer]);
}

// Hàm vẽ biểu tượng Nhóm 2 (máy may & teal gradient)
function getIconPixel(x, y, size) {
  const nx = x / size;
  const ny = y / size;

  // Squircle rounded corners
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  const dist = Math.pow(Math.abs(cx * 2), 4) + Math.pow(Math.abs(cy * 2), 4);
  if (dist > 1.05) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Border highlight
  const isBorder = dist > 0.88;

  // Background teal gradient
  let r = Math.round(13 + nx * 5 + (1 - ny) * 20);
  let g = Math.round(148 - ny * 60 + nx * 20);
  let b = Math.round(136 - ny * 70);

  if (isBorder) {
    return [45, 212, 191, 255]; // Teal border
  }

  // Sewing machine drawing
  // 1. Bedplate (chân đế máy)
  if (nx >= 0.16 && nx <= 0.84 && ny >= 0.72 && ny <= 0.80) {
    return [248, 250, 252, 255]; // Trắng bạc
  }

  // 2. Cột đứng bên phải (Column)
  if (nx >= 0.62 && nx <= 0.76 && ny >= 0.38 && ny <= 0.74) {
    return [255, 255, 255, 255];
  }

  // 3. Tay đòn trên (Arm)
  if (nx >= 0.28 && nx <= 0.76 && ny >= 0.30 && ny <= 0.44) {
    return [255, 255, 255, 255];
  }

  // 4. Đầu máy may (Head)
  if (nx >= 0.26 && nx <= 0.38 && ny >= 0.30 && ny <= 0.58) {
    return [255, 255, 255, 255];
  }

  // 5. Kim may & chân vịt
  if (nx >= 0.31 && nx <= 0.33 && ny >= 0.58 && ny <= 0.72) {
    return [56, 189, 248, 255]; // Xanh điện cyan
  }

  // 6. Bánh đà bên phải (Handwheel)
  if (nx >= 0.76 && nx <= 0.82 && ny >= 0.34 && ny <= 0.54) {
    return [203, 213, 225, 255];
  }

  // 7. Cuộn chỉ vàng phía trên (Golden Thread Spool)
  if (nx >= 0.66 && nx <= 0.72 && ny >= 0.18 && ny <= 0.28) {
    return [245, 158, 11, 255]; // Hổ phách hoàng kim
  }

  // 8. Cọc cắm chỉ
  if (nx >= 0.68 && nx <= 0.70 && ny >= 0.14 && ny <= 0.30) {
    return [255, 255, 255, 255];
  }

  return [r, g, b, 255];
}

// 2. Tạo file SVG Vector
const SVG_CONTENT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0d9488" />
      <stop offset="60%" stop-color="#0f766e" />
      <stop offset="100%" stop-color="#042f2e" />
    </linearGradient>
    <linearGradient id="metalBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="70%" stop-color="#f8fafc" />
      <stop offset="100%" stop-color="#e2e8f0" />
    </linearGradient>
    <linearGradient id="goldSpool" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#022c22" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Squircle -->
  <rect x="24" y="24" width="464" height="464" rx="108" fill="url(#bgGrad)" stroke="#5eead4" stroke-width="8" filter="url(#shadow)" />

  <!-- Ambient Light Reflection -->
  <ellipse cx="256" cy="110" rx="180" ry="70" fill="#ffffff" opacity="0.08" />

  <!-- Sewing Machine Emblem -->
  <g transform="translate(68, 64) scale(8.5)">
    <!-- Bedplate -->
    <rect x="5" y="34" width="34" height="4.5" rx="2.25" fill="#f8fafc" />
    <rect x="12" y="33" width="9" height="1.8" rx="0.9" fill="#cbd5e1" />

    <!-- Machine Arm & Body -->
    <path
      d="M 29 34 
         L 29 20 
         C 29 17.5, 30.5 16, 32.5 16 
         L 35.5 16 
         C 36.5 16, 37 15, 37 14 
         C 37 12.5, 35.5 11, 34 11 
         L 15 11 
         C 12.5 11, 10.5 13, 10.5 15.5 
         L 10.5 24 
         C 10.5 25.5, 11.8 26.8, 13.5 26.8 
         L 18 26.8 
         C 19.5 26.8, 20.5 25.5, 20.5 24 
         L 20.5 21 
         C 20.5 19, 21.8 17.5, 24 17.5 
         L 26.5 17.5 
         C 28 17.5, 29 18.5, 29 20 
         L 29 34 
         Z"
      fill="url(#metalBody)"
      stroke="#0f766e"
      stroke-width="0.8"
    />

    <!-- Handwheel on Right -->
    <rect x="35" y="14" width="2.8" height="10" rx="1.4" fill="#cbd5e1" stroke="#94a3b8" stroke-width="0.5" />
    <line x1="36.4" y1="16.5" x2="36.4" y2="21.5" stroke="#475569" stroke-width="1" stroke-linecap="round" />

    <!-- Golden Spool on Top -->
    <line x1="31" y1="5.5" x2="31" y2="11" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <rect x="29" y="5.5" width="4" height="4.8" rx="1.2" fill="url(#goldSpool)" stroke="#78350f" stroke-width="0.5" />

    <!-- Take-up lever -->
    <circle cx="12" cy="8.5" r="1.6" fill="#38bdf8" />
    <path d="M 12 8.5 L 14 11" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round" />

    <!-- Needle Bar & Presser Foot -->
    <line x1="14" y1="26.8" x2="14" y2="34" stroke="#cbd5e1" stroke-width="1.5" />
    <path d="M 12.5 33 L 15.5 33" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
    <line x1="15" y1="26.8" x2="15" y2="33.5" stroke="#38bdf8" stroke-width="0.8" />
  </g>

  <!-- Bottom Brand Text Badge -->
  <rect x="156" y="408" width="200" height="48" rx="24" fill="#042f2e" stroke="#2dd4bf" stroke-width="3" />
  <text x="256" y="440" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="3">NHÓM 2</text>
</svg>`;

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

console.log('1. Writing public/icon.svg...');
fs.writeFileSync(path.join(PUBLIC_DIR, 'icon.svg'), SVG_CONTENT);
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.svg'), SVG_CONTENT);

console.log('2. Generating PNG icons (32x32, 180x180, 192x192, 512x512)...');
const png32 = createPng(32, 32, (x, y) => getIconPixel(x, y, 32));
const png180 = createPng(180, 180, (x, y) => getIconPixel(x, y, 180));
const png192 = createPng(192, 192, (x, y) => getIconPixel(x, y, 192));
const png512 = createPng(512, 512, (x, y) => getIconPixel(x, y, 512));

fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-32.png'), png32);
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-192.png'), png192);
fs.writeFileSync(path.join(PUBLIC_DIR, 'icon-512.png'), png512);

console.log('3. Generating public/favicon.ico...');
const ico = createIcoFromPng(png32, 32, 32);
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), ico);

// Đồng thời lưu vào src/app/favicon.ico để Next.js tự động nhận diện nếu truy cập trực tiếp
const APP_DIR = path.join(__dirname, '..', 'src', 'app');
fs.writeFileSync(path.join(APP_DIR, 'favicon.ico'), ico);

console.log('4. Checking Open Graph Banner (1200x630)...');
const ogImagePath = path.join(PUBLIC_DIR, 'og-image.png');
if (!fs.existsSync(ogImagePath)) {
  console.log('Generating fallback Open Graph Banner...');
  const ogPng = createPng(1200, 630, getOgPixel);
  fs.writeFileSync(ogImagePath, ogPng);
} else {
  console.log('High-resolution Open Graph Banner already exists. Skipping overwrite.');
}

console.log('5. Generating public/manifest.json...');
const manifest = {
  name: 'Nhóm 2 — Quản Trị Chuyền May & Mô Phỏng FlexSim',
  short_name: 'Nhóm 2 FlexSim',
  description: 'Website quản trị số liệu chuyền may 27 công đoạn, kết nối FlexSim 2027, nghiệm thu 5.500 sản phẩm tại May Việt Thành.',
  start_url: '/',
  display: 'standalone',
  background_color: '#0f172a',
  theme_color: '#0d9488',
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/icon.svg',
      sizes: 'any',
      type: 'image/svg+xml'
    }
  ]
};
fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('Brand identity assets generated successfully!');
