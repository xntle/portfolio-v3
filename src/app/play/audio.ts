// Sound for the white room, using the same files as the my-room game:
// the Perfect City soundtrack, footsteps, and two things you hear as you get
// close to them (the ukulele singing, the bed snoring).

type Source = { at: [number, number]; el: HTMLAudioElement; vol: number; max: number };

export type RoomAudio = {
  /** Call from a click: browsers only allow sound after a user gesture. */
  unlock: () => void;
  setMuted: (muted: boolean) => void;
  /** The host talking, for the shoes-off rule. */
  say: () => void;
  /** Once per frame, with the player's position and how fast they are walking (0..1). */
  update: (x: number, z: number, moving: number, dt: number) => void;
  dispose: () => void;
};

const FULL = 1.6; // metres: full volume inside this
const SILENT = 8; // metres: silent beyond this
const STEP_EVERY = 0.42; // seconds between footsteps at full speed

export function createAudio(sources: { at: [number, number]; src: string; max: number }[]): RoomAudio {
  let unlocked = false;
  let heard = false; // the music has started, even if Start has not been pressed
  let muted = false;
  let sinceStep = STEP_EVERY;

  const music = new Audio("/audio/perfect-city.mp3");
  music.loop = true;
  music.preload = "auto";
  music.volume = 0.25;

  // a small pool so quick steps do not cut each other off
  const steps = Array.from({ length: 3 }, () => {
    const a = new Audio("/audio/walk.mp3");
    a.preload = "auto";
    a.volume = 0.35;
    return a;
  });
  let nextStep = 0;

  const talk = new Audio("/audio/talking.mp3");
  talk.preload = "auto";
  talk.volume = 0.5;

  const near: Source[] = sources.map((s) => {
    const el = new Audio(s.src);
    el.loop = true;
    el.preload = "none";
    el.volume = 0;
    return { at: s.at, el, vol: 0, max: s.max };
  });

  const all = () => [music, talk, ...steps, ...near.map((n) => n.el)];
  const quiet = () => all().forEach((a) => a.pause());

  // do not keep playing in a background tab
  const onVisibility = () => {
    if (document.hidden) quiet();
    else if ((unlocked || heard) && !muted) music.play().catch(() => {});
  };
  document.addEventListener("visibilitychange", onVisibility);

  // The music starts on the start screen. Browsers that block sound before a
  // gesture get it on the first click, tap or key anywhere on the page.
  const EARLY = ["pointerdown", "keydown", "touchstart"] as const;
  const early = () => {
    if (muted || document.hidden) return;
    music.play().then(() => {
      heard = true;
      EARLY.forEach((e) => window.removeEventListener(e, early));
    }).catch(() => {});
  };
  EARLY.forEach((e) => window.addEventListener(e, early, { passive: true }));
  early();

  return {
    unlock() {
      if (unlocked) return;
      unlocked = true;
      if (!muted) music.play().catch(() => {});
    },
    setMuted(m) {
      muted = m;
      if (m) quiet();
      else if (unlocked || heard) music.play().catch(() => {});
    },
    say() {
      if (!unlocked || muted) return;
      talk.currentTime = 0;
      talk.play().catch(() => {});
    },
    update(x, z, moving, dt) {
      if (!unlocked || muted || document.hidden) return;

      if (moving > 0.1) {
        sinceStep += dt * moving;
        if (sinceStep >= STEP_EVERY) {
          sinceStep = 0;
          const a = steps[nextStep];
          nextStep = (nextStep + 1) % steps.length;
          a.currentTime = 0;
          a.play().catch(() => {});
        }
      } else {
        sinceStep = STEP_EVERY; // first step lands as soon as you move again
      }

      for (const n of near) {
        const d = Math.hypot(x - n.at[0], z - n.at[1]);
        const t = d <= FULL ? 1 : d >= SILENT ? 0 : 1 - (d - FULL) / (SILENT - FULL);
        n.vol += (t * t - n.vol) * Math.min(1, dt * 4);
        const v = Math.max(0, Math.min(1, n.vol)) * n.max;
        if (Math.abs(n.el.volume - v) > 0.005) n.el.volume = v;
        if (v > 0.01) {
          if (n.el.paused) n.el.play().catch(() => {});
        } else if (!n.el.paused) {
          n.el.pause();
        }
      }
    },
    dispose() {
      document.removeEventListener("visibilitychange", onVisibility);
      EARLY.forEach((e) => window.removeEventListener(e, early));
      for (const a of all()) {
        a.pause();
        a.src = "";
      }
    },
  };
}
