# Structure Smash (destructible-structures)

Structure Smash turns an Angry-Birds course sketch into a focused structural-destruction sandbox — no slingshot, no birds, just buildings and the physics of taking them down. Structures are pure data: a Python generator converts ASCII layouts into JSON, assigning every block one of three materials with genuinely different physics. Stone is dense, grippy, and takes 150 hit points behind a high damage threshold; wood is the balanced middle; glass is light, brittle, and chips from impulses stone doesn't even feel. Click anywhere to strike — a radial impulse with linear falloff shoves nearby blocks and injects damage, then gravity and Matter.js do the rest as toppling debris crushes whatever it lands on. A live panel tracks total structure integrity percent, blocks destroyed, and the peak impact force observed, while damaged blocks visibly darken. Material rules, integrity math, and structure parsing are pure TypeScript modules under Vitest; CI runs lint, tests, and build.

## Using the sandbox

- Pick a structure — **Watchtower** (stone base → wood → glass crown), **Bridge**
  (stone pillars, wood deck, glass finials), or **Glass Wall** (fragile on top of solid).
- Set **strike power** and click in the scene: the yellow ring shows the strike radius;
  everything inside is pushed away from the click and damaged with distance falloff.
- Watch the **integrity bar** drain as collapse cascades — falling stone crushes glass
  it lands on, because collision damage uses the same impulse model as strikes.

## The material model

| Material | Density | Health | Damage threshold | Behaviour |
| --- | --- | --- | --- | --- |
| Stone | 0.004 | 150 | 4.5 | Heavy anchor; shrugs off light hits |
| Wood | 0.0016 | 60 | 2.0 | Balanced framing |
| Glass | 0.001 | 24 | 0.8 | Shatters from touches wood ignores |

Damage = `max(0, impulse − threshold) × scale`, with the impulse proxy
`relativeSpeed × min(massA, massB)` per collision (statics count as infinite mass).
Integrity % = surviving health ÷ original health across the whole structure.

## Structures as data

```bash
python scripts/gen_structures.py scripts/layouts/tower.txt public/structures/tower.json
```

Layout characters: `W`/`S`/`G` are wood/stone/glass cells; lowercase runs (`wwww`)
merge into a single wide beam. Add a layout, regenerate, and add its name to the
`STRUCTURES` list in `src/main.ts`.

## Tech stack

TypeScript (strict) · Vite · Matter.js (typed) · Canvas2D · Vitest ·
ESLint + Prettier · GitHub Actions · Python 3 (structure generator)

## Local development

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Testing

`tests/materials.test.ts` (body-option mapping, per-material thresholds — the same
impulse chips glass, dents wood, bounces off stone), `tests/integrity.test.ts`
(integrity % math including destroyed-block accounting, peak tracker), and
`tests/structures.test.ts` (shipped-fixture pins, beam merging, validation errors).

## Deploy

```bash
npm i -g vercel   # once
vercel deploy
```

`vercel.json` is preconfigured for the Vite static build.

## Project history

The 2021 original was a mid-series Angry-Birds course stage. Rebuilt in 2026 around
what made it interesting — structures collapsing — with a material system, data-driven
buildings, live damage metrics, tests, CI, and deploy config.
