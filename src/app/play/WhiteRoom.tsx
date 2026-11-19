"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { createUISFX, type CueName, type UISFXPlayer } from "uisfx";
import { createGame, type Game, type GameState } from "./game";
import { NAV, ROOM, type ThingId } from "./room";
import { SHEETS } from "./content";
import "./play.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// The house rule from the my-room game: nobody walks in with shoes on.
// Saying no only makes the host angrier.
const SHOES = [
  "did you take your shoes off?",
  "Please take your shoes off. This is an asian household.",
  "TAKE YOUR SHOES OFF. This is an asian household.",
  "TAKE YOUR F***KING (FRICKING) SHOES OFF. THIS IS AN ASIAN HOUSEHOLD.",
];

// same three as the contact section on the home page
const CONTACT = [
  { label: "Email", href: "mailto:thaianle.work@gmail.com", Icon: FaEnvelope },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/thai-an-le/", Icon: FaLinkedin },
  { label: "GitHub", href: "https://github.com/xntle", Icon: FaGithub },
];

const short = (id: ThingId) => ROOM.find((t) => t.id === id)?.short ?? id;

export default function WhiteRoom() {
  const appRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // interface sounds: the zen pack from uisfx (paper, brush, wood, quiet chimes)
  const sfxRef = useRef<UISFXPlayer | null>(null);
  const sfx = useCallback((cue: CueName) => {
    sfxRef.current?.play(cue);
  }, []);
  const stickRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const gameRef = useRef<Game | null>(null);

  const [state, setState] = useState<GameState>("title");
  const [focus, setFocus] = useState<ThingId | null>(null);
  const [panel, setPanel] = useState<ThingId | null>(null);
  const [noGL, setNoGL] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const [muted, setMuted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [shoesOff, setShoesOff] = useState(false);
  const [anger, setAnger] = useState(0);
  const shoesRef = useRef<HTMLButtonElement>(null);
  // you are stopped at the entrance until your shoes are off
  const gate = state === "play" && !shoesOff && !noGL;

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const app = appRef.current, canvas = canvasRef.current;
    const stick = stickRef.current;
    if (!app || !canvas || !stick) return;
    const ui = createUISFX({ pack: "zen", volume: 0.6 });
    sfxRef.current = ui;
    // browsers only allow sound after the first click or key
    const unlock = () => void ui.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    const stopSfx = () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      sfxRef.current = null;
      void ui.destroy();
    };
    const game = createGame({ app, canvas, stick, onState: setState, onFocus: setFocus, onOpen: setPanel, onLock: setLocked });
    if (!game) {
      // no WebGL: skip the room, the nav still opens every section
      setNoGL(true);
      setState("play");
      return stopSfx;
    }
    gameRef.current = game;
    return () => {
      game.dispose();
      gameRef.current = null;
      stopSfx();
    };
  }, []);

  // a soft tick when the box locks onto something, paper when a sheet opens or closes
  useEffect(() => {
    if (focus && state === "play") sfx("hover");
  }, [focus, state, sfx]);
  const hadPanel = useRef(false);
  useEffect(() => {
    if (panel) sfx("open");
    else if (hadPanel.current) sfx("close");
    hadPanel.current = panel !== null;
  }, [panel, sfx]);

  useEffect(() => {
    gameRef.current?.setPaused(panel !== null || gate, panel !== null);
    if (panel) closeRef.current?.focus();
  }, [panel, gate]);

  const takeShoesOff = useCallback(() => {
    gameRef.current?.takeShoesOff();
    setShoesOff(true);
    sfx("success");
    canvasRef.current?.focus();
  }, [sfx]);
  const refuse = () => {
    setAnger((a) => Math.min(SHOES.length - 1, a + 1));
    sfx("error");
    gameRef.current?.say();
  };

  useEffect(() => {
    if (!gate) return;
    gameRef.current?.say();
    shoesRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "j") takeShoesOff();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gate, takeShoesOff]);

  useEffect(() => {
    gameRef.current?.setMuted(muted);
    sfxRef.current?.setEnabled(!muted);
  }, [muted]);

  const close = useCallback(() => {
    setPanel(null);
    canvasRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const go = (id: ThingId) => {
    const game = gameRef.current;
    sfx("select");
    if (noGL || !game) {
      setPanel(id);
      return;
    }
    setPanel(null);
    game.walkTo(id);
  };

  const sheet = panel ? SHEETS[panel] : null;
  const index = panel ? ROOM.findIndex((t) => t.id === panel) : -1;
  const next = index >= 0 ? ROOM[(index + 1) % ROOM.length] : null;

  return (
    <div
      ref={appRef}
      className={`wr ${geist.variable} ${geistMono.variable}${panel ? " wr-has-sheet" : ""}${gate ? " wr-gated" : ""}`}
      data-state={state}
    >
      <canvas
        ref={canvasRef}
        className="wr-cv"
        tabIndex={0}
        aria-label="A white room with a desk, whiteboard, bookshelf, passport, door, monstera, ukulele, wall clock, crushed can and bed"
      />

      <div className="wr-top">
        <Link href="/" className="wr-name" aria-label="Thai An (An) Le, back to home">
          Thai An (An) Le
        </Link>
        <nav className="wr-nav wr-hud" aria-label="Sections">
          {NAV.map((n) => (
            <button key={n.id} className="wr-mono" type="button" aria-current={panel === n.id ? "page" : undefined} onClick={() => go(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <span className="wr-mono wr-place">San Francisco, CA</span>
      </div>

      {!noGL && (
        <button
          className="wr-tbtn wr-sound"
          type="button"
          aria-pressed={!muted}
          onClick={() => {
            // heard on the way in, and as the last thing on the way out
            if (muted) sfxRef.current?.setEnabled(true);
            sfx(muted ? "toggle-on" : "toggle-off");
            setMuted((m) => !m);
          }}
        >
          Sound {muted ? "off" : "on"}
        </button>
      )}

      {/* the line that comes out of the figure, and what it says */}
      <section className="wr-title">
        <div className="wr-says">
          <h1>{"hi, i'm an."}</h1>
          <p className="wr-lede">{"i'm working for play anything as a product engineer."}</p>
          <p className="wr-contact">
            {CONTACT.map(({ label, href, Icon }) => (
              <a key={label} href={href} aria-label={label} title={label} {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
                <Icon aria-hidden="true" />
              </a>
            ))}
          </p>
        </div>
        <button className="wr-start" type="button" onClick={() => {
            sfx("start");
            gameRef.current?.start();
          }}
          disabled={state !== "title"}>
          Start <span aria-hidden="true">→</span>
        </button>
      </section>

      <div className="wr-bottom wr-hud">
        {coarse && focus ? (
          <button className="wr-open" type="button" onClick={() => go(focus)}>
            Open <b>{short(focus)}</b>
          </button>
        ) : (
          <p className="wr-mono wr-hint">
            {coarse
              ? "Left thumb moves · Right thumb looks · Walk up to an item"
              : locked
                ? "Mouse looks · Hold click or W A S D to walk · Click an item · Push up past the ceiling for the menu"
                : "Cursor is free for the menu · Click the room to take the mouse back"}
          </p>
        )}
      </div>

      <i className="wr-cross" aria-hidden="true" />
      {/* the Open prompt rides on the cursor */}
      {!coarse && focus && !panel && !gate && state === "play" && (
        <span className="wr-prompt" aria-live="polite">
          Open <b>{short(focus)}</b> <kbd>click</kbd>
        </span>
      )}

      <div ref={stickRef} className="wr-stick" hidden aria-hidden="true">
        <i />
      </div>

      {gate && (
        <div key={anger} className={`wr-gate${anger > 1 ? " wr-angry" : ""}`} role="alertdialog" aria-labelledby="wr-gate-line">
          <span className="wr-mono">Thai An</span>
          <p id="wr-gate-line">{SHOES[anger]}</p>
          <div className="wr-gate-acts">
            <button ref={shoesRef} className="wr-start" type="button" onClick={takeShoesOff}>
              Take shoes off <kbd>J</kbd>
            </button>
            <button className="wr-tbtn" type="button" onClick={refuse}>
              No
            </button>
          </div>
        </div>
      )}

      {sheet && panel && (
        <aside key={panel} className="wr-sheet" role="dialog" aria-labelledby="wr-sheet-title">
          <header>
            <span className="wr-mono">{sheet.kicker}</span>
            <button ref={closeRef} className="wr-tbtn" type="button" onClick={close}>
              Close <kbd>Esc</kbd>
            </button>
          </header>
          <h2 id="wr-sheet-title">{sheet.title}</h2>
          <div className="wr-body">{sheet.body}</div>
          <footer>
            <span className="wr-mono">
              {index + 1} / {ROOM.length}
            </span>
            {next && (
              <button className="wr-tbtn" type="button" onClick={() => go(next.id)}>
                {noGL ? "Next: " : "Walk to "}
                {next.short.toLowerCase()} →
              </button>
            )}
          </footer>
        </aside>
      )}

      {noGL && (
        <p className="wr-nogl">
          {"This browser can't draw the 3D room. The links at the top still open every section."}
        </p>
      )}
    </div>
  );
}
