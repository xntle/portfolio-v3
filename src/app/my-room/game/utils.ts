import { Item, Pos } from "./types";
import { COLS, ROWS, TILE_PX } from "./constants";

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function placeholderDataUri(label: string, px = TILE_PX) {
  const W = px,
    H = px,
    pad = 2,
    fontSize = Math.round(W * 0.33),
    textY = Math.round(H * 0.6);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>
    <rect x='${pad}' y='${pad}' width='${W - pad * 2}' height='${H - pad * 2}'
          rx='4' ry='4' fill='rgba(255,255,255,0.08)' stroke='rgba(255,255,255,0.35)'/>
    <text x='${W / 2}' y='${textY}' font-size='${fontSize}' text-anchor='middle'
          fill='white' fill-opacity='0.92' font-family='ui-sans-serif,system-ui'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildItemOcc(items: Item[]) {
  const occ: (Item | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );
  for (const it of items) {
    const isSolid = it.solid ?? true; // ← default solid
    if (!isSolid) continue; // ← skip non-solid items
    const w = it.size?.w ?? 1;
    const h = it.size?.h ?? 1;
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        const r = it.pos.r + dr;
        const c = it.pos.c + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) occ[r][c] = it;
      }
    }
  }
  return occ;
}

export function isAdjacentToItem(player: Pos, item: Item): boolean {
  const w = item.size?.w ?? 1;
  const h = item.size?.h ?? 1;
  for (let dr = 0; dr < h; dr++) {
    for (let dc = 0; dc < w; dc++) {
      const r = item.pos.r + dr;
      const c = item.pos.c + dc;
      if (Math.abs(player.r - r) + Math.abs(player.c - c) <= 1) return true; // 4-way adjacency
    }
  }
  return false;
}

export function firstActiveItem(player: Pos, items: Item[]) {
  for (const it of items) if (isAdjacentToItem(player, it)) return it;
  return null;
}
