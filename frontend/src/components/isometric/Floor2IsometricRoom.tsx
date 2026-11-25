import React, { useEffect, useRef, useState } from 'react';
import { Agent } from '../../types';
import { ISO_PALETTE } from '../../theme/isoPalette';
import {
  toScreen,
  drawEnclosedRoomStructure,
  createExecutiveDesk,
  createVideoEditingDesk,
  createDesignDesk,
  createErgonomicChair,
  createMeetingTable,
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

export const Floor2IsometricRoom: React.FC<Props> = ({
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
    getImage('/assets/sprites/employees/ananya_marketing.png');
    getImage('/assets/sprites/employees/rohit_social.png');
  }, []);

  // Floor 2 Personnel: Ananya (Growth Strategist) & Rohit (Social & YouTube Lead)
  const simAgentsRef = useRef<AgentSimState[]>([
    {
      id: 'ananya_marketing',
      name: 'Ananya (Growth)',
      role: 'Growth Strategist & Campaign Lead',
      gx: 4.0,
      gy: 2.4,
      targetGx: 4.0,
      targetGy: 2.4,
      isSeated: true,
      isWalking: false,
      facing: 'SE',
      avatarFile: 'ananya_marketing.png',
      isAuri: false,
      statusText: 'Analyzing Shorts Retention & Growth Funnel',
      deskPos: { gx: 4.0, gy: 2.4 },
      loungePos: { gx: 8.5, gy: 11.8 }
    },
    {
      id: 'rohit_social',
      name: 'Rohit (Social)',
      role: 'Social & YouTube Distribution Lead',
      gx: 10.6,
      gy: 2.4,
      targetGx: 10.6,
      targetGy: 2.4,
      isSeated: true,
      isWalking: false,
      facing: 'NW',
      avatarFile: 'rohit_social.png',
      isAuri: false,
      statusText: 'Scheduling YouTube Community & Reels Drops',
      deskPos: { gx: 10.6, gy: 2.4 },
      loungePos: { gx: 9.8, gy: 11.8 }
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

      // Light Muted Studio Backdrop
      ctx.fillStyle = ISO_PALETTE.bg_canvas;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const grad = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 80,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      grad.addColorStop(1, 'rgba(215, 222, 240, 0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Canvas Fixed Camera Center (Spacious 15x15 cutaway room)
      const originX = canvas.width / 2;
      const originY = 175;
      const roomSize = 15;

      // 1. Draw Architectural Room Structure
      drawEnclosedRoomStructure(ctx, originX, originY, roomSize, 150, 24);

      // 2. Prepare Render Items Queue for Depth Sorting
      const queue: RenderItem[] = [];

      // A. Outreach & Merch Display Cabinet (Back corner gx: 0.8, gy: 1.2)
      queue.push(createStudioBookcase(0.8, 1.2, 1.4, 0.6, 62));

      // B. Ananya's Growth Command Workstation (gx: 2.6, gy: 1.4)
      queue.push(createExecutiveDesk(2.6, 1.4, 3.2, 1.3, 38));
      const ananyaSim = simAgentsRef.current.find(a => a.id === 'ananya_marketing');
      queue.push(createErgonomicChair(4.0, 2.4, ananyaSim?.isSeated));

      // C. Rohit's Social Media & Broadcast Workstation (gx: 9.0, gy: 1.4)
      queue.push(createVideoEditingDesk(9.0, 1.4, 3.4, 1.4, 38));
      const rohitSim = simAgentsRef.current.find(a => a.id === 'rohit_social');
      queue.push(createErgonomicChair(10.6, 2.4, rohitSim?.isSeated));

      // D. Social Mobile Recording Rig & Studio Ring Light (gx: 6.8, gy: 6.2)
      queue.push(createStudioCamera(6.8, 6.2, 'NE'));
      queue.push(createStudioSoftboxLight(5.4, 5.2));
      queue.push(createStudioSoftboxLight(8.6, 7.8));

      // E. Growth Campaign Brainstorming Conference Table (gx: 2.4, gy: 6.8)
      queue.push(createMeetingTable(2.4, 6.8, 3.8, 2.2));
      queue.push(createErgonomicChair(3.0, 6.0, false));
      queue.push(createErgonomicChair(5.0, 6.0, false));
      queue.push(createErgonomicChair(3.0, 9.4, false));
      queue.push(createErgonomicChair(5.0, 9.4, false));

      // F. Campaign Analytics & Design Table (gx: 9.2, gy: 7.0)
      queue.push(createDesignDesk(9.2, 7.0, 3.2, 1.4, 38));

      // G. Refreshment Coffee Counter (gx: 12.6, gy: 10.8)
      queue.push(createStudioCoffeeBar(12.6, 10.8, 1.8, 1.0, 36));

      // H. Growth Operations Lounge Sofa (gx: 7.8, gy: 11.2)
      queue.push(createLoungeSofa(7.8, 11.2, 3.0, 1.3));

      // I. Staircase Down to Floor 1: Media Studio (gy: 9.5 -> 14.0)
      queue.push(...createStaircaseDown(0.2, 9.5, 14.0, 1, '▼ TO FLOOR 1: MEDIA STUDIO'));

      // J. Staircase Up to Floor 3: AI Video QA Lab (gx: 14.0 -> 9.5)
      queue.push(...createStaircaseUpAlongLeftWall(0.2, 14.0, 9.5, 3, '▲ TO FLOOR 3: AI VIDEO QA LAB'));

      // K. Framing Potted Greenery
      queue.push(createPottedTree(6.2, 1.2));
      queue.push(createPottedTree(0.8, 5.8));
      queue.push(createPottedTree(14.0, 9.5));
      queue.push(createPottedTree(1.8, 14.2));
      queue.push(createPottedTree(14.2, 14.2));

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
          statusText: sim.isWalking ? 'Moving across marketing suite...' : (pacingMode === 'break' ? 'Coffee Break in Growth Lounge' : sim.statusText),
          avatarImg
        };

        queue.push(createCharacterRenderItem(charData));
      });

      // 4. Sort Queue by Depth (Painter's Algorithm)
      queue.sort((a, b) => a.depth - b.depth);

      // 5. Render All Items
      queue.forEach(item => {
        item.render(ctx, originX, originY);
      });

      // 6. Interactive Floating Staircase Navigation Badges
      if (hoveredStairsDown) {
        ctx.save();
        const sDown = toScreen(0.4, 9.5, 130, originX, originY);
        ctx.font = 'bold 11px monospace';
        const txt = '▼ DESCEND TO FLOOR 1 (MEDIA STUDIO) • CLICK TO TRANSIT';
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
        const sUp = toScreen(9.5, 0.4, 130, originX, originY);
        ctx.font = 'bold 11px monospace';
        const txt = '▲ ASCEND TO FLOOR 3 (AI VIDEO QA LAB) • CLICK TO TRANSIT';
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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;

    const originX = canvas.width / 2;
    const originY = 175;

    // Personnel Hover
    let found: AgentSimState | null = null;
    simAgentsRef.current.forEach(sim => {
      const pos = toScreen(sim.gx, sim.gy, sim.isSeated ? 8 : 0, originX, originY);
      const dist = Math.hypot(cx - pos.x, cy - (pos.y - 25));
      if (dist < 32) {
        found = sim;
      }
    });
    setHoveredAgent(found);

    // Stairs Down Hover (gx in [0, 2.0], gy in [9.0, 14.5])
    const sdTop = toScreen(0, 9.5, 80, originX, originY);
    const sdBottom = toScreen(2.0, 14.2, 0, originX, originY);
    const sdLeft = toScreen(0, 14.2, 0, originX, originY);
    const sdRight = toScreen(2.0, 9.5, 0, originX, originY);

    const isOverStairsDown =
      cx >= sdLeft.x - 30 &&
      cx <= sdRight.x + 30 &&
      cy >= sdTop.y - 20 &&
      cy <= sdBottom.y + 20;
    setHoveredStairsDown(isOverStairsDown);

    // Stairs Up Hover (gx in [9.0, 14.5], gy in [0, 2.0])
    const suTop = toScreen(9.5, 0, 140, originX, originY);
    const suBottom = toScreen(14.2, 2.0, 0, originX, originY);
    const suLeft = toScreen(9.5, 2.0, 0, originX, originY);
    const suRight = toScreen(14.2, 0, 0, originX, originY);

    const isOverStairsUp =
      cx >= suLeft.x - 30 &&
      cx <= suRight.x + 30 &&
      cy >= suTop.y - 20 &&
      cy <= suBottom.y + 20;
    setHoveredStairsUp(isOverStairsUp);
  };

  const handleClick = () => {
    if (hoveredStairsDown && onNavigateFloor) {
      onNavigateFloor(1);
      return;
    }

    if (hoveredStairsUp && onNavigateFloor) {
      onNavigateFloor(3);
      return;
    }

    if (hoveredAgent) {
      const realAgent = agents.find(a => a.id === hoveredAgent.id) || {
        id: hoveredAgent.id,
        name: hoveredAgent.name,
        role: hoveredAgent.role,
        department: 'Marketing & Campaign Management',
        floor: 2,
        status: 'active',
        skills: ['Campaign Funnels', 'Shorts Retention', 'Audience Analytics', 'Distribution'],
        tools: ['YouTube Studio Analytics', 'Reels Scheduling Pipeline', 'Outreach CRM']
      };
      onSelectAgent(realAgent as Agent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E6E9F5] select-none overflow-hidden relative font-mono">
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
              cursor: (hoveredAgent || hoveredStairsDown || hoveredStairsUp) ? 'pointer' : 'default'
            }}
          />
        </div>
      </div>
    </div>
  );
};
