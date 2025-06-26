"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlassButton from "../package/glass-button";
import GlassText from "../package/glass-text";
import clsx from "clsx";

const navItems = ["about", "experience", "projects", "contacts"];

export default function GlassHeader() {
  const [activeSection, setActiveSection] = useState("about");

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      const yOffset = -50;
      const y =
        section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      for (let i = navItems.length - 1; i >= 0; i--) {
        const id = navItems[i];
        const section = document.getElementById(id);
        if (section) {
          const offsetTop = section.offsetTop;
          if (scrollY >= offsetTop - 100) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-screen max-w-4xl px-4 py-2 rounded-full backdrop-blur-md bg-white/10 border border-white/20 shadow-lg flex justify-between items-center ">
      {/* Left Logo */}
      <div>
        <GlassText size="lg" className="text-white/80">
          :-)
        </GlassText>
      </div>

      {/* Center Nav */}
      <nav className="hidden md:flex gap-3">
        {navItems.map((id) => (
          <GlassButton
            key={id}
            className={clsx(
              "px-4 py-1 text-sm",
              activeSection === id
                ? "bg-white/20 border border-white/30"
                : "bg-transparent border border-transparent"
            )}
            onClick={() => scrollToSection(id)}
          >
            {id}
          </GlassButton>
        ))}
      </nav>

      {/* Right Playground Link */}
      <div>
        <Link href="/playground">
          <GlassButton className="px-4 py-1 text-sm bg-[#e5372c] hover:opacity-90 hover:ring-2 hover:ring-[#e5372c]">
            playground
          </GlassButton>
        </Link>
      </div>
    </header>
  );
}
