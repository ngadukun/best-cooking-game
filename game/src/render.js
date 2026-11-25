// Dapur Kilat — canvas renderer. All art is drawn in code: rounded panels,
// coloured ingredient discs, progress rings, patience bars. No image assets.

import {
  CANVAS_W,
  CANVAS_H,
  INGREDIENTS,
  RECIPES,
  STATIONS,
  TARGET_COINS,
  layout,
  fmtTime,
  clamp,
} from './config.js';

const L = layout();

const INK = '#2b2118';
const CREAM = '#fff6e3';
const PANEL = '#fffdf6';
const WOOD = '#b07a45';
const WOOD_DARK = '#8a5a2b';
const TILE_A = '#f7ead2';
const TILE_B = '#f3dfc0';
const RED = '#e8442e';
const GREEN = '#3f9e4d';
const GOLD = '#f2b705';
const BLUE = '#3e7cb1';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, fill = PANEL, stroke = '#e5d3ae') {
  rr(ctx, x, y, w, h, 14);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

function text(ctx, s, x, y, size, color = INK, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, 'Segoe UI', sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function ingredientDisc(ctx, id, cx, cy, r) {
  const ing = INGREDIENTS[id];
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = ing.color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(43,33,24,0.55)';
  ctx.stroke();
  // A tiny glyph so every ingredient reads at a glance.
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(r * 0.9)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ing.label[0], cx, cy + 1);
}

function drawIngredientChip(ctx, id, x, y, size, fontSize = 13) {
  const ing = INGREDIENTS[id];
  rr(ctx, x, y, size, size, 10);
  ctx.fillStyle = ing.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(43,33,24,0.5)';
  ctx.stroke();
  text(ctx, ing.label, x + size / 2, y + size / 2 + 5, fontSize, INK, '800', 'center');
}

function progressRing(ctx, cx, cy, r, ratio, done) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(43,33,24,0.08)';
  ctx.fill();
  if (done) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = GREEN;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.45, cy);
    ctx.lineTo(cx - r * 0.1, cy + r * 0.4);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.4);
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

// --- background: tiled kitchen wall, wooden counter, floor -----------------

function drawBackground(ctx) {
  ctx.fillStyle = TILE_A;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = TILE_B;
  const ts = 48;
  for (let y = 64; y < 560; y += ts) {
    for (let x = ((y / ts) % 2) * ts / 2; x < CANVAS_W; x += ts) {
      ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
    }
  }
  // Wooden counter band.
  ctx.fillStyle = WOOD;
  ctx.fillRect(0, 560, CANVAS_W, 104);
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(0, 560, CANVAS_W, 8);
  ctx.fillStyle = '#c98f56';
  for (let x = 24; x < CANVAS_W; x += 96) ctx.fillRect(x, 596, 48, 5);
  // Floor.
  ctx.fillStyle = '#d9b98a';
  ctx.fillRect(0, 664, CANVAS_W, 56);
  ctx.fillStyle = '#c9a878';
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, 664, 3, 56);
}

// --- HUD -------------------------------------------------------------------

