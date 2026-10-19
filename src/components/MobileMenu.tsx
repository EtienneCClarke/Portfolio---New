'use client';
// Phone nav: a "Menu" button that opens a full-screen menu with a liquid edge.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { CONTACT } from '@/content/home';
import { clamp } from '@/lib/motion';
import { useHome } from './HomeContext';
import s from './MobileMenu.module.css';

export function MobileMenu() {
  const { scene, rm } = useHome();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const st = useRef({ e0: 0, e1: 0, stop: () => {}, prev: false });

  useEffect(() => {
    const a = st.current;
    if (a.prev === open) return;
    a.prev = open;
    scene.lockScroll(open);
    const nav = navRef.current;
    if (!nav) return;
    const l0 = nav.querySelector<HTMLElement>('[data-mnav-l0]'), l1 = nav.querySelector<HTMLElement>('[data-mnav-l1]'), btn = btnRef.current;
    const vw = window.innerWidth, vh = window.innerHeight;
    const b = btn ? btn.getBoundingClientRect() : { left: vw - 80, top: 16, width: 60, height: 44 };
    const ox = b.left + b.width / 2, oy = b.top + b.height / 2;
    const Rmax = Math.hypot(Math.max(ox, vw - ox), Math.max(oy, vh - oy)) * 1.15;
    const links = Array.from(nav.querySelectorAll<HTMLElement>('[data-mnav-ln]'));
    a.stop();
    nav.style.visibility = 'visible'; nav.style.pointerEvents = open ? 'auto' : 'none';
    const e0s = a.e0, e1s = a.e1;
    if (rm) {
      [l0, l1].forEach((l) => { if (l) l.style.clipPath = open ? 'none' : 'circle(0px at 100% 0%)'; });
      links.forEach((n) => { n.getAnimations().forEach((x) => x.cancel()); n.style.transform = open ? 'none' : 'translateY(110%)'; });
      if (!open) nav.style.visibility = 'hidden';
      a.e0 = a.e1 = open ? 1 : 0;
      return;
    }
    links.forEach((n, i) => {
      n.getAnimations().forEach((x) => x.cancel());
      if (open) n.animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 780, delay: 260 + i * 65, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'both' });
      else n.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-35%)', opacity: 0 }], { duration: 220, delay: i * 22, easing: 'cubic-bezier(0.55,0,1,0.45)', fill: 'both' });
    });
    const t0 = performance.now() + (open ? 0 : 90), D = open ? 950 : 640;
    const q4 = (x: number) => 1 - Math.pow(1 - x, 4), io = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const shape = (el: HTMLElement, e: number, amp: number, ph: number) => {
      if (e <= 0.0005) { el.style.clipPath = 'circle(0px at ' + ox.toFixed(1) + 'px ' + oy.toFixed(1) + 'px)'; return; }
      if (e >= 0.9995) { el.style.clipPath = 'none'; return; }
      const R = Rmax * e, cx = ox + (vw / 2 - ox) * 0.35 * e, cy = oy + (vh / 2 - oy) * 0.35 * e;
      let p = 'polygon(';
      for (let i = 0; i < 60; i++) {
        const ang = (i / 60) * Math.PI * 2;
        const r = R * (1 + amp * (0.55 * Math.sin(3 * ang + ph * 2.2) + 0.3 * Math.sin(5 * ang - ph * 3.1) + 0.15 * Math.sin(9 * ang + ph * 4.3)));
        p += (i ? ',' : '') + (cx + Math.cos(ang) * r).toFixed(1) + 'px ' + (cy + Math.sin(ang) * r).toFixed(1) + 'px';
      }
      el.style.clipPath = p + ')';
    };
    a.stop = scene.addTask((now) => {
      const k = Math.max(0, Math.min(1, (now - t0) / D)), ph = Math.max(0, now - t0) / 1000;
      let e0, e1;
      if (open) { e0 = e0s + (1 - e0s) * q4(clamp(k / 0.78)); e1 = e1s + (1 - e1s) * q4(clamp((k - 0.12) / 0.88)); }
      else { e1 = e1s * (1 - io(k)); e0 = k >= 1 ? 0 : Math.min(1.1, e1 + Math.max(0, e0s - e1s) * (1 - k) + 0.045 * Math.sin(Math.PI * k)); }
      a.e0 = e0; a.e1 = e1;
      const amp = (open ? 0.1 : 0.05) * Math.sin(Math.PI * k);
      if (l0) shape(l0, e0, amp, ph);
      if (l1) shape(l1, e1, amp, ph + 1.7);
      if (k < 1) return true;
      if (!open) nav.style.visibility = 'hidden';
      return false;
    });
  }, [open, rm, scene]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => () => { st.current.stop(); if (st.current.prev) scene.lockScroll(false); }, [scene]);

  const close = () => setOpen(false);
  const go = (e: MouseEvent<HTMLAnchorElement>) => { close(); scene.lockScroll(false); scene.onNav(e); };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-mnav-btn=""
        className={s['mobile-menu__button']}
        aria-expanded={open}
        aria-label={open ? 'Close' : 'Menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true" className={s['mobile-menu__labels']}>
          <span className={`${s['mobile-menu__label']} ${s['mobile-menu__label--menu']}`}>Menu</span>
          <span className={`${s['mobile-menu__label']} ${s['mobile-menu__label--close']}`}>Close</span>
        </span>
      </button>
      <nav ref={navRef} data-mnav="" aria-label="Menu" aria-hidden={!open} className={s['mobile-menu']}>
        <div data-mnav-l0="" className={s['mobile-menu__l0']} />
        <div data-mnav-l1="" className={s['mobile-menu__l1']}>
          <a href="#work" onClick={go} className={s['mobile-menu__link']}><span data-mnav-ln="" className={s['mobile-menu__line']}>Case Studies</span></a>
          <a href="#services" onClick={go} className={s['mobile-menu__link']}><span data-mnav-ln="" className={s['mobile-menu__line']}>Services</span></a>
          <a href="#contact" onClick={go} className={s['mobile-menu__link']}><span data-mnav-ln="" className={s['mobile-menu__line']}>Contact</span></a>
          <a href={`mailto:${CONTACT.email}`} onClick={close} className={s['mobile-menu__email']}><span data-mnav-ln="" className={s['mobile-menu__line']}>{CONTACT.email}</span></a>
        </div>
      </nav>
    </>
  );
}
