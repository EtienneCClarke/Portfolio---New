'use client';
import { useHome } from './HomeContext';
import { OccCorners } from './OccCorners';
import s from './PillNav.module.css';

// Desktop nav: a centred pill at the top of the hero that tucks away into "Hover for menu" once you scroll.
export function PillNav() {
  const { scene, touch } = useHome();
  return (
    <>
      <div
        data-pill-hint=""
        aria-hidden="true"
        className={s['pill-nav__hint']}
        onClick={touch ? () => scene.pillTapOpen() : undefined}
      >
        {touch ? 'Tap for menu' : 'Hover for menu'}
      </div>
      <nav
        data-pill=""
        aria-label="Primary"
        className={s['pill-nav']}
        onMouseEnter={() => scene.pillIn()}
        onMouseLeave={() => scene.pillOut()}
        onBlur={() => scene.pillBlur()}
      >
        <OccCorners />
        <ul data-pill-full="" className={s['pill-nav__list']}>
          <li><a href="#" className={`${s['pill-nav__link']} ${s['pill-nav__link--name']}`} onClick={scene.toTop}>Etienne Cellier‑Clarke</a></li>
          <li><a href="#work" className={s['pill-nav__link']} onClick={scene.onNav}>Case Studies</a></li>
          <li><a href="#services" className={s['pill-nav__link']} onClick={scene.onNav}>Services</a></li>
          <li><a href="#contact" className={`${s['pill-nav__link']} ${s['pill-nav__link--cta']}`} onClick={scene.onNav}>Contact</a></li>
        </ul>
      </nav>
    </>
  );
}
