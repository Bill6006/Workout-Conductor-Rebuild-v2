/**
 * Generates the PWA icon set from an original vector definition.
 *
 * Written as a dependency-free PNG encoder on purpose: no binary image
 * toolchain, no third-party artwork, and the mark is reproducible from source.
 * The geometry matches src/components/Brand/Logo.tsx - three ascending bars.
 *
 *   node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'icons');

/* ---------------------------------------------------------------- palette */

const LIME = [201, 249, 88];
const INK = [11, 12, 14];
const CHARCOAL = [22, 24, 28];

/* ------------------------------------------------------------------- PNG */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/** Encode straight RGBA bytes as a PNG buffer. */
function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  header[10] = 0; // deflate
  header[11] = 0; // adaptive filtering
  header[12] = 0; // no interlace

  // One filter byte (0 = None) per scanline.
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------------------------------------------------------- drawing */

/** Point-in-rounded-rectangle test, in whatever units the caller is using. */
function insideRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false;
  const cx = Math.max(x + r, Math.min(px, x + w - r));
  const cy = Math.max(y + r, Math.min(py, y + h - r));
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r + 1e-9;
}

/** The mark, in a 32x32 design space. Mirrors the React Logo component. */
const BARS = [
  { x: 6.5, y: 19, w: 5, h: 7, r: 2.5, alpha: 0.35 },
  { x: 13.5, y: 13, w: 5, h: 13, r: 2.5, alpha: 0.62 },
  { x: 20.5, y: 6, w: 5, h: 20, r: 2.5, alpha: 1 },
];

function mix(base, top, alpha) {
  return [
    Math.round(base[0] + (top[0] - base[0]) * alpha),
    Math.round(base[1] + (top[1] - base[1]) * alpha),
    Math.round(base[2] + (top[2] - base[2]) * alpha),
  ];
}

/**
 * @param {number} size output edge length in px
 * @param {{shape: 'rounded'|'full', contentScale: number, background: number[], foreground: number[]}} options
 */
function renderIcon(size, { shape, contentScale, background, foreground }) {
  const SS = 4; // 4x4 supersampling for clean curves
  const rgba = Buffer.alloc(size * size * 4);
  const unit = size / 32;
  const bgRadius = shape === 'rounded' ? 7.2 * unit : 0;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let covered = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;

          const onBackground =
            shape === 'full' || insideRoundedRect(x, y, 0, 0, size, size, bgRadius);
          if (!onBackground) continue;

          // Design-space coordinate for the (optionally scaled) mark.
          const dx = (x - size / 2) / (unit * contentScale) + 16;
          const dy = (y - size / 2) / (unit * contentScale) + 16;

          let colour = background;
          for (const bar of BARS) {
            if (insideRoundedRect(dx, dy, bar.x, bar.y, bar.w, bar.h, bar.r)) {
              colour = mix(background, foreground, bar.alpha);
              break;
            }
          }

          rSum += colour[0];
          gSum += colour[1];
          bSum += colour[2];
          covered += 1;
        }
      }

      const samples = SS * SS;
      const idx = (py * size + px) * 4;
      if (covered > 0) {
        // Average only the covered samples so antialiased edges keep their hue
        // instead of darkening toward black.
        rgba[idx] = Math.round(rSum / covered);
        rgba[idx + 1] = Math.round(gSum / covered);
        rgba[idx + 2] = Math.round(bSum / covered);
      }
      rgba[idx + 3] = Math.round((covered / samples) * 255);
    }
  }

  return encodePng(size, size, rgba);
}

/* ------------------------------------------------------------------ SVG */

function renderFaviconSvg() {
  const bars = BARS.map((bar) => {
    const rgb = mix(LIME, INK, bar.alpha);
    const fill = `rgb(${rgb.join(',')})`;
    return `  <rect x="${bar.x}" y="${bar.y}" width="${bar.w}" height="${bar.h}" rx="${bar.r}" fill="${fill}" />`;
  }).join('\n');

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Workout Conductor">',
    `  <rect width="32" height="32" rx="7.2" fill="rgb(${LIME.join(',')})" />`,
    bars,
    '</svg>',
    '',
  ].join('\n');
}

/* ------------------------------------------------------------------ main */

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  {
    file: 'icon-192.png',
    size: 192,
    options: { shape: 'rounded', contentScale: 1.12, background: LIME, foreground: INK },
  },
  {
    file: 'icon-512.png',
    size: 512,
    options: { shape: 'rounded', contentScale: 1.12, background: LIME, foreground: INK },
  },
  {
    // Maskable icons get cropped; keep the mark inside the safe zone.
    file: 'maskable-512.png',
    size: 512,
    options: { shape: 'full', contentScale: 0.94, background: LIME, foreground: INK },
  },
  {
    file: 'apple-touch-icon.png',
    size: 180,
    options: { shape: 'full', contentScale: 1.12, background: LIME, foreground: INK },
  },
  {
    // Dark chip variant, matching the in-app header lockup.
    file: 'icon-dark-512.png',
    size: 512,
    options: { shape: 'rounded', contentScale: 1.12, background: CHARCOAL, foreground: LIME },
  },
];

for (const target of targets) {
  const png = renderIcon(target.size, target.options);
  writeFileSync(join(OUT_DIR, target.file), png);
  console.log(`  ${target.file.padEnd(24)} ${target.size}x${target.size}  ${png.length} bytes`);
}

writeFileSync(join(OUT_DIR, 'favicon.svg'), renderFaviconSvg(), 'utf8');
console.log(`  ${'favicon.svg'.padEnd(24)} vector`);
console.log('\nIcons generated from scripts/generate-icons.mjs (original artwork).');
