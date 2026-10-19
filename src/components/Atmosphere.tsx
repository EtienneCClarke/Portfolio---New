import s from './Atmosphere.module.css';

// Film grain, vignette and the drifting light blobs the scene moves with scroll (global, decorative).
export function Atmosphere() {
  return (
    <>
      <div className={s.atmosphere__grain} aria-hidden="true"><div className={s.atmosphere__noise} /></div>
      <div className={s.atmosphere__vignette} aria-hidden="true" />
      <div data-atmo="" className={s.atmosphere} aria-hidden="true">
        <div data-atmo-a="" className={s.atmosphere__a} />
        <div data-atmo-b="" className={s.atmosphere__b} />
        <div data-atmo-beam="" className={s.atmosphere__beam} />
        <div data-atmo-beam2="" className={s.atmosphere__beam2} />
      </div>
    </>
  );
}
