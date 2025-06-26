"use client";

import { useState } from "react";
import GlassButton from "../package/glass-button";

export default function TestGlassButtonPage() {
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [dragging, setDragging] = useState(false);
  const [rel, setRel] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragging(true);
    setRel({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const newX = e.clientX - rel.x;
    const newY = e.clientY - rel.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div
      className="w-screen h-screen bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: "url('/background/mountain.jpg')" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* SVG filter for distortion effect (optional) */}
      <svg width="0" height="0">
        <filter id="glass-distort" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="2"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      {/* Draggable Button */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute cursor-move"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <div className="relative flex items-center gap-4">
          {/* Left bubble */}
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md" />

          {/* Button */}
          <GlassButton>button</GlassButton>

          {/* Right bubble */}
          <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md" />
        </div>
      </div>
    </div>
  );
}
