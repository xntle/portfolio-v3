import { Item } from "./types";
import { MAIN_W, SIDE_WALL_W, CENTER_TOP_W, mainLeft } from "./constants";

const mainLeftGlobal = mainLeft;
const centerLeftGlobal = mainLeft + SIDE_WALL_W;

export const ITEMS: Item[] = [
  {
    id: "poster",
    name: "poster",
    pos: { r: 3, c: 14 },
    size: { w: 3, h: 2 },
    placeholderLabel: "poster",
    solid: false,
  },
  {
    id: "window",
    name: "window",
    pos: { r: 0.5, c: 11.5 },
    size: { w: 2, h: 2 },
    placeholderLabel: "window",
    solid: false,
  },
  {
    id: "lamp",
    name: "lamp",
    pos: { r: 4, c: 3 },
    size: { w: 1, h: 3 },
    placeholderLabel: "lmp",
    solid: false,
  },
  {
    id: "mat",
    name: "mat",
    pos: { r: 7, c: 8.5 },
    size: { w: 3, h: 3 },
    placeholderLabel: "mat",
    solid: false,
  },
  {
    id: "desk",
    name: "Desk",
    pos: { r: 2, c: 11 },
    size: { w: 3, h: 2.5 },
    placeholderLabel: "DK",
    solid: false,
  },
  {
    id: "whiteboard",
    name: "Whiteboard",
    pos: { r: 0, c: centerLeftGlobal + Math.floor((CENTER_TOP_W - 4) / 2) },
    size: { w: 3, h: 3 },
    placeholderLabel: "WB",
  },
  {
    id: "clock",
    name: "Wall Clock",
    pos: { r: 3, c: 4 },
    size: { w: 2, h: 2 },
    placeholderLabel: "CL",
  },
  {
    id: "monstera",
    name: "Monstera",
    pos: { r: 1, c: 6 },
    size: { w: 3, h: 3 },
    placeholderLabel: "PL",
    solid: false,
  },
  {
    id: "ukulele",
    name: "Ukulele",
    pos: { r: 5, c: 4 },
    size: { w: 2, h: 2 },

    placeholderLabel: "UK",
  },
  {
    id: "bed",
    name: "bed",
    pos: { r: 9, c: 14 },
    size: { w: 3, h: 2 },

    placeholderLabel: "UK",
  },
  {
    id: "bookshelf",
    name: "bookshelf",
    pos: { r: 5, c: 15 },
    size: { w: 2, h: 2 },

    placeholderLabel: "BS",
  },

  {
    id: "sock",
    name: "sock",
    pos: { r: 7, c: 13 },
    size: { w: 1, h: 1 },
    placeholderLabel: "BS",
  },
  {
    id: "passport",
    name: "Passport",
    pos: { r: 8, c: 5 },
    placeholderLabel: "PP",
  },
  {
    id: "celsius",
    name: "Crushed Celsius",
    pos: { r: 5, c: 9 },
    placeholderLabel: "CC",
  },
];
