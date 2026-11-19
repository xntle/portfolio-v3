// The objects in the white room: where they stand and how big they are.
// What each one says lives in content.tsx; how each one is drawn lives in game.ts.

export type ThingId =
  | "desk"
  | "whiteboard"
  | "bookshelf"
  | "passport"
  | "door"
  | "monstera"
  | "ukulele"
  | "clock"
  | "celsius"
  | "bed"
  | "darts";

export type Thing = {
  id: ThingId;
  /** Floating label in the room. */
  label: string;
  /** Name used in the "Open …" prompt and the readout. */
  short: string;
  /** Story objects get a quieter label than the portfolio sections. */
  soft?: boolean;
  /** x, z on the floor, in metres. The player starts at (0, 8) looking toward -z. */
  at: [number, number];
  /** Which way the front of the object faces (radians around y; 0 faces +z). */
  rot: number;
  /** Collision radius. */
  r: number;
  /** Height, used to place the label. */
  h: number;
  /** Stipple density (dots per m²) and dot size, for small detailed objects. */
  dens?: number;
  dot?: number;
  /** Skip the dust settled on the floor around it (things that hang on a wall). */
  noShadow?: boolean;
  /** Height to look at when walking up to it; defaults to a bit above the middle. */
  look?: number;
  /** How far back to stand when walking up to it; wide things need more room. */
  stand?: number;
};

export const ROOM: Thing[] = [
  { id: "desk", label: "Desk · Projects", short: "Desk", at: [5.2, -5.2], rot: -0.6, r: 1.15, h: 1.55 },
  { id: "whiteboard", label: "Whiteboard · Experience", short: "Whiteboard", at: [0, -7.5], rot: 0, r: 1.15, h: 2.15 },
  { id: "bookshelf", label: "Bookshelf", short: "Bookshelf", at: [6.4, 0.4], rot: -1.4, r: 0.75, h: 1.9 },
  { id: "passport", label: "Passport · About", short: "Passport", at: [-4, 4.6], rot: 0.9, r: 0.3, h: 0.55, look: 0.1, dens: 4200, dot: 0.027 },
  { id: "door", label: "Door · Contact", short: "Door", at: [3, -9.45], rot: 0, r: 1.0, h: 2.35 },
  { id: "monstera", label: "Monstera", short: "Monstera", soft: true, at: [-5, -5.8], rot: 0.6, r: 0.7, h: 1.85, dens: 4200, dot: 0.027 },
  { id: "ukulele", label: "Ukulele", short: "Ukulele", soft: true, at: [-6, 0.4], rot: 1.2, r: 0.4, h: 1.45, dens: 4200, dot: 0.027 },
  { id: "clock", label: "Year clock", short: "Year clock", soft: true, at: [-9.9, -1], rot: Math.PI / 2, r: 0.8, h: 2.45, look: 1.55, stand: 3.6, dot: 0.011, noShadow: true },
  { id: "celsius", label: "Crushed Celsius", short: "Crushed Celsius", soft: true, at: [2.4, -1.3], rot: -0.3, r: 0.25, h: 0.45, look: 0.05, dens: 4200, dot: 0.027 },
  { id: "darts", label: "Dartboard", short: "Dartboard", soft: true, at: [9.9, -2.4], rot: -Math.PI / 2, r: 0.5, h: 2.1, look: 1.7, stand: 2.4, dot: 0.011, noShadow: true },
  { id: "bed", label: "Bed", short: "Bed", soft: true, at: [6.4, 5.4], rot: -Math.PI / 2, r: 1.3, h: 1.3 },
];

/** The portfolio sections in the top nav. */
export const NAV: { id: ThingId; label: string }[] = [
  { id: "desk", label: "Projects" },
  { id: "whiteboard", label: "Experience" },
  { id: "passport", label: "About" },
  { id: "door", label: "Contact" },
];
