// Data derived from the content at load: diagram cells, build steps and stack layers.
import { LAYERS, PROJECTS, ROWS, type SystemDiagramMedia } from '@/content/home';

export type Kind = 'wipe' | 'parallax' | 'build' | 'code';

const MEDIA_KIND: Record<string, Kind> = { comparison: 'wipe', deviceShowcase: 'parallax', systemDiagram: 'build', codeSnippet: 'code' };
export const kindOf = (blockType: string): Kind => MEDIA_KIND[blockType] || 'wipe';

export type DiagramCell =
  | { type: 'node'; i: number; b: number; col: string; row: string; title: string; tech: string; bc: string }
  | { type: 'h' | 'hl'; b: number; col: string; row: string; label: string }
  | { type: 'v'; b: number; col: string; row: string; label: string; origin: string }
  | { type: 'loop'; b: number; col: string; row: string; label: string }
  | { type: 'up'; b: number; col: string; row: string };

const diagramCells = (d: SystemDiagramMedia) => {
  const n = d.nodes.length, top = Math.min(n, 3), cells: DiagramCell[] = [];
  let b = 0;
  const node = (i: number, col: number, row: number) => cells.push({ type: 'node', i, b: b++, col: String(col), row: String(row), title: d.nodes[i].title, tech: d.nodes[i].tech.join(', '), bc: d.nodes[i].highlight ? '#EDEBE6' : '#4A4B4B' });
  for (let i = 0; i < top; i++) { node(i, 1 + 2 * i, 1); if (i < top - 1) cells.push({ type: 'h', b: b++, col: String(2 + 2 * i), row: '1', label: d.nodes[i].link || '' }); }
  if (n > 3) {
    cells.push({ type: 'v', b: b++, col: '5', row: '2', label: d.nodes[2].link || '', origin: '50% 0%' });
    for (let j = 3; j < n; j++) { node(j, 5 - 2 * (j - 3), 3); if (j < n - 1) cells.push({ type: 'hl', b: b++, col: String(4 - 2 * (j - 3)), row: '3', label: d.nodes[j].link || '' }); }
    if (d.loop) {
      const lastCol = 5 - 2 * (n - 4);
      if (lastCol > 1) { cells.push({ type: 'loop', b: b++, col: '1 / span ' + (lastCol - 1), row: '3', label: d.loop.label }); cells.push({ type: 'up', b: b++, col: '1', row: '2 / span 2' }); }
      else cells.push({ type: 'v', b: b++, col: '1', row: '2', label: d.loop.label, origin: '50% 100%' });
    }
  }
  return cells;
};

const DIAGRAM = PROJECTS.map((p) => p.media).find((m): m is SystemDiagramMedia => m.blockType === 'systemDiagram');
export const DIAGRAM_CELLS: DiagramCell[] = DIAGRAM ? diagramCells(DIAGRAM) : [];
export const BOXE_STEPS = DIAGRAM_CELLS.map((c, m, a) => 0.08 + m * (0.76 / Math.max(1, a.length - 1)));

export const LAYER_DATA = LAYERS.map(([key, name], i) => {
  const row = ROWS.find((x) => x[0] === key);
  const items = row ? row[1] : [];
  return { i, name, items, fs: 'min(' + (82 / (name.length * 0.56)).toFixed(2) + 'vw, 28vh)', count: items.length + (items.length === 1 ? ' tool' : ' tools') };
});
