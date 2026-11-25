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
  createStudioCoffeeBar,
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
      gx: 4.4,
      gy: 2.4,
      targetGx: 4.4,
      targetGy: 2.4,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'arjun_ceo.png',
      isAuri: false,
      statusText: 'Directing AI Operations',
      deskPos: { gx: 4.4, gy: 2.4 },
      loungePos: { gx: 11.5, gy: 2.4 }
    },
    {
      id: 'coo_01',
      name: 'Marcus Vance',
      role: 'Chief Operating Officer',
      gx: 5.8,
      gy: 7.4,
      targetGx: 5.8,
      targetGy: 7.4,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'coo_01.png',
      isAuri: false,
      statusText: 'Reviewing Pipeline Deliverables',
      deskPos: { gx: 5.8, gy: 7.4 },
      loungePos: { gx: 12.5, gy: 3.2 }
    },
    {
      id: 'auri_ceo_interface',
      name: 'AURI Mascot',
      role: 'Executive Intelligence Mascot',
      gx: 3.2,
      gy: 4.8,
      targetGx: 3.2,
      targetGy: 4.8,
      isSeated: false,
      isWalking: false,
      facing: 'SE',
      avatarFile: 'auri',
      isAuri: true,
      statusText: 'Standing by for CEO Directives',
      deskPos: { gx: 3.2, gy: 4.8 },
      loungePos: { gx: 10.2, gy: 3.8 }
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

      // Canvas Fixed Camera Center (Enlarged 15x15 desktop cutaway room)
      const originX = canvas.width / 2;
      const originY = 175;
      const roomSize = 15; // Spacious 15x15 Grid Units cutaway room

      // 1. Draw Architectural Cutaway Enclosure (Slab + Walls + Windows + Blinds + Decor)
      drawEnclosedRoomStructure(ctx, originX, originY, roomSize, 150, 24);

      // 2. Prepare Render Items Queue for Painter's Algorithm Depth Sorting
      const queue: RenderItem[] = [];

      // A. CEO Arjun's Workstation (Desk, Screens, PC Tower, Chair, Accessories)
      // Placed with generous space along Left Wall Window
      queue.push(createExecutiveDesk(2.6, 1.4, 3.6, 1.4, 38));
      const arjunSim = simAgentsRef.current.find(a => a.id === 'arjun_ceo');
      queue.push(createErgonomicChair(4.4, 2.4, arjunSim?.isSeated));

      // B. Filing Cabinet with Cute Cat & Succulent on Top + Wastebasket (Screenshot 2 Match!)
      queue.push(createFilingCabinetWithCat(1.2, 4.8));

      // C. Executive Conference / Strategy Boardroom Table (6.8, 6.2)
      queue.push(createMeetingTable(6.8, 6.2, 4.4, 2.4));
      // Conference Chairs with ample walkway clearance
      queue.push(createErgonomicChair(7.6, 5.2, false));
      queue.push(createErgonomicChair(10.2, 5.2, false));
      queue.push(createErgonomicChair(7.6, 9.0, false));
      queue.push(createErgonomicChair(10.2, 9.0, false));
      const cooSim = simAgentsRef.current.find(a => a.id === 'coo_01');
      queue.push(createErgonomicChair(5.8, 7.4, cooSim?.isSeated)); // Head of table
      queue.push(createErgonomicChair(11.8, 7.4, false)); // Foot of table

      // D. Executive Lounge Area (Deep Indigo Sofa + Modern Coffee Counter)
      queue.push(createLoungeSofa(10.8, 1.6, 3.2, 1.4));
      queue.push(createStudioCoffeeBar(13.2, 1.2, 1.4, 1.0, 36));

      // E. Architectural Staircase leading Upward to Floor 1: Media Studio
      queue.push(...createStaircaseUp(0.2, 14.0, 9.5, 1));

      // F. Indoor Potted Fig Trees (Lush greenery framing executive zones)
      queue.push(createPottedTree(1.2, 7.8));
      queue.push(createPottedTree(6.6, 1.2));
      queue.push(createPottedTree(14.2, 4.6));
      queue.push(createPottedTree(1.8, 14.2));
      queue.push(createPottedTree(14.2, 14.2));

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
        const sPortal = toScreen(0.4, 9.5, 130, originX, originY);
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
    const originY = 175;

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

    // B. Detect Hover over Staircase (gx in [0, 2.0], gy in [9.0, 14.5])
    const sPortal = toScreen(0, 9.5, 140, originX, originY);
    const sBottom = toScreen(2.0, 14.2, 0, originX, originY);
    const sLeft = toScreen(0, 14.2, 0, originX, originY);
    const sRight = toScreen(2.0, 9.5, 70, originX, originY);

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
            width={1400}
            height={800}
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
