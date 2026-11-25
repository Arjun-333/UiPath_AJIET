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
  if (gridSize >= 14) {
    drawOfficeWindow(ctx, originX, originY, 2.4, 6.0, 45, 88);
    drawOfficeWindow(ctx, originX, originY, 9.0, 12.6, 45, 88);
  } else {
    drawOfficeWindow(ctx, originX, originY, 2.2, 5.2, 45, 85);
  }

  // G. Wall Decorations (Orange Clock, Pinboards, Framed Photo)
  drawWallDecor(ctx, originX, originY, gridSize);
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

function drawWallDecor(ctx: CanvasRenderingContext2D, originX: number, originY: number, gridSize: number = 10) {
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

  // 1b. Autonomia Brand Plaque on Left Wall between windows if wide grid
  if (gridSize >= 14) {
    const bp0 = toScreen(7.0, 0, 68, originX, originY);
    const bp1 = toScreen(8.2, 0, 68, originX, originY);
    const bp2 = toScreen(8.2, 0, 102, originX, originY);
    const bp3 = toScreen(7.0, 0, 102, originX, originY);

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(bp0.x, bp0.y);
    ctx.lineTo(bp1.x, bp1.y);
    ctx.lineTo(bp2.x, bp2.y);
    ctx.lineTo(bp3.x, bp3.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const bMid = toScreen(7.6, 0, 85, originX, originY);
    ctx.fillText('AUTONOMIA', bMid.x, bMid.y - 4);
    ctx.font = '7px monospace';
    ctx.fillStyle = '#38BDF8';
    ctx.fillText('AI HQ', bMid.x, bMid.y + 5);
  }

  // 2. Orange Wall Clock on Right Wall (gx = 0, gy = 1.3, gz = 112)
  const clockP = toScreen(0, 1.3, 112, originX, originY);
  ctx.fillStyle = ISO_PALETTE.accent_clock;
  ctx.beginPath();
  ctx.arc(clockP.x, clockP.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#9A3412';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(clockP.x, clockP.y, 10, 0, Math.PI * 2);
  ctx.fill();

  // Clock Hands
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(clockP.x, clockP.y);
  ctx.lineTo(clockP.x + 3, clockP.y - 5);
  ctx.moveTo(clockP.x, clockP.y);
  ctx.lineTo(clockP.x - 4, clockP.y);
  ctx.stroke();

  // 3. Wooden Pinboard / Corkboard on Right Wall (gx = 0, gy = 2.0 to 3.0, gz = 70)
  const pb0 = toScreen(0, 2.0, 70, originX, originY);
  const pb1 = toScreen(0, 3.0, 70, originX, originY);
  const pb2 = toScreen(0, 3.0, 106, originX, originY);
  const pb3 = toScreen(0, 2.0, 106, originX, originY);

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
    const gyNote = 2.15 + i * 0.3;
    const gzNote = 76 + (i % 2) * 14;
    const n0 = toScreen(0, gyNote, gzNote, originX, originY);
    const n1 = toScreen(0, gyNote + 0.22, gzNote, originX, originY);
    const n2 = toScreen(0, gyNote + 0.22, gzNote + 9, originX, originY);
    const n3 = toScreen(0, gyNote, gzNote + 9, originX, originY);

    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(n0.x, n0.y);
    ctx.lineTo(n1.x, n1.y);
    ctx.lineTo(n2.x, n2.y);
    ctx.lineTo(n3.x, n3.y);
    ctx.closePath();
    ctx.fill();
  });

  // 4. Framed Architecture Blueprint / Team Photo (gx = 0, gy = 3.3 to 4.2, gz = 68)
  const pic0 = toScreen(0, 3.3, 68, originX, originY);
  const pic1 = toScreen(0, 4.3, 68, originX, originY);
  const pic2 = toScreen(0, 4.3, 106, originX, originY);
  const pic3 = toScreen(0, 3.3, 106, originX, originY);

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
  const g1 = toScreen(0, 3.5, 76, originX, originY);
  const g2 = toScreen(0, 3.8, 90, originX, originY);
  const g3 = toScreen(0, 4.1, 82, originX, originY);
  ctx.beginPath();
  ctx.moveTo(g1.x, g1.y);
  ctx.lineTo(g2.x, g2.y);
  ctx.lineTo(g3.x, g3.y);
  ctx.stroke();

  // 5. Strategic Roadmap / OKR Banner if wide grid
  if (gridSize >= 14) {
    const rm0 = toScreen(0, 7.6, 65, originX, originY);
    const rm1 = toScreen(0, 10.2, 65, originX, originY);
    const rm2 = toScreen(0, 10.2, 102, originX, originY);
    const rm3 = toScreen(0, 7.6, 102, originX, originY);

    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(rm0.x, rm0.y);
    ctx.lineTo(rm1.x, rm1.y);
    ctx.lineTo(rm2.x, rm2.y);
    ctx.lineTo(rm3.x, rm3.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Roadmap Milestone Bars (emerald, amber, violet)
    const barColors = ['#10B981', '#F59E0B', '#8B5CF6'];
    barColors.forEach((barCol, bIdx) => {
      const bz = 72 + bIdx * 9;
      const bL = toScreen(0, 7.8, bz, originX, originY);
      const bR = toScreen(0, 7.8 + 1.2 + bIdx * 0.4, bz, originX, originY);
      ctx.strokeStyle = barCol;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bL.x, bL.y);
      ctx.lineTo(bR.x, bR.y);
      ctx.stroke();
    });
  }
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

// -------------------------------------------------------------
// 10. Architectural Isometric Staircase Leading Upward
// -------------------------------------------------------------
// Renders an executive ascending staircase leading up to Floor 1 (Media Studio)
// Features 2:1 isometric steps, risers facing viewer, outer steel/wood handrail,
// top mezzanine landing, and wall portal aperture with illuminated signboard.
export function createStaircaseUp(
  gx: number = 0.2,
  gyBottom: number = 9.4,
  gyTop: number = 5.2,
  targetFloor: number = 1,
  signLabel: string = '▲ TO FLOOR 1: MEDIA STUDIO'
): RenderItem[] {
  const items: RenderItem[] = [];
  const stairWidth = 1.4; // Width in X axis (from gx to gx + stairWidth)
  const numSteps = 8;
  const stepRise = 8; // gz rise per step
  const landingHeight = numSteps * stepRise + 8; // gz = 72px

  // A. Entrance Threshold Mat on Floor (gz = 0)
  items.push({
    depth: (gx + stairWidth / 2 + gyBottom + 0.2) * 100,
    render: (ctx, originX, originY) => {
      // Entrance mat / floor transition zone
      const m0 = toScreen(gx - 0.1, gyBottom, 0, originX, originY);
      const m1 = toScreen(gx + stairWidth + 0.1, gyBottom, 0, originX, originY);
      const m2 = toScreen(gx + stairWidth + 0.1, gyBottom + 0.5, 0, originX, originY);
      const m3 = toScreen(gx - 0.1, gyBottom + 0.5, 0, originX, originY);

      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(m0.x, m0.y);
      ctx.lineTo(m1.x, m1.y);
      ctx.lineTo(m2.x, m2.y);
      ctx.lineTo(m3.x, m3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Subtle directional chevron on entrance mat
      const arrCenter = toScreen(gx + stairWidth / 2, gyBottom + 0.25, 0, originX, originY);
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.moveTo(arrCenter.x, arrCenter.y - 4);
      ctx.lineTo(arrCenter.x + 5, arrCenter.y + 2);
      ctx.lineTo(arrCenter.x - 5, arrCenter.y + 2);
      ctx.closePath();
      ctx.fill();
    }
  });

  // B. Ascending Steps (from gyBottom up to gyTop)
  const gySpan = (gyBottom - gyTop) / numSteps;

  for (let i = 0; i < numSteps; i++) {
    const gyStart = gyBottom - i * gySpan;
    const gyEnd = gyStart - gySpan;
    const gz = (i + 1) * stepRise;
    const gyMid = (gyStart + gyEnd) / 2;

    items.push({
      depth: (gx + stairWidth / 2 + gyMid) * 100 + gz,
      render: (ctx, originX, originY) => {
        // 1. Step Tread (Top Face in Honey Oak)
        const t0 = toScreen(gx, gyEnd, gz, originX, originY);
        const t1 = toScreen(gx + stairWidth, gyEnd, gz, originX, originY);
        const t2 = toScreen(gx + stairWidth, gyStart, gz, originX, originY);
        const t3 = toScreen(gx, gyStart, gz, originX, originY);

        ctx.fillStyle = ISO_PALETTE.wood_top;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.closePath();
        ctx.fill();

        // Non-slip subtle tread groove
        const g0 = toScreen(gx + 0.15, gyStart - gySpan * 0.3, gz, originX, originY);
        const g1 = toScreen(gx + stairWidth - 0.15, gyStart - gySpan * 0.3, gz, originX, originY);
        ctx.strokeStyle = ISO_PALETTE.wood_left;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(g0.x, g0.y);
        ctx.lineTo(g1.x, g1.y);
        ctx.stroke();

        ctx.strokeStyle = ISO_PALETTE.wood_outline;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.closePath();
        ctx.stroke();

        // 2. Step Riser (Vertical Face facing viewer at gyStart, from gz - stepRise to gz)
        const rB0 = toScreen(gx, gyStart, gz - stepRise, originX, originY);
        const rB1 = toScreen(gx + stairWidth, gyStart, gz - stepRise, originX, originY);
        const rT1 = toScreen(gx + stairWidth, gyStart, gz, originX, originY);
        const rT0 = toScreen(gx, gyStart, gz, originX, originY);

        ctx.fillStyle = '#E2E8F0'; // Crisp architectural off-white riser
        ctx.beginPath();
        ctx.moveTo(rB0.x, rB0.y);
        ctx.lineTo(rB1.x, rB1.y);
        ctx.lineTo(rT1.x, rT1.y);
        ctx.lineTo(rT0.x, rT0.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3. Outer Stringer Face (along gx + stairWidth, down to ground)
        const sT0 = toScreen(gx + stairWidth, gyEnd, gz, originX, originY);
        const sT1 = toScreen(gx + stairWidth, gyStart, gz, originX, originY);
        const sB1 = toScreen(gx + stairWidth, gyStart, 0, originX, originY);
        const sB0 = toScreen(gx + stairWidth, gyEnd, 0, originX, originY);

        ctx.fillStyle = '#CBD5E1'; // Solid architectural support wall below stairs
        ctx.beginPath();
        ctx.moveTo(sT0.x, sT0.y);
        ctx.lineTo(sT1.x, sT1.y);
        ctx.lineTo(sB1.x, sB1.y);
        ctx.lineTo(sB0.x, sB0.y);
        ctx.closePath();
        ctx.fill();

        // Base trim line along ground
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sT0.x, sT0.y);
        ctx.lineTo(sT1.x, sT1.y);
        ctx.lineTo(sB1.x, sB1.y);
        ctx.stroke();

        // 4. Baluster Post & Handrail segment at outer edge (gx + stairWidth)
        const balusterBase = toScreen(gx + stairWidth - 0.05, gyMid, gz, originX, originY);
        const balusterTop = toScreen(gx + stairWidth - 0.05, gyMid, gz + 22, originX, originY);

        // Vertical Baluster post
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(balusterBase.x, balusterBase.y);
        ctx.lineTo(balusterTop.x, balusterTop.y);
        ctx.stroke();

        // Handrail segment
        const prevMid = gyMid + gySpan;
        const prevZ = gz - stepRise;
        const hrStart = toScreen(gx + stairWidth - 0.05, prevMid, prevZ + 22, originX, originY);

        ctx.strokeStyle = ISO_PALETTE.wood_outline;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hrStart.x, hrStart.y);
        ctx.lineTo(balusterTop.x, balusterTop.y);
        ctx.stroke();

        // Shiny handrail top highlight
        ctx.strokeStyle = ISO_PALETTE.wood_top;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hrStart.x, hrStart.y - 1);
        ctx.lineTo(balusterTop.x, balusterTop.y - 1);
        ctx.stroke();
      }
    });
  }

  // C. Upper Mezzanine Landing & Wall Portal Aperture
  const landingGyStart = gyTop;
  const landingGyEnd = gyTop - 0.9;
  const landingGz = landingHeight;

  items.push({
    depth: (gx + stairWidth / 2 + (landingGyStart + landingGyEnd) / 2) * 100 + landingGz,
    render: (ctx, originX, originY) => {
      // 1. Landing Platform Top Face
      const lp0 = toScreen(0, landingGyEnd, landingGz, originX, originY);
      const lp1 = toScreen(gx + stairWidth, landingGyEnd, landingGz, originX, originY);
      const lp2 = toScreen(gx + stairWidth, landingGyStart, landingGz, originX, originY);
      const lp3 = toScreen(0, landingGyStart, landingGz, originX, originY);

      ctx.fillStyle = ISO_PALETTE.wood_top;
      ctx.beginPath();
      ctx.moveTo(lp0.x, lp0.y);
      ctx.lineTo(lp1.x, lp1.y);
      ctx.lineTo(lp2.x, lp2.y);
      ctx.lineTo(lp3.x, lp3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = ISO_PALETTE.wood_outline;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Landing Platform Front Face
      const lf0 = toScreen(0, landingGyStart, landingGz - 6, originX, originY);
      const lf1 = toScreen(gx + stairWidth, landingGyStart, landingGz - 6, originX, originY);
      const lf2 = toScreen(gx + stairWidth, landingGyStart, landingGz, originX, originY);
      const lf3 = toScreen(0, landingGyStart, landingGz, originX, originY);

      ctx.fillStyle = ISO_PALETTE.wood_left;
      ctx.beginPath();
      ctx.moveTo(lf0.x, lf0.y);
      ctx.lineTo(lf1.x, lf1.y);
      ctx.lineTo(lf2.x, lf2.y);
      ctx.lineTo(lf3.x, lf3.y);
      ctx.closePath();
      ctx.fill();

      // Landing Platform Outer Side Face down to floor
      const ls0 = toScreen(gx + stairWidth, landingGyEnd, 0, originX, originY);
      const ls1 = toScreen(gx + stairWidth, landingGyStart, 0, originX, originY);
      const ls2 = toScreen(gx + stairWidth, landingGyStart, landingGz, originX, originY);
      const ls3 = toScreen(gx + stairWidth, landingGyEnd, landingGz, originX, originY);

      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(ls0.x, ls0.y);
      ctx.lineTo(ls1.x, ls1.y);
      ctx.lineTo(ls2.x, ls2.y);
      ctx.lineTo(ls3.x, ls3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Landing Safety Railing along the back/outer edges
      const rP0 = toScreen(gx + stairWidth - 0.05, landingGyStart, landingGz + 22, originX, originY);
      const rP1 = toScreen(gx + stairWidth - 0.05, landingGyEnd, landingGz + 22, originX, originY);
      ctx.strokeStyle = ISO_PALETTE.wood_outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rP0.x, rP0.y);
      ctx.lineTo(rP1.x, rP1.y);
      ctx.stroke();

      // Glass Balustrade Panel on Landing
      const gP0 = toScreen(gx + stairWidth - 0.05, landingGyStart, landingGz, originX, originY);
      const gP1 = toScreen(gx + stairWidth - 0.05, landingGyEnd, landingGz, originX, originY);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)'; // Soft tinted glass
      ctx.beginPath();
      ctx.moveTo(gP0.x, gP0.y);
      ctx.lineTo(gP1.x, gP1.y);
      ctx.lineTo(rP1.x, rP1.y);
      ctx.lineTo(rP0.x, rP0.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Doorway Portal Aperture cut into Right Back Wall (gx = 0)
      const doorGyStart = landingGyStart;
      const doorGyEnd = landingGyEnd;
      const doorBottom = landingGz;
      const doorTop = landingGz + 64;

      const d0 = toScreen(0, doorGyStart, doorBottom, originX, originY);
      const d1 = toScreen(0, doorGyEnd, doorBottom, originX, originY);
      const d2 = toScreen(0, doorGyEnd, doorTop, originX, originY);
      const d3 = toScreen(0, doorGyStart, doorTop, originX, originY);

      // Deep portal opening cavity
      const portalGrad = ctx.createLinearGradient(d0.x, d0.y, d1.x, d1.y);
      portalGrad.addColorStop(0, '#0F172A');
      portalGrad.addColorStop(1, '#020617');

      ctx.fillStyle = portalGrad;
      ctx.beginPath();
      ctx.moveTo(d0.x, d0.y);
      ctx.lineTo(d1.x, d1.y);
      ctx.lineTo(d2.x, d2.y);
      ctx.lineTo(d3.x, d3.y);
      ctx.closePath();
      ctx.fill();

      // Ambient passage glow from inside portal leading upward
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.beginPath();
      ctx.moveTo(d0.x, d0.y);
      ctx.lineTo(d1.x, d1.y);
      ctx.lineTo(d2.x, d2.y - 15);
      ctx.lineTo(d3.x, d3.y - 15);
      ctx.closePath();
      ctx.fill();

      // Doorway casing / architectural frame
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(d0.x, d0.y);
      ctx.lineTo(d3.x, d3.y);
      ctx.lineTo(d2.x, d2.y);
      ctx.lineTo(d1.x, d1.y);
      ctx.stroke();

      // 3. Directional Signboard above Doorway
      const sCenter = toScreen(0, (doorGyStart + doorGyEnd) / 2, doorTop + 14, originX, originY);
      const signW = 175;
      const signH = 22;

      ctx.save();
      // Sign background pill
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(sCenter.x - signW / 2, sCenter.y - signH / 2, signW, signH);

      // Cyan / Amber corporate border
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sCenter.x - signW / 2, sCenter.y - signH / 2, signW, signH);

      // Status indicator LED (Emerald green pulse)
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(sCenter.x - signW / 2 + 10, sCenter.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Signboard text
      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(signLabel, sCenter.x + 5, sCenter.y);
      ctx.restore();
    }
  });

  return items;
}

// -------------------------------------------------------------
// 11. Architectural Isometric Staircase Leading Downward
// -------------------------------------------------------------
// Connects upper floors back down to lower floors through a cutaway
// stairwell aperture in the floor slab with glass balustrades & directional sign.
export function createStaircaseDown(
  gx: number = 0.2,
  gyTop: number = 5.2,
  gyBottom: number = 9.4,
  targetFloor: number = 0,
  signLabel: string = '▼ TO FLOOR 0: EXECUTIVE SUITE'
): RenderItem[] {
  const items: RenderItem[] = [];
  const stairWidth = 1.4;
  const numSteps = 7;
  const gySpan = (gyBottom - gyTop) / numSteps;

  // A. Stairwell Cutaway Cavity & Descending Steps
  items.push({
    depth: (gx + stairWidth / 2 + (gyTop + gyBottom) / 2) * 100 - 10,
    render: (ctx, originX, originY) => {
      // Dark stairwell cavity beneath the floor opening
      const c0 = toScreen(gx, gyTop, 0, originX, originY);
      const c1 = toScreen(gx + stairWidth, gyTop, 0, originX, originY);
      const c2 = toScreen(gx + stairWidth, gyBottom, 0, originX, originY);
      const c3 = toScreen(gx, gyBottom, 0, originX, originY);

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(c0.x, c0.y);
      ctx.lineTo(c1.x, c1.y);
      ctx.lineTo(c2.x, c2.y);
      ctx.lineTo(c3.x, c3.y);
      ctx.closePath();
      ctx.fill();

      // Outer rim safety trim
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Descending treads into stairwell
      for (let i = 0; i < numSteps; i++) {
        const yS = gyTop + i * gySpan;
        const yE = yS + gySpan;
        const z = -((i + 1) * 7);

        const s0 = toScreen(gx + 0.1, yS, z, originX, originY);
        const s1 = toScreen(gx + stairWidth - 0.1, yS, z, originX, originY);
        const s2 = toScreen(gx + stairWidth - 0.1, yE, z, originX, originY);
        const s3 = toScreen(gx + 0.1, yE, z, originX, originY);

        ctx.fillStyle = i % 2 === 0 ? '#BD8036' : '#7C4F1A';
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.lineTo(s3.x, s3.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  });

  // B. Upper Floor Guardrail & Entry Portal at Floor Level (gz = 0 to 24)
  items.push({
    depth: (gx + stairWidth / 2 + (gyTop + gyBottom) / 2) * 100 + 35,
    render: (ctx, originX, originY) => {
      // Guardrail along outer edge of descending stairwell (gx + stairWidth)
      const gr0 = toScreen(gx + stairWidth, gyTop, 22, originX, originY);
      const gr1 = toScreen(gx + stairWidth, gyBottom - 0.4, 22, originX, originY);

      // Glass Balustrade panel
      const gb0 = toScreen(gx + stairWidth, gyTop, 0, originX, originY);
      const gb1 = toScreen(gx + stairWidth, gyBottom - 0.4, 0, originX, originY);

      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      ctx.beginPath();
      ctx.moveTo(gb0.x, gb0.y);
      ctx.lineTo(gb1.x, gb1.y);
      ctx.lineTo(gr1.x, gr1.y);
      ctx.lineTo(gr0.x, gr0.y);
      ctx.closePath();
      ctx.fill();

      // Handrail
      ctx.strokeStyle = ISO_PALETTE.wood_outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gr0.x, gr0.y);
      ctx.lineTo(gr1.x, gr1.y);
      ctx.stroke();

      // Posts
      const pMid = toScreen(gx + stairWidth, (gyTop + gyBottom) / 2, 0, originX, originY);
      const pMidTop = toScreen(gx + stairWidth, (gyTop + gyBottom) / 2, 22, originX, originY);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pMid.x, pMid.y);
      ctx.lineTo(pMidTop.x, pMidTop.y);
      ctx.moveTo(gb0.x, gb0.y);
      ctx.lineTo(gr0.x, gr0.y);
      ctx.stroke();

      // Downward Directional Signboard on Wall
      const sCenter = toScreen(0, (gyTop + gyBottom) / 2 - 0.6, 75, originX, originY);
      const signW = 180;
      const signH = 22;

      ctx.save();
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(sCenter.x - signW / 2, sCenter.y - signH / 2, signW, signH);
      ctx.strokeStyle = '#F59E0B'; // Amber portal border for downward connection
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sCenter.x - signW / 2, sCenter.y - signH / 2, signW, signH);

      // Status indicator LED
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(sCenter.x - signW / 2 + 10, sCenter.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(signLabel, sCenter.x + 5, sCenter.y);
      ctx.restore();
    }
  });

  return items;
}

// -------------------------------------------------------------
// 12. Architectural Isometric Staircase Ascending Along Left Wall
// -------------------------------------------------------------
// Ascends along the Left Back Wall (gy = 0, along X axis) towards
// an upper mezzanine portal leading up to Floor 2 (Marketing & Growth).
export function createStaircaseUpAlongLeftWall(
  gy: number = 0.2,
  gxBottom: number = 9.4,
  gxTop: number = 5.6,
  targetFloor: number = 2,
  signLabel: string = '▲ TO FLOOR 2: MARKETING & GROWTH'
): RenderItem[] {
  const items: RenderItem[] = [];
  const stairDepth = 1.3; // Depth in Y axis
  const numSteps = 7;
  const stepRise = 9;
  const landingHeight = numSteps * stepRise + 9; // gz = 72px
  const gxSpan = (gxBottom - gxTop) / numSteps;

  // A. Entrance Threshold Mat on Floor (gz = 0)
  items.push({
    depth: (gxBottom + 0.2 + gy + stairDepth / 2) * 100,
    render: (ctx, originX, originY) => {
      const m0 = toScreen(gxBottom, gy - 0.1, 0, originX, originY);
      const m1 = toScreen(gxBottom, gy + stairDepth + 0.1, 0, originX, originY);
      const m2 = toScreen(gxBottom + 0.5, gy + stairDepth + 0.1, 0, originX, originY);
      const m3 = toScreen(gxBottom + 0.5, gy - 0.1, 0, originX, originY);

      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(m0.x, m0.y);
      ctx.lineTo(m1.x, m1.y);
      ctx.lineTo(m2.x, m2.y);
      ctx.lineTo(m3.x, m3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // B. Ascending Steps along X
  for (let i = 0; i < numSteps; i++) {
    const gxStart = gxBottom - i * gxSpan;
    const gxEnd = gxStart - gxSpan;
    const gz = (i + 1) * stepRise;
    const gxMid = (gxStart + gxEnd) / 2;

    items.push({
      depth: (gxMid + gy + stairDepth / 2) * 100 + gz,
      render: (ctx, originX, originY) => {
        // 1. Step Tread (Top Face in Honey Oak)
        const t0 = toScreen(gxEnd, gy, gz, originX, originY);
        const t1 = toScreen(gxStart, gy, gz, originX, originY);
        const t2 = toScreen(gxStart, gy + stairDepth, gz, originX, originY);
        const t3 = toScreen(gxEnd, gy + stairDepth, gz, originX, originY);

        ctx.fillStyle = ISO_PALETTE.wood_top;
        ctx.beginPath();
        ctx.moveTo(t0.x, t0.y);
        ctx.lineTo(t1.x, t1.y);
        ctx.lineTo(t2.x, t2.y);
        ctx.lineTo(t3.x, t3.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = ISO_PALETTE.wood_outline;
        ctx.lineWidth = 1;
        ctx.stroke();

        // 2. Step Riser (Vertical Face facing viewer at gxStart, along Y)
        const rB0 = toScreen(gxStart, gy, gz - stepRise, originX, originY);
        const rB1 = toScreen(gxStart, gy + stairDepth, gz - stepRise, originX, originY);
        const rT1 = toScreen(gxStart, gy + stairDepth, gz, originX, originY);
        const rT0 = toScreen(gxStart, gy, gz, originX, originY);

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        ctx.moveTo(rB0.x, rB0.y);
        ctx.lineTo(rB1.x, rB1.y);
        ctx.lineTo(rT1.x, rT1.y);
        ctx.lineTo(rT0.x, rT0.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3. Outer Stringer Face (along gy + stairDepth, down to floor)
        const sT0 = toScreen(gxEnd, gy + stairDepth, gz, originX, originY);
        const sT1 = toScreen(gxStart, gy + stairDepth, gz, originX, originY);
        const sB1 = toScreen(gxStart, gy + stairDepth, 0, originX, originY);
        const sB0 = toScreen(gxEnd, gy + stairDepth, 0, originX, originY);

        ctx.fillStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(sT0.x, sT0.y);
        ctx.lineTo(sT1.x, sT1.y);
        ctx.lineTo(sB1.x, sB1.y);
        ctx.lineTo(sB0.x, sB0.y);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 4. Baluster Post & Handrail segment at outer edge (gy + stairDepth)
        const bBase = toScreen(gxMid, gy + stairDepth - 0.05, gz, originX, originY);
        const bTop = toScreen(gxMid, gy + stairDepth - 0.05, gz + 22, originX, originY);

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bBase.x, bBase.y);
        ctx.lineTo(bTop.x, bTop.y);
        ctx.stroke();

        // Handrail segment
        const prevMid = gxMid + gxSpan;
        const prevZ = gz - stepRise;
        const hrStart = toScreen(prevMid, gy + stairDepth - 0.05, prevZ + 22, originX, originY);

        ctx.strokeStyle = ISO_PALETTE.wood_outline;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hrStart.x, hrStart.y);
        ctx.lineTo(bTop.x, bTop.y);
        ctx.stroke();

        ctx.strokeStyle = ISO_PALETTE.wood_top;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hrStart.x, hrStart.y - 1);
        ctx.lineTo(bTop.x, bTop.y - 1);
        ctx.stroke();
      }
    });
  }

  // C. Upper Mezzanine Landing & Left Wall Portal
  const landingGxStart = gxTop;
  const landingGxEnd = gxTop - 0.8;
  const landingGz = landingHeight;

  items.push({
    depth: ((landingGxStart + landingGxEnd) / 2 + gy + stairDepth / 2) * 100 + landingGz,
    render: (ctx, originX, originY) => {
      // Landing Platform Top Face
      const lp0 = toScreen(landingGxEnd, 0, landingGz, originX, originY);
      const lp1 = toScreen(landingGxStart, 0, landingGz, originX, originY);
      const lp2 = toScreen(landingGxStart, gy + stairDepth, landingGz, originX, originY);
      const lp3 = toScreen(landingGxEnd, gy + stairDepth, landingGz, originX, originY);

      ctx.fillStyle = ISO_PALETTE.wood_top;
      ctx.beginPath();
      ctx.moveTo(lp0.x, lp0.y);
      ctx.lineTo(lp1.x, lp1.y);
      ctx.lineTo(lp2.x, lp2.y);
      ctx.lineTo(lp3.x, lp3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = ISO_PALETTE.wood_outline;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Platform Outer Face down to floor
      const lf0 = toScreen(landingGxEnd, gy + stairDepth, 0, originX, originY);
      const lf1 = toScreen(landingGxStart, gy + stairDepth, 0, originX, originY);
      const lf2 = toScreen(landingGxStart, gy + stairDepth, landingGz, originX, originY);
      const lf3 = toScreen(landingGxEnd, gy + stairDepth, landingGz, originX, originY);

      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(lf0.x, lf0.y);
      ctx.lineTo(lf1.x, lf1.y);
      ctx.lineTo(lf2.x, lf2.y);
      ctx.lineTo(lf3.x, lf3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Safety Railing on landing
      const rP0 = toScreen(landingGxStart, gy + stairDepth - 0.05, landingGz + 22, originX, originY);
      const rP1 = toScreen(landingGxEnd, gy + stairDepth - 0.05, landingGz + 22, originX, originY);
      ctx.strokeStyle = ISO_PALETTE.wood_outline;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rP0.x, rP0.y);
      ctx.lineTo(rP1.x, rP1.y);
      ctx.stroke();

      // Doorway Portal Aperture cut into Left Wall (gy = 0)
      const doorBottom = landingGz;
      const doorTop = landingGz + 64;

      const d0 = toScreen(landingGxStart, 0, doorBottom, originX, originY);
      const d1 = toScreen(landingGxEnd, 0, doorBottom, originX, originY);
      const d2 = toScreen(landingGxEnd, 0, doorTop, originX, originY);
      const d3 = toScreen(landingGxStart, 0, doorTop, originX, originY);

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(d0.x, d0.y);
      ctx.lineTo(d1.x, d1.y);
      ctx.lineTo(d2.x, d2.y);
      ctx.lineTo(d3.x, d3.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(d0.x, d0.y);
      ctx.lineTo(d3.x, d3.y);
      ctx.lineTo(d2.x, d2.y);
      ctx.lineTo(d1.x, d1.y);
      ctx.stroke();

      // Directional Signboard above Doorway on Left Wall
      const sCenter = toScreen((landingGxStart + landingGxEnd) / 2, 0, doorTop + 14, originX, originY);
      const signW = 180;
      const signH = 22;

      ctx.save();
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(sCenter.x - signW / 2, sCenter.y - signH / 2, signW, signH);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sCenter.x - signW / 2, sCenter.y - signH / 2, signW, signH);

      // Status indicator LED
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(sCenter.x - signW / 2 + 10, sCenter.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 9.5px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(signLabel, sCenter.x + 5, sCenter.y);
      ctx.restore();
    }
  });

  return items;
}

// -------------------------------------------------------------
// 12. Media Studio Specialized Isometric Pixel Sprites
// -------------------------------------------------------------

// A. Professional Studio Video Camera on Tripod
export function createStudioCamera(
  gx: number,
  gy: number,
  facing: 'SE' | 'SW' = 'SE'
): RenderItem {
  return {
    depth: (gx + gy) * 100 + 45,
    render: (ctx, originX, originY) => {
      const basePos = toScreen(gx, gy, 0, originX, originY);
      const camPos = toScreen(gx, gy, 34, originX, originY);

      // 1. Soft Tripod Shadow
      ctx.save();
      ctx.fillStyle = ISO_PALETTE.shadow_soft;
      ctx.beginPath();
      ctx.ellipse(basePos.x, basePos.y, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Tripod Three-Legged Stand (Metal Struts)
      const leg0 = toScreen(gx - 0.35, gy - 0.2, 0, originX, originY);
      const leg1 = toScreen(gx + 0.35, gy - 0.2, 0, originX, originY);
      const leg2 = toScreen(gx, gy + 0.35, 0, originX, originY);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(camPos.x, camPos.y + 2);
      ctx.lineTo(leg0.x, leg0.y);
      ctx.moveTo(camPos.x, camPos.y + 2);
      ctx.lineTo(leg1.x, leg1.y);
      ctx.moveTo(camPos.x, camPos.y + 2);
      ctx.lineTo(leg2.x, leg2.y);
      ctx.stroke();

      // Tripod Spreader Ring
      const sp0 = toScreen(gx - 0.2, gy - 0.1, 14, originX, originY);
      const sp1 = toScreen(gx + 0.2, gy - 0.1, 14, originX, originY);
      const sp2 = toScreen(gx, gy + 0.2, 14, originX, originY);
      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sp0.x, sp0.y);
      ctx.lineTo(sp1.x, sp1.y);
      ctx.lineTo(sp2.x, sp2.y);
      ctx.closePath();
      ctx.stroke();

      // 3. Camera Body (Heavy Broadcast Camera)
      const camColors: BoxColors = {
        top: '#334155',
        left: '#1E293B',
        right: '#0F172A',
        outline: '#020617'
      };
      drawShadedBox(ctx, originX, originY, gx - 0.25, gy - 0.2, 34, 0.5, 0.4, 12, camColors);

      // 4. Telephoto Cine Lens with Matte Box
      const lensPos = toScreen(
        facing === 'SE' ? gx + 0.35 : gx - 0.35,
        gy,
        38,
        originX, originY
      );
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(lensPos.x, lensPos.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38BDF8'; // Blue anti-reflective lens coating ring
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 5. Flip-Out LCD Screen
      const lcdPos = toScreen(gx - 0.1, gy + 0.25, 40, originX, originY);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(lcdPos.x - 6, lcdPos.y - 4, 12, 8);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      ctx.strokeRect(lcdPos.x - 6, lcdPos.y - 4, 12, 8);

      // 6. Top-Mounted Shotgun Mic & Red Recording Tally LED
      const tallyPos = toScreen(gx, gy, 48, originX, originY);
      ctx.fillStyle = '#EF4444'; // Glowing Red Tally
      ctx.beginPath();
      ctx.arc(tallyPos.x, tallyPos.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Shotgun Mic
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tallyPos.x - 5, tallyPos.y - 3);
      ctx.lineTo(tallyPos.x + 8, tallyPos.y - 3);
      ctx.stroke();
    }
  };
}

// B. Studio Softbox Diffuser Light on Tall Stand
export function createStudioSoftboxLight(
  gx: number,
  gy: number,
  lightAngle: 'SE' | 'SW' = 'SE'
): RenderItem {
  return {
    depth: (gx + gy) * 100 + 75,
    render: (ctx, originX, originY) => {
      const basePos = toScreen(gx, gy, 0, originX, originY);
      const topPos = toScreen(gx, gy, 68, originX, originY);

      // Stand Base & Shadow
      ctx.save();
      ctx.fillStyle = ISO_PALETTE.shadow_soft;
      ctx.beginPath();
      ctx.ellipse(basePos.x, basePos.y, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Vertical Chrome Shaft
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(basePos.x, basePos.y);
      ctx.lineTo(topPos.x, topPos.y);
      ctx.stroke();

      // Softbox Diffuser Panel (Rectangular Light Head)
      const boxW = 28;
      const boxH = 36;
      ctx.save();
      // Black outer baffle
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(topPos.x - boxW / 2 - 2, topPos.y - boxH / 2 - 2, boxW + 4, boxH + 4);

      // White Translucent Diffuser Face
      const diffGrad = ctx.createRadialGradient(
        topPos.x, topPos.y, 4,
        topPos.x, topPos.y, boxW / 2
      );
      diffGrad.addColorStop(0, '#FFFFFF');
      diffGrad.addColorStop(0.7, '#FEF08A'); // Warm studio light
      diffGrad.addColorStop(1, '#E2E8F0');
      ctx.fillStyle = diffGrad;
      ctx.fillRect(topPos.x - boxW / 2, topPos.y - boxH / 2, boxW, boxH);

      ctx.strokeStyle = '#64748B';
      ctx.lineWidth = 1;
      ctx.strokeRect(topPos.x - boxW / 2, topPos.y - boxH / 2, boxW, boxH);
      ctx.restore();
    }
  };
}

// C. Video Editing Desk with Ultrawide Display, Timeline & Audio Monitors
export function createVideoEditingDesk(
  gx: number,
  gy: number,
  deskWidth: number = 3.2,
  deskDepth: number = 1.4,
  deskHeight: number = 38
): RenderItem {
  return {
    depth: (gx + gy + deskWidth / 2 + deskDepth / 2) * 100 + 15,
    render: (ctx, originX, originY) => {
      const woodColors: BoxColors = {
        top: '#334155', // Sleek dark slate studio desk surface
        left: '#1E293B',
        right: '#0F172A',
        outline: '#020617'
      };

      // Tabletop Slab
      drawShadedBox(ctx, originX, originY, gx, gy, deskHeight - 6, deskWidth, deskDepth, 6, woodColors, { hasShadow: true });

      // Steel Desk Frame Legs
      drawShadedBox(ctx, originX, originY, gx + 0.1, gy + 0.1, 0, 0.25, deskDepth - 0.2, deskHeight - 6, woodColors);
      drawShadedBox(ctx, originX, originY, gx + deskWidth - 0.35, gy + 0.1, 0, 0.25, deskDepth - 0.2, deskHeight - 6, woodColors);

      // 1. Ultrawide Curved Video Editing Display
      const scrW = deskWidth * 0.65;
      const scrD = 0.2;
      const scrH = 26;
      const scrZ = deskHeight;
      const scrX = gx + (deskWidth - scrW) / 2;
      const scrY = gy + 0.2;

      // Stand
      drawShadedBox(ctx, originX, originY, scrX + scrW / 2 - 0.2, scrY + 0.1, deskHeight, 0.4, 0.3, 6, {
        top: '#64748B', left: '#475569', right: '#334155', outline: '#1E293B'
      });

      // Ultrawide Bezel
      drawShadedBox(ctx, originX, originY, scrX, scrY, scrZ + 6, scrW, scrD, scrH, {
        top: '#1E293B', left: '#0F172A', right: '#020617', outline: '#000000'
      });

      // Screen Face with Video Multi-Track Timeline
      const s0 = toScreen(scrX + 0.1, scrY + scrD, scrZ + 8, originX, originY);
      const s1 = toScreen(scrX + scrW - 0.1, scrY + scrD, scrZ + 8, originX, originY);
      const s2 = toScreen(scrX + scrW - 0.1, scrY + scrD, scrZ + scrH + 4, originX, originY);
      const s3 = toScreen(scrX + 0.1, scrY + scrD, scrZ + scrH + 4, originX, originY);

      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(s0.x, s0.y);
      ctx.lineTo(s1.x, s1.y);
      ctx.lineTo(s2.x, s2.y);
      ctx.lineTo(s3.x, s3.y);
      ctx.closePath();
      ctx.fill();

      // Colorful Video Timeline Tracks on Screen (Blue video track, Pink effect track, Green audio track)
      const trackColors = ['#38BDF8', '#F43F5E', '#10B981'];
      trackColors.forEach((color, idx) => {
        const tY = scrZ + 10 + idx * 5;
        const pL = toScreen(scrX + 0.2, scrY + scrD, tY, originX, originY);
        const pR = toScreen(scrX + scrW - 0.2, scrY + scrD, tY, originX, originY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pL.x, pL.y);
        ctx.lineTo(pR.x, pR.y);
        ctx.stroke();
      });

      // 2. Desktop Studio Audio Monitor Speakers (Left & Right)
      const speakerColors: BoxColors = {
        top: '#1E293B', left: '#0F172A', right: '#020617', outline: '#000000'
      };
      // Left speaker
      drawShadedBox(ctx, originX, originY, gx + 0.2, gy + 0.2, deskHeight, 0.45, 0.4, 16, speakerColors);
      // Right speaker
      drawShadedBox(ctx, originX, originY, gx + deskWidth - 0.65, gy + 0.2, deskHeight, 0.45, 0.4, 16, speakerColors);

      // Yellow/Gold cone highlights on speakers
      const spL = toScreen(gx + 0.42, gy + 0.55, deskHeight + 7, originX, originY);
      const spR = toScreen(gx + deskWidth - 0.42, gy + 0.55, deskHeight + 7, originX, originY);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(spL.x, spL.y, 3, 0, Math.PI * 2);
      ctx.arc(spR.x, spR.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // 3. Keyboard & Editing Jog Wheel Deck
      const kbPos = toScreen(gx + deskWidth / 2 - 0.5, gy + deskDepth - 0.35, deskHeight, originX, originY);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(kbPos.x - 14, kbPos.y - 6, 28, 8);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(kbPos.x - 14, kbPos.y - 6, 28, 8);
    }
  };
}

// D. Graphic & Thumbnail Design Desk with Tablet & Pen
export function createDesignDesk(
  gx: number,
  gy: number,
  deskWidth: number = 2.8,
  deskDepth: number = 1.3,
  deskHeight: number = 38
): RenderItem {
  return {
    depth: (gx + gy + deskWidth / 2 + deskDepth / 2) * 100 + 15,
    render: (ctx, originX, originY) => {
      const woodColors: BoxColors = {
        top: ISO_PALETTE.wood_top,
        left: ISO_PALETTE.wood_left,
        right: ISO_PALETTE.wood_right,
        outline: ISO_PALETTE.wood_outline
      };

      // Tabletop Slab & Legs
      drawShadedBox(ctx, originX, originY, gx, gy, deskHeight - 6, deskWidth, deskDepth, 6, woodColors, { hasShadow: true });
      drawShadedBox(ctx, originX, originY, gx + 0.1, gy + 0.1, 0, 0.25, deskDepth - 0.2, deskHeight - 6, woodColors);
      drawShadedBox(ctx, originX, originY, gx + deskWidth - 0.35, gy + 0.1, 0, 0.25, deskDepth - 0.2, deskHeight - 6, woodColors);

      // Color-Calibrated Display showing YouTube Thumbnail Art
      const monW = 1.6;
      drawShadedBox(ctx, originX, originY, gx + 0.3, gy + 0.15, deskHeight + 6, monW, 0.2, 22, {
        top: '#1E293B', left: '#0F172A', right: '#020617', outline: '#000000'
      });

      // Thumbnail Artwork Preview on Screen (Vibrant Orange & Mascot)
      const sc0 = toScreen(gx + 0.38, gy + 0.35, deskHeight + 8, originX, originY);
      const sc1 = toScreen(gx + 0.38 + monW - 0.16, gy + 0.35, deskHeight + 8, originX, originY);
      const sc2 = toScreen(gx + 0.38 + monW - 0.16, gy + 0.35, deskHeight + 26, originX, originY);
      const sc3 = toScreen(gx + 0.38, gy + 0.35, deskHeight + 26, originX, originY);

      ctx.fillStyle = '#EA580C'; // Vibrant thumbnail background
      ctx.beginPath();
      ctx.moveTo(sc0.x, sc0.y);
      ctx.lineTo(sc1.x, sc1.y);
      ctx.lineTo(sc2.x, sc2.y);
      ctx.lineTo(sc3.x, sc3.y);
      ctx.closePath();
      ctx.fill();

      // Bold Thumbnail Text / Graphic bar on display
      ctx.fillStyle = '#FFFFFF';
      const tMid = toScreen(gx + 0.38 + monW / 2, gy + 0.35, deskHeight + 17, originX, originY);
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('4K MASTER', tMid.x, tMid.y);

      // Graphics Tablet with Stylus Pen on desk
      const tabPos = toScreen(gx + deskWidth - 0.7, gy + deskDepth - 0.45, deskHeight, originX, originY);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(tabPos.x - 10, tabPos.y - 8, 20, 14);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1;
      ctx.strokeRect(tabPos.x - 10, tabPos.y - 8, 20, 14);

      // Stylus Pen
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tabPos.x + 12, tabPos.y - 4);
      ctx.lineTo(tabPos.x + 16, tabPos.y + 4);
      ctx.stroke();
    }
  };
}

// E. Studio Production Bookshelf & Tape Archive
export function createStudioBookcase(
  gx: number,
  gy: number,
  width: number = 1.8,
  depth: number = 0.7,
  height: number = 65
): RenderItem {
  return {
    depth: (gx + gy + width / 2 + depth / 2) * 100 + 20,
    render: (ctx, originX, originY) => {
      const woodColors: BoxColors = {
        top: ISO_PALETTE.wood_top,
        left: ISO_PALETTE.wood_left,
        right: ISO_PALETTE.wood_right,
        outline: ISO_PALETTE.wood_outline
      };

      // Frame
      drawShadedBox(ctx, originX, originY, gx, gy, 0, width, depth, height, woodColors, { hasShadow: true });

      // Shelves with Tape Cases & Golden Award
      const numShelves = 3;
      for (let s = 1; s <= numShelves; s++) {
        const sZ = (height / (numShelves + 1)) * s;
        // Shelf divider line
        const p0 = toScreen(gx, gy + depth, sZ, originX, originY);
        const p1 = toScreen(gx + width, gy + depth, sZ, originX, originY);
        ctx.strokeStyle = ISO_PALETTE.wood_outline;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        // Tape boxes & books on shelves
        const colors = ['#EF4444', '#38BDF8', '#10B981', '#F59E0B', '#818CF8'];
        for (let b = 0; b < 4; b++) {
          const bPos = toScreen(gx + 0.3 + b * 0.32, gy + depth, sZ + 6, originX, originY);
          ctx.fillStyle = colors[(s + b) % colors.length];
          ctx.fillRect(bPos.x - 3, bPos.y - 8, 6, 12);
        }
      }

      // Golden Creator Play Button / Award on Top Shelf
      const awPos = toScreen(gx + width / 2, gy + depth / 2, height + 8, originX, originY);
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(awPos.x, awPos.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };
}

// F. Studio Coffee Bar & Refreshment Counter
export function createStudioCoffeeBar(
  gx: number,
  gy: number,
  width: number = 2.0,
  depth: number = 1.0,
  height: number = 36
): RenderItem {
  return {
    depth: (gx + gy + width / 2 + depth / 2) * 100 + 10,
    render: (ctx, originX, originY) => {
      // Counter Base
      drawShadedBox(ctx, originX, originY, gx, gy, 0, width, depth, height, {
        top: '#F8FAFC', left: '#E2E8F0', right: '#CBD5E1', outline: '#64748B'
      }, { hasShadow: true });

      // Espresso Machine on top
      const espColors: BoxColors = {
        top: '#E2E8F0', left: '#94A3B8', right: '#64748B', outline: '#1E293B'
      };
      drawShadedBox(ctx, originX, originY, gx + 0.3, gy + 0.2, height, 0.7, 0.6, 16, espColors);

      // Portafilter & Drip Tray
      const dripPos = toScreen(gx + 0.65, gy + 0.7, height + 4, originX, originY);
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(dripPos.x - 6, dripPos.y - 2, 12, 4);

      // Ceramic Mugs on counter
      const mug0 = toScreen(gx + 1.3, gy + 0.4, height + 4, originX, originY);
      const mug1 = toScreen(gx + 1.6, gy + 0.5, height + 4, originX, originY);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(mug0.x - 3, mug0.y - 5, 6, 6);
      ctx.fillStyle = '#F43F5E';
      ctx.fillRect(mug1.x - 3, mug1.y - 5, 6, 6);
    }
  };
}
