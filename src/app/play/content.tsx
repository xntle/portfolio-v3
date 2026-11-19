import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import type { ThingId } from "./room";
import { yearLeft } from "./game";

// What each object in the room opens. The portfolio data mirrors the home page
// components (Projects, Experience, Archives, TechStack, About, Contacts); the
// stories are the lines from the my-room game.

type LinkT = [label: string, href: string];

type Entry = {
  title: string;
  date: string;
  sub?: string;
  text?: string;
  tags?: string[];
  links?: LinkT[];
  video?: string;
  logo?: string;
};

const PROJECTS: Entry[] = [
  {
    title: "Clubly",
    date: "Aug 2024 – Present",
    text: "Collaborated with developers, designers, and marketers to launch a platform helping 12,000+ UC Davis students discover and connect with 600+ campus organizations.",
    tags: ["Svelte", "SvelteKit", "PostgreSQL", "Drizzle ORM", "Hono", "Cloudflare", "TailwindCSS"],
    video: "/clublygif.mp4",
    links: [["Website", "https://clubly.org"]],
  },
  {
    title: "nodi ai",
    date: "July 2024 – Aug 2024",
    text: "Developed an AI-powered study tool that turns files into summaries, quizzes, and flashcards winning 1st place and a $1,000 grant at FlagUp, IU's startup competition.",
    tags: ["React", "Next.js", "Node.js", "Firebase", "Gemini AI"],
    video: "/nodi.mp4",
    links: [["Website", "https://nori-app.vercel.app/"]],
  },
  {
    title: "flock",
    date: "Feb 2023 – Feb 2023",
    text: "Built at SacHacks 2025, Flock helps international students navigate the U.S. visa process with personalized roadmaps, a fact-checked AI chatbot, and a peer support forum.",
    tags: ["Next.js", "LangChain", "PostgreSQL", "TailwindCSS", "Python", "Docker", "Railway", "Vercel"],
    video: "/flock.mp4",
    links: [
      ["Website", "https://sachacks2025-intlstudents.vercel.app/"],
      ["Source", "https://github.com/PowerOfAPoint/sachacks2025-intlstudents"],
      ["Demo", "https://www.youtube.com/watch?v=4p2W-XpW5kE&t=10s"],
    ],
  },
  {
    title: "Tumor Detecting Microscope",
    date: "Oct 2023 – Mar 2024",
    text: "Facilitate rapid and precise detection of dye injections in tumors.",
    tags: ["C#", "VB.net"],
    video: "/lab.mp4",
    links: [["Demo", "https://www.youtube.com/watch?v=mrX9GUh_ES8&feature=youtu.be"]],
  },
];

