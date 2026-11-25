// Dapur Kilat — mouse + keyboard input. Hit-tests against the same layout
// geometry the renderer uses, so clicks always land where the art shows.

import { layout, CANVAS_W, CANVAS_H } from './config.js';
import {
  takeIngredient,
  useStation,
  usePlateSlot,
  useTrash,
  serveTicket,
  startGame,
  createGame,
} from './state.js';
import { sfx, toggleMute, isMuted } from './audio.js';

const L = layout();

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function playSound(kind) {
  if (!kind || kind === 'no') return;
  if (kind === 'pickup') sfx.pickup();
  else if (kind === 'place') sfx.place();
  else if (kind === 'serve') sfx.serve();
  else if (kind === 'error') sfx.error();
  else if (kind === 'levelup') {
    sfx.serve();
    sfx.levelup();
  }
}

// The canvas is shown at its natural size; map a pointer event to game coords.
export function eventPos(canvas, ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - rect.left) / rect.width) * CANVAS_W,
    y: ((ev.clientY - rect.top) / rect.height) * CANVAS_H,
  };
}

// Returns the (possibly replaced) game object after handling one click.
export function handleClick(g, x, y) {
  if (g.screen === 'title') {
    // The big start button, or anywhere on the title card.
    const cx = CANVAS_W / 2;
    if (x >= cx - 150 && x <= cx + 150 && y >= 392 && y <= 448) {
      return startGame(g);
    }
    return g;
  }
  if (g.screen === 'over') {
    const cx = CANVAS_W / 2;
    if (x >= cx - 130 && x <= cx + 130 && y >= 512 && y <= 562) {
      return startGame(g);
    }
    return g;
  }

  // Tickets first: serving is the point of the game.
  for (let i = 0; i < g.tickets.length; i++) {
    const r = { x: L.ticketsX, y: L.ticketsY + i * (L.ticketH + L.ticketGap), w: L.ticketW, h: L.ticketH };
    if (inside(x, y, r)) {
      const t = g.tickets[i];
      const result = serveTicket(g, t.id, r.x + r.w / 2, r.y + 10);
      playSound(result);
      return g;
    }
  }

  // Ingredient bins.
  for (const b of L.bins) {
    if (inside(x, y, b)) {
      const result = takeIngredient(g, b.id);
      playSound(result);
      if (result === 'no') sfx.error();
      return g;
    }
  }

  // Stations.
  for (const s of L.stations) {
    if (inside(x, y, s)) {
      const result = useStation(g, s.id);
      playSound(result);
      if (result === 'no') sfx.error();
      return g;
    }
  }

  // Plate slots.
  for (let i = 0; i < L.plateSlots.length; i++) {
    if (inside(x, y, L.plateSlots[i])) {
      const result = usePlateSlot(g, i);
      playSound(result);
      if (result === 'no') sfx.error();
      return g;
    }
  }
  // Clicking the plate panel itself also tries to add the held item.
  if (inside(x, y, L.plate)) {
    const result = usePlateSlot(g, g.plate.length);
    playSound(result);
    if (result === 'no') sfx.error();
    return g;
  }

  // Trash.
  if (inside(x, y, L.trash)) {
    const result = useTrash(g);
    playSound(result);
    return g;
  }

  return g;
}

// Keyboard: Space/Enter starts or restarts, R restarts, M mutes, 1-7 grab
// ingredients, Esc clears the hand to the trash.
export function handleKey(g, key) {
  const k = key.toLowerCase();
  if (k === ' ' || k === 'enter') {
    if (g.screen === 'title' || g.screen === 'over') return startGame(g);
    return g;
  }
  if (k === 'r') {
    if (g.screen !== 'title') return startGame(g);
    return g;
  }
  if (k === 'm') {
    toggleMute();
    return g;
  }
  if (g.screen !== 'playing') return g;
  if (k === 'escape') {
    const result = useTrash(g);
    playSound(result);
    return g;
  }
  const binIndex = ['1', '2', '3', '4', '5', '6', '7'].indexOf(k);
  if (binIndex >= 0 && binIndex < L.bins.length) {
    const result = takeIngredient(g, L.bins[binIndex].id);
    playSound(result);
    if (result === 'no') sfx.error();
  }
  return g;
}

export function muteState() {
  return isMuted();
}

export function freshGame(seed) {
  return createGame(seed);
}
