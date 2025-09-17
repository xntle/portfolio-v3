"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const fishImages = ["/4.png", "/2.png", "/3.png", "/5.png"];

type Fish = {
  top: number;
  left: number;
  vx: number;
  vy: number;
};

export default function FishTank() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [dimensions, setDimensions] = useState({
    width: 570,
    height: 550,
    fishSize: 128,
  });

  useEffect(() => {
    const isMobile = window.innerWidth <= 640;
    setDimensions({
      width: isMobile ? 320 : 570,
      height: isMobile ? 475 : 550,
      fishSize: isMobile ? 64 : 128,
    });

    // Initialize fish based on new tank size
    const initialFishes: Fish[] = [
      { top: 50, left: 100, vx: 1, vy: 1 },
      { top: 100, left: 200, vx: -1, vy: 1 },
      { top: 80, left: 220, vx: 1, vy: -1 },
      { top: 120, left: 140, vx: -1, vy: -1 },
    ];
    setFishes(initialFishes);
  }, []);

  useEffect(() => {
    const moveFishes = () => {
      setFishes((prev) => {
        const updated = [...prev];

        for (let i = 0; i < updated.length; i++) {
          const fish = updated[i];
          fish.top += fish.vy * 3;
          fish.left += fish.vx * 3;

          // Wall collision - Y Axis
          if (fish.top < 0) {
            fish.top = 0;
            fish.vy *= -1;
          }
          if (fish.top > dimensions.height - dimensions.fishSize) {
            fish.top = dimensions.height - dimensions.fishSize;
            fish.vy *= -1;
          }

          // Wall collision - X Axis
          if (fish.left < 0) {
            fish.left = 0;
            fish.vx *= -1;
          }
          if (fish.left > dimensions.width - dimensions.fishSize) {
            fish.left = dimensions.width - dimensions.fishSize;
            fish.vx *= -1;
          }

          // Fish-to-fish collision
          // Fish-to-fish collision
          for (let j = i + 1; j < updated.length; j++) {
            const other = updated[j];
            const dx = fish.left - other.left;
            const dy = fish.top - other.top;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < dimensions.fishSize) {
              // Swap velocities
              const tempVx = fish.vx;
              const tempVy = fish.vy;
              fish.vx = other.vx;
              fish.vy = other.vy;
              other.vx = tempVx;
              other.vy = tempVy;

              // Apply random nudge to avoid exact mirror collisions
              const randomNudge = () => (Math.random() - 0.5) * 0.5;
              fish.vx += randomNudge();
              fish.vy += randomNudge();
              other.vx += randomNudge();
              other.vy += randomNudge();

              // Push apart
              const minSeparation = 1;
              const overlap = Math.max(
                dimensions.fishSize - distance,
                minSeparation
              );
              const angle = Math.atan2(dy, dx);
              const pushX = (Math.cos(angle) * overlap) / 2;
              const pushY = (Math.sin(angle) * overlap) / 2;

              fish.left += pushX;
              fish.top += pushY;
              other.left -= pushX;
              other.top -= pushY;
            }
          }
        }

        return [...updated];
      });
    };

    const interval = setInterval(moveFishes, 40);
    return () => clearInterval(interval);
  }, [dimensions]);

  return (
    <div className="mt-12 w-full flex justify-center px-4 sm:px-0">
      <div
        ref={containerRef}
        className="relative bg-gray-50 rounded-3xl shadow-inner overflow-hidden"
        style={{
          width: dimensions.width,
          height: dimensions.height,
        }}
      >
        {fishes.map((fish, i) => (
          <Image
            key={i}
            src={fishImages[i % fishImages.length]}
            alt={`fish-${i}`}
            width={Math.round(dimensions.fishSize)}
            height={Math.round(dimensions.fishSize)}
            className="absolute pointer-events-none rounded-full animate-[spin_8s_linear_infinite]"
            style={{ top: fish.top, left: fish.left }}
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}
