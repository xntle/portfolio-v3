"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface GlassTextProps {
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl";
  className?: string;
  align?: "left" | "center" | "right";
}

const sizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
  "6xl": "text-6xl",
};

export default function GlassText({
  children,
  size = "xl",
  className = "",
  align = "left",
}: GlassTextProps) {
  return (
    <div className={clsx("relative", className)}>
      <h1
        className={clsx(
          "text-transparent bg-clip-text bg-gradient-to-br from-white/90 to-white/60 mix-blend-screen",
          "drop-shadow-[0_2px_6px_rgba(255,255,255,0.15)]",
          sizeMap[size],
          {
            "text-left": align === "left",
            "text-center": align === "center",
            "text-right": align === "right",
          }
        )}
      >
        {children}
      </h1>
      <div className="absolute inset-0 bg-white/10 blur-xl rounded-xl opacity-10 pointer-events-none" />
    </div>
  );
}
