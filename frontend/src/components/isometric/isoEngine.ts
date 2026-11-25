// Autonomia 2:1 Isometric Pixel Art Rendering Engine (High-Resolution 2X Pixel Scale)
// Follows Screenshot 2 visual guidelines: 64x32 2:1 diamond grid, enclosed cutaway walls,
// 3-face shaded furniture with 1px darker outlines, soft shadows, and painter's depth sorting.

import { ISO_PALETTE } from '../../theme/isoPalette';

export const TILE_W = 64;
export const TILE_H = 32;

export interface ScreenCoord {
  x: number;
  y: number;
}

export function toScreen(gx: number, gy: number, gz: number, originX: number, originY: number): ScreenCoord {
  return {
    x: Math.round(originX + (gx - gy) * (TILE_W / 2)),
    y: Math.round(originY + (gx + gy) * (TILE_H / 2) - gz)
  };
}

export interface BoxColors {
  top: string;
  left: string;
  right: string;
  outline: string;
}

export interface RenderItem {
  depth: number;
  render: (ctx: CanvasRenderingContext2D, originX: number, originY: number) => void;
}

// -------------------------------------------------------------
// 1. Shaded Box Primitive Helper (3 Lit Faces + 1px Outline)
// -------------------------------------------------------------
export function drawShadedBox(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gx: number,
  gy: number,
  gz: number,
  gw: number,
  gd: number,
  gh: number,
  colors: BoxColors,
  options: { hasShadow?: boolean; shadowAlpha?: number } = {}
) {
  // Ground shadow if requested
  if (options.hasShadow) {
    ctx.save();
    ctx.fillStyle = ISO_PALETTE.shadow_soft;
    ctx.beginPath();
    const s0 = toScreen(gx, gy, 0, originX, originY);
    const s1 = toScreen(gx + gw, gy, 0, originX, originY);
    const s2 = toScreen(gx + gw, gy + gd, 0, originX, originY);
    const s3 = toScreen(gx, gy + gd, 0, originX, originY);
    ctx.moveTo(s0.x, s0.y);
    ctx.lineTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.lineTo(s3.x, s3.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 8 Isometric Vertices
  // Bottom face
  const b00 = toScreen(gx, gy, gz, originX, originY);
  const b10 = toScreen(gx + gw, gy, gz, originX, originY);
  const b11 = toScreen(gx + gw, gy + gd, gz, originX, originY);
  const b01 = toScreen(gx, gy + gd, gz, originX, originY);

  // Top face
  const t00 = toScreen(gx, gy, gz + gh, originX, originY);
  const t10 = toScreen(gx + gw, gy, gz + gh, originX, originY);
  const t11 = toScreen(gx + gw, gy + gd, gz + gh, originX, originY);
  const t01 = toScreen(gx, gy + gd, gz + gh, originX, originY);

  // Left Face (facing South-West: b00 -> b01 -> t01 -> t00)
  ctx.fillStyle = colors.left;
  ctx.beginPath();
  ctx.moveTo(b00.x, b00.y);
  ctx.lineTo(b01.x, b01.y);
  ctx.lineTo(t01.x, t01.y);
  ctx.lineTo(t00.x, t00.y);
  ctx.closePath();
  ctx.fill();

  // Right Face (facing South-East: b01 -> b11 -> t11 -> t01)
  ctx.fillStyle = colors.right;
  ctx.beginPath();
  ctx.moveTo(b01.x, b01.y);
  ctx.lineTo(b11.x, b11.y);
  ctx.lineTo(t11.x, t11.y);
  ctx.lineTo(t01.x, t01.y);
  ctx.closePath();
  ctx.fill();

  // Top Face (t00 -> t10 -> t11 -> t01)
  ctx.fillStyle = colors.top;
  ctx.beginPath();
  ctx.moveTo(t00.x, t00.y);
  ctx.lineTo(t10.x, t10.y);
  ctx.lineTo(t11.x, t11.y);
  ctx.lineTo(t01.x, t01.y);
  ctx.closePath();
  ctx.fill();

  // 1px Darker Outline
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'miter';

  // Outer profile lines
  ctx.beginPath();
  ctx.moveTo(t00.x, t00.y);
  ctx.lineTo(t10.x, t10.y);
  ctx.lineTo(t11.x, t11.y);
  ctx.lineTo(b11.x, b11.y);
  ctx.lineTo(b01.x, b01.y);
  ctx.lineTo(b00.x, b00.y);
  ctx.closePath();
  ctx.stroke();

  // Interior edge lines
  ctx.beginPath();
  ctx.moveTo(t01.x, t01.y);
  ctx.lineTo(b01.x, b01.y);
  ctx.moveTo(t01.x, t01.y);
  ctx.lineTo(t00.x, t00.y);
  ctx.moveTo(t01.x, t01.y);
  ctx.lineTo(t11.x, t11.y);
  ctx.stroke();
}

// -------------------------------------------------------------
// 2. Enclosed Cutaway Room Architecture (Floor Slab & Back Walls)
// -------------------------------------------------------------
export function drawEnclosedRoomStructure(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gridSize: number,
  wallHeight: number = 150,
  slabThickness: number = 24
) {
  // A. Cutaway Floor Slab (Visible thickness at bottom-front edges)
  const fRight = toScreen(gridSize, 0, 0, originX, originY);
  const fFront = toScreen(gridSize, gridSize, 0, originX, originY);
  const fLeft = toScreen(0, gridSize, 0, originX, originY);

  // Slab Front-Left Dropped Face
  ctx.fillStyle = ISO_PALETTE.slab_face;
  ctx.beginPath();
  ctx.moveTo(fLeft.x, fLeft.y);
  ctx.lineTo(fFront.x, fFront.y);
  ctx.lineTo(fFront.x, fFront.y + slabThickness);
  ctx.lineTo(fLeft.x, fLeft.y + slabThickness);
  ctx.closePath();
  ctx.fill();

  // Slab Front-Right Dropped Face
  ctx.fillStyle = ISO_PALETTE.slab_trim;
  ctx.beginPath();
  ctx.moveTo(fFront.x, fFront.y);
  ctx.lineTo(fRight.x, fRight.y);
  ctx.lineTo(fRight.x, fRight.y + slabThickness);
  ctx.lineTo(fFront.x, fFront.y + slabThickness);
  ctx.closePath();
  ctx.fill();

  // Slab Outline
  ctx.strokeStyle = ISO_PALETTE.outline_dark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fLeft.x, fLeft.y + slabThickness);
  ctx.lineTo(fFront.x, fFront.y + slabThickness);
  ctx.lineTo(fRight.x, fRight.y + slabThickness);
  ctx.lineTo(fRight.x, fRight.y);
  ctx.lineTo(fFront.x, fFront.y);
  ctx.lineTo(fLeft.x, fLeft.y);
  ctx.closePath();
  ctx.stroke();

  // B. Tiled Floor (2:1 Diamond Tiles with thin grid lines)
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      const p0 = toScreen(gx, gy, 0, originX, originY);
      const p1 = toScreen(gx + 1, gy, 0, originX, originY);
      const p2 = toScreen(gx + 1, gy + 1, 0, originX, originY);
      const p3 = toScreen(gx, gy + 1, 0, originX, originY);

      const isAlt = (gx + gy) % 2 === 0;
      ctx.fillStyle = isAlt ? ISO_PALETTE.floor_light : ISO_PALETTE.floor_medium;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = ISO_PALETTE.floor_grid;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // C. Left Back Wall (gy = 0, along X axis from 0 to gridSize)
  const wallThick = 0.28;

  // Inner Left Wall Surface
  const wBack = toScreen(0, 0, 0, originX, originY);
  const wRight = toScreen(gridSize, 0, 0, originX, originY);
  const wBackTop = toScreen(0, 0, wallHeight, originX, originY);
  const wRightTop = toScreen(gridSize, 0, wallHeight, originX, originY);

  ctx.fillStyle = ISO_PALETTE.wall_left;
  ctx.beginPath();
  ctx.moveTo(wBack.x, wBack.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(wRightTop.x, wRightTop.y);
  ctx.lineTo(wBackTop.x, wBackTop.y);
  ctx.closePath();
  ctx.fill();

  // Baseboard along Left Wall
  const bbRight = toScreen(gridSize, 0, 8, originX, originY);
  const bbBack = toScreen(0, 0, 8, originX, originY);
  ctx.fillStyle = ISO_PALETTE.wall_baseboard;
  ctx.beginPath();
  ctx.moveTo(wBack.x, wBack.y);
  ctx.lineTo(wRight.x, wRight.y);
  ctx.lineTo(bbRight.x, bbRight.y);
  ctx.lineTo(bbBack.x, bbBack.y);
  ctx.closePath();
  ctx.fill();

  // D. Right Back Wall (gx = 0, along Y axis from 0 to gridSize)
  const wLeft = toScreen(0, gridSize, 0, originX, originY);
  const wLeftTop = toScreen(0, gridSize, wallHeight, originX, originY);

  ctx.fillStyle = ISO_PALETTE.wall_right;
  ctx.beginPath();
  ctx.moveTo(wBack.x, wBack.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.lineTo(wLeftTop.x, wLeftTop.y);
  ctx.lineTo(wBackTop.x, wBackTop.y);
  ctx.closePath();
  ctx.fill();

  // Baseboard along Right Wall
  const bbLeft = toScreen(0, gridSize, 8, originX, originY);
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(wBack.x, wBack.y);
  ctx.lineTo(wLeft.x, wLeft.y);
  ctx.lineTo(bbLeft.x, bbLeft.y);
  ctx.lineTo(bbBack.x, bbBack.y);
  ctx.closePath();
  ctx.fill();

  // E. Visible Top Face on Both Back Walls (Showing Wall Thickness)
  const wBackTopThick = toScreen(-wallThick, -wallThick, wallHeight, originX, originY);
  const wRightTopThick = toScreen(gridSize, -wallThick, wallHeight, originX, originY);
  const wLeftTopThick = toScreen(-wallThick, gridSize, wallHeight, originX, originY);

  // Top Face of Left Wall
  ctx.fillStyle = ISO_PALETTE.wall_top;
  ctx.beginPath();
  ctx.moveTo(wBackTop.x, wBackTop.y);
  ctx.lineTo(wRightTop.x, wRightTop.y);
  ctx.lineTo(wRightTopThick.x, wRightTopThick.y);
  ctx.lineTo(wBackTopThick.x, wBackTopThick.y);
  ctx.closePath();
  ctx.fill();

  // Top Face of Right Wall
  ctx.beginPath();
  ctx.moveTo(wBackTop.x, wBackTop.y);
  ctx.lineTo(wLeftTop.x, wLeftTop.y);
  ctx.lineTo(wLeftTopThick.x, wLeftTopThick.y);
  ctx.lineTo(wBackTopThick.x, wBackTopThick.y);
  ctx.closePath();
  ctx.fill();

  // Crisp Wall Outlines
  ctx.strokeStyle = ISO_PALETTE.wall_outline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  // Interior Corner
  ctx.moveTo(wBack.x, wBack.y);
  ctx.lineTo(wBackTop.x, wBackTop.y);
  // Outer Profiles
  ctx.moveTo(wLeftTop.x, wLeftTop.y);
  ctx.lineTo(wLeftTopThick.x, wLeftTopThick.y);
  ctx.lineTo(wBackTopThick.x, wBackTopThick.y);
  ctx.lineTo(wRightTopThick.x, wRightTopThick.y);
  ctx.lineTo(wRightTop.x, wRightTop.y);
  // Top inner edges
  ctx.moveTo(wLeftTop.x, wLeftTop.y);
  ctx.lineTo(wBackTop.x, wBackTop.y);
  ctx.lineTo(wRightTop.x, wRightTop.y);
  // Side cutaways
  ctx.moveTo(wRight.x, wRight.y);
  ctx.lineTo(wRightTop.x, wRightTop.y);
  ctx.moveTo(wLeft.x, wLeft.y);
  ctx.lineTo(wLeftTop.x, wLeftTop.y);
  ctx.stroke();

  // F. Left Wall Window with Horizontal Blinds (Matches Screenshot 2)
  drawOfficeWindow(ctx, originX, originY, 2.2, 5.2, 45, 85);

  // G. Wall Decorations (Orange Clock, Pinboards, Framed Photo)
  drawWallDecor(ctx, originX, originY);
}

// -------------------------------------------------------------
// 3. Wall Decor Details (Window, Blinds, Clock, Posters)
// -------------------------------------------------------------
function drawOfficeWindow(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gxStart: number,
  gxEnd: number,
  gzBottom: number,
  gzHeight: number
) {
  const p0 = toScreen(gxStart, 0, gzBottom, originX, originY);
  const p1 = toScreen(gxEnd, 0, gzBottom, originX, originY);
  const p2 = toScreen(gxEnd, 0, gzBottom + gzHeight, originX, originY);
  const p3 = toScreen(gxStart, 0, gzBottom + gzHeight, originX, originY);

  // Outer Window Frame
  ctx.fillStyle = '#CBD5E1';
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();

  // Window Glass (Sky blue tint)
  const ip0 = toScreen(gxStart + 0.12, 0, gzBottom + 4, originX, originY);
  const ip1 = toScreen(gxEnd - 0.12, 0, gzBottom + 4, originX, originY);
  const ip2 = toScreen(gxEnd - 0.12, 0, gzBottom + gzHeight - 4, originX, originY);
  const ip3 = toScreen(gxStart + 0.12, 0, gzBottom + gzHeight - 4, originX, originY);

  ctx.fillStyle = '#BAE6FD';
  ctx.beginPath();
  ctx.moveTo(ip0.x, ip0.y);
  ctx.lineTo(ip1.x, ip1.y);
  ctx.lineTo(ip2.x, ip2.y);
  ctx.lineTo(ip3.x, ip3.y);
  ctx.closePath();
  ctx.fill();

  // Horizontal Venetian Blinds Slats
  ctx.strokeStyle = '#0284C7';
  ctx.lineWidth = 1.2;
  const numSlats = 12;
  for (let i = 1; i <= numSlats; i++) {
    const gz = gzBottom + 4 + (gzHeight - 8) * (i / (numSlats + 1));
    const sL = toScreen(gxStart + 0.12, 0, gz, originX, originY);
    const sR = toScreen(gxEnd - 0.12, 0, gz, originX, originY);
    ctx.beginPath();
    ctx.moveTo(sL.x, sL.y);
    ctx.lineTo(sR.x, sR.y);
    ctx.stroke();
  }

  // Frame Outlines
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.stroke();
}

function drawWallDecor(ctx: CanvasRenderingContext2D, originX: number, originY: number) {
  // 1. Certificates on Left Wall (gx = 0.8 and 1.5, gy = 0)
  for (let idx = 0; idx < 2; idx++) {
    const gx = 0.7 + idx * 0.75;
    const c0 = toScreen(gx, 0, 65, originX, originY);
    const c1 = toScreen(gx + 0.5, 0, 65, originX, originY);
    const c2 = toScreen(gx + 0.5, 0, 95, originX, originY);
    const c3 = toScreen(gx, 0, 95, originX, originY);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(c0.x, c0.y);
    ctx.lineTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.lineTo(c3.x, c3.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text rows inside certificate
    ctx.strokeStyle = '#CBD5E1';
    for (let r = 72; r <= 88; r += 6) {
      const l1 = toScreen(gx + 0.08, 0, r, originX, originY);
      const l2 = toScreen(gx + 0.42, 0, r, originX, originY);
      ctx.beginPath();
      ctx.moveTo(l1.x, l1.y);
      ctx.lineTo(l2.x, l2.y);
      ctx.stroke();
    }
  }

  // 2. Orange Wall Clock on Right Wall (gx = 0, gy = 1.6, gz = 110)
  const clockP = toScreen(0, 1.6, 110, originX, originY);
  ctx.fillStyle = ISO_PALETTE.accent_clock;
  ctx.beginPath();
  ctx.arc(clockP.x, clockP.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9A3412';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(clockP.x, clockP.y, 11, 0, Math.PI * 2);
  ctx.fill();

  // Clock Hands
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(clockP.x, clockP.y);
  ctx.lineTo(clockP.x + 4, clockP.y - 6);
  ctx.moveTo(clockP.x, clockP.y);
  ctx.lineTo(clockP.x - 5, clockP.y);
  ctx.stroke();

  // 3. Wooden Pinboard / Corkboard on Right Wall (gx = 0, gy = 2.6 to 3.8, gz = 70)
  const pb0 = toScreen(0, 2.4, 70, originX, originY);
  const pb1 = toScreen(0, 3.8, 70, originX, originY);
  const pb2 = toScreen(0, 3.8, 108, originX, originY);
  const pb3 = toScreen(0, 2.4, 108, originX, originY);

  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.moveTo(pb0.x, pb0.y);
  ctx.lineTo(pb1.x, pb1.y);
  ctx.lineTo(pb2.x, pb2.y);
  ctx.lineTo(pb3.x, pb3.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Sticky notes on corkboard (Pink, Yellow, Cyan)
  const stickyColors = ['#F43F5E', '#FBBF24', '#38BDF8'];
  stickyColors.forEach((col, i) => {
    const gyNote = 2.6 + i * 0.4;
    const gzNote = 76 + (i % 2) * 14;
    const n0 = toScreen(0, gyNote, gzNote, originX, originY);
    const n1 = toScreen(0, gyNote + 0.25, gzNote, originX, originY);
    const n2 = toScreen(0, gyNote + 0.25, gzNote + 10, originX, originY);
    const n3 = toScreen(0, gyNote + 0.25, gzNote + 10, originX, originY);

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(n0.x, n0.y);
    ctx.lineTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.lineTo(n3.x, n3.y);
    ctx.closePath();
    ctx.fill();
  });

  // 4. Framed Architecture Blueprint / Team Photo (gx = 0, gy = 4.4 to 5.4, gz = 65)
  const pic0 = toScreen(0, 4.3, 65, originX, originY);
  const pic1 = toScreen(0, 5.5, 65, originX, originY);
  const pic2 = toScreen(0, 5.5, 105, originX, originY);
  const pic3 = toScreen(0, 4.3, 105, originX, originY);

  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.moveTo(pic0.x, pic0.y);
  ctx.lineTo(pic1.x, pic1.y);
  ctx.lineTo(pic2.x, pic2.y);
  ctx.lineTo(pic3.x, pic3.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner graph/chart lines inside frame
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.5;
  const g1 = toScreen(0, 4.5, 74, originX, originY);
  const g2 = toScreen(0, 4.9, 88, originX, originY);
  const g3 = toScreen(0, 5.3, 80, originX, originY);
  ctx.beginPath();
  ctx.moveTo(g1.x, g1.y);
  ctx.lineTo(g2.x, g2.y);
  ctx.lineTo(g3.x, g3.y);
  ctx.stroke();
}

// -------------------------------------------------------------
// 4. Procedural Isometric Pixel Furniture Sprites
// -------------------------------------------------------------

// A. Executive Desk with Dual Screens, PC Tower & Stationery
export function createExecutiveDesk(
  gx: number,
  gy: number,
  deskWidth: number = 3.4,
  deskDepth: number = 1.4,
  deskHeight: number = 38
): RenderItem {
  return {
    depth: (gx + gy + deskWidth / 2 + deskDepth / 2) * 100 + 10,
    render: (ctx, originX, originY) => {
      const woodColors: BoxColors = {
        top: ISO_PALETTE.wood_top,
        left: ISO_PALETTE.wood_left,
        right: ISO_PALETTE.wood_right,
        outline: ISO_PALETTE.wood_outline
      };

      // Tabletop Slab
      drawShadedBox(ctx, originX, originY, gx, gy, deskHeight - 6, deskWidth, deskDepth, 6, woodColors, { hasShadow: true });

      // Left Leg panel
      drawShadedBox(ctx, originX, originY, gx + 0.1, gy + 0.1, 0, 0.25, deskDepth - 0.2, deskHeight - 6, woodColors);
      // Right Drawer pedestal
      drawShadedBox(ctx, originX, originY, gx + deskWidth - 0.85, gy + 0.1, 0, 0.75, deskDepth - 0.2, deskHeight - 6, woodColors);

      // Drawer Seams & Handles on Right Pedestal
      const drwPos = toScreen(gx + deskWidth - 0.45, gy + deskDepth, 10, originX, originY);
      ctx.fillStyle = '#475569';
      ctx.fillRect(drwPos.x - 10, drwPos.y - 3, 20, 4);
      const drwPos2 = toScreen(gx + deskWidth - 0.45, gy + deskDepth, 22, originX, originY);
      ctx.fillRect(drwPos2.x - 10, drwPos2.y - 3, 20, 4);

      // 2. PC Desktop Tower Under Desk
      const towerColors: BoxColors = { top: '#334155', left: '#1E293B', right: '#0F172A', outline: '#020617' };
      drawShadedBox(ctx, originX, originY, gx + 0.45, gy + 0.2, 0, 0.5, 0.9, 24, towerColors);
      const ledP = toScreen(gx + 0.65, gy + 1.1, 19, originX, originY);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(ledP.x - 2, ledP.y - 2, 4, 4);

      // 3. Ultra-Wide Monitor with Stand
      const monBaseColors: BoxColors = { top: '#64748B', left: '#475569', right: '#334155', outline: '#1E293B' };
      drawShadedBox(ctx, originX, originY, gx + 1.25, gy + 0.3, deskHeight, 0.8, 0.3, 6, monBaseColors);
      const monColors: BoxColors = { top: '#1E293B', left: '#0F172A', right: '#020617', outline: '#000000' };
      drawShadedBox(ctx, originX, originY, gx + 0.75, gy + 0.25, deskHeight + 6, 1.8, 0.2, 24, monColors);

      // Glowing Monitor Screen Display
      const scrP0 = toScreen(gx + 0.8, gy + 0.46, deskHeight + 7, originX, originY);
      const scrP1 = toScreen(gx + 2.5, gy + 0.46, deskHeight + 7, originX, originY);
      const scrP2 = toScreen(gx + 2.5, gy + 0.46, deskHeight + 29, originX, originY);
      const scrP3 = toScreen(gx + 0.8, gy + 0.46, deskHeight + 29, originX, originY);

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(scrP0.x, scrP0.y);
      ctx.lineTo(scrP1.x, scrP1.y);
      ctx.lineTo(scrP2.x, scrP2.y);
      ctx.lineTo(scrP3.x, scrP3.y);
      ctx.closePath();
      ctx.fill();

      // Ambient IDE Lines on Screen
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      const ide1 = toScreen(gx + 0.95, gy + 0.46, deskHeight + 24, originX, originY);
      const ide2 = toScreen(gx + 1.9, gy + 0.46, deskHeight + 24, originX, originY);
      ctx.beginPath();
      ctx.moveTo(ide1.x, ide1.y);
      ctx.lineTo(ide2.x, ide2.y);
      ctx.stroke();

      // 4. Keyboard on Desk
      const kbColors: BoxColors = { top: '#E2E8F0', left: '#94A3B8', right: '#64748B', outline: '#334155' };
      drawShadedBox(ctx, originX, originY, gx + 1.1, gy + 0.75, deskHeight, 1.0, 0.45, 2.5, kbColors);

      // 5. Mouse on Mousepad
      const mpColors: BoxColors = { top: '#334155', left: '#1E293B', right: '#0F172A', outline: '#0F172A' };
      drawShadedBox(ctx, originX, originY, gx + 2.25, gy + 0.75, deskHeight, 0.5, 0.45, 1.0, mpColors);
      const mouseP = toScreen(gx + 2.45, gy + 0.95, deskHeight + 1.5, originX, originY);
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(mouseP.x, mouseP.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // 6. Ceramic Coffee Mug
      const mugP = toScreen(gx + 0.4, gy + 0.8, deskHeight + 1.5, originX, originY);
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(mugP.x, mugP.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

// B. Ergonomic Office Chair with 5-Star Caster Wheels & Indigo Upholstery
export function createErgonomicChair(
  gx: number,
  gy: number,
  isOccupied: boolean = false
): RenderItem {
  return {
    depth: (gx + gy + 0.5) * 100 + 15,
    render: (ctx, originX, originY) => {
      // 1. Five-Star Wheeled Base (Dark Slate Caster)
      const baseCenter = toScreen(gx + 0.4, gy + 0.4, 0, originX, originY);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.0;
      for (let a = 0; a < 5; a++) {
        const rad = (a * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.moveTo(baseCenter.x, baseCenter.y);
        ctx.lineTo(baseCenter.x + Math.cos(rad) * 11, baseCenter.y + Math.sin(rad) * 6);
        ctx.stroke();
      }

      // Swivel Column
      ctx.fillStyle = '#64748B';
      ctx.fillRect(baseCenter.x - 2, baseCenter.y - 18, 4, 18);

      // 2. Padded Seat Cushion (Executive Purple / Indigo)
      const chairColors: BoxColors = {
        top: ISO_PALETTE.fabric_top,
        left: ISO_PALETTE.fabric_left,
        right: ISO_PALETTE.fabric_right,
        outline: ISO_PALETTE.fabric_outline
      };
      drawShadedBox(ctx, originX, originY, gx + 0.05, gy + 0.05, 18, 0.7, 0.7, 5, chairColors);

      // 3. Ergonomic Armrests
      ctx.fillStyle = '#1E293B';
      const armL = toScreen(gx + 0.02, gy + 0.35, 24, originX, originY);
      ctx.fillRect(armL.x - 2, armL.y - 5, 4, 8);
      const armR = toScreen(gx + 0.78, gy + 0.35, 24, originX, originY);
      ctx.fillRect(armR.x - 2, armR.y - 5, 4, 8);

      // 4. Contoured Mesh Backrest
      drawShadedBox(ctx, originX, originY, gx + 0.05, gy + 0.65, 23, 0.7, 0.15, 20, chairColors);
    }
  };
}

// C. Tall Filing Cabinet / Storage Credenza with Potted Plant & Cat on Top (Matches Screenshot 2!)
export function createFilingCabinetWithCat(
  gx: number,
  gy: number
): RenderItem {
  return {
    depth: (gx + gy + 0.8) * 100 + 12,
    render: (ctx, originX, originY) => {
      const cabColors: BoxColors = {
        top: ISO_PALETTE.wood_top,
        left: ISO_PALETTE.metal_left,
        right: ISO_PALETTE.metal_right,
        outline: ISO_PALETTE.metal_outline
      };
      const cabH = 78;
      drawShadedBox(ctx, originX, originY, gx, gy, 0, 1.3, 1.1, cabH, cabColors, { hasShadow: true });

      // 3 Drawers with Black Metal Handles
      for (let d = 0; d < 3; d++) {
        const handleZ = 14 + d * 24;
        const hPos = toScreen(gx + 0.65, gy + 1.1, handleZ, originX, originY);
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(hPos.x - 8, hPos.y - 2.5, 16, 5);

        // Drawer Seam Lines
        const seam0 = toScreen(gx, gy + 1.1, handleZ - 9, originX, originY);
        const seam1 = toScreen(gx + 1.3, gy + 1.1, handleZ - 9, originX, originY);
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(seam0.x, seam0.y);
        ctx.lineTo(seam1.x, seam1.y);
        ctx.stroke();
      }

      // 2. Potted Succulent Plant on Left Top of Cabinet
      const potColors: BoxColors = {
        top: ISO_PALETTE.pot_terracotta,
        left: '#EA580C',
        right: '#C2410C',
        outline: '#7C2D12'
      };
      drawShadedBox(ctx, originX, originY, gx + 0.15, gy + 0.15, cabH, 0.4, 0.4, 9, potColors);
      const leafP = toScreen(gx + 0.35, gy + 0.35, cabH + 12, originX, originY);
      ctx.fillStyle = ISO_PALETTE.plant_leaf;
      ctx.beginPath();
      ctx.arc(leafP.x, leafP.y, 7, 0, Math.PI * 2);
      ctx.fill();

      // 3. Adorable Sitting Office Cat on Top of Cabinet (Screenshot 2 Match!)
      const catP = toScreen(gx + 0.85, gy + 0.45, cabH, originX, originY);
      // Cat Body (Soft Grey)
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.ellipse(catP.x, catP.y - 9, 7, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cat Head
      ctx.beginPath();
      ctx.arc(catP.x, catP.y - 20, 6, 0, Math.PI * 2);
      ctx.fill();
      // Cat Ears
      ctx.beginPath();
      ctx.moveTo(catP.x - 5, catP.y - 23);
      ctx.lineTo(catP.x - 2, catP.y - 28);
      ctx.lineTo(catP.x - 2, catP.y - 23);
      ctx.moveTo(catP.x + 2, catP.y - 23);
      ctx.lineTo(catP.x + 2, catP.y - 28);
      ctx.lineTo(catP.x + 5, catP.y - 23);
      ctx.fill();
      // Red Collar
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(catP.x - 4, catP.y - 14, 8, 2.5);
      // Cat Tail
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(catP.x + 5, catP.y - 5);
      ctx.quadraticCurveTo(catP.x + 12, catP.y - 14, catP.x + 8, catP.y - 22);
      ctx.stroke();

      // 4. Waste Paper Basket Beside Cabinet
      const binColors: BoxColors = { top: '#CBD5E1', left: '#475569', right: '#334155', outline: '#1E293B' };
      drawShadedBox(ctx, originX, originY, gx + 1.45, gy + 0.2, 0, 0.5, 0.5, 16, binColors, { hasShadow: true });
      const paperP = toScreen(gx + 1.7, gy + 0.45, 16, originX, originY);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(paperP.x, paperP.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

// D. Executive Conference / Meeting Table with Chairs
export function createMeetingTable(
  gx: number,
  gy: number,
  width: number = 3.2,
  depth: number = 2.0
): RenderItem {
  return {
    depth: (gx + gy + width / 2 + depth / 2) * 100 + 8,
    render: (ctx, originX, originY) => {
      const woodColors: BoxColors = {
        top: ISO_PALETTE.wood_top,
        left: ISO_PALETTE.wood_left,
        right: ISO_PALETTE.wood_right,
        outline: ISO_PALETTE.wood_outline
      };

      // Tabletop Slab at height 32
      drawShadedBox(ctx, originX, originY, gx, gy, 30, width, depth, 5, woodColors, { hasShadow: true });

      // Pedestal Base Center Columns
      const baseColors: BoxColors = { top: '#64748B', left: '#475569', right: '#334155', outline: '#1E293B' };
      drawShadedBox(ctx, originX, originY, gx + 0.8, gy + 0.7, 0, 0.4, 0.6, 30, baseColors);
      drawShadedBox(ctx, originX, originY, gx + width - 1.2, gy + 0.7, 0, 0.4, 0.6, 30, baseColors);

      // Conference Table Center Tablet
      const tabletP = toScreen(gx + width / 2, gy + depth / 2, 36, originX, originY);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(tabletP.x, tabletP.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  };
}

// E. Executive Lounge 2-Seater Sofa with Coffee Table
export function createLoungeSofa(
  gx: number,
  gy: number,
  width: number = 2.4,
  depth: number = 1.2
): RenderItem {
  return {
    depth: (gx + gy + width / 2 + depth / 2) * 100 + 5,
    render: (ctx, originX, originY) => {
      const sofaColors: BoxColors = {
        top: ISO_PALETTE.fabric_top,
        left: ISO_PALETTE.fabric_left,
        right: ISO_PALETTE.fabric_right,
        outline: ISO_PALETTE.fabric_outline
      };

      // Seat cushion
      drawShadedBox(ctx, originX, originY, gx, gy, 0, width, depth, 16, sofaColors, { hasShadow: true });
      // Backrest
      drawShadedBox(ctx, originX, originY, gx, gy, 16, width, 0.35, 24, sofaColors);
      // Left Armrest
      drawShadedBox(ctx, originX, originY, gx, gy, 16, 0.35, depth, 10, sofaColors);
      // Right Armrest
      drawShadedBox(ctx, originX, originY, gx + width - 0.35, gy, 16, 0.35, depth, 10, sofaColors);

      // Low Modern Coffee Table in front
      const tableColors: BoxColors = { top: '#F8FAFC', left: '#E2E8F0', right: '#CBD5E1', outline: '#64748B' };
      drawShadedBox(ctx, originX, originY, gx + 0.3, gy + depth + 0.3, 0, 1.8, 0.8, 12, tableColors, { hasShadow: true });

      // Coffee mug on coffee table
      const mugP = toScreen(gx + 0.7, gy + depth + 0.6, 14, originX, originY);
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.arc(mugP.x, mugP.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

// F. Indoor Potted Tree (Ficus / Monstera)
export function createPottedTree(
  gx: number,
  gy: number
): RenderItem {
  return {
    depth: (gx + gy + 0.5) * 100 + 14,
    render: (ctx, originX, originY) => {
      const potColors: BoxColors = {
        top: ISO_PALETTE.pot_terracotta,
        left: '#EA580C',
        right: '#C2410C',
        outline: '#7C2D12'
      };
      drawShadedBox(ctx, originX, originY, gx, gy, 0, 0.8, 0.8, 16, potColors, { hasShadow: true });

      // Trunk
      const trunkP = toScreen(gx + 0.4, gy + 0.4, 16, originX, originY);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.moveTo(trunkP.x, trunkP.y);
      ctx.lineTo(trunkP.x, trunkP.y - 20);
      ctx.stroke();

      // Lush Leaves Foliage (Multi-Tone Greens)
      const topP = toScreen(gx + 0.4, gy + 0.4, 38, originX, originY);
      ctx.fillStyle = ISO_PALETTE.plant_dark;
      ctx.beginPath();
      ctx.arc(topP.x, topP.y + 4, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ISO_PALETTE.plant_leaf;
      ctx.beginPath();
      ctx.arc(topP.x - 4, topP.y - 4, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#86EFAC';
      ctx.beginPath();
      ctx.arc(topP.x - 2, topP.y - 8, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

// -------------------------------------------------------------
// 5. Isometric Character Rendering with Real Sprites & Overlay
// -------------------------------------------------------------
export interface IsoCharacterRenderData {
  id: string;
  name: string;
  role: string;
  gx: number;
  gy: number;
  gz?: number;
  facing: 'SW' | 'SE' | 'NW' | 'NE';
  isWalking: boolean;
  isSeated: boolean;
  avatarFile?: string;
  isAuri?: boolean;
  statusText?: string;
  avatarImg?: HTMLImageElement | null;
}

export function createCharacterRenderItem(
  char: IsoCharacterRenderData
): RenderItem {
  const gz = char.gz || (char.isSeated ? 14 : 0);
  return {
    depth: (char.gx + char.gy) * 100 + 40,
    render: (ctx, originX, originY) => {
      const pos = toScreen(char.gx, char.gy, gz, originX, originY);

      // Soft Ground Shadow
      ctx.save();
      ctx.fillStyle = ISO_PALETTE.shadow_soft;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + (char.isSeated ? 10 : 0), 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Avatar Sprite if available, or procedural pixel figure
      if (char.avatarImg && char.avatarImg.complete && char.avatarImg.naturalWidth > 0) {
        ctx.imageSmoothingEnabled = false;
        const spriteSize = char.isAuri ? 56 : 64;
        const yOff = char.isSeated ? -52 : -62;
        ctx.drawImage(
          char.avatarImg,
          pos.x - spriteSize / 2,
          pos.y + yOff,
          spriteSize,
          spriteSize
        );
      } else {
        const yBase = pos.y + (char.isSeated ? -20 : -30);
        ctx.fillStyle = char.isAuri ? '#EA580C' : '#1E293B';
        ctx.fillRect(pos.x - 9, yBase, 18, char.isSeated ? 16 : 24);

        ctx.fillStyle = char.isAuri ? '#F97316' : '#EF4444';
        ctx.fillRect(pos.x - 2, yBase + 4, 4, 10);

        ctx.fillStyle = char.isAuri ? '#FB923C' : '#FBBF24';
        ctx.beginPath();
        ctx.arc(pos.x, yBase - 10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = char.isAuri ? '#C2410C' : '#0F172A';
        ctx.beginPath();
        ctx.arc(pos.x, yBase - 14, 8, Math.PI, Math.PI * 2);
        ctx.fill();
      }

      // Name Label & Activity Status Overlay
      ctx.save();
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';

      const tagY = pos.y - 74;
      const text = char.name;
      const metrics = ctx.measureText(text);
      const bgW = metrics.width + 14;

      // Label background pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(pos.x - bgW / 2, tagY - 12, bgW, 17);
      ctx.strokeStyle = char.isAuri ? '#F97316' : '#64748B';
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - bgW / 2, tagY - 12, bgW, 17);

      // Label text
      ctx.fillStyle = char.isAuri ? '#FB923C' : '#FFFFFF';
      ctx.fillText(text, pos.x, tagY + 1);

      // Status pill below name
      if (char.statusText) {
        ctx.font = '9px monospace';
        const stW = ctx.measureText(char.statusText).width + 10;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.90)';
        ctx.fillRect(pos.x - stW / 2, tagY + 8, stW, 14);
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(char.statusText, pos.x, tagY + 19);
      }
      ctx.restore();
    }
  };
}
