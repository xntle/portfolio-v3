import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "An's room",
  description: "Walk around Thai An's room. Each object opens a part of the portfolio.",
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
