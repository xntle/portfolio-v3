"use client";
import React from "react";
import { PLAYER_SPRITES } from "../../my-room/game/sprites";

export type Dir = "down" | "up" | "right" | "left";

type Props = {
  x: number; // pixel center X of the tile
  y: number; // pixel center Y of the tile
  tilePx: number;
  dir: Dir;
  frameIndex: 0 | 1; // 0 = *1.png, 1 = *2.png
  z?: number;
};

export default function PlayerSprite({
  x,
  y,
  tilePx,
  dir,
  frameIndex,
  z = 60,
}: Props) {
  const flipX = dir === "left";
  const keyDir = dir === "left" ? "right" : dir; // mirror right for left
  const frames = PLAYER_SPRITES[keyDir as "down" | "up" | "right"];
  const src = frames[frameIndex] ?? frames[0];

  const w = 1.5 * tilePx;
  const h = 1.5 * tilePx;

  return (
    <img
      alt="player"
      src={src}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        imageRendering: "pixelated",
        // place the *bottom-center* of the 2×2 sprite on the tile center:
        transform: `translate(-50%, -100%) ${flipX ? "scaleX(-1)" : ""}`,
        zIndex: z,
        pointerEvents: "none",
      }}
    />
  );
}
