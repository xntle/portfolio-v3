"use client";

import { useState } from "react";
import clsx from "clsx";

const tabs = ["Photos", "Memories", "Trips"];

export default function GlassToolbar() {
  const [active, setActive] = useState("Photos");

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md border border-white/10"
      style={{
        background:
          "linear-gradient(to bottom right, rgba(255,255,255,0.2), rgba(255,255,255,0.05))",
        boxShadow:
          "inset 1px 1px 0 rgba(255,255,255,0.4), inset -1px -1px 0 rgba(100,100,100,0.1)",
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={clsx(
            "px-4 py-1 rounded-full text-sm font-medium transition-all duration-200",
            active === tab
              ? "bg-white/20 text-white shadow-inner"
              : "text-white/70 hover:bg-white/10"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
