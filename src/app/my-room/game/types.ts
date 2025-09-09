export type Pos = { r: number; c: number };

export type ItemId =
  | "poster"
  | "window"
  | "mat"
  | "desk"
  | "monstera"
  | "ukulele"
  | "whiteboard"
  | "passport"
  | "celsius"
  | "bookshelf"
  | "bed"
  | "clock"
  | "sock"
  | "lamp";

export type Item = {
  id: ItemId;
  name: string;
  pos: Pos;
  size?: { w: number; h: number };
  placeholderLabel: string;
  solid?: boolean;
};

export type WallId = "wallLeft" | "wallRight" | "wallMid";

export type Wall = {
  id: WallId;
  name: string;
  pos: Pos;
  size: { w: number; h: number };
  placeholderLabel: string;
};

export type Flags = {
  shoesOff: boolean;
  shoesChoiceMade: boolean;
  seenMonstera: boolean;
  playedUke: boolean;
  usedBoard: boolean;
  readPassport: boolean;
  facedCan: boolean;
  checkedClock: boolean;

  shoeWarnLevel?: number; // 0..2
};