const EXPERIENCE: Entry[] = [
  {
    title: "Play Anything",
    sub: "Product Engineer · Full-time",
    date: "Oct 2026 - Present",
    text: "Building Anything Piano.",
  },
  {
    title: "researched technologies",
    sub: "Co-Founder",
    date: "Apr 2026 - Present",
    text: "Doing everything for breakfree (50k+ downloads, 30k+ on IG).",
    tags: ["Swift", "Project Management"],
    links: [
      ["researchedtechnologies.com", "https://researchedtechnologies.com"],
      ["@breakfree.app", "https://www.instagram.com/breakfree.app"],
    ],
  },
  {
    title: "Shopify",
    sub: "Contract Software Engineer",
    date: "Aug 2025 - Present",
    logo: "/shopify.png",
    text: "Built Shop Mini 'Fit Check' - Clothes Recommendations and AI Try On.",
    tags: ["React", "Shop Mini SDK"],
  },
  {
    title: "Aggieworks",
    sub: "Software Engineer",
    date: "Oct 2024 - current",
    logo: "/aw.jpeg",
    text: "Working on clubly.org, building an internal tool for UC Davis student organizations.",
    tags: ["Svelte", "SvelteKit", "PostgreSQL", "Drizzle ORM", "Hono", "R2/AWS", "TailwindCSS"],
    links: [["clubly", "https://clubly.org"]],
  },
  {
    title: "Headstarter",
    sub: "Software Engineer Fellow",
    date: "Jul 2024 - Sep 2024",
    logo: "/headstarter.svg",
    text: "Led the development of 7+ AI apps, reaching 700+ users using Next.js, OpenAI, and AWS.",
    tags: ["Next.js", "TypeScript", "OpenAI", "AWS", "Firebase", "Pinecone", "Stripe", "Whisper", "Clerk"],
    links: [
      ["rizzgpt", "https://rizzgpt.thaianle.com"],
      ["talkaroo", "https://talkaroo-lac.vercel.app/"],
      ["applyEZ", "https://applyez-waitlist.vercel.app/"],
      ["FlashAI", "https://flashai.thaianle.com"],
      ["pantrypal", "https://pantry-pal-eta.vercel.app/"],
    ],
  },
  {
    title: "UC Davis Health",
    sub: "Software Engineer Intern",
    date: "Oct 2023 - Mar 2024",
    logo: "/ucdhealth.svg",
    text: "Built VB.NET software for tumor dye detection — improved speed and accuracy significantly.",
    tags: ["VB.NET", "C#", "PowerShell"],
    links: [["youtube video", "https://www.youtube.com/watch?v=mrX9GUh_ES8&feature=youtu.be"]],
  },
  {
    title: "LLD Pool & Spa Co.",
    sub: "Product Manager",
    date: "Dec 2021 - Jan 2024",
    logo: "/lld.svg",
    text: "Redesigned flagship e-commerce site and led a cross-functional team of 5.",
    tags: ["Adobe", "Product Management"],
    links: [["linhlinhdan.com", "https://linhlinhdan.com"]],
  },
  {
    title: "public class APCS",
    sub: "Founder",
    date: "Aug 2021 - May 2022",
    logo: "/apcs.png",
    text: "Designed and taught personalized APCSA and APCSP courses, guiding three students to score 4 or higher on their AP exams.",
    tags: ["Java"],
    links: [
      ["APCSA", "https://drive.google.com/drive/folders/1XJ-H3vIF-TrgJWGewUAqEFj6bvA64GKi"],
      ["APCSP", "https://drive.google.com/drive/folders/1aozieTdWLkdw1g-RcM1jEmitWnDqroa9"],
    ],
  },
];

const ARCHIVE: Entry[] = [
  {
    title: "rizzGPT",
    date: "Completed",
    tags: ["React/NextJS", "Firebase", "Pinecone", "LangChain", "OpenAI"],
    links: [
      ["Website", "https://rizzgpt.thaianle.com/auth"],
      ["Source", "https://github.com/xntle/rizz-gpt"],
    ],
  },
  { title: "happyjar", date: "In progress", tags: ["React Native", "PostgreSQL", "Supabase"] },
  {
    title: "ineedtolockin.com",
    date: "In progress",
    tags: ["TypeScript", "Next.JS"],
    links: [["Source", "https://github.com/xntle/ineedtolockin"]],
  },
];

const STACK: [string, string][] = [
  ["Languages", "C/C++, C#, Python, Java, JavaScript, TypeScript, HTML/CSS"],
  ["Frameworks", "React.js, React Native, Next.js, Svelte, SvelteKit, Express.js, Django, Hono"],
  ["Tools", "Node.js, Git, Docker, SSH, PostgreSQL, SQLite, MongoDB, Firebase, Drizzle ORM, R2, AWS"],
];

const SOCIALS: LinkT[] = [
  ["resume", "https://drive.google.com/drive/folders/12cTsJccyvpVwrejRO2R2o7JuhABW4uVC?usp=sharing"],
  ["linkedin", "https://www.linkedin.com/in/thai-an-le/"],
  ["github", "https://github.com/xntle"],
  ["youtube", "https://www.youtube.com/@_xntle"],
  ["twitch", "https://www.twitch.tv/xntle"],
];

