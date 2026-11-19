"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { createUISFX, type CueName, type UISFXPlayer } from "uisfx";
import { createGame, type Game, type GameState } from "./game";
import { NAV, ROOM, type ThingId } from "./room";
import type { DartsState } from "./darts";
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

const DARTS_BEST = "an-room:darts-best";
// the dartboard is a game in the room, not a sheet, so the tour of sheets skips it
const TOUR = ROOM.filter((t) => t.id !== "darts");

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
  const [darts, setDarts] = useState<DartsState | null>(null);
  const [best, setBest] = useState(0);
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
    const game = createGame({ app, canvas, stick, onState: setState, onFocus: setFocus, onOpen: setPanel, onLock: setLocked, onDarts: setDarts });
    if (!game) {
      // no WebGL: skip the room, the nav still opens every section
      setNoGL(true);
      setState("play");
      return stopSfx;
    }
    gameRef.current = game;
    // development only: lets a test script walk straight to an item
    if (process.env.NODE_ENV !== "production") (window as unknown as { __room?: Game }).__room = game;
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
  // darts: a tick for each dart that lands, and the best round is remembered
  useEffect(() => {
    try {
      setBest(Number(window.localStorage.getItem(DARTS_BEST)) || 0);
    } catch {
      // private window: no best score kept
    }
  }, []);
  const dartCount = darts?.hits.length ?? 0;
  useEffect(() => {
    if (!darts || !dartCount) return;
    const last = darts.hits[dartCount - 1];
    sfx(last.points >= 25 ? "success" : last.points ? "select" : "cancel");
    if (darts.left === 0 && darts.total > best) {
      setBest(darts.total);
      try {
        window.localStorage.setItem(DARTS_BEST, String(darts.total));
      } catch {
        // not kept
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per dart that lands
  }, [dartCount]);
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
      if (e.key === "Escape") {
        close();
        gameRef.current?.leaveDarts();
      }
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

  const sheet = panel && panel !== "darts" ? SHEETS[panel] : null;
  const index = panel ? TOUR.findIndex((t) => t.id === panel) : -1;
  const next = index >= 0 ? TOUR[(index + 1) % TOUR.length] : null;

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
        aria-label="A white room with a desk, whiteboard, bookshelf, passport, door, monstera, ukulele, wall clock, dartboard, crushed can and bed"
      />

      <div className="wr-top">
        <Link href="/classic" className="wr-name" aria-label="Thai An (An) Le, the classic portfolio" title="Classic portfolio">
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
          <p className="wr-lede">
            {"i am a product engineer at "}
            <a href="https://playanything.com" target="_blank" rel="noopener noreferrer">
              play anything
            </a>
            {", and shipping "}
            <a href="https://breakfree.you" target="_blank" rel="noopener noreferrer">
              my app
            </a>
            {" on the weekend."}
          </p>
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
      {darts && !panel && (
        <>
          <i className="wr-reticle" aria-hidden="true" />
          <div className="wr-dartsbar" role="status">
            <p className="wr-count">
              <span>
                <b>{darts.total}</b> points
              </span>
              <span>
                <b>{darts.left}</b> darts left
              </span>
              <span>
                <b>{best}</b> best
              </span>
            </p>
            <p>
              {darts.left === 0
                ? `${darts.total} with three darts${darts.total > 0 && darts.total >= best ? ". That's your best" : ""}. ${coarse ? "Tap" : "Click"} to throw again.`
                : dartCount
                  ? `${darts.hits[dartCount - 1].label}${darts.hits[dartCount - 1].points ? `, ${darts.hits[dartCount - 1].points}` : ""}.`
                  : `Your hand shakes. Line it up and ${coarse ? "tap" : "click"} to throw.`}
            </p>
            <button className="wr-tbtn" type="button" onClick={() => gameRef.current?.leaveDarts()}>
              <span aria-hidden="true">✕</span> Leave {!coarse && <kbd>W A S D</kbd>}
            </button>
          </div>
        </>
      )}

      {!coarse && focus && !panel && !gate && !darts && state === "play" && (
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
            <button ref={closeRef} className="wr-tbtn wr-x" type="button" aria-label="Close" onClick={close}>
              <span aria-hidden="true">✕</span> <kbd>Esc</kbd>
            </button>
          </header>
          <h2 id="wr-sheet-title">{sheet.title}</h2>
          <div className="wr-body">{sheet.body}</div>
          <footer>
            <span className="wr-mono">
              {index + 1} / {TOUR.length}
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
