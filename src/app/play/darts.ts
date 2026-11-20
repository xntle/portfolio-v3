// Dart scoring. The board is measured in millimetres like a real one:
// the double ring ends 170 mm from the centre.

/** The numbers round the board, clockwise from the top. */
export const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const BULL = 6.35, OUTER_BULL = 16, TRIPLE = [99, 107], DOUBLE = [162, 170];

/** Radius of the board, to the outside of the double ring. */
export const BOARD_MM = DOUBLE[1];
export const DARTS_PER_ROUND = 3;

/** A set of three darts worth this much earns three more. */
export const BONUS_AT = 100;
export const MAX_DARTS = 30;

/** How many darts a round gets, given the points thrown so far: three, and
 *  three more each time a set of three adds up to 100 or more. */
export function dartsAllowed(points: readonly number[]): number {
  let n = DARTS_PER_ROUND;
  while (n < MAX_DARTS && points.length >= n && points.slice(n - DARTS_PER_ROUND, n).reduce((a, b) => a + b, 0) >= BONUS_AT) n += DARTS_PER_ROUND;
  return n;
}

/** Every score a single dart can make. */
const VALUES = new Set<number>([0, 25, 50]);
for (let n = 1; n <= 20; n++) [n, n * 2, n * 3].forEach((v) => VALUES.add(v));
export const isDartValue = (v: unknown): v is number => typeof v === "number" && VALUES.has(v);

export type DartHit = { points: number; label: string };
export type DartsState = { hits: DartHit[]; total: number; left: number };
export type TopScore = { name: string; score: number; message?: string | null };

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
