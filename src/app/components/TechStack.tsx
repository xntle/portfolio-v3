export default function TechStack() {
  const techStack = {
    Languages: [
      "C/C++",
      "C#",
      "Python",
      "Java",
      "JavaScript",
      "TypeScript",
      "HTML/CSS",
    ],
    "Frameworks & Libraries": [
      "React.js",
      "React Native",
      "Next.js",
      "Svelte",
      "SvelteKit",
      "Express.js",
      "Django",
      "Hono",
    ],
    "Tools, Cloud & Databases": [
      "Node.js",
      "Git",
      "Docker",
      "SSH",
      "PostgreSql",
      "SQLite",
      "MongoDB",
      "Firebase",
      "Drizzle ORM",
      "R2",
      "AWS",
    ],
  };

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold">tech stack</h2>
      <div className="mt-4 space-y-4">
        {Object.entries(techStack).map(([category, items], idx) => (
          <div key={idx}>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
              {category}
            </h3>
            <div className="text-sm mt-2 flex flex-wrap gap-2">
              {items.map((tech, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-xs text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 px-2 py-1 rounded-full cursor-pointer transition duration-300 ease-in-out hover:bg-gray-200 dark:hover:bg-zinc-700 hover:opacity-80"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
