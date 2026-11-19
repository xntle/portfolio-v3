// Dart scoring. The board is measured in millimetres like a real one:
// the double ring ends 170 mm from the centre.

const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const BULL = 6.35, OUTER_BULL = 16, TRIPLE = [99, 107], DOUBLE = [162, 170];

/** Radius of the board, to the outside of the double ring. */
export const BOARD_MM = DOUBLE[1];
export const DARTS_PER_ROUND = 3;

export type DartHit = { points: number; label: string };
export type DartsState = { hits: DartHit[]; total: number; left: number };

/** Score a dart at (x, y) mm from the centre; x to the right, y up. */
export function scoreDart(x: number, y: number): DartHit {
  const r = Math.hypot(x, y);
  if (r <= BULL) return { points: 50, label: "Bullseye" };
  if (r <= OUTER_BULL) return { points: 25, label: "Outer bull" };
  if (r > DOUBLE[1]) return { points: 0, label: "Miss" };
  // wedges are 18° wide and 20 sits centred on straight up
  const deg = ((Math.atan2(x, y) * 180) / Math.PI + 369) % 360;
  const n = ORDER[Math.floor(deg / 18)];
  if (r >= DOUBLE[0]) return { points: n * 2, label: `Double ${n}` };
  if (r >= TRIPLE[0] && r <= TRIPLE[1]) return { points: n * 3, label: `Triple ${n}` };
  return { points: n, label: String(n) };
}
