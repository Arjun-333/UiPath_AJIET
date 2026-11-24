# AUTONOMIA — Pixel Art Visual Style Guide (`docs/pixel-style.md`)

Based on visual analysis of reference images (`media_1795543604630_92e7a69f.png`, `media_1795543635133_08801c1b.jpg`, `media_1795543639887_9ac625c0.jpg`, `media_1795543644664_9d149837.jpg`, `media_1795543651121_6417b79e.jpg`, `media_1795543661315_cd3bcff8.jpg`):

---

## 1. Perspective & Coordinate System
* **Perspective**: Top-down 3/4 RPG view (Stardew Valley / Pokemon Gen 3 / Habbo interior style). **Isometric rendering is strictly discarded.**
* **Grid**: Uniform 16×16 pixel square tiles.
* **Pixel Density**: Crisp, integer-scaled pixel art (2x, 3x, 4x zoom levels) with `image-rendering: pixelated` and zero smoothing/blur.

---

## 2. 32-Color Warm Unified Palette

Every tile, wall, floor, furniture item, and character sprite must be constructed strictly using this 32-color palette:

| Index | Color Hex | Role / Material |
| :---: | :---: | :--- |
| 0 | `#141013` | Deep Void / Outlines / Darkest Shadows |
| 1 | `#241c2c` | Deep Slate / Dark Metal Trim / Computer Bezel |
| 2 | `#3b3247` | Muted Charcoal / Office Partitions / Dark Fabric |
| 3 | `#564a66` | Mid Charcoal / Shadowed Metal / Filing Cabinets |
| 4 | `#857496` | Slate Gray / Metal Hardware / Server Frame |
| 5 | `#b7a8c4` | Light Metal / Silver Hardware / Scanners |
| 6 | `#e8e0ee` | Crisp White / Paper / Wallboards / Highlight |
| 7 | `#4d2d32` | Dark Mahogany Wood / Shadowed Planks |
| 8 | `#7a3f3a` | Rich Mahogany Wood / Executive Desks |
| 9 | `#a85744` | Terracotta Brick / Warm Desks / Bookcase Outline |
| 10 | `#d17b54` | Warm Oak Wood / Bookshelves / Table Tops |
| 11 | `#e8a87c` | Light Birch Wood Planks / Desk Highlight |
| 12 | `#f7d3a2` | Scandinavian Blonde Wood / Bright Floor Planks |
| 13 | `#4a3b32` | Espresso Machine / Dark Leather Feet |
| 14 | `#735c43` | Walnut Baseboard / Medium Wood Shadow |
| 15 | `#a3825e` | Warm Tan Flooring / Carpet Trim |
| 16 | `#cbb08a` | Cream Tile / Tan Linoleum |
| 17 | `#f0e4cf` | Off-White Wall Paint / Linen Curtains |
| 18 | `#1d3c3d` | Deep Spruce / Plant Shadow |
| 19 | `#2b614d` | Emerald Green / Ficus Leaves |
| 20 | `#479667` | Fresh Foliage Green / Monstera Planters |
| 21 | `#78c77e` | Bright Green / Status LEDs / Foliage Highlight |
| 22 | `#bdf29b` | Neon Green / Terminal Matrix Glow |
| 23 | `#192742` | Executive Navy / Floor 0 Paneling |
| 24 | `#294873` | Deep Royal Blue / Corporate Carpets |
| 25 | `#3f78ad` | Studio Cyan / Screen Display / Water Cooler |
| 26 | `#6bb5d9` | Daylight Sky Window / Screen Waveform |
| 27 | `#a8e1f0` | Window Glass Glare / Ice Water / Hologram |
| 28 | `#7a2b4b` | Deep Crimson / Floor 0 Executive Rug |
| 29 | `#b83b5e` | Red Recording Tally LED / Red Accent Chair |
| 30 | `#e06b52` | UiPath Orange / Brand Accent / AURI Highlights |
| 31 | `#f7a361` | Amber Warm Glow / Lamp Light / Coffee Mug |

---

## 3. Wall Height, Openings & Boundaries
* **Wall Height**: Exactly 3 tiles high (48 pixels):
  * **Top Rim (Tile row 0)**: 16px horizontal trim with light wood or stone coping.
  * **Wall Face (Tile rows 1–2)**: 32px vertical surface showing paint, wallpaper, brick texture, or paneling.
  * **Baseboard (Bottom 4–6px of row 2)**: Dark wood moulding separating wall from floor.
* **Windows**: 2 tiles wide × 2 tiles high (32×32 px) set into the wall face, with crisp glass reflection diagonals (`#a8e1f0`).
* **Doors & Openings**: 2 tiles wide (32px), with clear open doorway thresholds leading to adjacent rooms or corridors.

---

## 4. Shadow Style & Lighting
* **Character Drop Shadows**: Semi-transparent dark pill (`#141013` at 35% opacity), 14px wide × 6px high, positioned directly beneath characters' feet.
* **Furniture Shadows**: 2px to 4px contact shadow cast to the bottom and bottom-right edge of large pieces (desks, bookcases, server racks, sofas).
* **Wall Cast Shadows**: A 1-tile wide strip of subtle floor shadow immediately adjacent to the north and west interior walls.

---

## 5. Furniture Density & Functional Zoning
Each floor room follows an authentic office density:
* **Workstation Pods**: 2–4 desks grouped with CRT/flat monitors, keyboards, desk chairs, and wastebins.
* **Executive Area**: Large double-width mahogany desk, leather executive chair, framed diplomas, brass plant.
* **Breakroom / Coffee Lounge**: Coffee maker counter, water cooler with blue bottle, snack counter, comfortable 2–3 seat sofa with coffee table.
* **Storage & Archives**: Tall bookcases, 4-drawer metal filing cabinets, heavy-duty laser copier/printer.
* **Tech / NOC Zone**: High-density server rack towers with blinking multi-color LED arrays and network patch panels.
* **Clear Walkways**: All desks and furniture maintain at least a 1-tile clear walking corridor (16px) for A* pathfinding.

---

## 6. Character Sprite Specifications
* **Dimensions**: 16 pixels wide × 32 pixels high (2 tiles tall).
* **Directions**: 4 cardinal orientations: `Down` (facing camera), `Left`, `Right`, `Up` (facing north).
* **Walk Cycle**: 4 frames per direction (`Idle`, `Step Left`, `Idle`, `Step Right`) animated at 6–8 frames per second.
* **States**:
  * `Idle`: Standing breathing frame.
  * `Walking`: 4-frame cycle with foot displacement and subtle bob.
  * `Sitting`: 16×24px sitting pose aligned with chair tiles.
  * `Working`: Sitting at desk with typing hand motion and screen glow reflection.
