"use client";
import React from "react";

export type Light = {
  id: string;
  r: number; // tile row (center of light)
  c: number; // tile col (center of light)
  radius: number; // radius in tiles
  intensity?: number; // 0..1 (how bright)
  color?: string; // CSS color (e.g. "255,255,200" for warm)
  softness?: number; // 0..1 (how soft the falloff is)
  pulse?: boolean; // subtle pulsing animation
};

type Props = {
  tilePx: number;
  cols: number;
  rows: number;
  ambient?: number; // 0..1 global darkness
  vignette?: boolean; // add edge darkening
  zIndex?: number; // default 50 (above board)
  lights?: Light[];
};

export default function Lights({
  tilePx,
  cols,
  rows,
  ambient = 0.35,
  vignette = true,
  zIndex = 50,
  lights = [],
}: Props) {
  const W = cols * tilePx;
  const H = rows * tilePx;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex, width: W, height: H }}
    >
      {/* Base ambient darkness */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: `rgba(0,0,0,${ambient})`,
        }}
      />

      {/* Optional vignette */}
      {vignette && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(closest-side at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.25) 80%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      )}

      {/* Radial lights (brighten using screen) */}
      {lights.map((L) => {
        const R = (L.radius ?? 4) * tilePx;
        const cx = L.c * tilePx + tilePx / 2;
        const cy = L.r * tilePx + tilePx / 2;
        const intensity = L.intensity ?? 0.85; // how bright center is
        const softness = L.softness ?? 0.65; // where it fades out
        const col = L.color ?? "255,255,200"; // warm default

        return (
          <div
            key={L.id}
            style={{
              position: "absolute",
              left: cx - R,
              top: cy - R,
              width: R * 2,
              height: R * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle,
                rgba(${col}, ${intensity}) 0%,
                rgba(${col}, ${Math.max(0, intensity * 0.4)}) ${Math.round(
                softness * 70
              )}%,
                rgba(${col}, 0) 100%)`,
              mixBlendMode: "screen",
              filter: "blur(1px)", // tiny soften
              animation: L.pulse
                ? "lightPulse 2.2s ease-in-out infinite"
                : undefined,
            }}
          />
        );
      })}

      {/* simple pulse keyframes */}
      <style jsx>{`
        @keyframes lightPulse {
          0%,
          100% {
            opacity: 0.95;
          }
          50% {
            opacity: 0.75;
          }
        }
      `}</style>
    </div>
  );
}
