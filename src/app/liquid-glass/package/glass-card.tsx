"use client";
import { useRef, useEffect } from "react";

interface GlassCardProps {
  width?: string;
  height?: string;
  children?: React.ReactNode;
}

export default function GlassCard({
  width = "300px",
  height = "180px",
  children,
}: GlassCardProps) {
  return (
    <div
      className="rounded-3xl"
      style={{
        width,
        height,
        backdropFilter: "blur(2px)",
        background:
          "linear-gradient(to bottom right, rgba(200, 200, 200, 0.1), rgba(255, 255, 255, 0.01))",
      }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-sm">
        <div className="absolute inset-0 rounded-3xl z-10" />
        <div className="absolute inset-0 z-20 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-white/2 mix-blend-screen pointer-events-none animate-pulse" />
        <div className="absolute inset-0 rounded-3xl shadow-[inset_1.5px_1.5px_0_rgba(255,255,255,0.4),inset_-1.5px_-1.5px_0_rgba(255,255,255,0.2)]  ring-5 ring-white/20 " />
        <div className="relative z-50 w-full h-full text-white text-opacity-90 backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
