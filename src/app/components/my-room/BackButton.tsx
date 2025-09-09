"use client";
import Link from "next/link";
import React from "react";

type Props = { className?: string };

export default function BackButton({ className = "" }: Props) {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className={
        "absolute top-2 left-2 z-[98] w-8 h-8 grid place-items-center " +
        "rounded-full bg-neutral-800/80 border border-neutral-700 " +
        "text-neutral-200 hover:bg-neutral-700 transition shadow " +
        className
      }
    >
      ←
    </Link>
  );
}
