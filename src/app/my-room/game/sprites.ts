import { ItemId, WallId } from "./types";

export const ITEM_SPRITES: Partial<Record<ItemId, string>> = {
  poster: "/pixel/items/poster.png",
  desk: "/pixel/items/desk.png",
  monstera: "/pixel/items/monstera.png",
  ukulele: "/pixel/items/ukulele.gif",
  whiteboard: "/pixel/items/whiteboard.png",
  passport: "/pixel/items/passport.png",
  celsius: "/pixel/items/celsius.png",
  clock: "/pixel/items/clock.png",
  mat: "/pixel/items/mat.png",
  window: "/pixel/items/window.png",
  bookshelf: "/pixel/items/bookshelf.png",
  bed: "/pixel/items/bed.png",
  sock: "/pixel/items/sock.png",
  lamp: "/pixel/items/lamp.png",
};

export const HOST_SPRITES = {
  normal: "/pixel/host/normal.png",
  angry: "/pixel/host/angry.png",
  furious: "/pixel/host/furious.png",
} as const;

export const WALL_SPRITES: Partial<Record<WallId, string>> = {
  wallMid: "/pixel/walls/wallMid.png",
  wallLeft: "/pixel/walls/wallLeft.png",
  wallRight: "/pixel/walls/wallRight.png",
};

// 2 frames per direction: index 0 = "...1", index 1 = "...2"
export const PLAYER_SPRITES = {
  down: ["/pixel/player/down1.png", "/pixel/player/down2.png"],
  right: ["/pixel/player/right1.png", "/pixel/player/right2.png"],
  up: ["/pixel/player/up1.png", "/pixel/player/up2.png"],
} as const;

export function preloadPlayerSprites() {
  [
    ...PLAYER_SPRITES.down,
    ...PLAYER_SPRITES.right,
    ...PLAYER_SPRITES.up,
  ].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export function preloadSprites(extra: string[] = []) {
  const urls = [
    ...Object.values(ITEM_SPRITES),
    ...Object.values(WALL_SPRITES),
    ...extra,
  ].filter(Boolean) as string[];
  urls.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

// Reuse placeholder generator from utils, but allow local import without cycles
export function placeholderDataUri(label: string, px: number) {
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