const STORIES = {
  whiteboard:
    "When people ask me what I've been working on I show them my whiteboard. Right now? I'm working on this exciting app called Photato, check out my github :-)",
  bookshelf:
    "I'm currently reading The Third Door by Alex Banayan. He said life, like a nightclub, has three ways in: the front door, the VIP entrance, and the third door you fight to find yourself.",
  door: "Please take your shoes off. This is an asian household.",
  desk: "Where things get built. Four I'd show you first.",
  contact: "Feel free to reach out. I'd love to connect, collaborate, or just say hi 👋",
  passport: [
    "On Dec 21, 2021, I landed in the US. I got into UC Davis for mathematics.",
    "Starting my own AP Computer Science tutoring course for high school students, I realised that I loved not just learning, but sharing that excitement too.",
    "I switched to Computer Science in my 3rd year, as I loved my coding classes",
    "Hackathon after hackathon, I discovered I didn't just love theory, I loved to build. My passport carried me here, but building carried me forward.",
  ],
  monstera: [
    "When I first got this beautiful monstera back from Costco, I was falling in love with it.",
    "I wanted it to grow so quickly, so I decided my monstera could “use a bit more sun”",
    "By afternoon, the leaves were wearing crisp brown patches, like someone had ironed toast onto them.",
    "I began to see how often I confuse urgency with love. A crisping leaf, a late reply, a wobble in a relationship, my body reads these as alarms. Fix it now, fix it loudly, prove you care with scale.",
    "I’m gentler with feedback now, my own and other people’s. When a leaf yellows or a stem leans, I try to read it like a weather report, not a verdict. Plants aren’t judging us, they’re reporting conditions. That small shift, listening for information instead of accusation, has saved me from a hundred spirals.",
    "The marks never disappeared. Friends still ask, “What happened there?” and I tell them, and we laugh, and I don’t hide the leaf anymore. There’s freedom in leaving the evidence visible. It reminds me that progress is not the same thing as erasure.",
  ],
  ukulele: ["I don't want to set the world on fyaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "Ok get outtax here"],
  clock: ["TIME IS RUNNING OUT, DO THAT THING YOU ALWAYS WANTED TO DO AND DIDN'T HAVE THE CHANCE TO!"],
  celsius: [
    "Oh... this demonic drink.",
    "I left it there after my last hackathon; I pulled an all-nighter to finish, then another to take my midterm the next morning.",
    "I barely remember how I stayed awake—adrenaline, bad snacks, maybe just stubbornness.",
    "I can’t run on fumes forever. Hustle feels good in the moment, but my liver is probably cooked.",
    "That’s why I only do it when necessary and lean on consistent effort instead... I’m much happier this way.",
  ],
  bed: [
    "Apparently I snore like a *dog* according to my roommate",
    "I said-Sorry, being legendary is exhausting.",
  ],
};

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function Item({ e }: { e: Entry }) {
  return (
    <article className="wr-it">
      {e.video && <video className="wr-media" src={e.video} autoPlay muted loop playsInline />}
      <header>
        <h3>
          {e.logo && <Image className="wr-logo" src={e.logo} alt="" width={22} height={22} />}
          {e.title}
        </h3>
        <span className="wr-mono">{e.date}</span>
      </header>
      {e.sub && <p className="wr-sub">{e.sub}</p>}
      {e.text && <p>{e.text}</p>}
      {e.tags && <p className="wr-mono wr-tags">{e.tags.join(" · ")}</p>}
      {e.links && (
        <p className="wr-links">
          {e.links.map(([label, href]) => (
            <Ext key={href} href={href}>
              {label}
            </Ext>
          ))}
        </p>
      )}
    </article>
  );
}

function Say({ children }: { children: ReactNode }) {
  return <p className="wr-say">{children}</p>;
}

function Story({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l) => (
        <p key={l}>{l}</p>
      ))}
    </>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="wr-rows">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="wr-mono">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const two = (n: number) => String(n).padStart(2, "0");

