// Dapur Kilat — game state: customers, stations, the plate, scoring.
// Pure logic: no canvas calls here, so the rules can be reasoned about alone.

import {
  INGREDIENTS,
  RECIPES,
  SHIFT_SECONDS,
  TARGET_COINS,
  MAX_HEARTS,
  MAX_TICKETS,
  COMBO_WINDOW_MS,
  PATIENCE_BASE,
  PATIENCE_MIN,
  SPAWN_FIRST,
  SPAWN_BASE,
  SPAWN_MIN,
  LEVEL_COINS,
  mulberry32,
  pick,
  clamp,
} from './config.js';

let nextTicketId = 1;

export function createGame(seed = 20261125) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: 'title', // title | playing | over
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    walkouts: 0,
    wrongServes: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    comboLeftMs: 0,
    bestCombo: 0,
    level: 1,
    levelProgress: 0,
    hand: null, // { kind: 'raw'|'done', id } or null
    plate: [], // processed ingredient ids on the plating counter
    tickets: [], // { id, recipe, patience, patienceMax, face }
    stations: {
      chop: { item: null, progress: 0, done: false },
      fry: { item: null, progress: 0, done: false },
      boil: { item: null, progress: 0, done: false },
      grill: { item: null, progress: 0, done: false },
    },
    spawnIn: SPAWN_FIRST,
    floaters: [], // { x, y, text, color, ttl }
    shake: 0,
    won: false,
    stars: 0,
    muted: false,
    lastTickSecond: -1,
  };
}

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function patienceFor(level) {
  return Math.max(PATIENCE_MIN, PATIENCE_BASE - (level - 1) * 2);
}

export function spawnIntervalFor(level) {
  return Math.max(SPAWN_MIN, SPAWN_BASE - (level - 1) * 1.5);
}

function spawnTicket(g) {
  const recipe = pick(g.rng, RECIPES);
  const patience = patienceFor(g.level);
  g.tickets.push({
    id: nextTicketId++,
    recipe,
    patience,
    patienceMax: patience,
  });
}

export function addFloater(g, x, y, text, color = '#ffffff') {
  g.floaters.push({ x, y, text, color, ttl: 1.4 });
}

// --- player actions (called by input.js). Each returns 'ok' | 'no' | a sound key. ---

export function takeIngredient(g, id) {
  if (g.screen !== 'playing') return 'no';
  if (g.hand) return 'no';
  g.hand = { kind: 'raw', id };
  return 'pickup';
}

export function useStation(g, stationId) {
  if (g.screen !== 'playing') return 'no';
  const st = g.stations[stationId];
  if (!st) return 'no';
  // Collect a finished item.
  if (st.done && st.item) {
    if (g.hand) return 'no';
    g.hand = { kind: 'done', id: st.item };
    st.item = null;
    st.done = false;
    st.progress = 0;
    return 'pickup';
  }
  // Start cooking a raw ingredient the station accepts.
  if (st.item) return 'no';
  if (!g.hand || g.hand.kind !== 'raw') return 'no';
  const ing = INGREDIENTS[g.hand.id];
  if (!ing || ing.station !== stationId) return 'no';
  st.item = g.hand.id;
  st.progress = 0;
  st.done = false;
  g.hand = null;
  return 'place';
}

export function usePlateSlot(g, slotIndex) {
  if (g.screen !== 'playing') return 'no';
  // Take a plated item back into an empty hand.
  if (!g.hand && g.plate[slotIndex]) {
    g.hand = { kind: 'done', id: g.plate[slotIndex] };
    g.plate.splice(slotIndex, 1);
    return 'pickup';
  }
  // Add a processed ingredient to the plate.
  if (g.hand && g.hand.kind === 'done' && g.plate.length < 3) {
    g.plate.push(g.hand.id);
    g.hand = null;
    return 'place';
  }
  return 'no';
}

export function useTrash(g) {
  if (g.screen !== 'playing') return 'no';
  if (!g.hand) return 'no';
  g.hand = null;
  return 'place';
}

// Does the plate hold exactly the recipe's ingredients (order-free)?
export function plateMatches(recipe, plate) {
  if (plate.length !== recipe.needs.length) return false;
  const sortedPlate = [...plate].sort();
  const sortedNeeds = [...recipe.needs].sort();
  return sortedPlate.every((id, i) => id === sortedNeeds[i]);
}

