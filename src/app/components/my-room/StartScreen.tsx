"use client";
import React, { useEffect } from "react";

type Props = {
  isOpen: boolean;
  widthPx: number; // usually COLS * TILE_PX
  onStart: () => void; // called when Enter/click
};

export default function StartScreen({ isOpen, widthPx, onStart }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onStart]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
      style={{ width: Math.min(widthPx, 720), zIndex: 100 }}
    >
      <div className="rounded-2xl border border-sky-400/40 bg-neutral-900/90 shadow-2xl backdrop-blur-sm overflow-hidden">
        <div className="px-5 py-3 bg-sky-700/40 text-sky-100 font-semibold tracking-wide">
          Welcome
        </div>
        <div className="p-5 text-neutral-100 space-y-3">
          <h1 className="text-xl font-semibold">Welcome to my room</h1>
          <p className="text-sm leading-6">
            Each item here tells a story about me. Wander around, interact, and
            piece things together at your pace.
          </p>

          <div className="mt-2 text-sm border border-neutral-700/60 rounded-lg p-3 bg-neutral-800/40">
            <div className="font-semibold mb-1 text-neutral-200">Controls</div>
            <ul className="grid grid-cols-2 gap-y-1 text-neutral-300">
              <li>
                Move: <span className="font-medium">WASD / Arrows</span>
              </li>
              <li>
                Interact: <span className="font-medium">X</span>
              </li>
              <li>
                Shoes: <span className="font-medium">J</span>
              </li>
              <li>
                Reset to Entrance: <span className="font-medium">R</span>
              </li>
            </ul>
            <div className="mt-2 text-xs text-neutral-400">
              Press <span className="font-semibold text-neutral-200">?</span>{" "}
              anytime for the rules.
            </div>
          </div>

          <button
            onClick={onStart}
            className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition"
          >
            Press Enter (or click) to start
          </button>
        </div>
      </div>
    </div>
  );
}