function drawHud(ctx, g) {
  const h = L.hud;
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  ctx.fillStyle = '#54371f';
  ctx.fillRect(0, 60, CANVAS_W, 4);
  text(ctx, 'DAPUR KILAT', 20, 42, 28, '#ffd94d', '900');
  text(ctx, 'Warung Rush Kitchen', 250, 40, 15, '#f7ead2', '600');

  // Coins + target.
  rr(ctx, 470, 12, 210, 40, 20);
  ctx.fillStyle = '#fff6e3';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(496, 32, 13, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#b8860b';
  ctx.stroke();
  text(ctx, 'C', 496, 37, 15, '#7a5b00', '900', 'center');
  text(ctx, `${g.coins} / ${TARGET_COINS} koin`, 516, 38, 19, INK, '800');

  // Shift timer.
  const urgent = g.timeLeft <= 15 && g.screen === 'playing';
  rr(ctx, 700, 12, 150, 40, 20);
  ctx.fillStyle = urgent ? '#ff6b5e' : '#fff6e3';
  ctx.fill();
  text(ctx, fmtTime(g.timeLeft), 775, 38, 19, urgent ? '#fff' : INK, '800', 'center');

  // Level + progress to next level.
  text(ctx, `Level ${g.level}`, 880, 38, 18, '#ffd94d', '800');
  rr(ctx, 960, 20, 130, 24, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();
  const lp = clamp(g.levelProgress / 40, 0, 1);
  rr(ctx, 960, 20, 130 * lp, 24, 12);
  ctx.fillStyle = GOLD;
  ctx.fill();

  // Combo.
  if (g.combo > 1) {
    rr(ctx, 1075, 12, 125, 40, 20);
    ctx.fillStyle = '#ff8c42';
    ctx.fill();
    text(ctx, `COMBO x${g.combo}`, 1137, 38, 17, '#fff', '900', 'center');
  } else {
    text(ctx, 'M: suara  •  R: ulang', 1205, 38, 13, '#f7ead2', '600', 'right');
  }

  // Hearts.
  for (let i = 0; i < 3; i++) {
    ctx.font = '20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = i < g.hearts ? '#ff5a5a' : 'rgba(255,255,255,0.25)';
    ctx.fillText('♥', 1224 + i * 24, 32);
  }
}

// --- order board -----------------------------------------------------------

function drawTicket(ctx, t, x, y) {
  const w = L.ticketW;
  const h = L.ticketH;
  const ratio = clamp(t.patience / t.patienceMax, 0, 1);
  const urgent = ratio < 0.35;
  panel(ctx, x, y, w, h, urgent ? '#ffe9e5' : PANEL, urgent ? '#ff8a7a' : '#e5d3ae');
  // Drawn smiley face: the smile flattens as patience runs out.
  const fx = x + 30;
  const fy = y + 30;
  ctx.beginPath();
  ctx.arc(fx, fy, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd94d';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8a6d3b';
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(fx - 6, fy - 4, 2.2, 0, Math.PI * 2);
  ctx.arc(fx + 6, fy - 4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  if (ratio > 0.55) {
    ctx.arc(fx, fy + 2, 8, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (ratio > 0.3) {
    ctx.moveTo(fx - 7, fy + 7);
    ctx.lineTo(fx + 7, fy + 7);
  } else {
    ctx.arc(fx, fy + 12, 7, 1.15 * Math.PI, 1.85 * Math.PI);
  }
  ctx.stroke();
  text(ctx, t.recipe.name, x + 52, y + 24, 18, INK, '800');
  text(ctx, `${t.recipe.coins} koin`, x + 52, y + 46, 14, '#8a6d3b', '700');
  // Needed ingredients.
  t.recipe.needs.forEach((id, i) => {
    drawIngredientChip(ctx, id, x + 14 + i * 46, y + 58, 38);
  });
  // Patience bar.
  rr(ctx, x + 14, y + h - 16, w - 28, 10, 5);
  ctx.fillStyle = 'rgba(43,33,24,0.12)';
  ctx.fill();
  rr(ctx, x + 14, y + h - 16, (w - 28) * ratio, 10, 5);
  ctx.fillStyle = ratio > 0.55 ? GREEN : ratio > 0.3 ? GOLD : RED;
  ctx.fill();
}

function drawBoard(ctx, g) {
  panel(ctx, L.board.x, L.board.y, L.board.w, L.board.h, 'rgba(255,253,246,0.92)');
  text(ctx, 'PAPAN PESANAN', L.board.x + 16, L.board.y + 30, 18, INK, '900');
  text(ctx, `Disajikan: ${g.served}   •   Kabur: ${g.walkouts}`, L.board.x + 16, L.board.y + 54, 13, '#8a6d3b', '700');
  if (g.tickets.length === 0) {
    text(ctx, 'Belum ada pelanggan…', L.ticketsX, L.ticketsY + 30, 16, '#8a6d3b', '600');
  }
  g.tickets.forEach((t, i) => {
    drawTicket(ctx, t, L.ticketsX, L.ticketsY + i * (L.ticketH + L.ticketGap));
  });
}

// --- kitchen: ingredient bins, stations, plate, hand, trash ---------------

function drawBins(ctx, g) {
  text(ctx, 'BAHAN — KLIK UNTUK AMBIL', L.binsLabel.x, L.binsLabel.y, 14, '#5c4026', '800');
  for (const b of L.bins) {
    const ing = INGREDIENTS[b.id];
    const held = g.hand && g.hand.id === b.id;
    panel(ctx, b.x, b.y, b.w, b.h, held ? '#ffe9a8' : PANEL, held ? GOLD : '#e5d3ae');
    ingredientDisc(ctx, b.id, b.x + b.w / 2, b.y + 30, 20);
    text(ctx, ing.label, b.x + b.w / 2, b.y + 66, 14, INK, '800', 'center');
    text(ctx, `→ ${STATIONS[ing.station].hint}`, b.x + b.w / 2, b.y + 78, 10, '#8a6d3b', '700', 'center');
  }
}

function stationArt(ctx, id, x, y, w, h) {
  // A simple drawn appliance per station.
  if (id === 'chop') {
    rr(ctx, x + 18, y + 52, w - 36, 54, 10);
    ctx.fillStyle = '#e8c99a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b98d54';
    ctx.stroke();
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 40 + i * 22, y + 62);
      ctx.lineTo(x + 52 + i * 22, y + 94);
      ctx.stroke();
    }
  } else if (id === 'fry') {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 78, 78, 26, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#3a3a3a';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 74, 66, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#6b4a2f';
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(x + w - 26, y + 66, 34, 8);
  } else if (id === 'boil') {
    rr(ctx, x + 38, y + 52, w - 76, 56, 12);
    ctx.fillStyle = '#7d8a99';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5a6773';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + 54, w / 2 - 38, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#aeb9c4';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 20, y + 34);
    ctx.quadraticCurveTo(x + w / 2 - 30, y + 20, x + w / 2 - 14, y + 10);
    ctx.moveTo(x + w / 2 + 14, y + 34);
    ctx.quadraticCurveTo(x + w / 2 + 4, y + 20, x + w / 2 + 20, y + 10);
    ctx.stroke();
  } else {
    // grill
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(x + 22, y + 56, w - 44, 48);
    ctx.strokeStyle = '#ff8c42';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const gx = x + 44 + i * 32;
      ctx.beginPath();
      ctx.moveTo(gx, y + 100);
      ctx.lineTo(gx + 8, y + 84);
      ctx.lineTo(gx + 16, y + 100);
      ctx.stroke();
    }
    ctx.strokeStyle = '#2b2118';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 30 + i * 44, y + 62);
      ctx.lineTo(x + 30 + i * 44, y + 96);
      ctx.stroke();
    }
  }
}

