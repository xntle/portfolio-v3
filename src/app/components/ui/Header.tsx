"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const Header = () => {
  const [activeSection, setActiveSection] = useState("about");
  const navItems = ["about", "experience", "projects", "contacts"];

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
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
    <section className="fixed top-0 left-0 w-full shadow-md z-50 flex justify-between items-center px-6 py-4 bg-white">
      {/* Logo */}
      <span className="text-xl font-bold">:-)</span>

      {/* Desktop Navigation */}
      <nav className="hidden sm:flex space-x-4">
        {navItems.map((id) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`w-28 px-4 py-0.5 rounded-full border transition-colors duration-300 
              ${
                activeSection === id
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-black"
              }
              hover:ring-2 hover:ring-offset-2 hover:ring-[#e5372c]
            `}
          >
            {id}
          </button>
        ))}
      </nav>

      {/* Playground Button - Always Visible */}
      <Link
        href="/playground"
        className="w-28 px-4 py-0.5 rounded-full bg-[#e5372c] text-white hover:opacity-90 transition"
      >
        playground
      </Link>
    </section>
  );
};

export default Header;
