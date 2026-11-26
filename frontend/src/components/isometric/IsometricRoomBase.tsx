import React, { useEffect, useRef, useState } from 'react';
import { Agent } from '../../types';
import { useIsoAgentDrag } from './useIsoAgentDrag';
import {
  toScreen,
  drawEnclosedRoomStructure,
  createCharacterRenderItem,
  RenderItem,
  IsoCharacterRenderData
} from './isoEngine';
import { AgentPositionInfo } from './Floor0IsometricRoom';

export interface SimAgentConfig {
  id: string;
  name: string;
  role: string;
  avatarFile: string;
  isAuri?: boolean;
  statusText: string;
  deskPos: { gx: number; gy: number };
  loungePos: { gx: number; gy: number };
  facing?: 'SW' | 'SE' | 'NW' | 'NE';
}

interface SimAgentRuntime extends SimAgentConfig {
  gx: number;
  gy: number;
  isSeated: boolean;
  isWalking: boolean;
  facing: 'SW' | 'SE' | 'NW' | 'NE';
  isAuri: boolean;
}

export interface StairConfig {
  targetFloor: number;
  badgeText: string;
}

export interface IsometricRoomBaseProps {
  floorNumber: number;
  departmentName: string;
  defaultSkills: string[];
  defaultTools: string[];
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  onNavigateFloor?: (floor: number) => void;
  zoom?: number;
  pan?: { x: number; y: number };
  pacingMode?: 'calm' | 'break' | 'active';
  skipBakedLabels?: boolean;
  onAgentPositionsUpdate?: (positions: AgentPositionInfo[]) => void;
  initialAgents: SimAgentConfig[];
  buildFurniture: (queue: RenderItem[], simAgents: SimAgentRuntime[]) => void;
  stairsDown?: StairConfig;
  stairsUp?: StairConfig;
}