function drawStations(ctx, g) {
  text(ctx, 'STASIUN MASAK — KLIK UNTUK OLAH / AMBIL', L.stationsLabel.x, L.stationsLabel.y, 14, '#5c4026', '800');
  for (const s of L.stations) {
    const st = g.stations[s.id];
    const info = STATIONS[s.id];
    const busy = !!st.item;
    panel(ctx, s.x, s.y, s.w, s.h, busy ? '#fff3d6' : PANEL);
    text(ctx, info.label, s.x + 16, s.y + 28, 17, INK, '800');
    stationArt(ctx, s.id, s.x, s.y, s.w, s.h);
    if (st.item) {
      const ing = INGREDIENTS[st.item];
      progressRing(ctx, s.x + s.w - 32, s.y + 30, 16, st.progress, st.done);
      text(ctx, ing.label, s.x + s.w / 2, s.y + 130, 14, INK, '800', 'center');
      if (st.done) text(ctx, 'SIAP! KLIK UNTUK AMBIL', s.x + s.w / 2, s.y + 146, 10, GREEN, '800', 'center');
    } else {
      text(ctx, 'Kosong', s.x + s.w / 2, s.y + 130, 13, '#b09a7a', '700', 'center');
    }
  }
}

function drawPlateArea(ctx, g) {
  panel(ctx, L.plate.x, L.plate.y, L.plate.w, L.plate.h, '#fff3d6', '#e8c98a');
  text(ctx, 'PIRING SAJI — SUSUN PESANAN DI SINI', L.plate.x + 16, L.plate.y + 26, 15, INK, '900');
  if (g.plate.length === 0) {
    text(ctx, 'Piring kosong — klik bahan olahan di tangan untuk menaruhnya.', L.plate.x + 16, L.plate.y + 78, 13, '#8a6d3b', '600');
  }
  L.plateSlots.forEach((slot, i) => {
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 12);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#d8c49a';
    ctx.stroke();
    ctx.setLineDash([]);
    const id = g.plate[i];
    if (id) drawIngredientChip(ctx, id, slot.x + 14, slot.y + 10, 56);
  });
  text(ctx, 'Klik piring berisi untuk mengambil kembali.', L.plate.x + 16, L.plate.y + 118, 11, '#8a6d3b', '600');
}

