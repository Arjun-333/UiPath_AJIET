# AUTONOMIA — Virtual Campus 2D Pixel-Art Redesign Progress

Branch: `pixel-redesign`

## Roadmap & Phases

- [x] **Phase 1: Architecture Specification & Approval Gate**
  - [x] Visual Style Guide defined from reference images (`docs/pixel-style.md`)
  - [x] 32-Color Warm Retro Palette specified
  - [x] Architecture Specification, Data Models, Files to Change & Status Mappings authored
  - [x] Phase 1 presented to CEO for formal approval gate

- [ ] **Phase 2: Palette & Procedural Asset Generation Engine**
  - [ ] Implement `frontend/src/game/palette.ts` (32 strictly typed hex colors + canvas color getters)
  - [ ] Implement `frontend/src/game/proceduralTiles.ts` (16×16 floor planks, tiles, rugs, walls, windows, desks, monitors, plants, coffee machines, server racks)
  - [ ] Implement `frontend/src/game/proceduralSprites.ts` (16×32 pixel characters: 4 cardinal directions, 4-frame walk cycles, idle, sitting poses, distinct hair/clothing per team member + AURI robot)

- [ ] **Phase 3: Floor Maps, Walkability Grid & A* Pathfinding**
  - [ ] Implement `frontend/src/game/floorMaps.ts` (Rich tile arrays for Floor 0 Executive Suite, Floor 1 Media Studio, Floor 4 Campus Outreach, Floor 5 Tech Infrastructure)
  - [ ] Implement `frontend/src/game/pathfinding.ts` (2D grid A* pathfinding, collision bitmask, obstacle avoidance, smooth interpolation)

- [ ] **Phase 4: High-Performance 2D Canvas Engine**
  - [ ] Implement `frontend/src/components/PixelVirtualHeadquarters.tsx`
  - [ ] Offscreen static tilemap canvas caching (60 FPS rendering)
  - [ ] Integer pixel scaling (2x, 3x, 4x zoom levels with zero blur)
  - [ ] Dynamic agent simulation loop (walking, sitting at desk, coffee breaks, visiting colleagues, inter-floor escalators)
  - [ ] Interactive speech bubbles, thought icons, and selection indicators

- [ ] **Phase 5: Room Detailing & Thematic Department Atmosphere**
  - [ ] Floor 0 (Executive Suite): CEO Arjun mahogany desk, COO Marcus Vance workstation, AURI podium, leather lounge, boardroom table
  - [ ] Floor 1 (Media Studio): Darshan, Shrinithi, Vaishnavi, Shreyank; dual-monitor editing suites, boom mics, recording tally lamp, script boards
  - [ ] Floor 4 (Documentation & Campus): Iffah, Jiya, Srijana; outreach brainstorming whiteboard, circular conference tables, filing cabinets
  - [ ] Floor 5 (Tech & Infrastructure): Pratham, Mallika, Vaibhav, Faazil; server towers with animated LED arrays, NOC status boards

- [ ] **Phase 6: Integration, Dual-Mode Compatibility & Verification**
  - [ ] Wire into `frontend/src/components/VirtualHeadquarters.tsx` with seamless `?view=legacy` toggle
  - [ ] Verify agent click-to-inspect, floor switching, live speech feeds, and transit animations
  - [ ] Run full build (`npm run build`) and verify 60 FPS in browser
