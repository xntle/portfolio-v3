"use client";
import dynamic from "next/dynamic";

const GameRoot = dynamic(() => import("./GameRoot"), {
  ssr: false,
  loading: () => (
    <div className="min-h-dvh w-full grid place-items-center bg-neutral-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <p className="text-neutral-200 text-sm tracking-wide">Loading room…</p>
        <p className="text-neutral-500 text-xs">
          fetching sprites & sounds should take about 5 seconds :-)
        </p>
      </div>
    </div>
  ),
});

export default function Page() {
  return <GameRoot />;
}
