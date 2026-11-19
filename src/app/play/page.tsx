"use client";

import dynamic from "next/dynamic";

// three.js and the room only make sense in the browser
const WhiteRoom = dynamic(() => import("./WhiteRoom"), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, background: "#f8f8f7" }} />,
});

export default function Page() {
  return <WhiteRoom />;
}