function drawHandAndTrash(ctx, g) {
  panel(ctx, L.hand.x, L.hand.y, L.hand.w, L.hand.h, PANEL);
  text(ctx, 'TANGAN', L.hand.x + 16, L.hand.y + 26, 15, INK, '900');
  if (g.hand) {
    const ing = INGREDIENTS[g.hand.id];
    drawIngredientChip(ctx, g.hand.id, L.hand.x + 16, L.hand.y + 40, 56);
    text(ctx, ing.label, L.hand.x + 84, L.hand.y + 62, 16, INK, '800');
    text(ctx, g.hand.kind === 'raw' ? 'Bahan mentah' : 'Siap disajikan', L.hand.x + 84, L.hand.y + 84, 12, '#8a6d3b', '700');
    text(ctx, g.hand.kind === 'raw' ? `Olah di: ${STATIONS[ing.station].label}` : 'Taruh di piring saji', L.hand.x + 84, L.hand.y + 102, 12, '#8a6d3b', '700');
  } else {
    text(ctx, 'Kosong — ambil bahan di atas.', L.hand.x + 16, L.hand.y + 66, 13, '#8a6d3b', '600');
  }

  panel(ctx, L.trash.x, L.trash.y, L.trash.w, L.trash.h, '#fdeceb', '#f0b0a8');
  text(ctx, 'TEMPAT SAMPAH', L.trash.x + 16, L.trash.y + 26, 15, INK, '900');
  text(ctx, 'Klik untuk membuang isi tangan.', L.trash.x + 16, L.trash.y + 66, 13, '#8a6d3b', '600');
  text(ctx, 'Salah ambil? Buang saja, gratis.', L.trash.x + 16, L.trash.y + 88, 12, '#8a6d3b', '600');
}

function drawServeHint(ctx, g) {
  rr(ctx, L.serveHint.x, L.serveHint.y, L.serveHint.w, L.serveHint.h, 12);
  ctx.fillStyle = 'rgba(43,33,24,0.75)';
  ctx.fill();
  const msg = g.plate.length === 0
    ? 'Cara main: ambil bahan → olah di stasiun → taruh di piring → klik tiket pelanggan yang cocok untuk menyajikan.'
    : 'Piring sudah berisi — klik tiket pelanggan yang pesanannya cocok untuk menyajikan!';
  text(ctx, msg, L.serveHint.x + 18, L.serveHint.y + 29, 15, '#fff6e3', '700');
}

function drawRecipeBook(ctx) {
  panel(ctx, L.recipeBook.x, L.recipeBook.y, L.recipeBook.w, L.recipeBook.h, 'rgba(255,253,246,0.9)');
  text(ctx, 'BUKU RESEP', L.recipeBook.x + 16, L.recipeBook.y + 26, 14, INK, '900');
  let x = L.recipeBook.x + 122;
  for (const r of RECIPES) {
    text(ctx, `${r.name}:`, x, L.recipeBook.y + 26, 13, INK, '800');
    r.needs.forEach((id, i) => drawIngredientChip(ctx, id, x + 8 + i * 28, L.recipeBook.y + 38, 24, 9));
    text(ctx, `${r.coins} koin`, x + 8 + r.needs.length * 28 + 6, L.recipeBook.y + 56, 12, '#8a6d3b', '700');
    x += 195;
  }
  text(ctx, 'Sajikan sebelum kesabaran pelanggan habis — sajian cepat = tip lebih besar. Combo naik tiap sajian beruntun!', L.recipeBook.x + 16, L.recipeBook.y + 90, 12, '#8a6d3b', '600');
}

// --- overlays: title, game over, floaters -----------------------------------

