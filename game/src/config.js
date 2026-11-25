// Dapur Kilat — configuration: recipes, ingredients, stations, tuning.
// All numbers are gameplay tuning; the art and rules live in the other modules.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const SHIFT_SECONDS = 150;
export const TARGET_COINS = 120;
export const MAX_HEARTS = 3;
export const MAX_TICKETS = 4;
export const COMBO_WINDOW_MS = 12000;

// One customer patience bar, in seconds. Later levels shave a little off.
export const PATIENCE_BASE = 46;
export const PATIENCE_MIN = 30;

// How fast new customers walk in, in seconds. Shrinks as the level rises.
export const SPAWN_FIRST = 2.5;
export const SPAWN_BASE = 14;
export const SPAWN_MIN = 7;

// A level is earned every LEVEL_COINS coins banked.
export const LEVEL_COINS = 40;

// Ingredients: id, label, colour, the station that processes it, seconds on that station.
export const INGREDIENTS = {
  rice:    { label: 'Nasi',    color: '#f5f0dc', station: 'boil',  seconds: 3.0 },
  egg:     { label: 'Telur',   color: '#ffd94d', station: 'fry',   seconds: 3.0 },
  chili:   { label: 'Cabai',   color: '#e8442e', station: 'chop',  seconds: 2.0 },
  noodles: { label: 'Mie',     color: '#f2c14e', station: 'boil',  seconds: 3.5 },
  chicken: { label: 'Ayam',    color: '#f0a35e', station: 'chop',  seconds: 2.5 },
  skewer:  { label: 'Sate',    color: '#b5773a', station: 'grill', seconds: 4.0 },
  tea:     { label: 'Teh',     color: '#8a5a2b', station: 'boil',  seconds: 2.0 },
};

// Stations: id, label, hint, where it sits (filled in by layout()).
export const STATIONS = {
  chop:  { label: 'Talenan',  hint: 'Potong', station: 'chop' },
  fry:   { label: 'Wajan',    hint: 'Goreng', station: 'fry' },
  boil:  { label: 'Panci',    hint: 'Rebus',  station: 'boil' },
  grill: { label: 'Panggangan', hint: 'Bakar', station: 'grill' },
};

// Recipes: id, display name, the processed ingredients it needs, base coins, blurb.
export const RECIPES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    needs: ['rice', 'egg', 'chili'],
    coins: 18,
    blurb: 'Nasi direbus, telur digoreng, cabai dipotong.',
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam',
    needs: ['noodles', 'chicken'],
    coins: 16,
    blurb: 'Mie direbus, ayam dipotong. Cepat dan laris.',
  },
  {
    id: 'sate-ayam',
    name: 'Sate Ayam',
    needs: ['chicken', 'skewer'],
    coins: 20,
    blurb: 'Ayam dipotong lalu sate dibakar sampai harum.',
  },
  {
    id: 'teh-manis',
    name: 'Teh Manis',
    needs: ['tea'],
    coins: 8,
    blurb: 'Teh direbus sebentar. Pesanan kilat penambah koin.',
  },
];

// Layout geometry. Every clickable region is computed from these, so the
// renderer and the input handler always agree about where things are.
export function layout() {
  const W = CANVAS_W;
  const binW = 118;
  const binGap = 12;
  const binsX = 336;
  const bins = Object.keys(INGREDIENTS).map((id, i) => ({
    id,
    x: binsX + i * (binW + binGap),
    y: 92,
    w: binW,
    h: 84,
  }));
  const stW = 216;
  const stGap = 16;
  const stationsX = 336;
  const stations = Object.keys(STATIONS).map((id, i) => ({
    id,
    x: stationsX + i * (stW + stGap),
    y: 208,
    w: stW,
    h: 150,
  }));
  return {
    hud: { x: 0, y: 0, w: W, h: 64 },
    board: { x: 16, y: 84, w: 296, h: 560 },
    ticketW: 264,
    ticketH: 112,
    ticketGap: 10,
    ticketsX: 32,
    ticketsY: 142,
    bins,
    binsLabel: { x: binsX, y: 76 },
    stations,
    stationsLabel: { x: stationsX, y: 192 },
    plate: { x: 336, y: 392, w: 452, h: 132 },
    plateSlots: [0, 1, 2].map((i) => ({ x: 360 + i * 140, y: 428, w: 120, h: 76 })),
    hand: { x: 828, y: 392, w: 200, h: 132 },
    trash: { x: 1052, y: 392, w: 196, h: 132 },
    serveHint: { x: 336, y: 540, w: 912, h: 46 },
    recipeBook: { x: 336, y: 592, w: 912, h: 104 },
    footer: { x: 16, y: 664, w: 1248, h: 44 },
  };
}

// Small deterministic RNG so screenshot scenes can be staged the same way twice.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
