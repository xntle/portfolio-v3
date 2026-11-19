"use client";

import Hero from "@/app/components/Hero";
import Header from "@/app/components/ui/Header";
import Chat from "@/app/components/ui/Chat";
import About from "@/app/components/About";
import TechStack from "@/app/components/TechStack";
import Experience from "@/app/components/Experience";
import Projects from "@/app/components/Projects";
import Archive from "@/app/components/Archives";
import Contact from "@/app/components/Contacts";

// import { AvatarCanvas } from "@/app/components/ui/AvatarCanvas";

export default function Home() {
  return (
    <>
      <Header></Header>
      <Chat></Chat>

      <div className="min-h-screen flex flex-col items-center justify-start px-4 w-full">
        <div className="w-full max-w-xl">
          <Hero></Hero>
          <About></About>
          <TechStack></TechStack>
          <Experience></Experience>
          <Projects></Projects>
          <Archive></Archive>
          <Contact></Contact>
        </div>
      </div>
    </>
  );
}