function drawTitle(ctx, g) {
  ctx.fillStyle = 'rgba(43,33,24,0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const cx = CANVAS_W / 2;
  panel(ctx, cx - 360, 130, 720, 420, 'rgba(255,246,227,0.98)', '#e8c98a');
  text(ctx, 'DAPUR KILAT', cx, 218, 56, '#b3402a', '900', 'center');
  text(ctx, 'Warung Rush Kitchen — masak cepat, sajikan tepat!', cx, 258, 19, INK, '700', 'center');
  text(ctx, 'Pelanggan datang dengan pesanan. Ambil bahan, olah di stasiun yang', cx, 302, 16, '#5c4026', '600', 'center');
  text(ctx, 'tepat, susun di piring, lalu sajikan sebelum mereka kehabisan sabar.', cx, 326, 16, '#5c4026', '600', 'center');
  text(ctx, `Target: ${TARGET_COINS} koin dalam 2 menit 30 detik  •  3 pelanggan kabur = shift berakhir`, cx, 364, 15, '#8a6d3b', '700', 'center');
  rr(ctx, cx - 150, 392, 300, 56, 28);
  ctx.fillStyle = '#e8442e';
  ctx.fill();
  text(ctx, 'MULAI MASAK', cx, 428, 22, '#fff', '900', 'center');
  text(ctx, 'Klik / Spasi untuk mulai  •  Mouse untuk semua aksi', cx, 476, 14, '#8a6d3b', '600', 'center');
}

function drawGameOver(ctx, g) {
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const cx = CANVAS_W / 2;
  panel(ctx, cx - 330, 110, 660, 470, 'rgba(255,246,227,0.98)', '#e8c98a');
  text(ctx, g.won ? 'SHIFT SELESAI!' : 'SHIFT BERAKHIR', cx, 180, 40, g.won ? GREEN : '#b3402a', '900', 'center');
  text(ctx, g.won ? 'Target tercapai — warungmu laris manis!' : g.hearts <= 0 ? 'Terlalu banyak pelanggan kabur…' : 'Target koin belum tercapai. Coba lagi!', cx, 216, 17, INK, '700', 'center');
  // Stars.
  for (let i = 0; i < 3; i++) {
    ctx.font = '54px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = i < g.stars ? GOLD : 'rgba(43,33,24,0.2)';
    ctx.fillText('★', cx - 70 + i * 70, 268);
  }
  const rows = [
    ['Koin terkumpul', `${g.coins} / ${TARGET_COINS}`],
    ['Pesanan disajikan', `${g.served}`],
    ['Pelanggan kabur', `${g.walkouts}`],
    ['Sajian salah', `${g.wrongServes}`],
    ['Combo terbaik', `x${Math.max(1, g.bestCombo)}`],
    ['Level tercapai', `${g.level}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 320 + i * 30;
    text(ctx, k, cx - 200, y, 16, '#5c4026', '700');
    text(ctx, v, cx + 200, y, 16, INK, '800', 'right');
  });
  rr(ctx, cx - 130, 512, 260, 50, 25);
  ctx.fillStyle = '#e8442e';
  ctx.fill();
  text(ctx, 'MAIN LAGI (R)', cx, 544, 19, '#fff', '900', 'center');
}

function drawFloaters(ctx, g) {
  for (const f of g.floaters) {
    ctx.globalAlpha = clamp(f.ttl / 0.6, 0, 1);
    text(ctx, f.text, f.x, f.y, 20, f.color, '900', 'center');
  }
  ctx.globalAlpha = 1;
}

// --- main entry -------------------------------------------------------------

export function render(ctx, g) {
  ctx.save();
  if (g.shake > 0) {
    const m = g.shake * 14;
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }
  drawBackground(ctx);
  drawHud(ctx, g);
  drawBoard(ctx, g);
  drawBins(ctx, g);
  drawStations(ctx, g);
  drawPlateArea(ctx, g);
  drawHandAndTrash(ctx, g);
  drawServeHint(ctx, g);
  drawRecipeBook(ctx, g);
  text(ctx, 'Dapur Kilat — game masak orisinal. Semua gambar digambar dengan kode; tanpa aset eksternal.', 20, 712, 12, '#7a5b3a', '600');
  drawFloaters(ctx, g);
  if (g.screen === 'title') drawTitle(ctx, g);
  if (g.screen === 'over') drawGameOver(ctx, g);
  ctx.restore();
}
