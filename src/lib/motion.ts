// Easing helpers, scroll constants and the hero camera path.

export const INK = '#EDEBE6', MUT = '#A3A19C', FNT = '#85837E', DIM = '#5A5A57', DIML = '#3E3F3D', AMB = '#E8A33A';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const eOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const eSine = (x: number) => (1 - Math.cos(Math.PI * x)) / 2;
export const eInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eSmooth = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
export const herm = (t: number, z0: number, m0: number, z1: number, m1: number, L: number) => {
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * z0 + (t3 - 2 * t2 + t) * L * m0 + (3 * t2 - 2 * t3) * z1 + (t3 - t2) * L * m1;
};

export const HERO_VH = 1250, HVC = 1.15 / 86, HZ2 = 5.75 + 80 * 0.00965;
export const SVC_SEG = 148, SVC_S1 = SVC_SEG + 80, SVC_LAND = SVC_S1 + 3 * SVC_SEG, SVC_VH = 100 + SVC_LAND + 288;
export const CS_LEAD = 0.4, CS_WIN = 1 + CS_LEAD, CS_D = 1000;

export const heroCam = (s: number, a: number, spread: number) => {
  if (s < 250) return -(1.5 + 0.55 * spread) * a;
  if (s < 378) return herm((s - 250) / 128, -2.05, 0, 0, HVC, 128);
  if (s < 808) return HVC * (s - 378);
  if (s < 888) return herm((s - 808) / 80, 5.75, HVC, HZ2, 0.0022, 80);
  return HZ2 + 0.0022 * (s - 888);
};

// Layout switches.
export const isDesk = (w: number, h: number) => w >= 1100 || (w >= 900 && w > h * 1.1);
// Case studies keep the desktop arrangement (side-by-side media, fact cards) only above tablet widths.
export const isCaseWide = (w: number, h: number) => isDesk(w, h) && w > 1024;
export const isStage = (w: number, h: number, rm: boolean) => w >= 340 && h >= 460 && !rm;
