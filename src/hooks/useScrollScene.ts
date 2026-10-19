'use client';
// The page's motion engine.
// One requestAnimationFrame loop drives Lenis, every scroll scene, the dust field, cursor, tilt and magnets.
// DOM lookups are cached per React commit (qa); writes are compositor-only and skipped when unchanged.
import Lenis from 'lenis';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { KeyboardEvent as RKeyboardEvent, MouseEvent as RMouseEvent, PointerEvent as RPointerEvent } from 'react';
import { CONFIG, SERVICES } from '@/content/home';
import { createDust } from '@/lib/dust';
import {
  AMB, CS_D, CS_LEAD, CS_WIN, HERO_VH, SVC_LAND, SVC_S1, SVC_SEG, SVC_VH,
  clamp, eInOut, eOut, eSine, eSmooth, herm, heroCam, isCaseWide, isDesk, isStage,
} from '@/lib/motion';
import { BOXE_STEPS } from '@/lib/scene-data';

/* eslint-disable @typescript-eslint/no-explicit-any */
type N = HTMLElement & { [k: string]: any };
type Task = (now: number) => boolean | void; // return false to stop

export type SceneView = { w: number; h: number; touch: boolean; rm: boolean; lite: boolean; loaderOn: boolean };
export type SceneEnv = SceneView & { booted: boolean };
export type SceneHost = { setViewport: (w: number, h: number) => void; setEnv: (env: SceneEnv) => void };

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export class Scene {
  host: SceneHost;
  st: SceneView = { w: 1440, h: 900, touch: false, rm: false, lite: false, loaderOn: true };
  rm = false; touch = false; lite = false;
  mounted = false; introOn = false;
  qv = 0; ids: Record<string, HTMLElement | null> = {}; idsV = -1;
  raf = 0; tasks = new Set<Task>(); needTick = true; lastY = -1;
  lenis: Lenis | null = null;
  fx = false; fxTick = 0; fxDirty = false;
  cp = 0; cpPainted = -1; cEls: { layer: N; inner: N; words: N[] } | null = null;
  warpAt = 0; warpV = 0;
  sw: { x: number; y: number } | null = null;
  tilts = new Set<N>(); tiltEl: N | null = null;
  svcLit: N | null = null; svcCovered = false;
  wipeManual: number | null = null; wipeRel: { from: number; t: number } | null = null;
  hoverNode: number | null = null; pinNode: number | null = null;
  phase = 'profile'; focusAt = 0;
  keepOn = false; keepY: number | null = null; keepT: ReturnType<typeof setTimeout> | null = null; keepAnim: Animation | null = null;
  sbAm: boolean | undefined; mbShow = false;
  pillOpen: boolean | undefined; pillW: number | null = null; pillHover = false; pillTap: number | null = null;
  pillHT: ReturnType<typeof setTimeout> | undefined; pillRO: ResizeObserver | null = null;
  topZone = false; topT: ReturnType<typeof setTimeout> | undefined;
  occCache: N[] | null = null; occAt = 0;
  magLive = false;
  dust: ReturnType<typeof createDust> | null = null;
  m = { x: -100, y: -100, rx: -100, ry: -100, seen: false, dirty: false };
  at = { ax: 0.7, ay: 0.3, bx: 0.25, by: 0.75, r: 0 };
  ro: ResizeObserver | null = null;
  off: (() => void)[] = [];
  fine = false;

  constructor(host: SceneHost) { this.host = host; }

  // ---- React bridge ----
  commit(view: SceneView) {
    this.st = view;
    this.qv++; this.occCache = null; this.pillW = null;
    if (!this.mounted) return;
    this.syncLenis();
    this.frame();
  }

  mount() {
    if (this.mounted) return;
    this.mounted = true;
    const mq = (q: string) => window.matchMedia(q).matches;
    this.rm = mq('(prefers-reduced-motion: reduce)');
    this.touch = mq('(pointer: coarse)');
    const pm = CONFIG.perfMode;
    const nav = navigator as Navigator & { deviceMemory?: number };
    this.lite = pm !== 'auto' ? pm === 'lite' : this.touch || (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4;
    // The inline script in layout.tsx has already decided whether the intro plays (first visit only).
    const loaderOn = !this.rm && document.documentElement.classList.contains('ecc-intro');
    this.introOn = loaderOn;
    if (loaderOn) window.scrollTo(0, 0);
    this.host.setEnv({ w: window.innerWidth, h: window.innerHeight, touch: this.touch, rm: this.rm, lite: this.lite, loaderOn, booted: !loaderOn });

    this.listen(window, 'resize', this.onResize);
    this.listen(document, 'focusin', this.onFocus);
    this.listen(document, 'pointermove', this.onTopZone, { passive: true });
    if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this.onResize()); this.ro.observe(document.documentElement); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (this.mounted) { this.pillW = null; this.fxBar(window.innerHeight); } });
    const sync = () => { if (this.mounted && (window.innerWidth !== this.st.w || window.innerHeight !== this.st.h)) this.host.setViewport(window.innerWidth, window.innerHeight); };
    requestAnimationFrame(sync); const sT = setTimeout(sync, 300); this.off.push(() => clearTimeout(sT));
    this.syncLenis();
    if (this.introOn && this.lenis) this.lenis.stop();
    if (!this.rm) this.startFx();
    this.raf = requestAnimationFrame(this.loop);
  }

  // The intro has finished: remember the visit and hand scrolling back.
  endIntro() {
    if (!this.introOn) return;
    this.introOn = false;
    try { localStorage.setItem('ecc-intro', '1'); } catch { /* storage blocked: the intro plays again next visit */ }
    const html = document.documentElement;
    html.classList.remove('ecc-intro'); html.classList.add('ecc-no-intro');
    if (this.lenis) this.lenis.start();
    this.needTick = true;
  }

  destroy() {
    this.mounted = false;
    cancelAnimationFrame(this.raf);
    this.off.forEach((f) => f()); this.off = [];
    this.tasks.clear();
    if (this.ro) this.ro.disconnect();
    if (this.pillRO) { this.pillRO.disconnect(); this.pillRO = null; }
    clearTimeout(this.topT); clearTimeout(this.pillHT);
    if (this.keepT) clearTimeout(this.keepT); if (this.keepAnim) { this.keepAnim.cancel(); this.keepAnim = null; }
    if (this.lenis) { this.lenis.destroy(); this.lenis = null; }
    document.documentElement.style.overflow = '';
    this.fx = false;
  }

  listen(t: EventTarget, ev: string, fn: (e: any) => void, opts?: AddEventListenerOptions) {
    t.addEventListener(ev, fn, opts);
    this.off.push(() => t.removeEventListener(ev, fn, opts));
  }

  addTask(t: Task) { this.tasks.add(t); return () => { this.tasks.delete(t); }; }

  // ---- Single loop ----
  loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    if (this.lenis) this.lenis.raf(now);
    const y = window.scrollY;
    if (this.needTick || y !== this.lastY) { this.needTick = false; this.lastY = y; this.tick(); }
    if (this.wipeRel) this.frame();
    this.tasks.forEach((t) => { if (t(now) === false) this.tasks.delete(t); });
    if (this.fx) this.fxStep();
  };

  // ---- Environment ----
  isDesk() { return isDesk(this.st.w || 1200, this.st.h || 800); }
  isCaseWide() { return isCaseWide(this.st.w || 1200, this.st.h || 800); }
  isStage() { return CONFIG.scrollMotion && isStage(this.st.w, this.st.h || 900, this.rm); }
  isLite() { return this.lite; }

  onResize = () => {
    const w = window.innerWidth, hh = window.innerHeight, dh = Math.abs(hh - (this.st.h || hh));
    if (w !== this.st.w || (dh > 0 && (!this.touch || dh > 160))) this.host.setViewport(w, hh);
    if (this.dust) this.dust.resize();
    this.tick();
  };

  onFocus = (e: FocusEvent) => {
    const t = e.target as HTMLElement | null;
    if (!t || !t.closest) return;
    if (t.closest('[data-pill]')) { this.fxBar(window.innerHeight); return; }
    if (this.isStage() && t.closest('[data-contact-layer]')) { this.scrollToY(document.documentElement.scrollHeight - window.innerHeight); return; }
    const el = t.closest('[data-phase]:not([data-phase=""])');
    if (el) { this.focusAt = Date.now(); this.setPhase(el.getAttribute('data-phase')); }
  };

  onTopZone = (ev: PointerEvent) => {
    const pillEl = this.qa(document.body, '[data-pill]')[0];
    const over = !!pillEl && pillEl.contains(ev.target as Node);
    const z = ev.clientY < (this.topZone ? 120 : 72) || over;
    if (z !== !!this.topZone) {
      clearTimeout(this.topT);
      this.topT = setTimeout(() => { this.topZone = z; this.fxBar(window.innerHeight); }, z ? 40 : 260);
    }
  };

  // ---- Lenis ----
  wantsLenis() { return !this.rm && CONFIG.smoothScroll; }
  syncLenis() {
    const want = this.wantsLenis();
    if (want && !this.lenis) {
      this.lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1.1, syncTouch: true, syncTouchLerp: 0.08, anchors: true, autoRaf: false });
      this.lenis.on('scroll', () => { this.needTick = true; });
    } else if (!want && this.lenis) { this.lenis.destroy(); this.lenis = null; }
  }
  scrollToY(y: number) {
    if (this.lenis) this.lenis.scrollTo(y, { duration: 1.1, easing: (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)) });
    else window.scrollTo(0, y);
  }
  lockScroll(on: boolean) {
    document.documentElement.style.overflow = on ? 'hidden' : '';
    if (this.lenis) { if (on) this.lenis.stop(); else this.lenis.start(); }
  }

  // ---- Cached lookups ----
  qa(el: Element, sel: string): N[] {
    const n = el as N;
    if (n.__qv !== this.qv) { n.__qv = this.qv; n.__qc = {}; }
    return n.__qc[sel] || (n.__qc[sel] = Array.from(el.querySelectorAll(sel)));
  }
  byId(id: string) {
    if (this.idsV !== this.qv) { this.idsV = this.qv; this.ids = {}; }
    if (!(id in this.ids)) this.ids[id] = document.getElementById(id);
    return this.ids[id];
  }
  kids(el: N): N[] {
    if (el.__kv !== this.qv) { el.__kv = this.qv; el.__kids = Array.from(el.children); }
    return el.__kids;
  }

  setBlur(n: N, b: number, step: number) {
    if (this.isLite()) b = 0;
    const q = b < step * 0.5 ? 0 : Math.round(b / step) * step;
    if (n.__b !== q) { n.__b = q; n.style.filter = q > 0 ? 'blur(' + q + 'px)' : ''; }
  }
  setOp(n: N, o: number) {
    const s = o < 0.01 ? 0 : Math.round(o * 50) / 50;
    if (n.__o !== s) { n.__o = s; n.style.opacity = String(s); n.style.visibility = s === 0 ? 'hidden' : ''; }
  }
  tl(el: N) {
    const rx = el.__rx || 0, ry = el.__ry || 0;
    return Math.abs(rx) < 0.01 && Math.abs(ry) < 0.01 ? '' : ' rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
  }
  swayStr(k: number) {
    const sw = this.sw;
    if (!sw || (Math.abs(sw.x) < 0.001 && Math.abs(sw.y) < 0.001)) return '';
    return 'rotateX(' + (-sw.y * 2 * k).toFixed(3) + 'deg) rotateY(' + (sw.x * 2 * k).toFixed(3) + 'deg) ';
  }

  // ---- Pointer effects (fine pointers) ----
  startFx() {
    this.fx = true;
    this.fine = window.matchMedia('(pointer: fine)').matches;
    const body = document.body;
    const m = this.m;
    if (this.fine) {
      this.listen(document, 'pointermove', (e: PointerEvent) => {
        m.x = e.clientX; m.y = e.clientY; m.dirty = true;
        if (!m.seen) {
          m.seen = true; m.rx = m.x; m.ry = m.y;
          const cur = this.qa(body, '[data-cursor]')[0], dot = this.qa(body, '[data-cursor-dot]')[0];
          if (cur) cur.style.opacity = '1'; if (dot) dot.style.opacity = '1';
        }
      }, { passive: true });
      this.listen(document, 'pointerover', (e: PointerEvent) => {
        const ring = this.qa(body, '[data-cursor-ring]')[0], dot = this.qa(body, '[data-cursor-dot]')[0], label = this.qa(body, '[data-cursor-label]')[0];
        if (!ring || !dot || !label) return;
        const t = e.target && (e.target as Element).closest ? (e.target as Element) : null;
        const tx = t && t.closest('[data-cursor-text]');
        const link = t && t.closest('a, button, [role="slider"], [tabindex="0"], input, textarea');
        const onAmber = t && t.closest('[data-contact-layer]');
        let size = 36, fill = 'transparent', txt = '';
        if (tx) { size = 64; fill = '#EDEBE6'; txt = tx.getAttribute('data-cursor-text') || ''; }
        else if (link) { size = 56; fill = 'transparent'; }
        ring.style.width = ring.style.height = size + 'px';
        ring.style.left = ring.style.top = -size / 2 + 'px';
        ring.style.background = fill; label.textContent = txt;
        dot.style.background = onAmber ? '#131414' : '#E8A33A';
        dot.style.transform = link || tx ? 'scale(0)' : '';
      });
      this.listen(document, 'pointerout', (e: PointerEvent) => {
        if (!e.relatedTarget) {
          const cur = this.qa(body, '[data-cursor]')[0], dot = this.qa(body, '[data-cursor-dot]')[0];
          if (cur) cur.style.opacity = '0'; if (dot) dot.style.opacity = '0'; m.seen = false;
        }
      });
      this.listen(document, 'pointermove', (e: PointerEvent) => {
        let t = e.target && (e.target as Element).closest ? ((e.target as Element).closest('[data-tilt]') as N | null) : null;
        if (!t) t = this.hitSvc(e.clientX, e.clientY);
        if (this.tiltEl && this.tiltEl !== t) { this.tiltEl.__trx = 0; this.tiltEl.__try = 0; }
        this.tiltEl = t;
        if (!t || !this.isStage()) return;
        const r = t.getBoundingClientRect(), mx = parseFloat(t.getAttribute('data-tilt') || '') || 5;
        t.__trx = -clamp((e.clientY - r.top) / r.height) * 2 * mx + mx;
        t.__try = clamp((e.clientX - r.left) / r.width) * 2 * mx - mx;
        this.tilts.add(t);
      }, { passive: true });
      this.listen(document, 'pointerout', (e: PointerEvent) => {
        if (!e.relatedTarget && this.tiltEl) { this.tiltEl.__trx = 0; this.tiltEl.__try = 0; this.tiltEl = null; }
      });
      this.listen(document, 'click', (e: MouseEvent) => {
        const tg = e.target as Element;
        if (tg.closest && tg.closest('[data-svc-panel]')) return;
        const pn = this.hitSvc(e.clientX, e.clientY);
        if (!pn) return;
        const a = Array.from(pn.querySelectorAll('a')).find((x) => { const r = x.getBoundingClientRect(); return e.clientX >= r.left - 4 && e.clientX <= r.right + 4 && e.clientY >= r.top - 4 && e.clientY <= r.bottom + 4; });
        if (a) { e.preventDefault(); a.click(); }
      });
    }
    const atmo = this.qa(body, '[data-atmo]')[0];
    if (atmo) atmo.style.opacity = '1';
    const cv = this.qa(body, '[data-dust]')[0] as unknown as HTMLCanvasElement | undefined;
    if (cv) {
      this.dust = createDust(cv, this.isLite());
      cv.style.opacity = '1';
    }
  }

  fxStep() {
    this.fxTick++;
    const now = performance.now();
    if (this.dust) {
      const fade = this.st.loaderOn ? 0 : 1 - clamp((this.cp || 0) * 1.6);
      const warp = now - (this.warpAt || 0) < 220 ? (this.warpV || 0) : 0;
      this.dust.draw(now, { fade, warp, odd: !!(this.fxTick & 1), mask: this.maskDust });
    }
    const body = document.body, m = this.m, lite = this.isLite();
    const atmo = this.qa(body, '[data-atmo]')[0], A = this.qa(body, '[data-atmo-a]')[0], B = this.qa(body, '[data-atmo-b]')[0];
    const beam = this.qa(body, '[data-atmo-beam]')[0], beam2 = this.qa(body, '[data-atmo-beam2]')[0], at = this.at;
    if (atmo && A && B && this.fxTick % (lite ? 3 : 2) === 0) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const g = clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - vh));
      const t = now / 1000;
      const mx = m.seen ? m.x / vw - 0.5 : 0, my = m.seen ? m.y / vh - 0.5 : 0;
      const tax = 0.5 + 0.32 * Math.sin(g * Math.PI * 3.2 + 0.6) + 0.04 * Math.sin(t * 0.21) + mx * 0.08;
      const tay = 0.42 + 0.22 * Math.cos(g * Math.PI * 2.4) + 0.04 * Math.cos(t * 0.17) + my * 0.08;
      const tbx = 0.5 - 0.34 * Math.sin(g * Math.PI * 2.6 + 1.1) + 0.05 * Math.cos(t * 0.13);
      const tby = 0.6 - 0.24 * Math.cos(g * Math.PI * 3.0 + 0.4) + 0.05 * Math.sin(t * 0.19);
      at.ax += (tax - at.ax) * 0.05; at.ay += (tay - at.ay) * 0.05; at.bx += (tbx - at.bx) * 0.04; at.by += (tby - at.by) * 0.04;
      A.style.transform = 'translate3d(' + (at.ax * vw).toFixed(1) + 'px,' + (at.ay * vh).toFixed(1) + 'px,0)';
      B.style.transform = 'translate3d(' + (at.bx * vw).toFixed(1) + 'px,' + (at.by * vh).toFixed(1) + 'px,0)';
      const tr = -22 + 44 * Math.sin(g * Math.PI * 1.7) + 3 * Math.sin(t * 0.11);
      at.r += (tr - at.r) * 0.05;
      if (beam) beam.style.transform = 'translate3d(' + (Math.sin(g * Math.PI * 2.2) * vw * 0.18).toFixed(1) + 'px,0,0) rotate(' + at.r.toFixed(2) + 'deg)';
      if (beam2) beam2.style.transform = 'translate3d(' + (Math.cos(g * Math.PI * 1.8) * vw * 0.22).toFixed(1) + 'px,0,0) rotate(' + (-at.r * 0.7 + 8).toFixed(2) + 'deg)';
      atmo.style.opacity = (1 - clamp((this.cp || 0) * 1.6)).toFixed(3);
    }
    const cur = this.qa(body, '[data-cursor]')[0], dot = this.qa(body, '[data-cursor-dot]')[0];
    if (this.fine && cur && m.seen) {
      if (Math.abs(m.x - m.rx) > 0.15 || Math.abs(m.y - m.ry) > 0.15) {
        m.rx += (m.x - m.rx) * 0.18; m.ry += (m.y - m.ry) * 0.18;
        cur.style.transform = 'translate3d(' + m.rx.toFixed(1) + 'px,' + m.ry.toFixed(1) + 'px,0)';
      }
      if (this.isStage()) {
        const sw = this.sw || (this.sw = { x: 0, y: 0 });
        const dx = (m.x / window.innerWidth - 0.5 - sw.x) * 0.045, dy = (m.y / window.innerHeight - 0.5 - sw.y) * 0.045;
        if (Math.abs(dx) > 0.0002 || Math.abs(dy) > 0.0002) { sw.x += dx; sw.y += dy; this.fxDirty = true; }
      }
    }
    if (this.tilts.size) {
      this.tilts.forEach((t) => {
        const trx = t.__trx || 0, tty = t.__try || 0, rx = t.__rx || 0, ry = t.__ry || 0;
        let nx = rx + (trx - rx) * 0.09, ny = ry + (tty - ry) * 0.09;
        if (Math.abs(trx - nx) < 0.02 && Math.abs(tty - ny) < 0.02) { nx = trx; ny = tty; if (!trx && !tty) this.tilts.delete(t); }
        if (nx !== rx || ny !== ry) { t.__rx = nx; t.__ry = ny; this.fxDirty = true; }
      });
    }
    if (this.fxDirty) { this.fxDirty = false; this.frame(); }
    if (this.fine && cur && dot && m.seen) {
      if (m.dirty) dot.style.translate = m.x + 'px ' + m.y + 'px';
      let magLive = false;
      if (m.dirty || this.magLive) this.qa(body, '[data-magnet]').forEach((b) => {
        const r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = m.x - cx, dy = m.y - cy, d = Math.hypot(dx, dy), R = Math.max(r.width, r.height) * 0.75;
        const k = d < R ? (1 - d / R) : 0;
        const tx = Math.max(-6, Math.min(6, dx * 0.14 * k)), ty = Math.max(-4, Math.min(4, dy * 0.2 * k));
        const px = parseFloat(b.dataset.mx || '0'), py = parseFloat(b.dataset.my || '0');
        const nx = px + (tx - px) * 0.2, ny = py + (ty - py) * 0.2;
        b.dataset.mx = String(nx); b.dataset.my = String(ny);
        b.style.translate = Math.abs(nx) < 0.05 && Math.abs(ny) < 0.05 ? '' : nx.toFixed(2) + 'px ' + ny.toFixed(2) + 'px';
        if (Math.abs(nx) >= 0.05 || Math.abs(ny) >= 0.05) magLive = true;
      });
      this.magLive = magLive; m.dirty = false;
    }
  }

  occList(force?: boolean) {
    if (!force && this.occCache && this.fxTick - this.occAt < 45) return this.occCache;
    this.occAt = this.fxTick;
    const els = this.qa(document.body, '[data-svc-panel]:not([data-svc-panel="0"]), [data-card], [data-media], [data-plane], [data-pill]');
    els.forEach((el) => { if (!el.__occ || el.__occV !== this.qv) { el.__occV = this.qv; el.__occ = this.qa(el, ':scope > [data-occ]'); } });
    this.occCache = els;
    return els;
  }
  maskDust = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const els = this.occList();
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < els.length; k++) {
      const el = els[k];
      if (!el.isConnected || !el.__occ || el.__occ.length < 4) continue;
      let o = 1, n: HTMLElement | null = el;
      for (let d = 0; n && n !== document.body && d < 18; d++, n = n.parentElement) {
        const st = n.style;
        if (st.visibility === 'hidden' || st.display === 'none') { o = 0; break; }
        if (st.opacity !== '') o *= parseFloat(st.opacity);
        if (o < 0.02) break;
      }
      if (o < 0.02) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
      ctx.globalAlpha = Math.min(1, o);
      ctx.beginPath();
      for (let c = 0; c < 4; c++) { const q = el.__occ[c].getBoundingClientRect(); if (c) ctx.lineTo(q.left, q.top); else ctx.moveTo(q.left, q.top); }
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };

  // ---- Scene frame ----
  tick() { this.frame(); this.detect(); }

  frame() {
    if (typeof document === 'undefined' || !this.mounted) return;
    const stage = this.isStage();
    const vh = window.innerHeight, vw = window.innerWidth;
    const acts = this.qa(document.body, '[data-act]');
    const rects = acts.map((el) => el.getBoundingClientRect()); // all reads before any writes
    acts.forEach((el, i) => {
      const r = rects[i];
      const off = stage && (r.bottom < -vh * 0.25 || r.top > vh * 1.5) && el.getAttribute('data-act') !== 'contact';
      if (off !== !!el.__off) { el.__off = off; this.qa(el, '[data-dworld], [data-svc-floor]').forEach((n) => { n.style.display = off ? 'none' : ''; }); }
      if (off) return;
      const span = parseFloat(el.getAttribute('data-span') || '') || 2;
      const kind = el.getAttribute('data-act');
      const rec = this.qa(el, '[data-recede]')[0];
      const next = acts[i + 1];
      const nEnter = next ? next.getAttribute('data-enter') : '';
      const xd = stage && nEnter === 'depth', lead = xd ? CS_LEAD : 0;
      const xw = xd ? clamp((CS_WIN * vh - rects[i + 1].top) / (CS_WIN * vh)) : 0;
      el.__xd = xd; el.__xw = xw;
      const flyOn = xd && xw > 0 && xw < 1;
      if (flyOn !== !!el.__fly) {
        el.__fly = flyOn;
        const ost = this.qa(el, '[data-stage]')[0];
        if (el.__z0 == null) el.__z0 = el.style.zIndex;
        el.style.zIndex = flyOn ? String((parseInt(next.style.zIndex, 10) || 0) + 1) : el.__z0;
        if (ost) { ost.style.backgroundColor = flyOn ? 'transparent' : '#131414'; ost.style.borderTopColor = flyOn ? 'transparent' : ''; }
      }
      const t = stage ? clamp((-r.top + 0.5 * vh) / ((span - 1.5 - lead) * vh)) : 1;
      if (rec) {
        let tf = '', op = '', rb = 0;
        const nRaw = stage && next ? clamp((vh - rects[i + 1].top) / vh) : 0;
        const ne = eOut(nRaw);
        if (nEnter === 'depth') {
          if (xw > 0) { const c = CS_D * eSine(xw); tf = 'scale(' + (1400 / (1400 - c)).toFixed(4) + ')'; op = (1 - eSine(clamp((c - 240) / 560))).toFixed(3); rb = clamp((c - 180) / 620) * 14; this.warpAt = performance.now(); this.warpV = Math.sin(Math.PI * xw); }
        } else if (ne > 0) {
          if (nEnter === 'slide') { tf = 'translate3d(0,' + (-3 * ne) + 'vh,0) scale(' + (1 - 0.035 * ne) + ')'; op = String(1 - 0.6 * ne); }
          else if (nEnter === 'wipe') { tf = 'translate3d(' + (-2.5 * ne) + 'vw,0,0)'; op = String(1 - 0.35 * ne); }
          else if (nEnter === 'dissolve') { tf = 'scale(' + (1 - 0.045 * ne) + ')'; op = String(1 - 0.92 * ne); }
          else { tf = 'translate3d(0,' + (-6 * ne).toFixed(2) + 'vh,0) scale(' + (1 - 0.08 * ne).toFixed(4) + ')'; op = String(1 - ne); }
        }
        rec.style.transform = tf; rec.style.opacity = op;
        this.setBlur(rec, rb, 2);
      }
      const enter = el.getAttribute('data-enter');
      const st = this.qa(el, '[data-stage]')[0];
      if (st && (enter === 'wipe' || enter === 'dissolve' || enter === 'iris' || enter === 'depth')) {
        const e = clamp((vh - r.top) / vh);
        const ew = enter === 'depth' ? clamp((CS_WIN * vh - r.top) / (CS_WIN * vh)) : e;
        const edge = this.qa(st, '[data-enter-edge]')[0];
        if (st.__ol && (enter !== 'depth' || !stage || ew >= 1)) { st.__ol = 0; st.style.outline = ''; st.style.outlineOffset = ''; }
        if (enter === 'depth' && !(stage && ew < 1)) this.setBlur(st, 0, 2);
        if (stage && ew < 1) {
          st.style.transform = 'translate3d(0,' + (-Math.max(0, r.top)).toFixed(1) + 'px,0)';
          if (enter === 'depth') {
            this.setBlur(st, (1 - eSine(clamp(ew / 0.6))) * 6, 2);
            const c = CS_D * eSine(ew);
            st.style.transform += ' scale(' + (1400 / (1400 + CS_D - c)).toFixed(4) + ')';
            st.style.opacity = eSine(clamp((ew - 0.03) / 0.3)).toFixed(3); st.style.clipPath = '';
            st.style.pointerEvents = ew < 0.6 ? 'none' : '';
            if (!st.__ol) { st.__ol = 1; st.style.outline = '1px solid #3A3B3B'; st.style.outlineOffset = '-1px'; }
            if (edge) edge.style.opacity = '0';
          } else if (enter === 'wipe') {
            const L = (1 - eInOut(e)) * 100;
            st.style.clipPath = 'inset(0 0 0 ' + L.toFixed(2) + '%)'; st.style.opacity = '';
            if (edge) { edge.style.transform = 'translateX(' + ((L / 100) * st.clientWidth).toFixed(1) + 'px)'; edge.style.opacity = e > 0 ? '1' : '0'; }
          } else if (enter === 'iris') {
            st.style.clipPath = 'circle(' + (eInOut(e) * 75).toFixed(2) + '% at 50% 50%)'; st.style.opacity = '';
            if (edge) edge.style.opacity = '0';
          } else {
            st.style.opacity = String(eInOut(e)); st.style.clipPath = '';
            st.style.pointerEvents = e < 0.5 ? 'none' : '';
            if (edge) edge.style.opacity = '0';
          }
        } else { st.style.transform = ''; st.style.clipPath = ''; st.style.opacity = ''; st.style.pointerEvents = ''; if (edge) edge.style.opacity = '0'; }
      }
      this.fxRise(el, clamp((vh - r.top) / vh), stage, vh);
      if (kind === 'wipe') this.fxWipe(el, t, stage);
      else if (kind === 'parallax') this.fxPar(el, stage ? (-r.top + 0.5 * vh) / ((span - 1.5 - lead) * vh) : 1, stage);
      else if (kind === 'build') this.fxBuild(el, t, stage);
      else if (kind === 'code') this.fxCode(el, t, stage);
      if (kind === 'wipe' || kind === 'parallax' || kind === 'build' || kind === 'code') this.fxScene(el, r, stage, vh, vw);
      else if (kind === 'contact') this.fxContact(el, r, stage, vh);
      else if (kind === 'hero') this.fxHero(el, r, stage, vh);
      else if (kind === 'services') this.fxSvc(el, r, stage, vh);
    });
    this.fxBar(vh);
  }

  keepCheck(y: number) {
    const k = this.qa(document.body, '[data-keep]')[0];
    if (!k) return;
    if (!this.keepAnim && !this.rm) { const ln = this.qa(k, '[data-keep-line]')[0]; if (ln && ln.animate) this.keepAnim = ln.animate([{ transform: 'translateY(-100%)' }, { transform: 'translateY(0%)', offset: 0.55 }, { transform: 'translateY(100%)' }], { duration: 1800, iterations: Infinity, easing: 'cubic-bezier(0.65,0,0.35,1)' }); }
    if (y === this.keepY && (this.keepT || this.keepOn)) return;
    this.keepY = y;
    if (this.keepOn) { this.keepOn = false; k.style.opacity = '0'; k.style.filter = 'blur(4px)'; k.style.transform = 'translate(-50%, 8px)'; }
    if (this.keepT) clearTimeout(this.keepT);
    this.keepT = setTimeout(() => {
      this.keepT = null;
      if (!this.mounted) return;
      if (this.st.loaderOn) { this.keepY = null; this.keepCheck(window.scrollY); return; }
      const yy = window.scrollY, mx = document.documentElement.scrollHeight - window.innerHeight;
      if (yy > mx - window.innerHeight * 0.9 || (this.cp || 0) > 0.02) return;
      const kr = k.getBoundingClientRect();
      if (this.qa(document.body, '[data-magnet], [data-dive-skip]').some((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && b.style.visibility !== 'hidden' && !(parseFloat(b.style.opacity) < 0.05) && r.right > kr.left - 12 && r.left < kr.right + 12 && r.bottom > kr.top - 12 && r.top < kr.bottom + 12; })) return;
      this.keepOn = true; k.style.opacity = '1'; k.style.filter = 'blur(0px)'; k.style.transform = 'translate(-50%, 0)';
    }, y < 4 ? 2600 : 1600);
  }

  fxBar(vh: number) {
    if (!this.mounted) return;
    this.keepCheck(window.scrollY);
    const body = document.body;
    const sb = this.qa(body, '[data-sitebar]')[0];
    if (sb && sb.firstElementChild) {
      const fill = sb.firstElementChild as HTMLElement;
      fill.style.transform = 'scaleY(' + clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4) + ')';
      const am = (this.cp || 0) > 0.45;
      if (am !== this.sbAm) { this.sbAm = am; sb.style.background = am ? 'rgba(19,20,20,0.18)' : 'rgba(237,235,230,0.1)'; fill.style.background = am ? '#131414' : '#E8A33A'; }
    }
    const pill = this.qa(body, '[data-pill]')[0];
    if (!pill) { this.pillOpen = undefined; return; }
    const full = this.qa(pill, '[data-pill-full]')[0];
    if (!full) return;
    if (!this.pillRO && window.ResizeObserver) { this.pillRO = new ResizeObserver(() => { this.pillW = null; this.fxBar(window.innerHeight); }); }
    if (this.pillRO && (full as N).__ro !== this.pillRO) { (full as N).__ro = this.pillRO; this.pillRO.observe(full); }
    const y = window.scrollY;
    const tapOpen = this.pillTap != null && Math.abs(y - this.pillTap) < 120;
    if (!tapOpen) this.pillTap = null;
    // Open only at the very top; once scrolling starts it tucks away behind "Hover for menu".
    // Focus keeps it open for keyboard users only, so a clicked link doesn't leave it stuck open.
    const ae = document.activeElement;
    const kbFocus = !!ae && pill.contains(ae) && ae.matches(':focus-visible');
    const open = y < 8 || this.pillHover || this.topZone || tapOpen || kbFocus;
    const hint = this.qa(body, '[data-pill-hint]')[0];
    if (open !== this.pillOpen || pill.__pv !== this.qv) {
      this.pillOpen = open; pill.__pv = this.qv;
      pill.style.transform = open ? 'translate(-50%, 0)' : 'translate(-50%, calc(-100% - 24px))';
      pill.style.opacity = open ? '1' : '0';
      pill.style.pointerEvents = open ? 'auto' : 'none';
      if (hint) { hint.style.transitionDelay = open ? '0ms' : '220ms'; hint.style.opacity = open ? '0' : '1'; hint.style.filter = open ? 'blur(3px)' : 'blur(0px)'; hint.style.transform = open ? 'translate(-50%, 6px)' : 'translate(-50%, 0)'; }
    }
    if (this.pillW == null) { this.pillW = Math.ceil(full.scrollWidth) + 2; pill.style.width = this.pillW + 'px'; }
  }
  pillIn() { clearTimeout(this.pillHT); this.pillHT = setTimeout(() => { this.pillHover = true; this.fxBar(window.innerHeight); }, 60); }
  pillOut() { clearTimeout(this.pillHT); this.pillHT = setTimeout(() => { this.pillHover = false; this.fxBar(window.innerHeight); }, 240); }
  pillBlur() { setTimeout(() => this.fxBar(window.innerHeight), 0); }
  pillTapOpen() { this.pillTap = window.scrollY; this.fxBar(window.innerHeight); }

  fxHero(el: N, r: DOMRect, stage: boolean, vh: number) {
    const world = this.qa(el, '[data-world]')[0], ui = this.qa(el, '[data-hero-ui]')[0];
    if (!world || !ui) return;
    const planes = this.qa(el, '[data-plane]');
    if (!stage) { world.style.transform = ''; ui.__o = undefined; ui.style.opacity = ''; ui.style.visibility = ''; ui.__bc = undefined; ui.style.borderColor = 'transparent'; return; }
    const vw = window.innerWidth;
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    const s = p * (HERO_VH - 100);
    const N = planes.length || 5;
    const a = eSine(clamp((s - 8) / 170));
    const spread = eSmooth(clamp((s - 120) / 130));
    const drift = eSine(clamp((s - 8) / 292));
    const st = eSmooth(clamp((s - 225) / 120));
    const SP = vh * 1.15, SPo = vh * 0.16;
    const sp0 = SPo + vh * 0.3 * spread;
    const sp = sp0 + (SP - sp0) * st;
    const camZ = heroCam(s, a, spread) * vh;
    const kz = camZ / SP;
    const tilt = (56 - 8 * drift) * a * (1 - st), rz = (-16 - 16 * drift) * a * (1 - st);
    world.style.transformOrigin = '50% 50% ' + (-(N * sp) / 2 * (1 - st)).toFixed(1) + 'px';
    world.style.transform = this.swayStr(2.2) + 'translate3d(0,0,' + camZ.toFixed(1) + 'px) rotateX(' + tilt.toFixed(3) + 'deg) rotateZ(' + rz.toFixed(3) + 'deg)';
    const near = (z: number) => 1 - clamp((z + 60) / 460);
    const fog = (z: number) => clamp(1 + (z + 2.2 * SP) / (1.4 * SP));
    this.setOp(ui, 1 - clamp(camZ / 420));
    this.setBlur(ui, clamp(camZ / 380) * 16, 2);
    { const bc = (a * (1 - st)).toFixed(2); if (ui.__bc !== bc) { ui.__bc = bc; ui.style.borderColor = 'rgba(106,107,106,' + bc + ')'; } }
    let passed = 0;
    planes.forEach((pl) => { const i = parseInt(pl.getAttribute('data-plane') || '0', 10); if (camZ - (i + 1) * sp > 0) passed++; });
    const live = st >= 0.999;
    const bgA = 0.55 + 0.37 * st;
    planes.forEach((pl) => {
      const i = parseInt(pl.getAttribute('data-plane') || '0', 10);
      const z0 = -(i + 1) * sp, z = camZ + z0;
      const fan = spread * (1 - st);
      pl.style.transform = 'translate3d(' + ((i + 1) * vw * 0.018 * fan).toFixed(1) + 'px,' + ((i + 1) * vh * -0.012 * fan).toFixed(1) + 'px,' + z0.toFixed(1) + 'px)';
      const appear = clamp((a - i * 0.09) / 0.5);
      const o = appear * near(z) * (1 - st + st * fog(z));
      this.setOp(pl, o);
      this.setBlur(pl, o > 0.005 ? clamp((z + 90) / 300) * 16 : 0, 2);
      const bgS = bgA.toFixed(2); if (pl.__bg !== bgS) { pl.__bg = bgS; pl.style.backgroundColor = 'rgba(20,21,21,' + bgS + ')'; }
      const body = this.qa(pl, '[data-plane-body]')[0];
      if (body) { const bo = live && i !== passed ? '0.28' : '1'; if (body.__o !== bo) { body.__o = bo; body.style.opacity = bo; } }
    });
    const intro = this.qa(el, '[data-dive-intro]')[0], out = this.qa(el, '[data-dive-out]')[0], skip = this.qa(el, '[data-dive-skip]')[0];
    if (intro) { const ci = eOut(clamp((s - 51) / 25.5)) * (1 - eSine(clamp((s - 200) / 28))); intro.style.opacity = ci.toFixed(3); intro.style.transform = 'translate3d(0,' + ((1 - ci) * 20).toFixed(1) + 'px,0)'; }
    if (skip) { const sk = clamp((s - 152) / 24) * (1 - clamp((kz - 5) / 0.3)); skip.style.opacity = sk.toFixed(3); skip.style.visibility = sk < 0.02 ? 'hidden' : ''; }
    if (out && (s > 790 || out.__on)) {
      out.__on = s > 790;
      const ko = clamp((s - 815) / 135);
      out.style.opacity = eSmooth(clamp((s - 815) / 30)).toFixed(3);
      const ap = clamp((s - 815) / 335);
      out.style.transform = 'scale(' + (0.84 + 0.24 * eSmooth(ap)).toFixed(4) + ')';
      this.fxEcho(this.qa(out, '[data-echo-root]')[0], ko, clamp((s - 990) / 160));
    }
  }

  fxEcho(root: N | undefined, k: number, x: number) {
    if (!root) return;
    const key = k <= 0 ? 'pre' : k >= 1 && x <= 0 ? 'set' : x >= 1 ? 'post' : '';
    if (key && root.__key === key) return;
    root.__key = key;
    const r = root.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    const sc = r.width / (root.offsetWidth || 1) || 1;
    const org = ((vw / 2 - r.left) / sc).toFixed(0) + 'px ' + ((vh / 2 - r.top) / sc).toFixed(0) + 'px';
    const conv = eInOut(clamp(k));
    const lite = this.isLite();
    const GAP = 0.15, open = eOut(clamp(x / 0.3)), cz = 2.3 * Math.pow(clamp(x), 1.55);
    const layer = (n: N, d: number, base: number) => {
      const den = 1 + d - cz;
      const fsN = n.hasAttribute('data-front-stroke');
      if (x <= 0) { if (n.__exitOn) { n.__exitOn = 0; n.style.transform = ''; n.style.transformOrigin = ''; this.setBlur(n, 0, 2); if (!fsN) this.setOp(n, 1); } if (fsN) root.__exitF = 1; return null; }
      n.__exitOn = 1;
      const s = den <= 0.18 ? 0 : 1 / den, op = s ? base * (1 - eSine(clamp((s - 1.7) / 1.9))) : 0;
      if (fsN) root.__exitF = op; else this.setOp(n, op);
      if (!s) return null;
      n.style.transformOrigin = org;
      n.style.transform = 'scale(' + s.toFixed(4) + ')';
      this.setBlur(n, clamp((s - 1.25) / 2.2) * 10, 2);
      return s;
    };
    if (x > 0) { this.warpAt = performance.now(); this.warpV = Math.sin(Math.PI * clamp(x)) * 0.8; }
    this.kids(root).forEach((n) => { if (!n.hasAttribute('data-echo')) layer(n, 0, 1); });
    this.qa(root, '[data-echo]').forEach((n) => {
      const j = parseInt(n.getAttribute('data-echo') || '0', 10);
      if (lite && j >= 3) { if (n.style.display !== 'none') n.style.display = 'none'; return; }
      const fade = 1 - 0.1 * j;
      if (x > 0) { layer(n, (j + 1) * GAP * open, fade * 0.85 * clamp(x / 0.12)); return; }
      const s = 1 - (j + 1) * 0.11 * (1 - conv);
      n.style.transformOrigin = org;
      n.style.transform = 'scale(' + s.toFixed(4) + ')';
      this.setOp(n, fade * 0.9 * clamp(k / 0.15) * (1 - conv));
    });
    const fills = this.qa(root, '[data-fill]'), L = fills.length;
    let minQ = 1;
    fills.forEach((n, i) => {
      const q = Math.round(eSmooth(clamp((k - 0.35 - (i / Math.max(1, L - 1)) * 0.4) / 0.22)) * 20) / 20;
      if (q < minQ) minQ = q;
      if (n.__a !== q) { n.__a = q; n.style.color = 'rgba(237,235,230,' + q + ')'; }
    });
    const fs = this.qa(root, '[data-front-stroke]')[0];
    if (fs) { const fo = ((1 - eSmooth(clamp((minQ - 0.6) / 0.4))) * (root.__exitF ?? 1)).toFixed(2); if (fs.__o !== fo) { fs.__o = fo; fs.style.opacity = fo; } }
  }

  hitSvc(x: number, y: number) {
    const pn = this.svcLit;
    if (!pn || !pn.isConnected || !this.isStage()) return null;
    const r = pn.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom ? pn : null;
  }

  placeDz(el: N, vw: number, vh: number, R: number) {
    const key = vw + 'x' + vh + 'x' + Math.round(R);
    this.qa(el, '[data-dz]').forEach((n) => {
      if (n.dataset.k === key) return;
      n.dataset.k = key;
      const z = -parseFloat(n.getAttribute('data-z') || '0') * R;
      n.dataset.zz = String(z);
      n.style.transform = 'translate3d(' + (parseFloat(n.getAttribute('data-x') || '0') * vw * 0.5).toFixed(1) + 'px,' + (parseFloat(n.getAttribute('data-y') || '0') * vh * 0.5).toFixed(1) + 'px,' + z.toFixed(1) + 'px) translate(-50%,-50%)';
    });
  }
  fogDz(el: N, camZ: number, R: number) {
    this.qa(el, '[data-dz]').forEach((n) => {
      const ze = camZ + parseFloat(n.dataset.zz || '0');
      this.setOp(n, clamp(1 + (ze + 0.85 * R) / (0.3 * R)) * (1 - clamp((ze + 160) / 360)) * (ze < -0.45 * R ? 0.55 + 0.45 * clamp(1 + (ze + 0.45 * R) / (0.4 * R)) : 1));
    });
  }

  fxScene(el: N, r: DOMRect, stage: boolean, vh: number, vw: number) {
    const media = this.qa(el, '[data-media]')[0], world = this.qa(el, '[data-dworld]')[0], hud = this.qa(el, '[data-hud]')[0];
    if (!stage) { if (media) { media.style.transform = ''; media.style.opacity = ''; } return; }
    const S = parseFloat(el.getAttribute('data-span') || '') || 4;
    const v = (vh - r.top) / vh, u = clamp(v / S);
    const xd = !!el.__xd, xw = el.__xw || 0;
    const m = 1 - Math.pow(1 - clamp((v - 0.2) / 1.1), 2), xx = xd ? 0 : clamp(v - (S - 1));
    if (media) {
      if (m >= 1 && xx <= 0) { media.style.transform = this.tl(media).trim(); media.style.opacity = ''; }
      else {
        const z = -1500 * (1 - m) + 900 * xx * xx;
        media.style.transform = 'translate3d(0,' + ((1 - m) * 8).toFixed(2) + 'vh,' + z.toFixed(1) + 'px) rotateX(' + ((1 - m) * 10).toFixed(2) + 'deg)' + this.tl(media);
        media.style.opacity = (m * (1 - xx)).toFixed(3);
      }
    }
    if (world) {
      const R = vh * 3.4;
      this.placeDz(world, vw, vh, R);
      const camZ = u * R + (xd ? CS_D * eSine(xw) : 0);
      world.style.transform = this.swayStr(1.6) + 'translate3d(0,0,' + camZ.toFixed(1) + 'px)';
      this.fogDz(world, camZ, R);
    }
    this.qa(el, '[data-card]').forEach((cd) => {
      const i = parseInt(cd.getAttribute('data-card') || '0', 10);
      const a = eOut(clamp((v - 0.7 - i * 0.16) / 0.7)), e2 = xd ? eInOut(clamp((xw - (3 - i) * 0.05) / 0.35)) : eInOut(clamp((v - (S - 1) - (3 - i) * 0.06) / 0.6));
      if (a >= 1 && e2 <= 0) { const tt = this.tl(cd).trim(); if (cd.__rest && cd.__tt === tt) return; cd.__tt = tt; cd.style.transform = tt; if (!cd.__rest) { cd.__rest = true; this.setBlur(cd, 0, 2); cd.style.opacity = '1'; } return; }
      cd.__rest = false; cd.__tt = null;
      const z = -900 * (1 - a) + 600 * e2, bl = (1 - a) * 8 + e2 * 10;
      cd.style.transform = 'translate3d(0,' + ((1 - a) * 30).toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ((1 - a) * -18).toFixed(2) + 'deg)' + this.tl(cd);
      this.setBlur(cd, bl, 2);
      cd.style.opacity = (a * (1 - e2)).toFixed(3);
    });
    if (hud) {
      const k = clamp((v - 1) / 0.6);
      const line = this.qa(hud, '[data-hud-line]')[0];
      if (line) line.style.transform = 'scaleX(' + eOut(k).toFixed(4) + ')';
      hud.style.opacity = (xd ? 1 - clamp(xw / 0.35) : 1 - xx).toFixed(3);
      this.qa(hud, '[data-hud-f]').forEach((f) => {
        const i = parseInt(f.getAttribute('data-hud-f') || '0', 10), fk = eOut(clamp(k * 1.6 - 0.25 - i * 0.14));
        f.style.opacity = fk.toFixed(3);
        f.style.transform = 'translate3d(0,' + ((1 - fk) * 12).toFixed(1) + 'px,0)';
      });
    }
  }

  fxSvc(el: N, r: DOMRect, stage: boolean, vh: number) {
    const track = this.qa(el, '[data-svc-track]')[0];
    if (!track) return;
    const panels = this.qa(el, '[data-svc-panel]');
    const all = this.qa(el, '[data-svc-panel], [data-svc-inner], [data-sw], [data-svc-d], [data-svc-rule], [data-sl], [data-svc-lede], [data-svc-echo]');
    if (!stage) { track.style.transform = ''; all.forEach((n) => { n.style.transform = ''; n.style.opacity = ''; n.style.backgroundPosition = ''; n.style.outlineColor = ''; n.style.visibility = ''; n.style.filter = ''; n.__b = 0; n.__o = undefined; }); return; }
    const vw = window.innerWidth;
    const ent = clamp((vh - r.top) / vh);
    const lede = this.qa(el, '[data-svc-lede]')[0];
    if (lede) { const k = eOut(clamp((ent - 0.55) / 0.4)); lede.style.opacity = k.toFixed(3); lede.style.transform = 'translate3d(0,' + ((1 - k) * 20).toFixed(1) + 'px,0)'; }
    const stg = el.firstElementChild as HTMLElement | null;
    const covered = (this.cp || 0) > 0.72;
    if (stg && covered !== !!this.svcCovered) { this.svcCovered = covered; stg.style.visibility = covered ? 'hidden' : ''; }
    if (covered) return;
    const p = clamp(-r.top / Math.max(1, r.height - vh));
    const s = p * (SVC_VH - 100), PL = SVC_VH - 100 - SVC_LAND;
    const N = panels.length - 1, G = vh * 1.25, REST = G * (this.isDesk() ? 0.22 : 0.06);
    const fl = s < SVC_S1 ? s / SVC_S1 : Math.min(N, 1 + (s - SVC_S1) / SVC_SEG);
    let phase;
    if (fl < 1) phase = herm(fl, 0, 0, 1, 0.55 * SVC_S1 / SVC_SEG, 1);
    else if (fl < N - 1) { const fi = Math.floor(fl), fx = fl - fi; phase = fi + fx - Math.sin(2 * Math.PI * fx) / (2 * Math.PI) * 0.45; }
    else phase = herm(fl - (N - 1), N - 1, 0.55, N, 0.296, 1);
    const push = s > SVC_LAND ? herm(clamp((s - SVC_LAND) / PL), 0, 0.296 / SVC_SEG * 1.25, 0.68, 0.0028, PL) : 0;
    const camZ = phase * G - REST * eSmooth(clamp(phase)) + push * vh;
    const sk = clamp((clamp((CS_WIN * vh - r.top) / (CS_WIN * vh)) - 0.3) / 0.62), sx = clamp((camZ - 20) / 600);
    const ser = this.qa(el, '[data-svc-echo]')[0];
    if (ser) { const sa = clamp((CS_WIN * vh - r.top) / (CS_WIN * vh) * 0.7 + clamp(camZ / 600) * 0.3); ser.style.transform = 'scale(' + (0.86 + 0.2 * eSmooth(sa)).toFixed(4) + ')'; }
    this.fxEcho(this.qa(el, '[data-echo-root]')[0], sk, sx);
    const LAT = this.isDesk() ? 0.27 : 0;
    const panX = -vw * LAT * 0.62 * Math.cos(Math.PI * Math.min(N, Math.max(1, phase))) * eInOut(clamp(phase));
    const floor = this.qa(el, '[data-svc-floor]')[0];
    if (floor && this.isLite()) floor.style.display = 'none';
    else if (floor) {
      const T = vh * 0.1, md = (v: number) => ((v % T) + T) % T;
      const grid = floor.firstElementChild as HTMLElement | null;
      if (grid) grid.style.transform = 'translate3d(' + md(panX).toFixed(1) + 'px,' + md(-camZ).toFixed(1) + 'px,0)';
      this.setOp(floor, Math.round(clamp((camZ - 80) / 500) * 50) / 50);
    }
    this.svcLit = null;
    track.style.transform = this.swayStr(1.2) + 'translate3d(' + panX.toFixed(1) + 'px,0,' + camZ.toFixed(1) + 'px)';
    panels.forEach((pn) => {
      const k = parseInt(pn.getAttribute('data-svc-panel') || '0', 10);
      if (k === 0) {
        const o = 1 - clamp((camZ - 160) / 540);
        pn.style.transform = 'translate3d(' + (-panX).toFixed(1) + 'px,0,0)'; this.setOp(pn, Math.round(o * 100) / 100);
        return;
      }
      const z0 = -k * G, ze = camZ + z0, side = k % 2 ? -1 : 1;
      let lit = clamp(1 - Math.max(0, Math.abs(ze + REST) - 0.06 * G) / (0.5 * G));
      const passed = ze > -REST;
      if (k === N && passed) lit = 1;
      if (lit > 0.5) { this.svcLit = pn; }
      const o = clamp(1 + (ze + 2.6 * G) / (1.2 * G)) * (1 - clamp((ze + 40) / 420)) * clamp((camZ - 120) / 360);
      pn.style.transform = 'translate3d(' + (side * vw * LAT).toFixed(1) + 'px,0,' + z0.toFixed(1) + 'px) rotateY(' + (LAT > 0.1 ? side * -16 * (1 - 0.6 * eInOut(lit)) : 0).toFixed(2) + 'deg) translate(-50%,-50%)' + this.tl(pn);
      this.setOp(pn, Math.round(o * 100) / 100);
      const lc = Math.round(eInOut(lit) * 20) / 20;
      if (pn.__lc !== lc && LAT === 0) { pn.__lc = lc; const b = this.qa(pn, '[data-svc-bar]')[0]; if (b) b.style.transform = 'scaleX(' + lc + ')'; }
      else if (pn.__lc !== lc) { pn.__lc = lc; pn.style.outlineColor = 'rgb(' + Math.round(43 + (232 - 43) * lc) + ',' + Math.round(44 + (163 - 44) * lc) + ',' + Math.round(44 + (58 - 44) * lc) + ')'; }
      const rv = passed ? 1 : lit;
      const inner = this.qa(pn, '[data-svc-inner]')[0], rule = this.qa(pn, '[data-svc-rule]')[0];
      if (inner) inner.style.opacity = (0.22 + 0.78 * Math.max(lit, passed ? 0.4 : 0)).toFixed(2);
      if (rule) rule.style.transform = 'scaleY(' + eOut(clamp(rv * 1.4)).toFixed(4) + ')';
      this.qa(pn, '[data-sw]').forEach((w) => {
        const i = parseInt(w.getAttribute('data-sw') || '0', 10), wk = eOut(clamp(rv * 1.5 - 0.2 - i * 0.14));
        w.style.transform = wk >= 1 ? '' : 'translate3d(0,' + ((1 - wk) * 105).toFixed(2) + '%,0)';
      });
      this.qa(pn, '[data-svc-d]').forEach((dn) => {
        const j = parseInt(dn.getAttribute('data-svc-d') || '0', 10), dk = eOut(clamp(rv * 1.9 - 0.55 - j * 0.12));
        dn.style.opacity = dk.toFixed(3);
        dn.style.transform = 'translate3d(0,' + ((1 - dk) * 22).toFixed(1) + 'px,0)';
      });
    });
  }

  fxRise(el: N, e: number, stage: boolean, vh: number) {
    const rises = this.qa(el, '[data-rise]'), fades = this.qa(el, '[data-fadeup]');
    if (stage) {
      const x = eOut(clamp((e - 0.3) / 0.55)), y = eOut(clamp((e - 0.5) / 0.45));
      rises.forEach((n) => { n.style.transition = ''; n.style.transform = x >= 1 ? '' : 'translate3d(0,' + ((1 - x) * 105).toFixed(2) + '%,0)'; });
      fades.forEach((n) => { n.style.transition = ''; n.style.opacity = y >= 1 ? '' : String(y); n.style.transform = y >= 1 ? '' : 'translate3d(0,' + ((1 - y) * 16).toFixed(1) + 'px,0)'; });
      return;
    }
    const all = rises.concat(fades);
    if (this.rm) { all.forEach((n) => { n.style.transform = ''; n.style.opacity = ''; n.style.transition = ''; }); return; }
    all.forEach((n) => {
      if (n.dataset.shown) return;
      const isRise = n.hasAttribute('data-rise');
      if (n.getBoundingClientRect().top < vh * 0.9) {
        n.dataset.shown = '1';
        n.style.transition = 'transform 760ms cubic-bezier(0.16,1,0.3,1), opacity 600ms ease-out';
        n.style.transform = ''; n.style.opacity = '';
      } else {
        n.style.transition = 'none';
        n.style.transform = isRise ? 'translate3d(0,105%,0)' : 'translate3d(0,16px,0)';
        if (!isRise) n.style.opacity = '0';
      }
    });
  }

  fxWipe(el: N, t: number, stage: boolean) {
    const w = this.qa(el, '[data-wipe]')[0], hd = this.qa(el, '[data-wipe-handle]')[0];
    if (!w || !hd) return;
    const auto = stage ? eInOut(clamp((t - 0.08) / 0.7)) : 0.5;
    let x = this.wipeManual != null ? this.wipeManual : auto;
    if (this.wipeRel) {
      const k = clamp((performance.now() - this.wipeRel.t) / 850);
      const c1 = 1.70158, c3 = c1 + 1, eb = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
      x = clamp(this.wipeRel.from + (auto - this.wipeRel.from) * eb, -0.02, 1.02);
      if (k >= 1) this.wipeRel = null;
    }
    w.style.clipPath = 'inset(0 ' + (100 - x * 100).toFixed(2) + '% 0 0)';
    hd.style.transform = 'translateX(' + (x * (hd.parentElement as HTMLElement).clientWidth).toFixed(1) + 'px)';
    hd.setAttribute('aria-valuenow', String(Math.round(x * 100)));
  }
  wipeDown = (e: RPointerEvent<HTMLElement>) => {
    const hd = e.currentTarget, frame = hd.parentElement as HTMLElement;
    e.preventDefault();
    try { hd.setPointerCapture(e.pointerId); } catch { /* capture unsupported */ }
    const move = (ev: PointerEvent | RPointerEvent) => { const r = frame.getBoundingClientRect(); this.wipeManual = clamp((ev.clientX - r.left) / r.width); this.frame(); };
    const up = () => {
      if (this.wipeManual != null && !this.rm) { this.wipeRel = { from: this.wipeManual, t: performance.now() }; this.wipeManual = null; }
      hd.removeEventListener('pointermove', move); hd.removeEventListener('pointerup', up); hd.removeEventListener('pointercancel', up);
    };
    hd.addEventListener('pointermove', move); hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    try { hd.focus({ preventScroll: true }); } catch { /* focus unsupported */ }
    move(e);
  };
  wipeKey = (e: RKeyboardEvent<HTMLElement>) => {
    const cur = parseInt(e.currentTarget.getAttribute('aria-valuenow') || '50', 10) / 100;
    let x: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') x = cur - 0.05;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') x = cur + 0.05;
    else if (e.key === 'Home') x = 0;
    else if (e.key === 'End') x = 1;
    if (x == null) return;
    e.preventDefault(); this.wipeManual = clamp(x); this.frame();
  };

  fxPar(el: N, t: number, stage: boolean) {
    this.qa(el, '[data-par]').forEach((n) => {
      const rate = parseFloat(n.getAttribute('data-par') || '0') * (this.isCaseWide() ? 1 : 0.5);
      n.style.transform = stage ? 'translate3d(0,' + (rate * (t - 0.5) * 100).toFixed(1) + 'px,0)' : '';
    });
  }

  setHover(n: number | null) { if (n !== this.hoverNode) { this.hoverNode = n; this.frame(); } }
  pin(n: number) { this.pinNode = this.pinNode === n ? null : n; this.setHover(this.pinNode == null ? n : this.pinNode); }
  hoverOff() { this.setHover(this.pinNode); }

  fxBuild(el: N, t: number, stage: boolean) {
    this.qa(el, '[data-build]').forEach((n) => {
      const idx = parseInt(n.getAttribute('data-build') || '0', 10);
      const lp = stage ? eOut(clamp((t - BOXE_STEPS[idx]) / 0.09)) : 1;
      const wire = n.getAttribute('data-wire');
      if (wire) {
        const line = this.qa(n, '[data-wire-line]')[0];
        if (line) line.style.transform = stage ? (wire === 'v' || wire === 'vu' ? 'scaleY(' + lp + ')' : 'scaleX(' + lp + ')') : '';
        n.style.opacity = stage ? String(0.2 + 0.8 * lp) : '';
      } else {
        n.style.opacity = stage ? String(0.14 + 0.86 * lp) : '';
        n.style.transform = stage ? 'translate3d(0,' + ((1 - lp) * 8).toFixed(1) + 'px,0)' : '';
      }
    });
    const pk = this.qa(el, '[data-packet]')[0];
    if (pk) {
      const wl = (pk.parentElement as HTMLElement).querySelector('[data-wire-line]') as HTMLElement | null;
      const W = wl ? wl.offsetWidth : 0;
      const x = stage ? eInOut(clamp((t - 0.86) / 0.1)) : 0;
      pk.style.transform = 'translate3d(' + ((1 - x) * Math.max(0, W - 5)).toFixed(1) + 'px,0,0)';
      pk.style.opacity = stage && x > 0 && x < 1 ? '1' : '0';
    }
    const done = stage && t >= 0.96;
    this.qa(el, '[data-node]').forEach((nd) => {
      const ni = parseInt(nd.getAttribute('data-node') || '0', 10);
      const hot = this.hoverNode === ni || (ni === 0 && done && this.hoverNode == null);
      nd.style.borderColor = hot ? AMB : nd.getAttribute('data-bc') || '';
    });
  }

  fxCode(el: N, t: number, stage: boolean) {
    const tt = stage ? clamp(t / 0.85) : 1;
    this.qa(el, '[data-line]').forEach((n) => {
      const i = parseInt(n.getAttribute('data-line') || '0', 10);
      n.style.opacity = !stage ? '1' : (0.22 + 0.78 * eOut(clamp((tt - 0.04 - i * 0.06) / 0.06))).toFixed(3);
    });
  }

  fxContact(el: N, r: DOMRect, stage: boolean, vh: number) {
    const layer = this.qa(el, '[data-contact-layer]')[0], inner = this.qa(el, '[data-contact-in]')[0];
    if (!layer || !inner) return;
    const words = this.qa(el, '[data-cw]');
    if (!stage) { this.cp = 0; this.cpPainted = -1; layer.style.clipPath = ''; layer.style.opacity = ''; layer.style.pointerEvents = ''; inner.style.opacity = ''; inner.style.transform = ''; words.forEach((w) => { w.style.transform = ''; }); return; }
    this.cEls = { layer, inner, words };
    this.cp = clamp((vh - r.top) / Math.max(1, r.height));
    this.paintContact();
  }
  paintContact() {
    if (!this.cEls || !this.isStage()) return;
    const { layer, inner, words } = this.cEls;
    const p = this.cp;
    if (p === this.cpPainted && layer.__cv === this.qv) return;
    this.cpPainted = p; layer.__cv = this.qv;
    const e = clamp(p / 0.18);
    const open = eInOut(clamp(p / 0.78));
    if (this.svcCovered !== (p > 0.72)) { const sv = this.byId('services') as N | null; if (sv) this.fxSvc(sv, sv.getBoundingClientRect(), true, window.innerHeight); }
    layer.style.clipPath = 'circle(' + (open * 82).toFixed(2) + '% at 50% 50%)';
    layer.style.opacity = String(eOut(e));
    layer.style.pointerEvents = e > 0.6 ? 'auto' : 'none';
    const ci = clamp((p - 0.08) / 0.28);
    inner.style.opacity = String(ci);
    inner.style.transform = 'translate3d(0,' + ((1 - eSine(clamp((p - 0.08) / 0.92))) * 40).toFixed(1) + 'px,0)';
    words.forEach((w) => {
      const i = parseInt(w.getAttribute('data-cw') || '0', 10);
      const x = eOut(clamp((p - 0.12 - i * 0.07) / 0.42));
      w.style.transform = x >= 1 ? '' : 'translate3d(0,' + ((1 - x) * 105).toFixed(2) + '%,0)';
    });
  }

  // ---- Phase (which act is current) ----
  detect() {
    if (Date.now() - this.focusAt < 700) return;
    const vh = window.innerHeight, line = this.isStage() ? 2 : vh * 0.42;
    let cur = 'profile';
    this.qa(document.body, '[data-phase]:not([data-phase=""])').forEach((el) => {
      if (el.getBoundingClientRect().top > line) return;
      cur = el.getAttribute('data-phase') || cur;
    });
    this.setPhase(cur);
  }
  setPhase(id: string | null) {
    if (!id || id === this.phase) return;
    if (id !== 'sneakar') this.wipeManual = null;
    this.phase = id;
  }

  // ---- Navigation ----
  goService(i: number) {
    if (!this.isStage()) { const li = this.byId(SERVICES[i].id); if (li) this.scrollToY(li.getBoundingClientRect().top + window.scrollY - 24); return; }
    const el = this.byId('services');
    if (!el) return;
    const vh = window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    this.scrollToY(top + (SVC_S1 + i * SVC_SEG) / (SVC_VH - 100) * (el.offsetHeight - vh));
  }
  onNav = (e: RMouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute('href');
    if (href === '#contact' && this.isStage()) { e.preventDefault(); e.stopPropagation(); this.scrollToY(document.documentElement.scrollHeight - window.innerHeight); }
    else if (href && href.length > 1 && this.lenis) {
      const target = document.querySelector(href);
      if (target) { e.preventDefault(); e.stopPropagation(); this.scrollToY(target.getBoundingClientRect().top + window.scrollY + (href === '#work' && this.isStage() ? window.innerHeight : 0)); }
    }
  };
  skipDive = () => { const w = this.byId('work'); if (w) this.scrollToY(w.getBoundingClientRect().top + window.scrollY + window.innerHeight); };
  toTop = (e: RMouseEvent) => { e.preventDefault(); e.stopPropagation(); this.scrollToY(0); };
}

export function useScrollScene(view: SceneView, host: SceneHost) {
  const ref = useRef<Scene | null>(null);
  if (!ref.current) ref.current = new Scene(host);
  const scene = ref.current;
  scene.host = host;
  // Every commit: refresh cached lookups and repaint.
  useIsoLayoutEffect(() => { scene.commit(view); });
  useIsoLayoutEffect(() => { scene.mount(); return () => scene.destroy(); }, [scene]);
  return scene;
}
