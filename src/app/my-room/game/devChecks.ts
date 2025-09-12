import { Item } from "./types";
import { buildItemOcc } from "./utils";

export function runDevChecks(walkable: boolean[][], items: Item[]) {
  // Keep this light and non-breaking; your constants have changed a few times.
  const total = walkable.flat().reduce((a, b) => a + (b ? 1 : 0), 0);
  console.debug("[dev] walkable cells:", total);

  // Sanity: items in bounds & no overlap
  const occ = buildItemOcc(items);
  const seen = new Set<string>();
  for (const it of items) {
    const w = it.size?.w ?? 1,
      h = it.size?.h ?? 1;
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        const r = it.pos.r + dr,
          c = it.pos.c + dc;
        console.assert(
          r >= 0 && c >= 0 && occ[r]?.[c]?.id === it.id,
          `${it.id} occupancy ok at ${r},${c}`
        );
        const key = `${r},${c}`;
        console.assert(!seen.has(key), `no overlap at ${key}`);
        seen.add(key);
      }
    }
  }
}
