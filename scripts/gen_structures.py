#!/usr/bin/env python3
"""Emit structure JSON for Structure Smash from ASCII layouts.

Layout format (scripts/layouts/*.txt):

    name: Watchtower
    cell: 42
    origin: 640 508
    ---
    GG
    WW
    SS

Grid characters (each cell is one block, drawn top-down; the bottom row rests
on the ground at origin-y):
  W = wood   S = stone   G = glass   . = empty
Lowercase w/s/g runs merge horizontally into one wide beam (height = 0.35*cell).

Usage:
    python scripts/gen_structures.py scripts/layouts/tower.txt public/structures/tower.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

MATERIALS = {"W": "wood", "S": "stone", "G": "glass"}
BEAMS = {"w": "wood", "s": "stone", "g": "glass"}
BEAM_HEIGHT = 0.35


def build(text: str) -> dict:
    header, _, grid_text = text.partition("---")
    meta: dict[str, str] = {}
    for line in header.strip().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()

    name = meta.get("name")
    if not name:
        raise ValueError("layout: missing name")
    cell = float(meta.get("cell", "42"))
    ox, ground_y = (float(v) for v in meta.get("origin", "640 508").split())

    rows = [r.rstrip("\n") for r in grid_text.strip("\n").splitlines() if r.strip()]
    n_rows = len(rows)
    blocks: list[dict] = []

    for r, row in enumerate(rows):
        c = 0
        while c < len(row):
            ch = row[c]
            if ch in MATERIALS:
                blocks.append(
                    {
                        "material": MATERIALS[ch],
                        "x": ox + (c + 0.5) * cell,
                        "y": ground_y - (n_rows - r - 0.5) * cell,
                        "w": cell,
                        "h": cell,
                    }
                )
                c += 1
            elif ch in BEAMS:
                run = 1
                while c + run < len(row) and row[c + run] == ch:
                    run += 1
                blocks.append(
                    {
                        "material": BEAMS[ch],
                        "x": ox + (c + run / 2) * cell,
                        "y": ground_y - (n_rows - r - 1) * cell - (cell * BEAM_HEIGHT) / 2,
                        "w": run * cell,
                        "h": cell * BEAM_HEIGHT,
                    }
                )
                c += run
            else:
                c += 1

    if not blocks:
        raise ValueError("layout: no blocks")
    return {"name": name, "blocks": blocks}


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(2)
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    structure = build(src.read_text(encoding="utf-8"))
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(structure, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {dst}: {structure['name']} ({len(structure['blocks'])} blocks)")


if __name__ == "__main__":
    main()
