"use client";

import { FaGlobe, FaGithub, FaYoutube } from "react-icons/fa";
import Image from "next/image";

interface Project {
  title: string;
  dates: string;
  description: string;
  tags: string[];
  image?: string;
  video?: string;
  website?: string;
  source?: string;
  demo?: string;
}
const projects: Project[] = [
  {
    title: "Clubly",
    dates: "Aug 2024 – Present",
    description: `
  Collaborated with developers, designers, and marketers to launch a platform helping 12,000+ UC Davis students discover and connect with 600+ campus organizations.
      `,
    tags: [
      "Svelte",
      "SvelteKit",
      "PostgreSQL",
      "Drizzle ORM",
      "Hono",
      "Cloudflare",
      "TailwindCSS",
    ],
    video: "/clublygif.mp4",
    website: "https://clubly.org",
  },
  {
    title: "nodi ai",
    dates: "July 2024 – Aug 2024",
    description:
      "Developed an AI-powered study tool that turns files into summaries, quizzes, and flashcards winning 1st place and a $1,000 grant at FlagUp, IU's startup competition.",
    tags: ["React", "Next.js", "Node.js", "Firebase", "Gemini AI"],
    video: "/nodi.mp4",
    website: "https://nori-app.vercel.app/",
  },
  {
    title: "flock",
    dates: "Feb 2023 – Feb 2023",
    description: `
    Built at SacHacks 2025, Flock helps international students navigate the U.S. visa process with personalized roadmaps, a fact-checked AI chatbot, and a peer support forum.
    `,
    tags: [
      "Next.js",
      "LangChain",
      "PostgreSQL",
      "TailwindCSS",
      "Python",
      "Docker",
      "Railway",
      "Vercel",
    ],
    video: "/flock.mp4",
    website: "https://sachacks2025-intlstudents.vercel.app/",
    source: "https://github.com/PowerOfAPoint/sachacks2025-intlstudents",
    demo: "https://www.youtube.com/watch?v=4p2W-XpW5kE&t=10s",
  },
  {
    title: "Tumor Detecting Microscope",
    dates: "Oct 2023 – Mar 2024",
    description:
      "Facilitate rapid and precise detection of dye injections in tumors.",
    tags: ["C#", "VB.net"],
    video: "/lab.mp4",
    demo: "https://www.youtube.com/watch?v=mrX9GUh_ES8&feature=youtu.be",
  },
];

export default function Projects() {
  return (
    <>
      <section id="projects">
        <h2 className="text-xl font-bold mb-6">projects</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {projects.map((project, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition duration-300 bg-white dark:bg-zinc-900"
            >
              {project.image && (
                <Image
                  src={project.image}
                  alt={project.title}
                  width={600}
                  height={400}
                  className="rounded-t-xl w-full h-40 object-cover"
                />
              )}
              {project.video && (
                <video
                  src={project.video}
                  width={600}
                  height={400}
                  className="rounded-t-xl w-full h-40 object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              <div className="p-4">
                <h3 className="text-lg font-semibold dark:text-zinc-100">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  {project.dates}
                </p>

                <p className="mt-2 text-sm text-gray-700 dark:text-zinc-300">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {project.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-gray-100 text-xs text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mt-4 text-xs">
                  {project.demo && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 border dark:border-zinc-700 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition dark:text-zinc-300"
                    >
                      <FaYoutube className="text-sm" /> Demo
                    </a>
                  )}
                  {project.website && (
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 border dark:border-zinc-700 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition dark:text-zinc-300"
                    >
                      <FaGlobe className="text-sm" /> Website
                    </a>
                  )}
                  {project.source && (
                    <a
                      href={project.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 border dark:border-zinc-700 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition dark:text-zinc-300"
                    >
                      <FaGithub className="text-sm" /> Source
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