/** The wall clock: the year as a grid of circles, counting down to its end. */
function YearClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const left = yearLeft(now);
  const year = now.getFullYear();
  return (
    <>
      <p className="wr-count" aria-live="off">
        <span>
          <b>{left.days}</b> days
        </span>
        <span>
          <b>{two(left.hours)}</b> hours
        </span>
        <span>
          <b>{two(left.minutes)}</b> min
        </span>
        <span>
          <b>{two(left.seconds)}</b> sec
        </span>
      </p>
      <div className="wr-year" role="img" aria-label={`${left.days} days left in ${year}`}>
        {MONTHS.map((name, month) => {
          const days = new Date(year, month + 1, 0).getDate();
          return (
            <div key={name} className="wr-month">
              <span className="wr-mono">{name}</span>
              {Array.from({ length: days }, (_, i) => {
                const today = month === now.getMonth() && i + 1 === now.getDate();
                const gone = new Date(year, month, i + 1) < now;
                return <i key={i} className={today ? "wr-today" : gone ? "wr-gone" : undefined} />;
              })}
            </div>
          );
        })}
      </div>
      <Story lines={STORIES.clock} />
    </>
  );
}

export type Sheet = { kicker: string; title: string; body: ReactNode };

export const SHEETS: Record<ThingId, Sheet> = {
  desk: {
    kicker: "The desk",
    title: "Projects",
    body: (
      <>
        <Say>{STORIES.desk}</Say>
        {PROJECTS.map((e) => (
          <Item key={e.title} e={e} />
        ))}
      </>
    ),
  },
  whiteboard: {
    kicker: "The whiteboard",
    title: "Experience",
    body: (
      <>
        <Say>{STORIES.whiteboard}</Say>
        {EXPERIENCE.map((e) => (
          <Item key={e.title} e={e} />
        ))}
      </>
    ),
  },
  bookshelf: {
    kicker: "The bookshelf",
    title: "Archive & stack",
    body: (
      <>
        <Say>{STORIES.bookshelf}</Say>
        {ARCHIVE.map((e) => (
          <Item key={e.title} e={e} />
        ))}
        <Rows rows={STACK} />
      </>
    ),
  },
  passport: {
    kicker: "The passport",
    title: "About",
    body: (
      <>
        <Story lines={STORIES.passport} />
        <Rows
          rows={[
            ["Degree", "(B.S) Computer Science with a minor in Tech Management at UC Davis"],
            ["Hobbies", "Video Editing, Cool ChatGPT Prompts, 3D-Modeling, Streaming, Badminton"],
            [
              "Find me",
              <span className="wr-links" key="socials">
                {SOCIALS.map(([label, href]) => (
                  <Ext key={href} href={href}>
                    {label}
                  </Ext>
                ))}
              </span>,
            ],
          ]}
        />
      </>
    ),
  },
  door: {
    kicker: "The door",
    title: "Contact",
    body: (
      <>
        <Say>{STORIES.door}</Say>
        <p>{STORIES.contact}</p>
        <Rows
          rows={[
            ["Email", <a key="e" href="mailto:thaianle.work@gmail.com">thaianle.work@gmail.com</a>],
            ["LinkedIn", <Ext key="l" href="https://www.linkedin.com/in/thai-an-le/">linkedin.com/in/thai-an-le</Ext>],
            ["GitHub", <Ext key="g" href="https://github.com/xntle">github.com/xntle</Ext>],
          ]}
        />
      </>
    ),
  },
  monstera: { kicker: "Story", title: "The monstera from Costco", body: <Story lines={STORIES.monstera} /> },
  ukulele: { kicker: "Story", title: "The ukulele", body: <Story lines={STORIES.ukulele} /> },
  clock: { kicker: "The wall clock", title: `${new Date().getFullYear()} ends in`, body: <YearClock /> },
  celsius: { kicker: "Story", title: "Crushed Celsius", body: <Story lines={STORIES.celsius} /> },
  bed: { kicker: "Story", title: "The bed", body: <Story lines={STORIES.bed} /> },
};
