// Dapur Kilat — entry point: game loop, wiring, screenshot scenes.
// The game is a plain ES module; no build step, no network requests.

import { CANVAS_W, CANVAS_H, TARGET_COINS, SHIFT_SECONDS } from './config.js';
import { createGame, startGame, update, recipeById, patienceFor } from './state.js';
import { render } from './render.js';
import { handleClick, handleKey, eventPos } from './input.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 20261125);
const scene = params.get('scene') || 'title';
if (params.get('bare')) document.body.classList.add('bare');

let game = createGame(seed);

function ticket(recipeId, patienceRatio) {
  const recipe = recipeById(recipeId);
  const patience = patienceFor(1);
  return { id: Math.floor(Math.random() * 1e9), recipe, patience: patience * patienceRatio, patienceMax: patience };
}

// Staged states for screenshots: real renders of the real game code, with
// the kitchen, order board, a dish mid-assembly, a timer and a ready plate.
function stageScene(name) {
  if (name === 'play') {
    game = startGame(game);
    game.elapsed = SHIFT_SECONDS - 118;
    game.timeLeft = 118;
    game.coins = 42;
    game.combo = 2;
    game.comboLeftMs = 8000;
    game.level = 2;
    game.levelProgress = 2;
    game.tickets = [
      ticket('nasi-goreng', 0.62),
      ticket('mie-ayam', 0.8),
      ticket('sate-ayam', 0.45),
    ];
    game.stations.chop = { item: 'chicken', progress: 0.3, done: false };
    game.stations.boil = { item: 'rice', progress: 0.45, done: false };
    game.stations.fry = { item: 'egg', progress: 0.85, done: false };
    game.plate = ['rice'];
    game.hand = { kind: 'done', id: 'egg' };
  } else if (name === 'serve') {
    game = startGame(game);
    game.elapsed = SHIFT_SECONDS - 96;
    game.timeLeft = 96;
    game.coins = 58;
    game.combo = 3;
    game.comboLeftMs = 9000;
    game.level = 2;
    game.levelProgress = 18;
    game.tickets = [
      ticket('nasi-goreng', 0.7),
      ticket('teh-manis', 0.9),
    ];
    // A complete Nasi Goreng on the plate, matching the first ticket.
    game.plate = ['rice', 'egg', 'chili'];
    game.stations.grill = { item: 'skewer', progress: 0.4, done: false };
    game.floaters = [{ x: 640, y: 300, text: 'Piring siap disajikan!', color: '#ffd94d', ttl: 1.4 }];
  } else if (name === 'end') {
    game = startGame(game);
    game.screen = 'over';
    game.won = true;
    game.stars = 3;
    game.coins = 134;
    game.served = 9;
    game.walkouts = 1;
    game.wrongServes = 1;
    game.bestCombo = 5;
    game.level = 4;
    game.timeLeft = 0;
  }
  // 'title' (default) needs no staging: the title card draws over the kitchen.
}

stageScene(scene);
window.__game = game;

canvas.addEventListener('click', (ev) => {
  const p = eventPos(canvas, ev);
  game = handleClick(game, p.x, p.y);
  window.__game = game;
});

window.addEventListener('keydown', (ev) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(ev.key)) ev.preventDefault();
  game = handleKey(game, ev.key);
  window.__game = game;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(50, now - last);
  last = now;
  update(game, dt, sfx);
  render(ctx, game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
