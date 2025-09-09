"use client";
import React, { useEffect } from "react";

type Props = {
  isOpen: boolean;
  widthPx: number;
  onClose: () => void;
};

export default function HelpOverlay({ isOpen, widthPx, onClose }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute left-1/2 bottom-2 -translate-x-1/2 pointer-events-auto"
      style={{ width: Math.min(widthPx, 720), zIndex: 95 }}
      onClick={onClose}
    >
      <div className="rounded-xl border border-neutral-600/60 bg-neutral-900/85 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="px-4 py-2 bg-neutral-800/70 text-neutral-100 text-sm font-semibold">
          Rules & Controls
        </div>
        <div className="p-4 text-neutral-100 text-sm leading-6">
          <ul className="grid grid-cols-2 gap-y-1">
            <li>
              Move: <span className="font-medium">WASD / Arrows</span>
            </li>
            <li>
              Interact: <span className="font-medium">X</span>
            </li>
            <li>
              Shoes (entrance): <span className="font-medium">J</span>
            </li>
            <li>
              Reset to entrance: <span className="font-medium">R</span>
            </li>
          </ul>
          <div className="mt-2 text-xs text-neutral-400">
            Press <span className="font-semibold text-neutral-200">Enter</span>{" "}
            or <span className="font-semibold text-neutral-200">Esc</span> to
            close.
          </div>
        </div>
      </div>
    </div>
  );
}
