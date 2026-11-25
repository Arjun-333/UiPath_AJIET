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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pacingMode, setPacingMode] = useState<'calm' | 'break' | 'active'>('calm');
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredAgent, setHoveredAgent] = useState<AgentSimState | null>(null);
  const [hoveredStairsDown, setHoveredStairsDown] = useState<boolean>(false);
  const [hoveredStairsUp, setHoveredStairsUp] = useState<boolean>(false);

  // Cache loaded images
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

  // Preload Floor 1 Avatars
  useEffect(() => {
    getImage('/assets/sprites/employees/darshan_director.png');
    getImage('/assets/sprites/employees/shrinithi_script.png');
    getImage('/assets/sprites/employees/vaishnavi_design.png');
    getImage('/assets/sprites/employees/shreyank_editor.png');
  }, []);

  // Simulation State for Floor 1 Media Studio Personnel (Spaced cleanly to eliminate label overlap)
  const simAgentsRef = useRef<AgentSimState[]>([
    {
      id: 'shrinithi_script',
      name: 'Shrinithi (Script)',
      role: 'Scriptwriter & Narrative Lead',
      gx: 2.2,
      gy: 1.4,
      targetGx: 2.2,
      targetGy: 1.4,
      isSeated: true,
      isWalking: false,
      facing: 'SE',
      avatarFile: 'shrinithi_script.png',
      isAuri: false,
      statusText: 'Drafting UiPath Script Narrative',
      deskPos: { gx: 2.2, gy: 1.4 },
      loungePos: { gx: 7.2, gy: 7.0 }
    },
    {
      id: 'darshan_director',
      name: 'Darshan (Director)',
      role: 'Director of Video Production',
      gx: 2.2,
      gy: 7.2,
      targetGx: 2.2,
      targetGy: 7.2,
      isSeated: true,
      isWalking: false,
      facing: 'NE',
      avatarFile: 'darshan_director.png',
      isAuri: false,
      statusText: 'Directing 1080p Video Composition',
      deskPos: { gx: 2.2, gy: 7.2 },
      loungePos: { gx: 7.6, gy: 7.6 }
    },
    {
      id: 'shreyank_editor',
      name: 'Shreyank (Editor)',
      role: 'Lead Video Editor & Motion Graphics',
      gx: 4.8,
      gy: 3.6,
      targetGx: 4.8,
      targetGy: 3.6,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'shreyank_editor.png',
      isAuri: false,
      statusText: 'Editing Subtitle Tracks & Scene Cuts',
      deskPos: { gx: 4.8, gy: 3.6 },
      loungePos: { gx: 7.2, gy: 6.4 }
    },
    {
      id: 'vaishnavi_design',
      name: 'Vaishnavi (Design)',
      role: 'Lead Thumbnail & Brand Designer',
      gx: 5.4,
      gy: 7.6,
      targetGx: 5.4,
      targetGy: 7.6,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'vaishnavi_design.png',
      isAuri: false,
      statusText: 'Compositing YouTube Thumbnail Art',
      deskPos: { gx: 5.4, gy: 7.6 },
      loungePos: { gx: 7.6, gy: 8.2 }
    }
  ]);

  // Main Canvas Render & Animation Loop
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

      // Light Muted Studio Diorama Backdrop
      ctx.fillStyle = ISO_PALETTE.bg_canvas;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Radial Gradient
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 80,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(215, 222, 240, 0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Canvas Fixed Camera Center
      const originX = canvas.width / 2;
      const originY = 270;
      const roomSize = 10;

      // 1. Draw Architectural Enclosed Cutaway Room Structure
      drawEnclosedRoomStructure(ctx, originX, originY, roomSize, 150, 24);

      // 2. Prepare Render Items Queue for Depth Sorting
      const queue: RenderItem[] = [];

      // A. Production Media Archive Bookshelf (Back corner gx: 0.8)
      queue.push(createStudioBookcase(0.8, 0.6, 1.4, 0.6, 62));

      // B. Shrinithi's Scriptwriting Workstation under Left Wall Window (gx: 1.6, gy: 0.8)
      queue.push(createExecutiveDesk(1.6, 0.8, 2.4, 1.2, 38));
      const shrinithiSim = simAgentsRef.current.find(a => a.id === 'shrinithi_script');
      queue.push(createErgonomicChair(2.2, 1.4, shrinithiSim?.isSeated));

      // C. Staircase Up to Floor 2 (Marketing & Growth) along Left Wall (gx: 9.4 -> 5.6)
      queue.push(...createStaircaseUpAlongLeftWall(0.2, 9.4, 5.6, 2, '▲ TO FLOOR 2: MARKETING & GROWTH'));

      // D. Shreyank's Video Editing Suite (gx: 4.2, gy: 2.8)
      queue.push(createVideoEditingDesk(4.2, 2.8, 2.8, 1.3, 38));
      const shreyankSim = simAgentsRef.current.find(a => a.id === 'shreyank_editor');
      queue.push(createErgonomicChair(4.8, 3.6, shreyankSim?.isSeated));

      // E. Darshan's Director Desk on Left Side (gx: 1.6, gy: 6.4)
      queue.push(createExecutiveDesk(1.6, 6.4, 2.4, 1.2, 38));
      const darshanSim = simAgentsRef.current.find(a => a.id === 'darshan_director');
      queue.push(createErgonomicChair(2.2, 7.2, darshanSim?.isSeated));

      // F. Professional Studio Camera & Lighting Equipment in Center Stage
      queue.push(createStudioCamera(3.6, 5.0, 'NE'));
      queue.push(createStudioSoftboxLight(5.2, 5.0));

      // G. Vaishnavi's Graphic & Thumbnail Design Desk in Foreground (gx: 4.8, gy: 7.0)
      queue.push(createDesignDesk(4.8, 7.0, 2.6, 1.3, 38));
      const vaishnaviSim = simAgentsRef.current.find(a => a.id === 'vaishnavi_design');
      queue.push(createErgonomicChair(5.4, 7.6, vaishnaviSim?.isSeated));

      // H. Studio Coffee Bar & Refreshment Counter (gx: 7.0, gy: 4.6)
      queue.push(createStudioCoffeeBar(7.0, 4.6, 1.8, 1.0, 36));

      // I. Creative Lounge Area (Break Sofa & Coffee Table, gx: 7.0, gy: 6.6)
      queue.push(createLoungeSofa(7.0, 6.6, 2.2, 1.2));

      // J. Staircase Down to Floor 0 (Executive Suite) along Right Wall (gy: 5.2 -> 9.4)
      queue.push(...createStaircaseDown(0.2, 5.2, 9.4, 0, '▼ TO FLOOR 0: EXECUTIVE SUITE'));

      // K. Potted Trees framing the room edges
      queue.push(createPottedTree(0.6, 9.6));
      queue.push(createPottedTree(9.0, 2.0));

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
          statusText: sim.isWalking
            ? 'Moving across studio...'
            : (pacingMode === 'break' ? 'Espresso Break in Lounge' : sim.statusText),
          avatarImg
        };

        queue.push(createCharacterRenderItem(charData));
      });

      // 4. Sort Render Queue by Isometric Depth (Painter's Algorithm)
      queue.sort((a, b) => a.depth - b.depth);

      // 5. Execute Depth-Sorted Render Passes
      queue.forEach(item => {
        item.render(ctx, originX, originY);
      });

      // 6. Interactive Floating Staircase Navigation Badges
      if (hoveredStairsDown) {
        ctx.save();
        const sDown = toScreen(0.4, 7.2, 50, originX, originY);
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
        const sUp = toScreen(5.2, 0.4, 130, originX, originY);
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
  }, [pacingMode, orbiState, hoveredStairsDown, hoveredStairsUp]);

  // Handle Mouse Hover on Personnel and Staircases
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;

    const originX = canvas.width / 2;
    const originY = 270;

    // A. Detect Hover over Personnel
    let found: AgentSimState | null = null;
    simAgentsRef.current.forEach(sim => {
      const pos = toScreen(sim.gx, sim.gy, sim.isSeated ? 8 : 0, originX, originY);
      const dist = Math.hypot(cx - pos.x, cy - (pos.y - 25));
      if (dist < 28) {
        found = sim;
      }
    });
    setHoveredAgent(found);

    // B. Detect Hover over Stairs Down (gx in [0, 1.8], gy in [5.0, 9.6])
    const sdTop = toScreen(0, 5.0, 80, originX, originY);
    const sdBottom = toScreen(1.8, 9.6, 0, originX, originY);
    const sdLeft = toScreen(0, 9.6, 0, originX, originY);
    const sdRight = toScreen(1.8, 5.0, 0, originX, originY);

    const isOverStairsDown =
      cx >= sdLeft.x - 25 &&
      cx <= sdRight.x + 25 &&
      cy >= sdTop.y - 20 &&
      cy <= sdBottom.y + 20;
    setHoveredStairsDown(isOverStairsDown);

    // C. Detect Hover over Stairs Up along Left Wall (gx in [5.4, 9.6], gy in [0, 1.8])
    const suTop = toScreen(5.4, 0, 140, originX, originY);
    const suBottom = toScreen(9.6, 1.8, 0, originX, originY);
    const suLeft = toScreen(5.4, 1.8, 0, originX, originY);
    const suRight = toScreen(9.6, 0, 0, originX, originY);

    const isOverStairsUp =
      cx >= suLeft.x - 25 &&
      cx <= suRight.x + 25 &&
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
    <div className="flex flex-col h-full bg-[#E6E9F5] select-none overflow-hidden relative font-mono">
      {/* Main Canvas Container with Crisp Pixel Rendering */}
      <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease'
          }}
          className="relative rounded-2xl shadow-xl overflow-hidden border border-slate-300/80 bg-white"
        >
          <canvas
            ref={canvasRef}
            width={1240}
            height={740}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            style={{
              imageRendering: 'pixelated',
              display: 'block',
              cursor: (hoveredAgent || hoveredStairsDown || hoveredStairsUp) ? 'pointer' : 'default'
            }}
          />
        </div>
      </div>
    </div>
  );
};
