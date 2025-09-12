"use client";
import React from "react";
import { Pos, Item } from "../../my-room/game/types";

type Props = {
  rows: number;
  cols: number;
  tilePx: number;
  tileSrc: string;
  walkable: boolean[][];
  pos: Pos;
  activeItem: Item | null;
};

export default function GridFloor({
  rows,
  cols,
  tilePx,
  tileSrc,
  walkable,
  pos,
  activeItem,
}: Props) {
  return (
    <div
      className="grid gap-0"
      style={{
        gridTemplateColumns: `repeat(${cols}, ${tilePx}px)`,
        gridTemplateRows: `repeat(${rows}, ${tilePx}px)`,
        width: cols * tilePx,
        height: rows * tilePx,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const isWalkable = walkable[r][c];

        const floorStyle: React.CSSProperties | undefined = isWalkable
          ? {
              backgroundImage: `url(${tileSrc})`,
              backgroundSize: `${tilePx}px ${tilePx}px`,
              backgroundRepeat: "no-repeat",
            }
          : undefined;

        return (
          <div
            key={i}
            className={"relative " + (isWalkable ? "" : "bg-black")}
            style={{ ...floorStyle, width: tilePx, height: tilePx }}
          >
            {/* Inline [X] prompt (anchor to item top-left) */}
            {activeItem && activeItem.pos.r === r && activeItem.pos.c === c && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 z-90 rounded bg-neutral-800 text-white border border-neutral-700">
                [X] to interact
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
