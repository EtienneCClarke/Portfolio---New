import s from './ScrollDepth.module.css';

// One thin progress rail for the whole page; scaled by the scene.
export function ScrollDepth() {
  return (
    <div data-sitebar="" className={s['scroll-depth']} aria-hidden="true">
      <span className={s['scroll-depth__fill']} />
    </div>
  );
}
