# Etienne Cellier-Clarke, temporary homepage

A single-page Next.js 16 site (App Router, TypeScript, React 19). No CMS, no database, no environment variables.

## Run it

Needs Node 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
```

Production:

```bash
npm run build
npm start        # serves on $PORT, or 3000
```

## Hosting

- **Vercel (easiest):** `npx vercel` from this folder, or drag the folder into a new Vercel project. No settings needed.
- **Any Node host** (Render, Railway, a VPS): build command `npm run build`, start command `npm start`.
- It needs a Node server rather than plain static hosting, because `next/image` optimises the case-study images on request (AVIF/WebP).

## Where things are

- `src/content/home.ts`: all copy, case studies, services and contact details. **`CONTACT.linkedin` is empty**: add a URL and a LinkedIn button appears in the footer.
- `src/hooks/useScrollScene.ts`: the motion engine (one requestAnimationFrame loop driving Lenis, every scroll scene, the dust field, the cursor and tilt).
- `src/components/`: one component per section, each with a CSS Module.
- `src/app/layout.tsx`: fonts, metadata and the small inline script that decides whether the intro plays.
- `public/case-studies/`: media. Each video has an AV1 version plus an H.264 fallback, and a poster frame.

## Behaviour worth knowing

- The intro plays on a visitor's **first visit only** (stored in `localStorage` as `ecc-intro`). To see it again, use a private window or clear that key.
- With `prefers-reduced-motion`, there's no intro, no smooth scroll and no pinned scenes: the page renders as a normal static page.
- No favicon is included yet; add `src/app/icon.png` (or `favicon.ico`) if you want one.
