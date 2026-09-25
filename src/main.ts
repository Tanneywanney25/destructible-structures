import { defaultConfig, MATERIALS } from './config';
import { SmashWorld } from './game/world';
import { destroyedCount, integrityPct } from './systems/integrity';
import { parseStructure, type Structure } from './systems/structures';

const STRUCTURES = ['tower', 'bridge', 'wall'] as const;

function requireEl<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el;
}

async function fetchStructure(name: string): Promise<Structure> {
  const res = await fetch(`structures/${name}.json`);
  if (!res.ok) throw new Error(`structure ${name}: HTTP ${res.status}`);
  return parseStructure(await res.json());
}

async function init(): Promise<void> {
  const canvas = requireEl<HTMLCanvasElement>('#scene');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const cfg = defaultConfig;
  canvas.width = cfg.canvas.width;
  canvas.height = cfg.canvas.height;

  const statsEl = requireEl('#stats');
  const controlsEl = requireEl('#controls');

  const structures = await Promise.all(STRUCTURES.map((n) => fetchStructure(n)));
  const world = new SmashWorld(cfg);
  let current = 0;
  let strikeImpulse = cfg.strike.impulse;

  function load(index: number): void {
    current = index;
    const s = structures[index];
    if (s) world.load(s);
    buildControls();
  }

  function buildControls(): void {
    controlsEl.innerHTML = '<h2>Controls</h2>';
    const row = document.createElement('div');
    row.className = 'row';
    structures.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = s.name;
      if (i === current) btn.classList.add('active');
      btn.addEventListener('click', () => load(i));
      row.append(btn);
    });
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = '↻ Reset';
    reset.addEventListener('click', () => load(current));
    row.append(reset);
    controlsEl.append(row);

    const label = document.createElement('label');
    const readout = document.createElement('strong');
    readout.textContent = ` ${strikeImpulse.toFixed(2)}`;
    label.append('Strike power:', readout);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(cfg.strike.minImpulse);
    input.max = String(cfg.strike.maxImpulse);
    input.step = '0.01';
    input.value = String(strikeImpulse);
    input.addEventListener('input', () => {
      strikeImpulse = Number(input.value);
      readout.textContent = ` ${strikeImpulse.toFixed(2)}`;
    });
    label.append(input);
    controlsEl.append(label);

    const legend = document.createElement('div');
    legend.className = 'legend';
    legend.innerHTML = MATERIALS.map((m) => {
      const spec = cfg.materials[m];
      return `<span><i style="background:${spec.fill};border-color:${spec.stroke}"></i>${m} · ${spec.health}hp</span>`;
    }).join('');
    controlsEl.append(legend);

    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = 'Click anywhere in the scene to strike. Blocks darken as they take damage.';
    controlsEl.append(hint);
  }

  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * cfg.canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * cfg.canvas.height;
    world.strike(x, y, strikeImpulse);
    flash = { x, y, ttl: 220 };
  });

  let flash: { x: number; y: number; ttl: number } | null = null;
  let statsAt = 0;

  load(0);

  let last = performance.now();
  function frame(now: number): void {
    const dtMs = Math.min(now - last, 33);
    last = now;
    world.step(dtMs);

    // Render.
    const c = ctx as CanvasRenderingContext2D;
    c.fillStyle = '#101720';
    c.fillRect(0, 0, cfg.canvas.width, cfg.canvas.height);
    c.fillStyle = '#2c3b2c';
    c.fillRect(0, cfg.canvas.height - cfg.ground.height, cfg.canvas.width, cfg.ground.height);

    for (const block of world.blocks) {
      if (block.destroyed) continue;
      const spec = cfg.materials[block.material];
      const { position, angle } = block.body;
      c.save();
      c.translate(position.x, position.y);
      c.rotate(angle);
      c.fillStyle = spec.fill;
      c.strokeStyle = spec.stroke;
      c.lineWidth = 2;
      c.fillRect(-block.w / 2, -block.h / 2, block.w, block.h);
      c.strokeRect(-block.w / 2, -block.h / 2, block.w, block.h);
      const hurt = 1 - block.health / block.maxHealth;
      if (hurt > 0.02) {
        c.fillStyle = `rgba(10, 10, 10, ${0.55 * hurt})`;
        c.fillRect(-block.w / 2, -block.h / 2, block.w, block.h);
      }
      c.restore();
    }

    if (flash) {
      c.strokeStyle = `rgba(255, 210, 90, ${flash.ttl / 220})`;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(flash.x, flash.y, cfg.strike.radius * (1 - flash.ttl / 220) + 12, 0, Math.PI * 2);
      c.stroke();
      flash.ttl -= dtMs;
      if (flash.ttl <= 0) flash = null;
    }

    if (now - statsAt > 150) {
      statsAt = now;
      const pct = integrityPct(world.blocks);
      statsEl.innerHTML = `
        <h2>${world.structureName}</h2>
        <div class="grid">
          <div class="stat">Integrity<b>${pct.toFixed(1)}%</b></div>
          <div class="stat">Destroyed<b>${destroyedCount(world.blocks)} / ${world.blocks.length}</b></div>
          <div class="stat">Peak impact<b>${world.peak.peak.toFixed(1)}</b></div>
        </div>
        <div class="integrity-bar"><div style="width:${pct}%"></div></div>`;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

void init();