export const IsometricRoomBase: React.FC<IsometricRoomBaseProps> = ({
  floorNumber,
  departmentName,
  defaultSkills,
  defaultTools,
  agents,
  onSelectAgent,
  onNavigateFloor,
  zoom = 1.0,
  pan = { x: 0, y: 0 },
  pacingMode = 'calm',
  skipBakedLabels = true,
  onAgentPositionsUpdate,
  initialAgents,
  buildFurniture,
  stairsDown,
  stairsUp
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1360, height: 680 });
  const [hoveredAgent, setHoveredAgent] = useState<SimAgentRuntime | null>(null);
  const { isDragging, handleMouseDown, handleDragMove, handleMouseUp, consumeJustDragged } = useIsoAgentDrag(
    canvasRef,
    pan,
    zoom,
    hoveredAgent
  );
  const [hoveredStairsDown, setHoveredStairsDown] = useState(false);
  const [hoveredStairsUp, setHoveredStairsUp] = useState(false);

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

  const simAgentsRef = useRef<SimAgentRuntime[]>(
    initialAgents.map(a => ({
      ...a,
      gx: a.deskPos.gx,
      gy: a.deskPos.gy,
      isSeated: true,
      isWalking: false,
      facing: a.facing || 'SE',
      isAuri: Boolean(a.isAuri)
    }))
  );

  useEffect(() => {
    initialAgents.forEach(a => {
      getImage(`/assets/sprites/employees/${a.avatarFile}`);
    });
  }, [initialAgents]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      if (el.clientWidth && el.clientHeight) {
        setDimensions({ width: el.clientWidth, height: el.clientHeight });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

      // Dark Navy Environment per Spec 5.A
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const roomSize = 14;
      const wallHeight = 110;
      const slabThickness = 22;
      const totalDioramaHeight = wallHeight + roomSize * 32 + slabThickness;
      const originX = Math.round(canvas.width / 2);
      const originY = Math.round((canvas.height - totalDioramaHeight) / 2 + wallHeight);

      // Studio Vignette / Radial Gradient Centered on the Office Floor
      const floorCenterY = originY + roomSize * 16;
      const grad = ctx.createRadialGradient(
        canvas.width / 2 + pan.x,
        floorCenterY + pan.y,
        60 * zoom,
        canvas.width / 2 + pan.x,
        floorCenterY + pan.y,
        Math.max(canvas.width, canvas.height) * 0.75 * zoom
      );
      grad.addColorStop(0, 'rgba(28, 38, 62, 0.5)');
      grad.addColorStop(1, 'rgba(8, 12, 20, 0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      drawEnclosedRoomStructure(ctx, originX, originY, roomSize, wallHeight, slabThickness);

      const queue: RenderItem[] = [];
      buildFurniture(queue, simAgentsRef.current);

      const screenPositions: AgentPositionInfo[] = [];
      simAgentsRef.current.forEach(sim => {
        const target = pacingMode === 'break' ? sim.loungePos : sim.deskPos;
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
          sim.isSeated = pacingMode !== 'break' || target === sim.loungePos;
        }

        const pos = toScreen(sim.gx, sim.gy, sim.isSeated ? 14 : 0, originX, originY);
        const sx = (pos.x - canvas.width / 2) * zoom + (canvas.width / 2 + pan.x);
        const sy = (pos.y - canvas.height / 2) * zoom + (canvas.height / 2 + pan.y);
        const statusText = sim.isWalking
          ? `Moving across Floor ${floorNumber}...`
          : pacingMode === 'break'
          ? 'Coffee Break in Lounge'
          : sim.statusText;

        screenPositions.push({
          id: sim.id,
          name: sim.name,
          role: sim.role,
          screenX: sx,
          screenY: sy,
          statusText,
          status: sim.isWalking ? 'in_transit' : pacingMode === 'break' ? 'break' : 'active',
          isAuri: sim.isAuri
        });

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
          statusText,
          avatarImg: getImage(`/assets/sprites/employees/${sim.avatarFile}`),
          skipBakedLabels
        };
        queue.push(createCharacterRenderItem(charData));
      });

      if (onAgentPositionsUpdate && tick % 2 === 0) {
        onAgentPositionsUpdate(screenPositions);
      }

      queue.sort((a, b) => a.depth - b.depth);
      queue.forEach(item => item.render(ctx, originX, originY));

      const drawStairBadge = (
        anchor: { x: number; y: number },
        text: string,
        accent: string
      ) => {
        ctx.save();
        ctx.font = 'bold 11px monospace';
        const tw = ctx.measureText(text).width + 28;
        const th = 26;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(anchor.x - tw / 2, anchor.y - th / 2, tw, th);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(anchor.x - tw / 2, anchor.y - th / 2, tw, th);
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(anchor.x - tw / 2 + 12, anchor.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, anchor.x + 8, anchor.y);
        ctx.restore();
      };

      if (stairsDown && hoveredStairsDown) {
        drawStairBadge(toScreen(0.4, 8.5, 130, originX, originY), stairsDown.badgeText, '#F59E0B');
      }
      if (stairsUp && hoveredStairsUp) {
        drawStairBadge(toScreen(8.5, 0.4, 130, originX, originY), stairsUp.badgeText, '#38BDF8');
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [pacingMode, hoveredStairsDown, hoveredStairsUp, dimensions, zoom, pan.x, pan.y, skipBakedLabels]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const cx = (rawX - (canvas.width / 2 + pan.x)) / zoom + canvas.width / 2;
    const cy = (rawY - (canvas.height / 2 + pan.y)) / zoom + canvas.height / 2;

    const roomSize = 14;
    const wallHeight = 110;
    const slabThickness = 22;
    const totalDioramaHeight = wallHeight + roomSize * 32 + slabThickness;
    const originX = Math.round(canvas.width / 2);
    const originY = Math.round((canvas.height - totalDioramaHeight) / 2 + wallHeight);

    let found: SimAgentRuntime | null = null;
    simAgentsRef.current.forEach(sim => {
      const pos = toScreen(sim.gx, sim.gy, sim.isSeated ? 8 : 0, originX, originY);
      if (Math.hypot(cx - pos.x, cy - (pos.y - 25)) < 32) {
        found = sim;
      }
    });
    setHoveredAgent(found);

    if (stairsDown) {
      const sdTop = toScreen(0, 8.5, 80, originX, originY);
      const sdBottom = toScreen(2.0, 13.2, 0, originX, originY);
      const sdLeft = toScreen(0, 13.2, 0, originX, originY);
      const sdRight = toScreen(2.0, 8.5, 0, originX, originY);
      setHoveredStairsDown(
        cx >= sdLeft.x - 30 && cx <= sdRight.x + 30 && cy >= sdTop.y - 20 && cy <= sdBottom.y + 20
      );
    }

    if (stairsUp) {
      const suTop = toScreen(8.5, 0, 110, originX, originY);
      const suBottom = toScreen(13.2, 2.0, 0, originX, originY);
      const suLeft = toScreen(8.5, 2.0, 0, originX, originY);
      const suRight = toScreen(13.2, 0, 0, originX, originY);
      setHoveredStairsUp(
        cx >= suLeft.x - 30 && cx <= suRight.x + 30 && cy >= suTop.y - 20 && cy <= suBottom.y + 20
      );
    }
  };

  const handleClick = () => {
    if (hoveredAgent) {
      const realAgent = agents.find(a => a.agent_id === hoveredAgent.id || a.id === hoveredAgent.id) || {
        id: hoveredAgent.id,
        agent_id: hoveredAgent.id,
        name: hoveredAgent.name,
        role: hoveredAgent.role,
        department: departmentName,
        floor: floorNumber,
        status: 'active',
        skills: defaultSkills,
        tools: defaultTools
      };
      onSelectAgent(realAgent as Agent);
      return;
    }
    if (stairsDown && hoveredStairsDown && onNavigateFloor) {
      onNavigateFloor(stairsDown.targetFloor);
      return;
    }
    if (stairsUp && hoveredStairsUp && onNavigateFloor) {
      onNavigateFloor(stairsUp.targetFloor);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none overflow-hidden font-mono bg-[#080c14]">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => { if (!handleDragMove(e)) handleMouseMove(e); }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => { if (!consumeJustDragged()) handleClick(); }}
        style={{
          imageRendering: 'pixelated',
          display: 'block',
          cursor: isDragging ? 'grabbing' : hoveredAgent ? 'grab' : (hoveredStairsDown || hoveredStairsUp) ? 'pointer' : 'default'
        }}
      />
    </div>
  );
};
