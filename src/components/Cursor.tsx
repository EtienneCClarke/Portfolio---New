import s from './Cursor.module.css';

// Follower ring and dot for fine pointers; positioned by the scene loop.
export function Cursor() {
  return (
    <>
      <div data-cursor="" className={s.cursor} aria-hidden="true">
        <div data-cursor-ring="" className={s.cursor__ring}><span data-cursor-label="" /></div>
      </div>
      <div data-cursor-dot="" className={s.cursor__dot} aria-hidden="true" />
    </>
  );
}
