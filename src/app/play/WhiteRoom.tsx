"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { FaEnvelope, FaGithub, FaLinkedin } from "react-icons/fa";
import { createUISFX, type CueName, type UISFXPlayer } from "uisfx";
import { createGame, type Game, type GameState } from "./game";
import { NAV, ROOM, type ThingId } from "./room";
import type { DartsState, TopScore } from "./darts";
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
const DARTS_NAME = "an-room:darts-name";
const VISITOR = "an-room:visitor";
const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // private window
  }
};
const write = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // not kept
  }
};
/** A random id this browser keeps, so the leaderboard holds one row per visitor without a sign-in. */
function visitorId() {
  let id = read(VISITOR);
  if (!id) {
    id = crypto.randomUUID();
    write(VISITOR, id);
  }
  return id;
}
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
  const shirtsRef = useRef<HTMLDivElement>(null);
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
  // the leaderboard: null until it has loaded, and it stays hidden if it is not set up
  const [board, setBoard] = useState<{ enabled: boolean; scores: TopScore[] } | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [post, setPost] = useState<{ state: "idle" | "sending" | "sent" | "error"; note?: string }>({ state: "idle" });
  // the closet behind the door: black room, white monster, and he talks
  const [closet, setCloset] = useState(false);
  const [talk, setTalk] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [ask, setAsk] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typed, setTyped] = useState(0);
  const [talking, setTalking] = useState(false); // the box to talk to him is out
  const talkingRef = useRef(false);
  talkingRef.current = talking;
  const [shoesOff, setShoesOff] = useState(false);
  const [anger, setAnger] = useState(0);
  const shoesRef = useRef<HTMLButtonElement>(null);
  // you are stopped at the entrance until your shoes are off
  const gate = state === "play" && !shoesOff && !noGL;

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const app = appRef.current, canvas = canvasRef.current;
    const stick = stickRef.current;
    const shirts = shirtsRef.current;
    if (!app || !canvas || !stick || !shirts) return;
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
    const game = createGame({ app, canvas, stick, onState: setState, onFocus: setFocus, onOpen: setPanel, onLock: setLocked, onDarts: setDarts, onCloset: setCloset, onTalk: setTalking, shirts });
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
    setBest(Number(read(DARTS_BEST)) || 0);
    setName(read(DARTS_NAME) ?? "");
  }, []);
  const atBoard = darts !== null;
  useEffect(() => {
    if (!atBoard) return;
    let live = true;
    fetch("/api/darts")
      .then((r) => r.json())
      .then((d) => live && setBoard({ enabled: !!d.enabled, scores: d.scores ?? [] }))
      .catch(() => live && setBoard({ enabled: false, scores: [] }));
    return () => {
      live = false;
    };
  }, [atBoard]);
  const dartCount = darts?.hits.length ?? 0;
  useEffect(() => {
    if (!darts || !dartCount) return;
    const last = darts.hits[dartCount - 1];
    sfx(last.points >= 25 ? "success" : last.points ? "select" : "cancel");
    if (darts.left === 0 && darts.total > best) {
      setBest(darts.total);
      write(DARTS_BEST, String(darts.total));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per dart that lands
  }, [dartCount]);
  // a new round can be posted again
  useEffect(() => {
    if (dartCount === 0) setPost({ state: "idle" });
  }, [dartCount]);

  const postScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!darts || darts.left > 0 || post.state === "sending") return;
    setPost({ state: "sending" });
    try {
      const res = await fetch("/api/darts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ visitor: visitorId(), name, message, hits: darts.hits.map((h) => h.points) }),
      });
      const d = await res.json();
      if (!res.ok) {
        setPost({ state: "error", note: d.error ?? "Could not save that." });
        sfx("error");
        return;
      }
      write(DARTS_NAME, name.trim());
      setBoard({ enabled: true, scores: d.scores ?? [] });
      setPost({ state: "sent" });
      sfx("success");
    } catch {
      setPost({ state: "error", note: "Could not save that. Try again." });
    }
  };
  useEffect(() => {
    if (closet) sfx("open");
    // the first time you come in, he speaks first
    if (closet) setTalk((t) => (t.length ? t : [{ role: "assistant", content: "hi stranger." }]));
  }, [closet, sfx]);
  /** Ask the monster. He is the same AI as the chat on the classic page. */
  const askMonster = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = ask.trim();
    if (!question || thinking) return;
    const sent = [...talk, { role: "user" as const, content: question }];
    setTalk([...sent, { role: "assistant", content: "" }]);
    setAsk("");
    setTyped(0);
    setThinking(true);
    try {
      const res = await fetch("/chat?as=monster", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sent.slice(-12)),
      });
      const reader = res.ok ? res.body?.getReader() : null;
      if (!reader) throw new Error("no reply");
      const decoder = new TextDecoder();
      let reply = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setTalk([...sent, { role: "assistant", content: reply }]);
      }
      if (!reply) throw new Error("empty reply");
    } catch {
      setTalk([...sent, { role: "assistant", content: "(he growls. something went wrong, try again in a bit.)" }]);
    } finally {
      setThinking(false);
    }
  };
  const said = talk.filter((t) => t.role === "assistant").pop()?.content ?? "";
  // his words come out one letter at a time, and he is heard for as long as they do
  const speaking = closet && typed < said.length;
  useEffect(() => {
    if (!speaking) return;
    const t = setTimeout(() => setTyped((n) => n + 1), 26);
    return () => clearTimeout(t);
  }, [speaking, typed]);
  useEffect(() => {
    if (!speaking) return;
    gameRef.current?.say();
    const voice = setInterval(() => gameRef.current?.say(), 2250);
    return () => {
      clearInterval(voice);
      gameRef.current?.hush(); // he stops when the words do
    };
  }, [speaking]);
  const bonus = !!darts && dartCount > 0 && dartCount % 3 === 0 && darts.left === 3;
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
        // the first Esc stops the talk, the next one leaves the closet
        if (talkingRef.current) gameRef.current?.endTalk();
        else gameRef.current?.leaveCloset();
      }
      // in the closet, Enter puts you in the box to talk to him
      const box = document.getElementById("wr-ask");
      if (e.key === "Enter" && box && document.activeElement !== box) {
        box.focus();
        e.preventDefault();
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
      className={`wr ${geist.variable} ${geistMono.variable}${panel ? " wr-has-sheet" : ""}${gate ? " wr-gated" : ""}${closet ? " wr-closet" : ""}`}
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
            <a className="wr-tip" href="https://breakfree.you" target="_blank" rel="noopener noreferrer" data-tip="80k+ downloads" aria-label="breakfree, 80k+ downloads">
              breakfree
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
      {closet && (
        <>
          {(said || thinking) && (
            <p className="wr-bubble" aria-live="polite" aria-label={said || "thinking"}>
              <span aria-hidden="true">{said.slice(0, typed)}</span>
              <i className="wr-caret" aria-hidden="true" />
            </p>
          )}
          {talking && (
          <aside className="wr-closetui" aria-label="Talk to the monster in the closet">
            <form className="wr-ask" onSubmit={askMonster}>
              <input id="wr-ask" autoFocus value={ask} onChange={(e) => setAsk(e.target.value)} maxLength={300} autoComplete="off" aria-label="Say something to him" placeholder="say something to him" />
              <button className="wr-start" type="submit" disabled={thinking} aria-label="Send">
                <span aria-hidden="true">→</span>
              </button>
            </form>
            <button className="wr-tbtn" type="button" onClick={() => gameRef.current?.endTalk()}>
              <span aria-hidden="true">✕</span> Stop talking <kbd>Esc</kbd>
            </button>
          </aside>
          )}
        </>
      )}

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
                ? `${darts.total} with ${dartCount} darts${darts.total > 0 && darts.total >= best ? ". That's your best" : ""}. ${coarse ? "Tap" : "Click"} the board to throw again.`
                : bonus
                  ? "100 or more with three darts. Three more darts."
                  : dartCount
                    ? `${darts.hits[dartCount - 1].label}${darts.hits[dartCount - 1].points ? `, ${darts.hits[dartCount - 1].points}` : ""}.`
                    : `Your hand shakes. Line it up and ${coarse ? "tap" : "click"} to throw. 100 with three darts earns three more.`}
            </p>
            <button className="wr-tbtn" type="button" onClick={() => gameRef.current?.leaveDarts()}>
              <span aria-hidden="true">✕</span> Leave {!coarse && <kbd>W A S D</kbd>}
            </button>
            {board?.enabled && darts.left === 0 && darts.total > 0 && post.state !== "sent" && (
              <form className="wr-post" onSubmit={postScore}>
                <label className="wr-mono" htmlFor="wr-name">
                  Name
                </label>
                <input
                  id="wr-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={12}
                  minLength={2}
                  required
                  autoComplete="nickname"
                  spellCheck={false}
                  placeholder="your name"
                />
                <label className="wr-mono" htmlFor="wr-msg">
                  Message
                </label>
                <input
                  id="wr-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={60}
                  autoComplete="off"
                  placeholder="say something (optional)"
                />
                <button className="wr-start" type="submit" disabled={post.state === "sending"}>
                  {post.state === "sending" ? "Posting" : "Post score"}
                </button>
                {post.state === "error" && (
                  <span className="wr-post-note" role="alert">
                    {post.note}
                  </span>
                )}
              </form>
            )}
            {post.state === "sent" && <p className="wr-post-note">Posted. You are on the board.</p>}
          </div>
          {board?.enabled && (
            <div className="wr-top10">
              <span className="wr-mono">Leaderboard</span>
              {board.scores.length ? (
                <ol>
                  {board.scores.map((row, i) => (
                    <li key={i}>
                      <span>{row.name}</span>
                      <b>{row.score}</b>
                      {row.message && <q>{row.message}</q>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No scores yet. Be the first.</p>
              )}
            </div>
          )}
        </>
      )}

      {!coarse && focus && !panel && !gate && !darts && state === "play" && (
        <span className="wr-prompt" aria-live="polite">
          Open <b>{short(focus)}</b> <kbd>click</kbd>
        </span>
      )}

      {/* the logos printed on the shirts in the closet; the game keeps them over the shirts */}
      <div ref={shirtsRef} className="wr-shirts" aria-hidden="true">
        {CONTACT.map(({ label, Icon }) => (
          <span key={label}>
            <Icon />
          </span>
        ))}
      </div>
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
