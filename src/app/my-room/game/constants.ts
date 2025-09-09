export const COLS = 20;
export const ROWS = 12; // your current file uses 15
export const TILE_PX = 60;
export const TILE_SRC = "/pixel/tile.png";

// Layout numbers from your current file
export const TOP_H = 3;
export const MAIN_H = 8;
export const ENTRANCE_H = 1;
export const ENTRANCE_W = 2;

export const MAIN_W = 14;
export const CENTER_TOP_W = 8; // your current value
export const SIDE_WALL_W = 3; // your current value
export const MID_WALL_W = 3;
export const MID_WALL_H = 3;

export const mainLeft = Math.floor((COLS - MAIN_W) / 2); // 3
export const centerWallLeft = mainLeft + SIDE_WALL_W; // 6 if SIDE_WALL_W=3? (comment kept from your file)
export const WALK_MIN = 6;
export const WALK_MAX = 10;
export const MID_WALL_START =
  WALK_MIN + Math.floor((WALK_MAX - WALK_MIN + 1 - MID_WALL_W) / 2);
