"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [activeSection, setActiveSection] = useState("about");
  const navItems = ["about", "experience", "projects", "contacts"];

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
    <section className="fixed top-0 left-0 w-full z-50 flex items-center justify-center px-6 py-4 bg-gradient-to-b from-white/80 to-transparent dark:from-black/80 dark:to-transparent backdrop-blur-sm">
      {/* Left: Logo */}
      <div className="absolute left-6">
        <span className="text-xl font-bold">:-)</span>
      </div>

      {/* Center: Nav */}
      <nav className="hidden sm:flex space-x-4">
        {navItems.map((id) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`w-28 px-4 py-0.5 rounded-full border duration-300
          ${
            activeSection === id
              ? "bg-black text-white border-black dark:bg-zinc-100 dark:text-black dark:border-zinc-100"
              : "bg-white text-black border-black dark:bg-transparent dark:text-zinc-200 dark:border-zinc-200"
          }
          hover:opacity-90 hover:ring-2 hover:ring-offset-2 hover:ring-[#e5372c] transition
        `}
          >
            {id}
          </button>
        ))}
      </nav>

      {/* Right: Playground Button */}
      <div className="absolute right-6 flex items-center space-x-3">
        <ThemeToggle />
        <Link
          href="/my-room"
          className="w-28 text-center px-4 py-1 rounded-full bg-[#e5372c] text-white hover:opacity-90  hover:ring-2 hover:ring-offset-2 hover:ring-[#e5372c] transition"
        >
          Play
        </Link>
      </div>
    </section>
  );
};

export default Header;
