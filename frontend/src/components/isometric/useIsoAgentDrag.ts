import { useRef, useState } from 'react';
import { screenToGrid } from './isoEngine';

export interface DraggableSimAgent {
  gx: number;
  gy: number;
  targetGx: number;
  targetGy: number;
  isSeated: boolean;
  state: string;
  pauseTimer: number;
}

export function useIsoAgentDrag<T extends DraggableSimAgent>(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  pan: { x: number; y: number },
  zoom: number,
  hoveredAgent: T | null
) {
  const dragRef = useRef<{ agent: T; startX: number; startY: number; moved: boolean } | null>(null);
  const justDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 || !hoveredAgent) return;
    dragRef.current = { agent: hoveredAgent, startX: e.clientX, startY: e.clientY, moved: false };
    justDraggedRef.current = false;
  };

  const handleDragMove = (e: React.MouseEvent<HTMLCanvasElement>): boolean => {
    const drag = dragRef.current;
    if (!drag) return false;
    if (!drag.moved && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6) {
      drag.moved = true;
      setIsDragging(true);
    }
    if (!drag.moved) return false;

    const canvas = canvasRef.current;
    if (!canvas) return true;
    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const cx = (rawX - (canvas.width / 2 + pan.x)) / zoom + canvas.width / 2;
    const cy = (rawY - (canvas.height / 2 + pan.y)) / zoom + canvas.height / 2;

    const wallHeight = 110;
    const slabThickness = 22;
    const totalDioramaHeight = wallHeight + 14 * 32 + slabThickness;
    const originX = Math.round(canvas.width / 2);
    const originY = Math.round((canvas.height - totalDioramaHeight) / 2 + wallHeight);

    const { gx, gy } = screenToGrid(cx, cy + 20, originX, originY);
    drag.agent.gx = gx;
    drag.agent.gy = gy;
    drag.agent.targetGx = gx;
    drag.agent.targetGy = gy;
    drag.agent.isSeated = false;
    drag.agent.state = 'idle';
    drag.agent.pauseTimer = 3.5;
    return true;
  };

  const handleMouseUp = () => {
    if (dragRef.current?.moved) {
      justDraggedRef.current = true;
    }
    dragRef.current = null;
    setIsDragging(false);
  };

  const consumeJustDragged = (): boolean => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return true;
    }
    return false;
  };

  return {
    isDragging,
    handleMouseDown,
    handleDragMove,
    handleMouseUp,
    consumeJustDragged,
  };
}
