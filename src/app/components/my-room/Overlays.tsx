"use client";
import React from "react";
import { Item, Pos, Wall } from "../../my-room/game/types";
import {
  ITEM_SPRITES,
  WALL_SPRITES,
  placeholderDataUri,
} from "../../my-room/game/sprites";
import { isAdjacentToItem } from "../../my-room/game/utils";
import Image from "next/image";

type Props = {
  tilePx: number;
  items: Item[];
  walls: Wall[];
  pos: Pos;
  activeItem: Item | null;
};

export default function Overlays({
  tilePx,
  items,
  walls,
  pos,
  activeItem,
}: Props) {
  return (
    <>
      {/* Walls under items */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {walls.map((w) => {
          const src =
            WALL_SPRITES[w.id] ??
            placeholderDataUri(w.placeholderLabel, tilePx);
          return (
            <img
              key={w.id}
              alt={w.name}
              src={src}
              style={{
                position: "absolute",
                left: w.pos.c * tilePx,
                top: w.pos.r * tilePx,
                width: w.size.w * tilePx,
                height: w.size.h * tilePx,
                imageRendering: "pixelated",
              }}
            />
          );
        })}
      </div>

      {/* Items above walls */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {items.map((it) => {
          const src =
            ITEM_SPRITES[it.id] ??
            placeholderDataUri(it.placeholderLabel, tilePx);
          const w = it.size?.w ?? 1;
          const h = it.size?.h ?? 1;
          const isActive =
            activeItem?.id === it.id && isAdjacentToItem(pos, it);
          return (
            <Image
              key={it.id}
              alt={it.name}
              src={src}
              width={Math.round(w * tilePx)}
              height={Math.round(h * tilePx)}
              style={{
                position: "absolute",
                left: it.pos.c * tilePx,
                top: it.pos.r * tilePx,
                imageRendering: "pixelated",
                filter: isActive
                  ? "drop-shadow(0 0 8px rgba(255,255,255,0.6))"
                  : undefined,
              }}
              className="pointer-events-none select-none"
              draggable={false}
            />
          );
        })}
      </div>
    </>
  );
}
