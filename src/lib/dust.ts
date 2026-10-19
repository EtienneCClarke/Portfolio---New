// Dust particle field, drawn once per frame by the scene loop.
import { clamp } from './motion';

export type DustFrame = {
  fade: number; // 0..1, the field fades out as the footer opens and while the loader runs
  warp: number; // extra speed during depth transitions and echo fly-throughs
  odd: boolean; // lite mode skips every other frame when the field is slow
  mask: (ctx: CanvasRenderingContext2D, W: number, H: number) => void;
};

export function createDust(cv: HTMLCanvasElement, lite: boolean) {
  const dctx = cv.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, lite ? 1 : 1.5), NUM = lite ? 155 : 310;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: NUM }, () => ({ x: rnd() * 2 - 1, y: rnd() * 2 - 1, z: 0.08 + rnd() * 0.92, amb: rnd() < 0.2, px: 0, py: 0, ok: false }));
  const D = { W: 0, H: 0, sp: 0.035, v: 0, lastY: window.scrollY, lastT: performance.now(), on: false };

  const resize = () => {
    if (!dctx) return;
    D.W = window.innerWidth; D.H = window.innerHeight;
    cv.width = Math.round(D.W * DPR); cv.height = Math.round(D.H * DPR);
    dctx.setTransform(DPR, 0, 0, DPR, 0, 0); dctx.lineCap = 'round';
    stars.forEach((s) => { s.ok = false; });
  };
  resize();

  const draw = (now: number, f: DustFrame) => {
    if (!dctx) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - D.lastT) / 1000)); D.lastT = now;
    const y = window.scrollY, vel = (y - D.lastY) / Math.max(1, D.H) / dt; D.lastY = y;
    D.v = D.v + (vel - D.v) * 0.25;
    D.sp += (0.035 + Math.max(-2.2, Math.min(2.2, D.v * 0.55)) + f.warp * 1.4 - D.sp) * 0.08;
    const fade = f.fade;
    if (fade <= 0.01) { if (D.on) { dctx.clearRect(0, 0, D.W, D.H); D.on = false; } return; }
    if (lite && Math.abs(D.sp) < 0.08 && f.odd) return;
    D.on = true;
    dctx.clearRect(0, 0, D.W, D.H);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= D.sp * dt * 0.5;
      if (s.z < 0.06 || s.z > 1) { s.z += s.z < 0.06 ? 0.94 : -0.94; s.x = rnd() * 2 - 1; s.y = rnd() * 2 - 1; s.ok = false; }
    }
    const cx = D.W / 2, cy = D.H * 0.48, fl = Math.max(D.W, D.H) * 0.42, sk = clamp((Math.abs(D.sp) - 0.2) / 0.9);
    for (let layer = 0; layer < 2; layer++) {
      if (layer === 1) f.mask(dctx, D.W, D.H);
      for (let pass = 0; pass < 2; pass++) {
        dctx.fillStyle = dctx.strokeStyle = pass ? 'rgb(232,163,58)' : 'rgb(237,235,230)';
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          if (s.amb !== (pass === 1)) continue;
          if ((s.z < 0.2) !== (layer === 1)) continue;
          const sx = cx + (s.x * fl) / s.z, sy = cy + (s.y * fl) / s.z;
          const near = clamp((0.22 - s.z) / 0.16);
          const a = clamp((1 - s.z) / 0.3) * clamp((s.z - 0.06) / 0.08) * (pass ? 0.75 : 0.5) * (1 - 0.55 * near) * fade;
          const r = 0.5 + 1.3 * (1 - s.z) + near * 3;
          if (a > 0.01 && sx > -20 && sx < D.W + 20 && sy > -20 && sy < D.H + 20) {
            dctx.globalAlpha = a;
            if (r < 1.3) dctx.fillRect(sx - r / 2, sy - r / 2, r, r);
            else { dctx.beginPath(); dctx.arc(sx, sy, r / 2, 0, 6.2832); dctx.fill(); }
            if (sk > 0.02 && s.ok) {
              const dx = sx - s.px, dy = sy - s.py;
              const len = Math.hypot(dx, dy) * (1.5 + 2.5 * sk);
              if (len > 0.5) {
                const kk = Math.min(len, 140) / Math.max(0.001, Math.hypot(dx, dy));
                dctx.globalAlpha = a * (0.3 + 0.5 * sk);
                dctx.lineWidth = Math.max(0.9, r * 0.75);
                dctx.beginPath(); dctx.moveTo(sx - dx * kk, sy - dy * kk); dctx.lineTo(sx, sy); dctx.stroke();
              }
            }
          }
          s.px = sx; s.py = sy; s.ok = true;
        }
      }
    }
    dctx.globalAlpha = 1;
  };

  return { resize, draw };
}
