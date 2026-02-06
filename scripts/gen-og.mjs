import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = process.cwd();

const inLogo = path.join(ROOT, "public", "logo", "logo-light.png");
const outOg = path.join(ROOT, "public", "og.png");

const W = 1200;
const H = 630;

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function setPixel(img, x, y, r, g, b, a = 255) {
  const idx = (W * y + x) << 2;
  img.data[idx + 0] = r;
  img.data[idx + 1] = g;
  img.data[idx + 2] = b;
  img.data[idx + 3] = a;
}

function sampleBilinear(src, sx, sy) {
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(src.width - 1, x0 + 1);
  const y1 = Math.min(src.height - 1, y0 + 1);
  const tx = sx - x0;
  const ty = sy - y0;

  function px(x, y) {
    const i = (src.width * y + x) << 2;
    return [
      src.data[i + 0],
      src.data[i + 1],
      src.data[i + 2],
      src.data[i + 3],
    ];
  }

  const p00 = px(x0, y0);
  const p10 = px(x1, y0);
  const p01 = px(x0, y1);
  const p11 = px(x1, y1);

  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c += 1) {
    const a0 = p00[c] * (1 - tx) + p10[c] * tx;
    const a1 = p01[c] * (1 - tx) + p11[c] * tx;
    out[c] = a0 * (1 - ty) + a1 * ty;
  }
  return out;
}

function blendOver(dst, x, y, r, g, b, a) {
  // alpha in [0..255]
  const idx = (W * y + x) << 2;
  const da = dst.data[idx + 3] / 255;
  const sa = a / 255;
  const oa = sa + da * (1 - sa);
  if (oa <= 0) return;

  const dr = dst.data[idx + 0] / 255;
  const dg = dst.data[idx + 1] / 255;
  const db = dst.data[idx + 2] / 255;

  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;

  const or = (sr * sa + dr * da * (1 - sa)) / oa;
  const og = (sg * sa + dg * da * (1 - sa)) / oa;
  const ob = (sb * sa + db * da * (1 - sa)) / oa;

  dst.data[idx + 0] = Math.round(or * 255);
  dst.data[idx + 1] = Math.round(og * 255);
  dst.data[idx + 2] = Math.round(ob * 255);
  dst.data[idx + 3] = Math.round(oa * 255);
}

function main() {
  if (!fs.existsSync(inLogo)) {
    console.error(`Missing input logo: ${inLogo}`);
    process.exit(1);
  }

  const src = PNG.sync.read(fs.readFileSync(inLogo));
  const out = new PNG({ width: W, height: H });

  // Background gradient + subtle vignette.
  for (let y = 0; y < H; y += 1) {
    const tY = y / (H - 1);
    for (let x = 0; x < W; x += 1) {
      const tX = x / (W - 1);

      const top = [8, 12, 20];
      const bottom = [9, 18, 30];
      const base = [
        lerp(top[0], bottom[0], tY),
        lerp(top[1], bottom[1], tY),
        lerp(top[2], bottom[2], tY),
      ];

      // Add a soft light toward top-left to keep the logo readable.
      const dx = (tX - 0.18) * 1.6;
      const dy = (tY - 0.20) * 1.6;
      const glow = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));

      // Vignette
      const vx = (tX - 0.5) * 1.2;
      const vy = (tY - 0.55) * 1.2;
      const vig = Math.min(1, Math.sqrt(vx * vx + vy * vy));

      const r = Math.min(255, Math.round(base[0] + glow * 18 - vig * 18));
      const g = Math.min(255, Math.round(base[1] + glow * 20 - vig * 18));
      const b = Math.min(255, Math.round(base[2] + glow * 28 - vig * 18));
      setPixel(out, x, y, Math.max(0, r), Math.max(0, g), Math.max(0, b), 255);
    }
  }

  // Place logo centered-left with padding; keep it smaller so previews look clean.
  const targetW = 520;
  const scale = targetW / src.width;
  const targetH = Math.round(src.height * scale);

  const destX0 = 96;
  const destY0 = Math.round((H - targetH) / 2) - 10;

  for (let y = 0; y < targetH; y += 1) {
    for (let x = 0; x < targetW; x += 1) {
      const sx = x / scale;
      const sy = y / scale;
      const [r, g, b, a] = sampleBilinear(src, sx, sy);
      const dx = destX0 + x;
      const dy = destY0 + y;
      if (dx < 0 || dx >= W || dy < 0 || dy >= H) continue;
      if (a < 2) continue;
      blendOver(out, dx, dy, r, g, b, a);
    }
  }

  fs.writeFileSync(outOg, PNG.sync.write(out));
  console.log(`Wrote ${outOg}`);
}

main();

