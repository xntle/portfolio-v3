"use client";

import dynamic from "next/dynamic";

// The room is the front page. The older scrolling portfolio lives at /classic.
// three.js and the room only make sense in the browser.
const WhiteRoom = dynamic(() => import("./play/WhiteRoom"), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, background: "#f8f8f7" }} />,
});

export default function Home() {
  return <WhiteRoom />;
}
