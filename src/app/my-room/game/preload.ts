import { useEffect, useState } from "react";
import { getImageProps } from "next/image";
import { TILE_PX, TILE_SRC } from "./constants";
import { ITEMS } from "./items";
import { HOST_SPRITES, ITEM_SPRITES, PLAYER_SPRITES } from "./sprites";

type Warm = { src: string; srcSet?: string };

// Same URLs next/image will request for this src at this size,
// so the warmed response is the one the room actually renders.
function imageProps(src: string, width: number, height: number): Warm {
  const { props } = getImageProps({ src, alt: "", width, height });
  return { src: props.src, srcSet: props.srcSet };
}

// Sharpest optimized candidate, for places that need a plain URL (CSS backgrounds)
export function optimizedSrc(src: string, px: number) {
  const { src: fallback, srcSet } = imageProps(src, px, px);
  const last = srcSet?.split(", ").pop()?.split(" ")[0];
  return last ?? fallback;
}

export const TILE_BG_SRC = optimizedSrc(TILE_SRC, TILE_PX);

function buildWarmList(): Warm[] {
  const list: Warm[] = [{ src: TILE_BG_SRC }];
  const portrait = Math.round(TILE_PX * 3); // DialogueBox portrait size
  const player = Math.round(TILE_PX * 1.5); // PlayerSprite size

  for (const it of ITEMS) {
    const src = ITEM_SPRITES[it.id];
    if (!src) continue;
    // in the room
    list.push(
      imageProps(
        src,
        Math.round((it.size?.w ?? 1) * TILE_PX),
        Math.round((it.size?.h ?? 1) * TILE_PX)
      )
    );
    // in the dialogue box
    list.push(imageProps(src, portrait, portrait));
  }
  for (const src of [HOST_SPRITES.normal, HOST_SPRITES.furious]) {
    list.push(imageProps(src, portrait, portrait));
  }
  for (const src of Object.values(PLAYER_SPRITES).flat()) {
    list.push(imageProps(src, player, player));
  }
  return list;
}

// keep references so decoded images stay around for the session
const warmed: HTMLImageElement[] = [];

function warm({ src, srcSet }: Warm): Promise<void> {
  const img = new Image();
  if (srcSet) img.srcset = srcSet;
  img.src = src;
  warmed.push(img);
  // a failed image should not block the game
  return img.decode().catch(() => {});
}

// Loads and decodes every image the room can show. `ready` flips when all are
// in, or after `timeoutMs` so a slow connection can still start.
export function usePrewarm(timeoutMs = 15000) {
  const [state, setState] = useState({ done: 0, total: 0, ready: false });

  useEffect(() => {
    let cancelled = false;
    const list = buildWarmList();
    let done = 0;
    setState({ done, total: list.length, ready: false });

    list.forEach((w) =>
      warm(w).then(() => {
        if (cancelled) return;
        done += 1;
        setState((s) => ({
          done,
          total: list.length,
          ready: s.ready || done === list.length,
        }));
      })
    );

    const id = window.setTimeout(() => {
      if (!cancelled) setState((s) => ({ ...s, ready: true }));
    }, timeoutMs);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [timeoutMs]);

  return state;
}
