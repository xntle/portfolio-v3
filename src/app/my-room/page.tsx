"use client";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import Link from "next/link";

// Lazy-load GameRoot with a loading screen
const GameRoot = dynamic(() => import("./GameRoot"), {
  ssr: false,
  loading: () => (
    <div className="min-h-dvh w-full grid place-items-center bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <p className="text-neutral-200 text-sm tracking-wide">Loading room…</p>
        <p className="text-neutral-500 text-xs">fetching sprites & sounds</p>
      </div>
    </div>
  ),
});

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const check = () => {
      const smallViewport = window.innerWidth < 768; // md breakpoint
      setIsMobile(mq.matches || smallViewport);
    };
    check();
    const onResize = () => check();
    mq.addEventListener?.("change", check);
    window.addEventListener("resize", onResize);
    return () => {
      mq.removeEventListener?.("change", check);
      window.removeEventListener("resize", onResize);
    };
  }, []);
  return isMobile;
}

function MobileBlocker() {
  return (
    <div className="min-h-dvh w-full grid place-items-center bg-neutral-950 px-6 text-center">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full border border-white/20 grid place-items-center">
          <span className="text-2xl">🎮</span>
        </div>
        <h1 className="text-lg font-semibold text-white">
          Best experienced on desktop
        </h1>
        <p className="text-neutral-300 text-sm">
          This game uses keyboard controls (WASD/arrow keys) and isn’t optimized
          for phones or tablets. Please visit on a laptop or desktop computer.
        </p>
        <Link
          href="/"
          className=" rounded-md bg-neutral-800/70 text-white px-3 py-1 text-sm border border-neutral-600 hover:bg-neutral-700 transition"
          style={{ zIndex: 100 }}
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}

export default function Page() {
  return <GameRoot />;
}
