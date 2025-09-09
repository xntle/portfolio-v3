"use client";
import React, { useEffect, useRef } from "react";
import type { Item } from "../../my-room/game/types";

type Props = {
  /** e.g. "/audio/ukulele.mp3" */
  src: string;
  /** tile size (px) */
  tilePx: number;
  /** the item that emits sound (ukulele) */
  item: Item;
  /** player's rendered pixel position (x is tile center; y is tile bottom-center) */
  playerXY: { x: number; y: number };
  /** set true after first key/mouse/touch so autoplay works */
  unlocked: boolean;
  /** full volume inside this radius (tiles) */
  fullRadiusTiles?: number; // default 1.2
  /** silent at/after this radius (tiles) */
  maxRadiusTiles?: number; // default 7
  /** cap volume (0..1) */
  maxVolume?: number; // default 0.6
  /** smoothness (0..1): higher = slower changes */
  smooth?: number; // default 0.2
};

export default function ProximityAudio({
  src,
  tilePx,
  item,
  playerXY,
  unlocked,
  fullRadiusTiles = 1.2,
  maxRadiusTiles = 7,
  maxVolume = 0.6,
  smooth = 0.2,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volRef = useRef(0); // smoothed volume 0..1
  const rafRef = useRef<number | null>(null);

  // init audio once
  useEffect(() => {
    const a = new Audio(src);
    a.loop = true;
    a.preload = "auto";
    a.volume = 0;
    a.muted = false;
    audioRef.current = a;
    return () => {
      a.pause();
      a.src = "";
      audioRef.current = null;
    };
  }, [src]);

  // main loop: compute distance → target volume → smooth → apply
  useEffect(() => {
    const tick = () => {
      const a = audioRef.current;
      if (!a) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // object center in pixels
      const w = item.size?.w ?? 1;
      const h = item.size?.h ?? 1;
      const objX = (item.pos.c + w / 2) * tilePx;
      const objY = (item.pos.r + h / 2) * tilePx;

      // player center (convert y from bottom-center to true center)
      const px = playerXY.x;
      const py = playerXY.y - tilePx / 2;

      const distPx = Math.hypot(px - objX, py - objY);
      const distTiles = distPx / tilePx;

      // piecewise linear falloff (inside r0 = full, at/after r1 = silent)
      const r0 = fullRadiusTiles;
      const r1 = Math.max(r0 + 0.01, maxRadiusTiles);
      let t: number;
      if (distTiles <= r0) t = 1;
      else if (distTiles >= r1) t = 0;
      else t = 1 - (distTiles - r0) / (r1 - r0);

      // gentle curve (square) for nicer falloff
      const target = t * t;

      // smooth toward target
      volRef.current = volRef.current + (target - volRef.current) * smooth;

      // apply volume cap
      const finalVol = Math.max(0, Math.min(1, volRef.current)) * maxVolume;
      if (Math.abs(a.volume - finalVol) > 0.005) a.volume = finalVol;

      // play/pause depending on unlock and audibility
      if (unlocked) {
        if (finalVol > 0.01) {
          // try play; ignore promise rejection on some browsers
          if (a.paused) a.play().catch(() => {});
        } else {
          // save CPU when far away
          if (!a.paused) a.pause();
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    item.pos.r,
    item.pos.c,
    item.size?.w,
    item.size?.h,
    playerXY.x,
    playerXY.y,
    tilePx,
    unlocked,
    fullRadiusTiles,
    maxRadiusTiles,
    maxVolume,
    smooth,
  ]);

  return null; // no DOM
}
