"use client";
import React from "react";

type Props = {
  onClick: () => void;
};

export default function HelpButton({ onClick }: Props) {
  return (
    <button
      aria-label="Open help"
      onClick={onClick}
      className="absolute top-2 right-2 z-[98] w-8 h-8 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-200 hover:bg-neutral-700 transition shadow"
    >
      ?
    </button>
  );
}
