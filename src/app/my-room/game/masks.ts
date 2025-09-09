import {
  COLS,
  ROWS,
  TOP_H,
  MAIN_H,
  ENTRANCE_H,
  ENTRANCE_W,
  MAIN_W,
  SIDE_WALL_W,
  CENTER_TOP_W,
  MID_WALL_H,
  mainLeft,
  centerWallLeft,
} from "./constants";
import { Wall } from "./types";

export function buildWalkable(): boolean[][] {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  // Rows 0–2: center band walkable per your current constants; sides are non-walkable
  for (let r = 0; r < TOP_H; r++) {
    for (let c = centerWallLeft; c < centerWallLeft + CENTER_TOP_W; c++)
      grid[r][c] = true;
  }

  // Rows 3..(3+MAIN_H-1): 14-wide middle room walkable
  for (let r = TOP_H; r < TOP_H + MAIN_H; r++) {
    for (let c = mainLeft; c < mainLeft + MAIN_W; c++) grid[r][c] = true;
  }

  // Entrance: last row (TOP_H + MAIN_H), 2-wide centered
  const entLeft = Math.floor((COLS - ENTRANCE_W) / 2);
  for (let r = TOP_H + MAIN_H; r < TOP_H + MAIN_H + ENTRANCE_H; r++) {
    for (let c = entLeft; c < entLeft + ENTRANCE_W; c++) grid[r][c] = true;
  }

  return grid;
}

export function buildWalls(): { walls: Wall[]; occ: (Wall | null)[][] } {
  const occ: (Wall | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );

  // Top mid wall (8×3) per your current constants
  const wallMid: Wall = {
    id: "wallMid",
    name: "wallMid",
    pos: { r: 0, c: centerWallLeft },
    size: { w: CENTER_TOP_W, h: TOP_H },
    placeholderLabel: "WM",
  };

  // Left & Right 3×3 walls on rows 3–5
  const wallLeft: Wall = {
    id: "wallLeft",
    name: "wallLeft",
    pos: { r: TOP_H, c: mainLeft },
    size: { w: SIDE_WALL_W, h: MID_WALL_H },
    placeholderLabel: "WL",
  };
  const wallRight: Wall = {
    id: "wallRight",
    name: "wallRight",
    pos: { r: TOP_H, c: mainLeft + MAIN_W - SIDE_WALL_W },
    size: { w: SIDE_WALL_W, h: MID_WALL_H },
    placeholderLabel: "WR",
  };

  const walls = [wallLeft, wallMid, wallRight];

  for (const w of walls) {
    for (let r = w.pos.r; r < w.pos.r + w.size.h; r++) {
      for (let c = w.pos.c; c < w.pos.c + w.size.w; c++) occ[r][c] = w;
    }
  }
  return { walls, occ };
}
