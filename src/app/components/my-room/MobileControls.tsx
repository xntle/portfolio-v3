"use client";
import React, { useEffect, useState, useRef } from "react";
import { Dir } from "./PlayerSprite";

type Props = {
  onMove: (dir: Dir) => void;
};

export default function MobileControls({ onMove }: Props) {
  const [active, setActive] = useState(false);
  const [isReady, setIsReady] = useState(false); // Safety delay to prevent ghost clicks
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentDirRef = useRef<Dir | null>(null);

  // Prevent ghost inputs on mount
  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  // Start movement loop
  useEffect(() => {
    if (active && currentDirRef.current && isReady) {
      if (!moveIntervalRef.current) {
        // Initial move immediately
        onMove(currentDirRef.current);
        // Then repeat
        moveIntervalRef.current = setInterval(() => {
          if (currentDirRef.current) onMove(currentDirRef.current);
        }, 150); // Slightly faster step interval for D-pad feel
      }
    } else {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
    }
  }, [active, onMove]);

  const handleStart = (dir: Dir) => (e: React.PointerEvent) => {
    // e.preventDefault();
    if (!isReady) return;
    currentDirRef.current = dir;
    setActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleEnd = (e: React.PointerEvent) => {
    // e.preventDefault();
    setActive(false);
    currentDirRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Button Style
  const btnClass =
    "w-12 h-12 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg active:bg-white/30 transition-colors touch-none select-none";

  return (
    <div className="fixed inset-0 z-40 pointer-events-none md:hidden">
      {/* D-Pad Container - Bottom Right */}
      <div
        className={`absolute bottom-8 right-8 pointer-events-auto transition-opacity duration-300 ${
          isReady ? "opacity-100" : "opacity-50 pointer-events-none"
        }`}
      >
        <div className="grid grid-cols-3 gap-2">
          {/* Row 1: Up (Center) */}
          <div />
          <button
            className={btnClass}
            onPointerDown={handleStart("up")}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
            style={{ touchAction: "none" }}
          >
            ▲
          </button>
          <div />

          {/* Row 2: Left, Down (Center - empty?), Right */}
          <button
            className={btnClass}
            onPointerDown={handleStart("left")}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
            style={{ touchAction: "none" }}
          >
            ◀
          </button>

          {/* Down is usually below, but some layouts put Down in middle? 
              Standard D-Pad: Up top, Down bottom, Left left, Right right. 
              Middle is empty.
          */}
          <button
            className={btnClass}
            onPointerDown={handleStart("down")}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
            style={{ touchAction: "none" }}
          >
            ▼
          </button>

          <button
            className={btnClass}
            onPointerDown={handleStart("right")}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
            style={{ touchAction: "none" }}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
