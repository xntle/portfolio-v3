"use client";

import GlassCard from "./package/glass-card";
import GlassButton from "./package/glass-button";
import GlassText from "./package/glass-text";
import GlassToolbar from "./package/glass-toolbar";
import GlassHeader from "./components/GlassHeader";

const components = [
  {
    title: "Glass Card",
    description: "A draggable or static card with blur and reflection.",
    component: <div></div>,
  },
  {
    title: "Glass Button",
    description: "Button with animated glass click/hover feedback.",
    component: <GlassButton>Click Me</GlassButton>,
  },
  {
    title: "Glass Text",
    description: "Gradient masked text with clarity and blur.",
    component: <GlassText size="xl">Stylized Glass Text</GlassText>,
  },
  {
    title: "Glass Header",
    description: "Mimics macOS control bar / dock.",
    component: (
      <GlassToolbar>
        <GlassButton>Tab 1</GlassButton>
        <GlassButton>Tab 2</GlassButton>
        <GlassButton>Tab 3</GlassButton>
      </GlassToolbar>
    ),
  },
  {
    title: "Glass Dropdown",
    description: "Gradient masked text with clarity and blur.",
    component: <GlassText size="xl">Stylized Glass Text</GlassText>,
  },
  {
    title: "Glass Toggle",
    description: "Gradient masked text with clarity and blur.",
    component: <GlassText size="xl">Stylized Glass Text</GlassText>,
  },
  {
    title: "Glass Slider",
    description: "Gradient masked text with clarity and blur.",
    component: <GlassText size="xl">Stylized Glass Text</GlassText>,
  },
  {
    title: "Glass Accordion",
    description: "Gradient masked text with clarity and blur.",
    component: <GlassText size="xl">Stylized Glass Text</GlassText>,
  },
  {
    title: "Glass Text Effect",
    description: "Gradient masked text with clarity and blur.",
    component: <GlassText size="xl">Stylized Glass Text</GlassText>,
  },
];

export default function ComponentsPage() {
  return (
    <>
      <GlassHeader />
      <div
        className="min-h-screen flex bg-cover bg-center bg-fixed text-white overflow-y-auto"
        style={{ backgroundImage: "url('/background/mountain.jpg')" }}
      >
        {/* Sidebar */}
        <aside className="mt-16  hidden md:block w-64 px-6 py-10 fixed top-0 h-screen border-r border-white/10">
          <h2 className="text-lg font-semibold mb-4">Follow for updates</h2>
          <p className="text-sm text-white/60 mb-6">@yourhandle</p>

          <h2 className="text-lg font-semibold mb-2">Installation</h2>
          <ul className="text-sm text-white/70 space-y-1 mb-6">
            <li>Install Next.js</li>
            <li>Install Tailwind CSS</li>
            <li>Add utilities</li>
            <li>CLI</li>
          </ul>

          <h2 className="text-lg font-semibold mb-2">All Components</h2>
          <ul className="text-sm text-white/70 space-y-1">
            {components.map((c) => (
              <li key={c.title}>{c.title}</li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="mt-16 ml-60 flex-1 px-6 py-12 md:px-16 overflow-y-auto">
          <header className="mb-16">
            <GlassText size="5xl">Liquid Glass Components</GlassText>
            <p className="text-white/70 text-lg mt-4">
              Beautifully styled glassmorphic UI building blocks
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
            {components.map((item, index) => (
              <GlassCard key={index} width="100%" height="100%">
                <div className="flex flex-col gap-4 px-6 py-6">
                  <div className="h-28 flex items-center justify-center">
                    {item.component}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-white/60">{item.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
