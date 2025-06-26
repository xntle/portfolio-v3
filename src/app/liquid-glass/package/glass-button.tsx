"use client";

import React from "react";
import Image from "next/image";

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function GlassButton({
  children,
  onClick,
  className = "",
}: GlassButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-2 rounded-[99px] font-medium text-white overflow-hidden shadow-inner ${className}`}
      style={{
        background: "rgba(255, 255, 255, 0.01)",
        boxShadow:
          "inset 0 0 10px rgba(255, 255, 255, 0.3), inset -1px -1px 2px rgba(255, 255, 255, 0.25), inset 1px 1px 2px rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      {/* Optional SVG texture overlay */}
      <Image
        src="/textures/glass.svg"
        alt=""
        fill
        className="absolute inset-0 opacity-10 object-cover pointer-events-none"
      />

      <span className="relative z-10">{children}</span>
    </button>
    // <div className="relative w-40 h-40 overflow-hidden">
    //   <img
    //     src="/textures/glass.svg"
    //     className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none mix-blend-screen"
    //   />
    //   <span className="relative z-10 text-white">Button</span>
    // </div>
  );
}
