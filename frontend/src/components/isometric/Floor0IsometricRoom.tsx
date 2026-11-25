import React, { useEffect, useRef, useState } from 'react';
import { Agent } from '../../types';
import { ISO_PALETTE } from '../../theme/isoPalette';
import {
  toScreen,
  drawEnclosedRoomStructure,
  createExecutiveDesk,
  createErgonomicChair,
  createFilingCabinetWithCat,
  createMeetingTable,
  createLoungeSofa,
  createPottedTree,
  createStaircaseUp,
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

export const Floor0IsometricRoom: React.FC<Props> = ({
  agents,
  onSelectAgent,
  orbiState,
  onNavigateFloor
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pacingMode, setPacingMode] = useState<'calm' | 'break' | 'active'>('calm');
  const [zoom, setZoom] = useState<number>(1.0);
  const [hoveredAgent, setHoveredAgent] = useState<AgentSimState | null>(null);
  const [hoveredStairs, setHoveredStairs] = useState<boolean>(false);

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

  // Preload Floor 0 Avatars
  useEffect(() => {
    getImage('/assets/sprites/employees/arjun_ceo.png');
    getImage('/assets/sprites/employees/coo_01.png');
    getImage('/assets/sprites/auri/orbi_idle_f0.png');
    getImage('/assets/sprites/auri/orbi_working_f0.png');
  }, []);

  // Simulation State for Floor 0 Personnel
  const simAgentsRef = useRef<AgentSimState[]>([
    {
      id: 'arjun_ceo',
      name: 'Arjun (CEO)',
      role: 'Chief Executive Officer',
      gx: 3.5,
      gy: 2.2,
      targetGx: 3.5,
      targetGy: 2.2,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'arjun_ceo.png',
      isAuri: false,
      statusText: 'Directing AI Operations',
      deskPos: { gx: 3.5, gy: 2.2 },
      loungePos: { gx: 8.5, gy: 3.0 }
    },
    {
      id: 'coo_01',
      name: 'Marcus Vance',
      role: 'Chief Operating Officer',
      gx: 5.5,
      gy: 7.2,
      targetGx: 5.5,
      targetGy: 7.2,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'coo_01.png',
      isAuri: false,
      statusText: 'Reviewing Pipeline Deliverables',
      deskPos: { gx: 5.5, gy: 7.2 },
      loungePos: { gx: 8.2, gy: 4.2 }
    },
    {
      id: 'auri_ceo_interface',
      name: 'AURI Mascot',
      role: 'Executive Intelligence Mascot',
      gx: 1.8,
      gy: 1.8,
      targetGx: 1.8,
      targetGy: 1.8,
      isSeated: false,
      isWalking: false,
      facing: 'SE',
      avatarFile: 'auri',
      isAuri: true,
      statusText: 'Standing by for CEO Directives',
      deskPos: { gx: 1.8, gy: 1.8 },
      loungePos: { gx: 7.5, gy: 3.5 }
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

      // Light Muted Diorama Backdrop (Matching Screenshot 2 - No Black Dark Void!)
      ctx.fillStyle = ISO_PALETTE.bg_canvas;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Vignette / Studio Gradient
      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 80,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(215, 222, 240, 0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Canvas Fixed Camera Center (Centering 499px room within 740px canvas)
      const originX = canvas.width / 2;
      const originY = 270;
      const roomSize = 10; // 10x10 Grid Units cutaway room

      // 1. Draw Architectural Cutaway Enclosure (Slab + Walls + Window + Blinds + Clock)
      drawEnclosedRoomStructure(ctx, originX, originY, roomSize, 150, 24);

      // 2. Prepare Render Items Queue for Painter's Algorithm Depth Sorting
      const queue: RenderItem[] = [];

      // A. CEO Arjun's Workstation (Desks, Screens, PC Tower, Chair, Accessories)
      // Matches Screenshot 2 placement near Left Wall Window
      queue.push(createExecutiveDesk(2.0, 0.8, 3.4, 1.4, 38));
      const arjunSim = simAgentsRef.current.find(a => a.id === 'arjun_ceo');
      queue.push(createErgonomicChair(3.2, 2.0, arjunSim?.isSeated));

      // B. Filing Cabinet with Cute Cat & Succulent on Top + Wastebasket (Screenshot 2 Match!)
      queue.push(createFilingCabinetWithCat(6.2, 0.7));

      // C. Executive Conference / Strategy Meeting Table with Tabletop Tablet
      queue.push(createMeetingTable(3.6, 4.8, 3.2, 2.0));
      // Conference Chairs
      queue.push(createErgonomicChair(3.4, 4.0, false));
      queue.push(createErgonomicChair(5.4, 4.0, false));
      queue.push(createErgonomicChair(3.4, 6.8, false));

      // D. Executive Lounge Area (Deep Indigo Sofa + Modern Coffee Table)
      queue.push(createLoungeSofa(7.2, 2.4, 2.4, 1.2));

      // E. Architectural Staircase leading Upward to Floor 1: Media Studio
      queue.push(...createStaircaseUp(0.2, 9.4, 5.0, 1));

      // F. Indoor Potted Fig Trees (Lush greenery framing room & staircase entrance)
      queue.push(createPottedTree(2.0, 9.4)); // Framed gracefully at foot of staircase
      queue.push(createPottedTree(8.8, 0.8));

      // 3. Update Agents Simulation Motion
      simAgentsRef.current.forEach(sim => {
        // Target destination based on pacing
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

        // Get sprite
        let avatarImg: HTMLImageElement | null = null;
        if (sim.isAuri) {
          avatarImg = getImage(orbiState === 'thinking'
            ? '/assets/sprites/auri/orbi_thinking_f0.png'
            : orbiState === 'celebrating'
            ? '/assets/sprites/auri/orbi_celebrating_f0.png'
            : '/assets/sprites/auri/orbi_idle_f0.png'
          );
        } else {
          avatarImg = getImage(`/assets/sprites/employees/${sim.avatarFile}`);
        }

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
          isAuri: sim.isAuri,
          statusText: sim.isWalking ? 'Moving across suite...' : (pacingMode === 'break' ? 'Coffee Break in Lounge' : sim.statusText),
          avatarImg
        };

        queue.push(createCharacterRenderItem(charData));
      });

      // 4. Sort Render Queue by Isometric Depth (Painter's Algorithm)
      // Objects further back (lower depth value) render first
      queue.sort((a, b) => a.depth - b.depth);

      // 5. Execute Depth-Sorted Render Passes
      queue.forEach(item => {
        item.render(ctx, originX, originY);
      });

      // 6. Interactive Floating Staircase Navigation Badge when hovered
      if (hoveredStairs) {
        ctx.save();
        const sPortal = toScreen(0.4, 5.2, 130, originX, originY);
        ctx.font = 'bold 11px monospace';
        const txt = '▲ ASCEND TO FLOOR 1 (MEDIA STUDIO) • CLICK TO TRANSIT';
        const tw = ctx.measureText(txt).width + 28;
        const th = 26;

        // Glowing backdrop pill
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(sPortal.x - tw / 2, sPortal.y - th / 2, tw, th);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sPortal.x - tw / 2, sPortal.y - th / 2, tw, th);

        // Blinking emerald LED
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(sPortal.x - tw / 2 + 12, sPortal.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Label text
        ctx.fillStyle = '#38BDF8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, sPortal.x + 8, sPortal.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [pacingMode, orbiState, hoveredStairs]);

  // Handle Mouse Hover on Personnel and Staircase
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

    // B. Detect Hover over Staircase (gx in [0, 1.8], gy in [4.6, 9.8])
    const sPortal = toScreen(0, 4.8, 140, originX, originY);
    const sBottom = toScreen(1.8, 9.6, 0, originX, originY);
    const sLeft = toScreen(0, 9.6, 0, originX, originY);
    const sRight = toScreen(1.8, 4.8, 70, originX, originY);

    const isOverStairs =
      cx >= sLeft.x - 30 &&
      cx <= sRight.x + 30 &&
      cy >= sPortal.y - 15 &&
      cy <= sBottom.y + 25;

    setHoveredStairs(isOverStairs);
  };

  const handleClick = () => {
    if (hoveredStairs && onNavigateFloor) {
      onNavigateFloor(1);
      return;
    }

    if (hoveredAgent) {
      const realAgent = agents.find(a => a.id === hoveredAgent.id) || {
        id: hoveredAgent.id,
        name: hoveredAgent.name,
        role: hoveredAgent.role,
        department: 'Executive Suite',
        floor: 0,
        status: 'active',
        skills: ['Executive Directives', 'Workflow Approval', 'Leadership'],
        tools: ['CEO Command Terminal', 'Approval Gate', 'Company Strategy']
      };
      onSelectAgent(realAgent as Agent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E6E9F5] select-none overflow-hidden relative font-mono">
      {/* Top Controls Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur-md border-b border-slate-300 shadow-sm z-20 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="px-2.5 py-1 bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm">
            FLOOR 0 // EXECUTIVE CUTAWAY SUITE
          </div>
          <span className="text-xs text-slate-600 font-medium">
            2:1 Isometric Pixel Art • Enclosed Cutaway Architecture
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {onNavigateFloor && (
            <button
              onClick={() => onNavigateFloor(1)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
              title="Ascend staircase to Floor 1: Media & Creative Studio"
            >
              <span>▲ Ascend to Floor 1</span>
            </button>
          )}

          <button
            onClick={() => setPacingMode(prev => prev === 'break' ? 'calm' : 'break')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              pacingMode === 'break'
                ? 'bg-amber-500 text-white'
                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {pacingMode === 'break' ? '☕ Return to Work' : '☕ Coffee Break'}
          </button>

          <div className="h-4 w-px bg-slate-300 mx-1" />

          <button
            onClick={() => setZoom(z => Math.max(0.8, z - 0.1))}
            className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 text-xs"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-xs text-slate-600 font-bold px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
            className="p-1.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 text-xs"
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>

      {/* Main Canvas Container with Crisp Pixel Rendering */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
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
              cursor: (hoveredAgent || hoveredStairs) ? 'pointer' : 'default'
            }}
          />
        </div>
      </div>
    </div>
  );
};
