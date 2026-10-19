'use client';
// Warp intro: streaks rush past, the name punches in through its echoes, then cuts to the hero.
// The streak canvas draws from the scene loop.
// Plays on the first visit only and can't be skipped; the page stays locked until it ends.
import { useEffect, useRef } from 'react';
import { useHome } from './HomeContext';
import s from './Loader.module.css';

const ECHOES = ['5', '4', '3', '2', '1', '0'];
const NAME = <>Etienne<br />Cellier‑Clarke</>;

type Props = { onBoot: () => void; onDone: () => void };

export function Loader({ onBoot, onDone }: Props) {
  const { scene, lite } = useHome();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !root.animate) { onDone(); return; }
    let done = false;
    const timers: number[] = [];
    let stopDraw = () => {};
    const ldAt = (ms: number, fn: () => void) => { timers.push(window.setTimeout(() => { if (!done) fn(); }, ms)); };
    const exit = () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout); stopDraw();
      onDone();
    };

    const introWarp = () => {
      const q = (sel: string) => root.querySelector<HTMLElement>(sel);
      const cv = q('[data-wp-cv]') as HTMLCanvasElement | null, name = q('[data-wp-name]'), front = q('[data-wp-front]'), ink = q('[data-wp-ink]'), edge = q('[data-wp-edge]');
      const meta = q('[data-wp-meta]'), flash = q('[data-wp-flash]'), base = q('[data-ld-base]');
      const echoes = Array.from(root.querySelectorAll<HTMLElement>('[data-wp-echo]'));
      const HIT = 1150, OUT = 2050, t0 = performance.now();
      const ctx = cv && cv.getContext ? cv.getContext('2d') : null;
      if (cv && ctx) {
        const W = root.clientWidth, H = root.clientHeight, dpr = lite ? 1 : Math.min(2, window.devicePixelRatio || 1);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round';
        const NS = lite ? 150 : 340, F = Math.max(W, H) * 0.42, cx = W / 2, cy = H / 2;
        type Star = { x: number; y: number; z: number; a: boolean };
        const spawn = (st: Star, far: boolean) => { st.x = (Math.random() * 2 - 1) * 1.3; st.y = (Math.random() * 2 - 1) * 1.3; st.z = far ? 1.6 + Math.random() * 0.4 : 0.1 + Math.random() * 1.9; return st; };
        const stars = Array.from({ length: NS }, (_, i) => spawn({ x: 0, y: 0, z: 0, a: i % 11 === 0 }, false));
        const speed = (t: number) => {
          if (t < HIT) { const k = Math.max(0, (t - 200) / (HIT - 200)); return 0.12 + 5.2 * k * k * k; }
          if (t < OUT) return 0.12 + 5.2 * Math.exp(-(t - HIT) / 110);
          const u = t - OUT; return 0.12 + 3.6 * Math.min(1, u / 140) * Math.exp(-u / 420);
        };
        let last = t0;
        stopDraw = scene.addTask((now) => {
          if (done) return false;
          const dt = Math.min(0.05, Math.max(0, now - last) / 1000); last = now;
          const sp = speed(now - t0), tr = Math.min(0.09, 0.012 + sp * 0.014);
          ctx.clearRect(0, 0, W, H);
          for (let i = 0; i < NS; i++) {
            const st = stars[i];
            st.z -= sp * dt;
            if (st.z < 0.06) spawn(st, true);
            const x1 = cx + (st.x / st.z) * F, y1 = cy + (st.y / st.z) * F;
            if (x1 < -60 || x1 > W + 60 || y1 < -60 || y1 > H + 60) { spawn(st, true); continue; }
            const z0 = st.z + sp * tr, near = 1 - st.z / 2;
            ctx.globalAlpha = Math.min(1, near * 1.25) * 0.85;
            ctx.strokeStyle = st.a ? '#E8A33A' : '#EDEBE6';
            ctx.lineWidth = 0.4 + near * 1.6;
            ctx.beginPath(); ctx.moveTo(cx + (st.x / z0) * F, cy + (st.y / z0) * F); ctx.lineTo(x1, y1); ctx.stroke();
          }
        });
      }
      if (name) {
        name.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 80, easing: 'ease-out', fill: 'forwards' });
        name.animate([{ transform: 'scale(0.55)' }, { transform: 'scale(1)' }], { duration: HIT - 80, delay: 80, easing: 'cubic-bezier(0.5,0,0.75,0)', fill: 'forwards' });
      }
      echoes.forEach((e) => {
        const j = parseInt(e.getAttribute('data-wp-echo') || '0', 10), sc = 1 - (j + 1) * 0.12, hold = (HIT - 500) / (HIT - 80);
        e.animate([{ opacity: 0 }, { opacity: 0.9 - 0.1 * j }], { duration: 420, delay: 120 + j * 45, easing: 'ease-out', fill: 'forwards' });
        e.animate([{ transform: 'scale(' + sc + ')' }, { transform: 'scale(' + sc + ')', offset: hold, easing: 'cubic-bezier(0.7,0,0.84,0)' }, { transform: 'scale(1)' }], { duration: HIT - 80, delay: 80, fill: 'forwards' });
      });
      ldAt(HIT, () => {
        if (flash) flash.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 620, easing: 'cubic-bezier(0.22,1,0.36,1)' });
        if (name) name.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.035)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(0.22,1,0.36,1)' });
        if (ink) ink.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 640, easing: 'cubic-bezier(0.65,0,0.35,1)', fill: 'forwards' });
        if (edge && front) edge.animate([{ transform: 'translateX(0px)', opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.88 }, { transform: 'translateX(' + front.offsetWidth + 'px)', opacity: 0 }], { duration: 640, easing: 'cubic-bezier(0.65,0,0.35,1)', fill: 'forwards' });
        if (meta) meta.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 280, easing: 'ease-out', fill: 'forwards' });
      });
      ldAt(OUT, () => {
        const bl = (px: number) => (lite ? 'none' : 'blur(' + px + 'px)');
        if (front) front.animate([{ transform: 'none', opacity: 1, filter: bl(0) }, { transform: 'scale(3.4)', opacity: 0, filter: bl(18) }], { duration: 860, easing: 'cubic-bezier(0.55,0,1,0.45)', fill: 'forwards' });
        echoes.forEach((e) => {
          const j = parseInt(e.getAttribute('data-wp-echo') || '0', 10);
          e.animate([{ transform: 'scale(1)', opacity: 0.9 - 0.1 * j }, { opacity: 0.75, offset: 0.35 }, { transform: 'scale(' + (3.2 - j * 0.35) + ')', opacity: 0 }], { duration: 860, delay: j * 35, easing: 'cubic-bezier(0.33,0,0.67,1)', fill: 'forwards' });
        });
        if (meta) meta.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: 'forwards' });
        if (base) base.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 220, easing: 'ease-in-out', fill: 'forwards' });
        if (cv) cv.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 120, easing: 'ease-in-out', fill: 'forwards' });
        ldAt(260, onBoot);
        ldAt(980, exit);
      });
    };

    const start = window.setTimeout(introWarp, 30);
    return () => { done = true; clearTimeout(start); timers.forEach(clearTimeout); stopDraw(); };
  }, [scene, lite, onBoot, onDone]);

  return (
    <div ref={rootRef} data-loader="" className={s.loader} aria-hidden="true">
      <div data-ld-base="" className={s.loader__base} />
      <canvas data-wp-cv="" className={s.loader__canvas} />
      <div data-wp-flash="" className={s.loader__flash} />
      <div className={s.loader__stage}>
        <div data-wp-name="" className={s.loader__name}>
          {ECHOES.map((e) => (
            <div key={e} data-wp-echo={e} className={s.loader__echo}>
              <span className={s.loader__stroke}>{NAME}</span>
              <span className={s.loader__fill}>{NAME}</span>
            </div>
          ))}
          <div data-wp-front="" className={s.loader__front}>
            <span className={`${s.loader__stroke} ${s['loader__stroke--front']}`}>{NAME}</span>
            <span className={s.loader__fill}>{NAME}</span>
            <span data-wp-ink="" className={s.loader__ink}>{NAME}</span>
            <span data-wp-edge="" className={s.loader__edge} />
          </div>
        </div>
      </div>
      <div data-wp-meta="" className={s.loader__meta}>
        <span>Software engineer, Manchester</span>
        <span className={s.loader__status}><span className={s.loader__dot} />Available now</span>
      </div>
    </div>
  );
}
