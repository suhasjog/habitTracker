const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; ihdrData[9] = 2; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0;
    for (let x = 0; x < width; x++) {
      const pi = (y * width + x) * 4;
      const ri = y * (1 + width * 3) + 1 + x * 3;
      rawData[ri] = pixels[pi]; rawData[ri+1] = pixels[pi+1]; rawData[ri+2] = pixels[pi+2];
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])) >>> 0, 0);
  return Buffer.concat([len, typeB, data, crc]);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); crcTable[n] = c; }
function crc32(buf) { let crc = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8); return crc ^ 0xFFFFFFFF; }

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2-x1, dy = y2-y1, lenSq = dx*dx+dy*dy;
  let t = Math.max(0, Math.min(1, ((px-x1)*dx+(py-y1)*dy)/lenSq));
  const ddx = px-(x1+t*dx), ddy = py-(y1+t*dy);
  return Math.sqrt(ddx*ddx+ddy*ddy);
}

function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = Math.floor(size * 0.15);
  const margin = Math.floor(size * 0.02);
  const bx0 = margin, by0 = margin, bx1 = size-1-margin, by1 = size-1-margin;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let inside = (x >= bx0 && x <= bx1 && y >= by0 && y <= by1);
      if (inside) {
        const corners = [[bx0+radius,by0+radius],[bx1-radius,by0+radius],[bx0+radius,by1-radius],[bx1-radius,by1-radius]];
        const regions = [x<bx0+radius&&y<by0+radius, x>bx1-radius&&y<by0+radius, x<bx0+radius&&y>by1-radius, x>bx1-radius&&y>by1-radius];
        for (let c = 0; c < 4; c++) {
          if (regions[c]) { const dx=x-corners[c][0], dy=y-corners[c][1]; if(dx*dx+dy*dy>radius*radius) inside=false; }
        }
      }
      if (!inside) { pixels[i]=240; pixels[i+1]=240; pixels[i+2]=245; pixels[i+3]=255; continue; }

      const nx = x/size, ny = y/size, thick = 0.06;
      const d1 = distToSeg(nx, ny, 0.25, 0.50, 0.42, 0.67);
      const d2 = distToSeg(nx, ny, 0.42, 0.67, 0.77, 0.32);
      if (d1 < thick || d2 < thick) { pixels[i]=255; pixels[i+1]=255; pixels[i+2]=255; }
      else { pixels[i]=108; pixels[i+1]=99; pixels[i+2]=255; }
      pixels[i+3] = 255;
    }
  }
  return pixels;
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
for (const size of [192, 512]) {
  console.log('Generating ' + size + 'x' + size + '...');
  const png = createPNG(size, size, drawIcon(size));
  const out = path.join(outDir, 'icon-' + size + '.png');
  fs.writeFileSync(out, png);
  console.log('  ' + out + ' (' + png.length + ' bytes)');
}
console.log('Done!');
