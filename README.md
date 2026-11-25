# Dapur Kilat — Warung Rush Kitchen

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ngadukun/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ngadukun/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A complete, original browser cooking game built for the make.fun bounty
[best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137)
("Make the best cooking game", $250 prize pool).

## The game

You run a busy warung kitchen — **Dapur Kilat**. Customers walk in with orders,
and you have one 2-minute-30-second shift to bank **120 coins**:

- **Take orders** from the order board — every ticket shows its dish, the
  ingredients it needs, and a patience bar that drains in real time.
- **Cook**: grab ingredients from the bins, then chop, fry, boil or grill them
  at the matching station. Each station shows a live progress ring.
- **Plate**: stack the finished ingredients on the serving plate.
- **Serve**: click the matching customer ticket. Fast serves earn a patience
  tip; chained serves build a combo multiplier (up to x2).
- **Survive**: a wrong dish costs 5 coins and breaks the combo; a customer
  whose patience runs out storms off and costs a heart. Lose 3 hearts and
  the shift ends early.

Four original recipes with distinct steps:

| Dish | Steps | Coins |
| --- | --- | --- |
| Nasi Goreng | boil rice, fry egg, chop chili | 18 |
| Mie Ayam | boil noodles, chop chicken | 16 |
| Sate Ayam | chop chicken, grill skewer | 20 |
| Teh Manis | boil tea | 8 |

Levels ramp up as you bank coins: customers arrive faster and grow less
patient. End-of-shift results show coins, dishes served, best combo and a
1–3 star rating. Sound effects are synthesised with Web Audio (M to mute) —
the game ships no audio, image or font assets; all art is drawn in code.

## Controls

- **Mouse** — everything: take ingredients, run stations, plate, serve, trash.
- **Keys 1–7** — grab an ingredient. **Space** — start / restart.
- **R** — restart. **M** — mute. **Esc** — throw away what you are holding.

## Play it

Serve `game/` with any static HTTP server and open `game/index.html`, e.g.:

```sh
cd game && python3 -m http.server 8080
# open http://localhost:8080/
```

No build step, no network requests — every file the game loads lives under
`game/`.

## Layout

- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to
  `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json`.
- `game/index.html` — the page; `game/src/main.js` runs the loop.
- `game/src/config.js` — recipes, ingredients, stations, tuning, layout.
- `game/src/state.js` — customers, stations, plate, scoring, combo, levels.
- `game/src/render.js` — all canvas art: kitchen, tickets, stations, HUD.
- `game/src/input.js` — mouse + keyboard handling.
- `game/src/audio.js` — synthesised Web Audio sound effects.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — real renders of the game running in a browser.

## License

MIT — see [LICENSE](LICENSE).
