import React, { useEffect, useRef, useState } from 'react';
import { Agent } from '../../types';
import { ISO_PALETTE } from '../../theme/isoPalette';
import {
  toScreen,
  drawEnclosedRoomStructure,
  createVideoEditingDesk,
  createDesignDesk,
  createExecutiveDesk,
  createErgonomicChair,
  createStudioCamera,
  createStudioSoftboxLight,
  createStudioBookcase,
  createStudioCoffeeBar,
  createLoungeSofa,
  createPottedTree,
  createStaircaseDown,
  createStaircaseUpAlongLeftWall,
  createCharacterRenderItem,
  RenderItem,
  IsoCharacterRenderData
} from './isoEngine';

interface Props {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  orbiState: string;
  onNavigateFloor?: (floor: number) => void;
}

interface AgentSimState {
  id: string;
  name: string;
  role: string;
  gx: number;
  gy: number;
  targetGx: number;
  targetGy: number;
  isSeated: boolean;
  isWalking: boolean;
  facing: 'SW' | 'SE' | 'NW' | 'NE';
  avatarFile: string;
  isAuri: boolean;
  statusText: string;
  deskPos: { gx: number; gy: number };
  loungePos: { gx: number; gy: number };
}

export const Floor1IsometricRoom: React.FC<Props> = ({
  agents,
  onSelectAgent,
  orbiState,
  onNavigateFloor
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1360, height: 680 });
  const [pacingMode, setPacingMode] = useState<'calm' | 'break' | 'active'>('calm');
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredAgent, setHoveredAgent] = useState<AgentSimState | null>(null);
  const [hoveredStairsDown, setHoveredStairsDown] = useState<boolean>(false);
  const [hoveredStairsUp, setHoveredStairsUp] = useState<boolean>(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el.clientWidth && el.clientHeight) {
        const w = Math.min(1400, Math.max(900, el.clientWidth - 16));
        const h = Math.min(800, Math.max(500, el.clientHeight - 16));
        setDimensions({ width: Math.round(w), height: Math.round(h) });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const getImage = (src: string): HTMLImageElement => {
    let img = imagesRef.current.get(src);
    if (!img) {
      img = new Image();
      img.src = src;
      imagesRef.current.set(src, img);
    }
    return img;
  };

  useEffect(() => {
    getImage('/assets/sprites/employees/darshan_director.png');
    getImage('/assets/sprites/employees/shrinithi_script.png');
    getImage('/assets/sprites/employees/shreyank_editor.png');
    getImage('/assets/sprites/employees/vaishnavi_design.png');
  }, []);

  const simAgentsRef = useRef<AgentSimState[]>([
    {
      id: 'shrinithi_script',
      name: 'Shrinithi (Script)',
      role: 'Scriptwriter & Narrative Lead',
      gx: 3.4,
      gy: 2.2,
      targetGx: 3.4,
      targetGy: 2.2,
      isSeated: true,
      isWalking: false,
      facing: 'SE',
      avatarFile: 'shrinithi_script.png',
      isAuri: false,
      statusText: 'Drafting UiPath Script Narrative',
      deskPos: { gx: 3.4, gy: 2.2 },
      loungePos: { gx: 7.8, gy: 10.8 }
    },
    {
      id: 'darshan_director',
      name: 'Darshan (Director)',
      role: 'Director of Video Production',
      gx: 3.2,
      gy: 7.2,
      targetGx: 3.2,
      targetGy: 7.2,
      isSeated: true,
      isWalking: false,
      facing: 'NE',
      avatarFile: 'darshan_director.png',
      isAuri: false,
      statusText: 'Directing 1080p Video Composition',
      deskPos: { gx: 3.2, gy: 7.2 },
      loungePos: { gx: 7.2, gy: 11.4 }
    },
    {
      id: 'shreyank_editor',
      name: 'Shreyank (Editor)',
      role: 'Lead Video Editor & Motion Graphics',
      gx: 9.8,
      gy: 2.2,
      targetGx: 9.8,
      targetGy: 2.2,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'shreyank_editor.png',
      isAuri: false,
      statusText: 'Editing Subtitle Tracks & Scene Cuts',
      deskPos: { gx: 9.8, gy: 2.2 },
      loungePos: { gx: 9.0, gy: 10.8 }
    },
    {
      id: 'vaishnavi_design',
      name: 'Vaishnavi (Design)',
      role: 'Lead Thumbnail & Brand Designer',
      gx: 9.8,
      gy: 7.2,
      targetGx: 9.8,
      targetGy: 7.2,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'vaishnavi_design.png',
      isAuri: false,
      statusText: 'Compositing YouTube Thumbnail Art',
      deskPos: { gx: 9.8, gy: 7.2 },
      loungePos: { gx: 9.6, gy: 11.4 }
    }
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = ISO_PALETTE.bg_canvas;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Symmetrically Centered Studio Diorama (Mathematically exact 70px top/bottom & 226px left/right margins)
      const roomSize = 14;
      const wallHeight = 110;
      const slabThickness = 22;
      const totalDioramaHeight = wallHeight + (roomSize * 32) + slabThickness;
      const originX = Math.round(canvas.width / 2) + 6;
      const originY = Math.round((canvas.height - totalDioramaHeight) / 2 + wallHeight) + 13;

      // Subtle Vignette / Studio Gradient Centered on the Office Floor
      const floorCenterY = originY + (roomSize * 16);
      const grad = ctx.createRadialGradient(
        originX, floorCenterY, 60,
        originX, floorCenterY, canvas.width * 0.65
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(215, 222, 240, 0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Architectural Room Structure
      drawEnclosedRoomStructure(ctx, originX, originY, roomSize, wallHeight, slabThickness);

      // 2. Prepare Render Items Queue for Depth Sorting
      const queue: RenderItem[] = [];

      // A. Production Media Archive Bookshelf (gx: 0.8, gy: 1.2)
      queue.push(createStudioBookcase(0.8, 1.2, 1.4, 0.6, 62));

      // B. Shrinithi's Scriptwriting Workstation (gx: 2.2, gy: 1.4)
      queue.push(createExecutiveDesk(2.2, 1.4, 2.8, 1.3, 38));
      const shrinithiSim = simAgentsRef.current.find(a => a.id === 'shrinithi_script');
      queue.push(createErgonomicChair(3.4, 2.2, shrinithiSim?.isSeated));

      // C. Shreyank's Triple-Monitor Video Editing Bay (gx: 8.4, gy: 1.4)
      queue.push(createVideoEditingDesk(8.4, 1.4, 3.2, 1.3, 38));
      const shreyankSim = simAgentsRef.current.find(a => a.id === 'shreyank_editor');
      queue.push(createErgonomicChair(9.8, 2.2, shreyankSim?.isSeated));

      // D. Central Studio Camera & Lighting Soundstage (gx: 6.4, gy: 5.6)
      queue.push(createStudioCamera(6.4, 5.6, 'NE'));
      queue.push(createStudioSoftboxLight(5.0, 4.8));
      queue.push(createStudioSoftboxLight(8.0, 7.2));

      // E. Darshan's Director Desk on Left Side (gx: 2.0, gy: 6.4)
      queue.push(createExecutiveDesk(2.0, 6.4, 2.8, 1.3, 38));
      const darshanSim = simAgentsRef.current.find(a => a.id === 'darshan_director');
      queue.push(createErgonomicChair(3.2, 7.2, darshanSim?.isSeated));

      // F. Vaishnavi's Graphic & Thumbnail Design Desk (gx: 8.6, gy: 6.4)
      queue.push(createDesignDesk(8.6, 6.4, 3.0, 1.3, 38));
      const vaishnaviSim = simAgentsRef.current.find(a => a.id === 'vaishnavi_design');
      queue.push(createErgonomicChair(9.8, 7.2, vaishnaviSim?.isSeated));

      // G. Studio Coffee Bar & Refreshment Counter (gx: 11.8, gy: 9.8)
      queue.push(createStudioCoffeeBar(11.8, 9.8, 1.6, 1.0, 36));

      // H. Creative Lounge Area (Break Sofa, gx: 7.2, gy: 10.2)
      queue.push(createLoungeSofa(7.2, 10.2, 2.8, 1.2));

      // I. Staircase Down to Floor 0: Executive Suite (gy: 8.5 -> 13.0)
      queue.push(...createStaircaseDown(0.2, 8.5, 13.0, 0, '▼ TO FLOOR 0: EXECUTIVE SUITE'));

      // J. Staircase Up to Floor 2: Marketing & Growth (gx: 13.0 -> 8.5)
      queue.push(...createStaircaseUpAlongLeftWall(0.2, 13.0, 8.5, 2, '▲ TO FLOOR 2: MARKETING & GROWTH'));

      // K. Framing Potted Greenery
      queue.push(createPottedTree(5.6, 1.2));
      queue.push(createPottedTree(0.8, 5.2));
      queue.push(createPottedTree(13.0, 8.6));
      queue.push(createPottedTree(1.6, 13.2));
      queue.push(createPottedTree(13.2, 13.2));

      // 3. Update Agents Simulation Motion
      simAgentsRef.current.forEach(sim => {
        let target = sim.deskPos;
        if (pacingMode === 'break') {
          target = sim.loungePos;
        }

        const dx = target.gx - sim.gx;
        const dy = target.gy - sim.gy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.08) {
          const speed = 0.035;
          sim.gx += (dx / dist) * speed;
          sim.gy += (dy / dist) * speed;
          sim.isWalking = true;
          sim.isSeated = false;
          sim.facing = dx > 0 ? 'SE' : 'SW';
        } else {
          sim.gx = target.gx;
          sim.gy = target.gy;
          sim.isWalking = false;
          sim.isSeated = (pacingMode !== 'break') || (target === sim.loungePos);
        }

        const avatarImg = getImage(`/assets/sprites/employees/${sim.avatarFile}`);

        const charData: IsoCharacterRenderData = {
          id: sim.id,
          name: sim.name,
          role: sim.role,
          gx: sim.gx,
          gy: sim.gy,
          facing: sim.facing,
          isWalking: sim.isWalking,
          isSeated: sim.isSeated,
          avatarFile: sim.avatarFile,
          isAuri: false,
          statusText: sim.isWalking ? 'Moving across studio...' : (pacingMode === 'break' ? 'Coffee Break in Studio Lounge' : sim.statusText),
          avatarImg
        };

        queue.push(createCharacterRenderItem(charData));
      });

      // 4. Sort Render Queue by Isometric Depth
      queue.sort((a, b) => a.depth - b.depth);

      // 5. Render All Items
      queue.forEach(item => {
        item.render(ctx, originX, originY);
      });

      // 6. Interactive Floating Staircase Navigation Badges
      if (hoveredStairsDown) {
        ctx.save();
        const sDown = toScreen(0.4, 8.5, 130, originX, originY);
        ctx.font = 'bold 11px monospace';
        const txt = '▼ DESCEND TO FLOOR 0 (EXECUTIVE SUITE) • CLICK TO TRANSIT';
        const tw = ctx.measureText(txt).width + 28;
        const th = 26;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(sDown.x - tw / 2, sDown.y - th / 2, tw, th);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sDown.x - tw / 2, sDown.y - th / 2, tw, th);

        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(sDown.x - tw / 2 + 12, sDown.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F59E0B';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, sDown.x + 8, sDown.y);
        ctx.restore();
      }

      if (hoveredStairsUp) {
        ctx.save();
        const sUp = toScreen(8.5, 0.4, 130, originX, originY);
        ctx.font = 'bold 11px monospace';
        const txt = '▲ ASCEND TO FLOOR 2 (MARKETING & GROWTH) • CLICK TO TRANSIT';
        const tw = ctx.measureText(txt).width + 28;
        const th = 26;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(sUp.x - tw / 2, sUp.y - th / 2, tw, th);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sUp.x - tw / 2, sUp.y - th / 2, tw, th);

        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(sUp.x - tw / 2 + 12, sUp.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#38BDF8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, sUp.x + 8, sUp.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [pacingMode, orbiState, hoveredStairsDown, hoveredStairsUp, dimensions]);

  // Handle Mouse Hover on Personnel and Staircases
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;

    const roomSize = 14;
    const wallHeight = 110;
    const slabThickness = 22;
    const totalDioramaHeight = wallHeight + (roomSize * 32) + slabThickness;
    const originX = Math.round(canvas.width / 2) + 6;
    const originY = Math.round((canvas.height - totalDioramaHeight) / 2 + wallHeight) + 13;

    // A. Detect Hover over Personnel
    let found: AgentSimState | null = null;
    simAgentsRef.current.forEach(sim => {
      const pos = toScreen(sim.gx, sim.gy, sim.isSeated ? 8 : 0, originX, originY);
      const dist = Math.hypot(cx - pos.x, cy - (pos.y - 25));
      if (dist < 32) {
        found = sim;
      }
    });
    setHoveredAgent(found);

    // B. Detect Hover over Stairs Down (gx in [0, 2.0], gy in [8.0, 13.5])
    const sdTop = toScreen(0, 8.5, 80, originX, originY);
    const sdBottom = toScreen(2.0, 13.2, 0, originX, originY);
    const sdLeft = toScreen(0, 13.2, 0, originX, originY);
    const sdRight = toScreen(2.0, 8.5, 0, originX, originY);

    const isOverStairsDown =
      cx >= sdLeft.x - 30 &&
      cx <= sdRight.x + 30 &&
      cy >= sdTop.y - 20 &&
      cy <= sdBottom.y + 20;
    setHoveredStairsDown(isOverStairsDown);

    // C. Detect Hover over Stairs Up along Left Wall (gx in [8.0, 13.5], gy in [0, 2.0])
    const suTop = toScreen(8.5, 0, 110, originX, originY);
    const suBottom = toScreen(13.2, 2.0, 0, originX, originY);
    const suLeft = toScreen(8.5, 2.0, 0, originX, originY);
    const suRight = toScreen(13.2, 0, 0, originX, originY);

    const isOverStairsUp =
      cx >= suLeft.x - 30 &&
      cx <= suRight.x + 30 &&
      cy >= suTop.y - 20 &&
      cy <= suBottom.y + 20;
    setHoveredStairsUp(isOverStairsUp);
  };

  const handleClick = () => {
    if (hoveredStairsDown && onNavigateFloor) {
      onNavigateFloor(0);
      return;
    }

    if (hoveredStairsUp && onNavigateFloor) {
      onNavigateFloor(2);
      return;
    }

    if (hoveredAgent) {
      const realAgent = agents.find(a => a.id === hoveredAgent.id) || {
        id: hoveredAgent.id,
        name: hoveredAgent.name,
        role: hoveredAgent.role,
        department: 'Creative & Video Production',
        floor: 1,
        status: 'active',
        skills: ['Video Composition', 'Narration Hook', 'Graphic Design', 'Motion Graphics'],
        tools: ['FFmpeg Suite', 'Canvas Artboard', 'Script Hook Engine']
      };
      onSelectAgent(realAgent as Agent);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden font-mono bg-[#E6E9F5]">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{
          imageRendering: 'pixelated',
          display: 'block',
          cursor: (hoveredAgent || hoveredStairsDown || hoveredStairsUp) ? 'pointer' : 'default'
        }}
      />
    </div>
  );
};