export function serveTicket(g, ticketId, atX, atY) {
  if (g.screen !== 'playing') return 'no';
  const ticket = g.tickets.find((t) => t.id === ticketId);
  if (!ticket) return 'no';
  if (!plateMatches(ticket.recipe, g.plate)) {
    // Wrong dish: a small fine and the combo breaks.
    g.wrongServes += 1;
    g.coins = Math.max(0, g.coins - 5);
    g.combo = 0;
    g.comboLeftMs = 0;
    g.shake = 0.35;
    addFloater(g, atX, atY, 'Salah pesanan! -5', '#ff6b5e');
    return 'error';
  }
  // Correct serve: base coins + patience tip, scaled by the combo.
  const patienceRatio = ticket.patience / ticket.patienceMax;
  const tip = Math.round(ticket.recipe.coins * 0.5 * patienceRatio);
  g.combo += 1;
  g.comboLeftMs = COMBO_WINDOW_MS;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  const mult = Math.min(2, 1 + (g.combo - 1) * 0.1);
  const earned = Math.round((ticket.recipe.coins + tip) * mult);
  g.coins += earned;
  g.served += 1;
  g.plate = [];
  g.tickets = g.tickets.filter((t) => t.id !== ticketId);
  addFloater(g, atX, atY, `+${earned} koin${g.combo > 1 ? `  COMBO x${g.combo}` : ''}`, '#ffd94d');
  const before = g.level;
  g.level = 1 + Math.floor(g.coins / LEVEL_COINS);
  g.levelProgress = g.coins % LEVEL_COINS;
  if (g.level > before) return 'levelup';
  return 'serve';
}

// --- per-frame update ---

export function startGame(g) {
  const fresh = createGame(g.seed);
  fresh.screen = 'playing';
  spawnTicket(fresh);
  return fresh;
}

export function update(g, dtMs, sfx) {
  const dt = dtMs / 1000;
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt);
  for (const f of g.floaters) {
    f.ttl -= dt;
    f.y -= 34 * dt;
  }
  g.floaters = g.floaters.filter((f) => f.ttl > 0);
  if (g.screen !== 'playing') return;

  g.elapsed += dt;
  g.timeLeft = Math.max(0, SHIFT_SECONDS - g.elapsed);
  if (g.comboLeftMs > 0) {
    g.comboLeftMs -= dtMs;
    if (g.comboLeftMs <= 0) g.combo = 0;
  }

  // Last-ten-seconds warning ticks.
  const sec = Math.ceil(g.timeLeft);
  if (sec <= 10 && sec >= 1 && sec !== g.lastTickSecond) {
    g.lastTickSecond = sec;
    if (sfx) sfx.tick();
  }

  // Stations cook.
  for (const [id, st] of Object.entries(g.stations)) {
    if (st.item && !st.done) {
      const ing = INGREDIENTS[st.item];
      st.progress += dt / ing.seconds;
      if (st.progress >= 1) {
        st.progress = 1;
        st.done = true;
        if (sfx) sfx.ready();
      }
    }
  }

  // Customers lose patience; an empty bar walks out angry.
  for (const t of g.tickets) t.patience -= dt;
  const left = g.tickets.filter((t) => t.patience <= 0);
  if (left.length) {
    g.tickets = g.tickets.filter((t) => t.patience > 0);
    g.walkouts += left.length;
    g.hearts = Math.max(0, g.hearts - left.length);
    g.combo = 0;
    g.comboLeftMs = 0;
    g.shake = 0.4;
    if (sfx) sfx.walkout();
  }

  // New customers walk in.
  g.spawnIn -= dt;
  if (g.spawnIn <= 0 && g.tickets.length < MAX_TICKETS) {
    spawnTicket(g);
    g.spawnIn = spawnIntervalFor(g.level);
  } else if (g.spawnIn <= 0) {
    g.spawnIn = 2;
  }

  // Shift over: win on coins, lose on hearts.
  if (g.timeLeft <= 0 || g.hearts <= 0) {
    g.screen = 'over';
    g.won = g.hearts > 0 && g.coins >= TARGET_COINS;
    const ratio = clamp(g.coins / TARGET_COINS, 0, 1.5);
    g.stars = g.coins >= TARGET_COINS ? 3 : ratio >= 0.66 ? 2 : ratio >= 0.33 ? 1 : 0;
    if (sfx) (g.won ? sfx.win : sfx.lose)();
  }
}
