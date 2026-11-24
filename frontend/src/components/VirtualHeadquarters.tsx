import React, { useState, useEffect, useRef } from 'react';
import { Agent, AgentMessage, AgentTransitEvent } from '../types';
import { 
  Building2, Users, Coffee, Laptop, Sparkles, MessageSquare, 
  ChevronRight, ZoomIn, ZoomOut, Maximize2, Layers, Compass, ArrowUp, ArrowDown
} from 'lucide-react';

interface Props {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  activeFloor: number;
  setActiveFloor: (floor: number) => void;
  orbiState: string;
  onOpenComms?: () => void;
  recentMessages?: AgentMessage[];
  pendingTransit?: AgentTransitEvent | null;
}

export const FLOOR_CONFIG = [
  { floor: 0, name: "Floor 0: Executive Suite", subtitle: "Arjun's CEO Suite, Marcus Vance (COO) & AURI Mascot", theme: "executive", badge: "EXECUTIVE" },
  { floor: 1, name: "Floor 1: Media & Creative Studio", subtitle: "Darshan, Shrinithi, Vaishnavi & Shreyank (Video Production)", theme: "creative", badge: "MEDIA PRODUCTION" },
  { floor: 2, name: "Floor 2: Marketing & Growth Operations", subtitle: "Ananya & Rohit (Campaigns, Shorts & Campus Growth)", theme: "marketing", badge: "MARKETING & GROWTH" },
  { floor: 3, name: "Floor 3: AI Video QA & Testing Lab", subtitle: "Tarun & Kavya (Autonomous Defect Detection & Repair)", theme: "qa_lab", badge: "VIDEO QA & TESTING" },
  { floor: 4, name: "Floor 4: Documentation & Campus Hub", subtitle: "Iffah, Jiya & Srijana (Campus Outreach & Compliance)", theme: "admin", badge: "OUTREACH & DOCS" },
  { floor: 5, name: "Floor 5: Technology & Infrastructure", subtitle: "Pratham, Mallika, Vaibhav & Faazil (Systems, DevOps & DB)", theme: "tech", badge: "TECH & CLOUD" }
];

interface CharacterSim {
  agent_id: string;
  name: string;
  role: string;
  homeFloor: number;
  currentFloor: number;
  avatar_file: string;
  isAuri: boolean;
  deskX: number;
  deskY: number;
  curX: number;
  curY: number;
  targetX: number;
  targetY: number;
  state: 'working_at_desk' | 'walking' | 'drinking_coffee' | 'sitting_on_sofa' | 'escalator_transit' | 'visiting_colleague';
  subStateTimer: number;
  facing: 'SE' | 'SW' | 'NE' | 'NW';
  walkCycle: number;
  bubbleText?: string;
  bubbleTimer?: number;
  bubbleEmoji?: string;
  transitProgress?: number;
  transitFromFloor?: number;
  transitToFloor?: number;
}

export const VirtualHeadquarters: React.FC<Props> = ({
  agents,
  onSelectAgent,
  activeFloor,
  setActiveFloor,
  orbiState,
  onOpenComms,
  recentMessages = [],
  pendingTransit = null
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'multi_tower' | 'floor_focus'>('multi_tower');
  const simRef = useRef<CharacterSim[]>([]);
  const animFrameRef = useRef<number>(0);
  const [activeActionLog, setActiveActionLog] = useState<string>("Autonomous corporate workforce operational across all 6 campus floors.");

  // Isometric Grid Settings
  const TILE_W = 56;
  const TILE_H = 28;
  const FOCUS_GRID = 14;

  // Image Asset Cache
  const imgCache = useRef<Record<string, HTMLImageElement>>({});
  const getImage = (src: string): HTMLImageElement => {
    if (!imgCache.current[src]) {
      const img = new Image();
      img.src = src;
      imgCache.current[src] = img;
    }
    return imgCache.current[src];
  };

  // Home desk coordinates for all personnel across all 6 floors
  const ALL_PERSONNEL_DESKS = [
    // Floor 0 - Executive (Ground Left)
    { agent_id: 'arjun_ceo', name: 'Arjun', role: 'Founder & CEO', floor: 0, x: 2, y: 3, chairColor: '#ea580c', isAuri: false },
    { agent_id: 'auri_ceo_interface', name: 'AURI', role: 'Mascot & CEO Interface', floor: 0, x: 4, y: 3, chairColor: '#0284c7', isAuri: true },
    { agent_id: 'coo_01', name: 'Marcus Vance', role: 'COO', floor: 0, x: 5, y: 4, chairColor: '#475569', isAuri: false },
    // Floor 1 - Media Studio (Ground Right)
    { agent_id: 'darshan_director', name: 'Darshan', role: 'Video Director', floor: 1, x: 2, y: 4, chairColor: '#ea580c', isAuri: false },
    { agent_id: 'shrinithi_script', name: 'Shrinithi', role: 'Scriptwriter', floor: 1, x: 4, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'vaishnavi_design', name: 'Vaishnavi', role: 'Thumbnail Designer', floor: 1, x: 6, y: 4, chairColor: '#dc2626', isAuri: false },
    { agent_id: 'shreyank_editor', name: 'Shreyank', role: 'Motion Graphics', floor: 1, x: 5, y: 6, chairColor: '#10b981', isAuri: false },
    // Floor 2 - Marketing & Growth Operations (Mid Left)
    { agent_id: 'ananya_marketing', name: 'Ananya', role: 'Growth Strategist', floor: 2, x: 3, y: 4, chairColor: '#10b981', isAuri: false },
    { agent_id: 'rohit_social', name: 'Rohit', role: 'Social & YouTube Lead', floor: 2, x: 5, y: 5, chairColor: '#ec4899', isAuri: false },
    // Floor 3 - AI Video QA & Testing Lab (Mid Right)
    { agent_id: 'tarun_qa', name: 'Tarun', role: 'Lead Defect Inspector', floor: 3, x: 3, y: 4, chairColor: '#f59e0b', isAuri: false },
    { agent_id: 'kavya_compliance', name: 'Kavya', role: 'Subtitle & Audio QA', floor: 3, x: 5, y: 5, chairColor: '#8b5cf6', isAuri: false },
    // Floor 4 - Documentation & Campus Hub (Top Left)
    { agent_id: 'iffah_doc', name: 'Iffah', role: 'Campus Outreach Lead', floor: 4, x: 2, y: 4, chairColor: '#9333ea', isAuri: false },
    { agent_id: 'jiya_research', name: 'Jiya', role: 'Technical Docs', floor: 4, x: 4, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'srijana_quality', name: 'Srijana', role: 'Quality Inspector', floor: 4, x: 6, y: 4, chairColor: '#10b981', isAuri: false },
    // Floor 5 - Technology & Infrastructure (Top Right)
    { agent_id: 'pratham_cto', name: 'Pratham', role: 'CTO & Tech Lead', floor: 5, x: 2, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'mallika_tech', name: 'Mallika', role: 'API & DB Lead', floor: 5, x: 4, y: 4, chairColor: '#10b981', isAuri: false },
    { agent_id: 'vaibhav_devops', name: 'Vaibhav', role: 'DevOps & Security', floor: 5, x: 6, y: 4, chairColor: '#f59e0b', isAuri: false },
    { agent_id: 'faazil_sysadmin', name: 'Faazil', role: 'SysAdmin & Storage', floor: 5, x: 5, y: 6, chairColor: '#6366f1', isAuri: false }
  ];

  // Persistent Initialization & Smooth Task Assignment Updates
  useEffect(() => {
    if (simRef.current.length === 0) {
      const list: CharacterSim[] = ALL_PERSONNEL_DESKS.map(d => {
        const real = agents.find(a => a.agent_id === d.agent_id);
        return {
          agent_id: d.agent_id,
          name: d.name,
          role: d.role,
          homeFloor: d.floor,
          currentFloor: d.floor,
          avatar_file: real?.avatar_file || `${d.agent_id}.png`,
          isAuri: d.isAuri,
          deskX: d.x,
          deskY: d.y,
          curX: d.x,
          curY: d.y,
          targetX: d.x,
          targetY: d.y,
          state: 'working_at_desk',
          subStateTimer: Math.floor(Math.random() * 140) + 160,
          facing: 'SE',
          walkCycle: 0,
          bubbleText: undefined,
          bubbleTimer: 0,
          bubbleEmoji: d.isAuri ? "🤖" : "💻"
        };
      });
      simRef.current = list;
    } else {
      simRef.current.forEach(sim => {
        const real = agents.find(a => a.agent_id === sim.agent_id);
        if (real?.avatar_file) sim.avatar_file = real.avatar_file;

        if (real?.status === 'working') {
          if (sim.currentFloor !== sim.homeFloor) {
            if (sim.state !== 'escalator_transit') {
              sim.state = 'escalator_transit';
              sim.transitFromFloor = sim.currentFloor;
              sim.transitToFloor = sim.homeFloor;
              sim.transitProgress = 0.0;
              sim.bubbleText = "⚡ Work assigned! Taking stairs home";
              sim.bubbleTimer = 110;
            }
          } else if (Math.hypot(sim.curX - sim.deskX, sim.curY - sim.deskY) > 0.1) {
            sim.targetX = sim.deskX;
            sim.targetY = sim.deskY;
            sim.state = 'walking';
            sim.bubbleText = "⚡ Task active! Walking to desk";
            sim.bubbleTimer = 90;
          } else {
            sim.curX = sim.deskX;
            sim.curY = sim.deskY;
            sim.state = 'working_at_desk';
            sim.facing = 'SE';
          }
        }
      });
    }
  }, [agents]);

  // Handle cross-floor transit requests (from API/WebSocket)
  useEffect(() => {
    if (!pendingTransit) return;
    const sim = simRef.current.find(s => s.agent_id === pendingTransit.agent_id);
    if (sim) {
      sim.state = 'escalator_transit';
      sim.transitFromFloor = pendingTransit.from_floor;
      sim.transitToFloor = pendingTransit.to_floor;
      sim.transitProgress = 0.0;
      sim.bubbleText = `Stairs to Floor ${pendingTransit.to_floor}!`;
      sim.bubbleEmoji = "🚶";
      sim.bubbleTimer = 160;
      setActiveActionLog(`${sim.name} taking stairs: Floor ${pendingTransit.from_floor} ➔ Floor ${pendingTransit.to_floor} (${pendingTransit.purpose})`);
    }
  }, [pendingTransit]);

  // Handle incoming message bubbles
  useEffect(() => {
    if (recentMessages.length > 0) {
      const lastMsg = recentMessages[recentMessages.length - 1];
      const senderSim = simRef.current.find(s => s.agent_id === lastMsg.sender_id);
      if (senderSim) {
        senderSim.bubbleText = lastMsg.content.length > 32 ? lastMsg.content.slice(0, 32) + '...' : lastMsg.content;
        senderSim.bubbleEmoji = "💬";
        senderSim.bubbleTimer = 180;
      }
    }
  }, [recentMessages]);

  // Interactive Quick Command: Trigger Team Coffee Break
  const handleTriggerTeamBreak = () => {
    simRef.current.forEach((sim, idx) => {
      const isCoffee = idx % 2 === 0;
      sim.state = 'walking';
      sim.targetX = isCoffee ? 1.5 : 5.5;
      sim.targetY = isCoffee ? 2.5 : 1.5;
      sim.bubbleText = isCoffee ? "☕ Coffee break time!" : "🛋️ Heading to lounge!";
      sim.bubbleTimer = 120;
    });
    setActiveActionLog("☕ Team break activated: Staff gathering at department refreshment bars.");
  };

  // Interactive Quick Command: Summon All to Desks
  const handleSummonToDesks = () => {
    simRef.current.forEach(sim => {
      if (sim.currentFloor !== sim.homeFloor) {
        sim.state = 'escalator_transit';
        sim.transitFromFloor = sim.currentFloor;
        sim.transitToFloor = sim.homeFloor;
        sim.transitProgress = 0.0;
        sim.bubbleText = `Stairs back to Floor ${sim.homeFloor}!`;
        sim.bubbleTimer = 120;
      } else {
        sim.state = 'walking';
        sim.targetX = sim.deskX;
        sim.targetY = sim.deskY;
        sim.bubbleText = "💻 Heading back to desk!";
        sim.bubbleTimer = 100;
      }
    });
    setActiveActionLog("💻 All employees returning to workstations.");
  };

  // Navigate using stairs directly
  const handleUseStairs = (targetFloor: number) => {
    if (targetFloor < 0 || targetFloor > 5) return;
    const fromFloor = activeFloor;
    setActiveFloor(targetFloor);
    setActiveActionLog(`🪜 Used campus stairs: Floor ${fromFloor} ➔ Floor ${targetFloor} (${FLOOR_CONFIG[targetFloor]?.name})`);

    // Animate active floor agent taking stairs
    const mover = simRef.current.find(s => s.currentFloor === fromFloor);
    if (mover) {
      mover.state = 'escalator_transit';
      mover.transitFromFloor = fromFloor;
      mover.transitToFloor = targetFloor;
      mover.transitProgress = 0.0;
      mover.bubbleText = `🪜 Taking stairs to Floor ${targetFloor}!`;
      mover.bubbleTimer = 120;
    }
  };

  // Main Canvas Render & AI Update Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    // Floor Center Anchors in Architectural Multi-Tier Campus Layout
    // Bottom: Ground Level (Floor 0 & 1)
    // Middle: Mid Level (Floor 2 & 3)
    // Top: Penthouse / Cloud Level (Floor 4 & 5)
    const TOWER_FLOORS: Record<number, { name: string; x: number; y: number; gridW: number; gridH: number; color: string; labelColor: string }> = {
      0: { name: "Floor 0: Executive Suite", x: 330, y: 570, gridW: 7, gridH: 6, color: '#1e293b', labelColor: '#f97316' },
      1: { name: "Floor 1: Media Studio", x: 890, y: 570, gridW: 7, gridH: 6, color: '#b91c1c', labelColor: '#38bdf8' },
      2: { name: "Floor 2: Marketing & Growth", x: 330, y: 360, gridW: 7, gridH: 6, color: '#065f46', labelColor: '#34d399' },
      3: { name: "Floor 3: Video QA Lab", x: 890, y: 360, gridW: 7, gridH: 6, color: '#78350f', labelColor: '#fbbf24' },
      4: { name: "Floor 4: Campus Outreach", x: 330, y: 150, gridW: 7, gridH: 6, color: '#581c87', labelColor: '#c084fc' },
      5: { name: "Floor 5: Tech Infrastructure", x: 890, y: 150, gridW: 7, gridH: 6, color: '#0f172a', labelColor: '#38bdf8' }
    };

    const toTowerScreen = (fl: number, gx: number, gy: number, gz: number = 0) => {
      const base = TOWER_FLOORS[fl] || TOWER_FLOORS[0];
      const sx = base.x + (gx - gy) * (TILE_W / 2);
      const sy = base.y + (gx + gy) * (TILE_H / 2) - gz;
      return { x: sx, y: sy };
    };

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ==========================================
      // SHARED AGENT AI MOTION UPDATE
      // ==========================================
      const simList = simRef.current;
      simList.forEach(sim => {
        const realAgent = agents.find(a => a.agent_id === sim.agent_id);
        const isRealWorking = realAgent?.status === 'working';

        if (isRealWorking) {
          if (sim.currentFloor !== sim.homeFloor) {
            if (sim.state !== 'escalator_transit') {
              sim.state = 'escalator_transit';
              sim.transitFromFloor = sim.currentFloor;
              sim.transitToFloor = sim.homeFloor;
              sim.transitProgress = 0.0;
              sim.bubbleText = "⚡ Task active! Stairs home";
              sim.bubbleTimer = 90;
            }
          } else if (Math.hypot(sim.curX - sim.deskX, sim.curY - sim.deskY) > 0.1) {
            sim.targetX = sim.deskX;
            sim.targetY = sim.deskY;
            sim.state = 'walking';
          } else {
            sim.curX = sim.deskX;
            sim.curY = sim.deskY;
            sim.state = 'working_at_desk';
            sim.facing = 'SE';
          }
        } else {
          sim.subStateTimer--;
          if (sim.subStateTimer <= 0) {
            sim.subStateTimer = Math.floor(Math.random() * 240) + 200;

            if (sim.state === 'working_at_desk') {
              const roll = Math.random();
              if (roll < 0.3) {
                sim.targetX = 1.5;
                sim.targetY = 2.5;
                sim.state = 'walking';
                sim.bubbleText = "☕ Grabbing coffee";
                sim.bubbleTimer = 90;
              } else if (roll < 0.55) {
                sim.targetX = 5.5;
                sim.targetY = 1.5;
                sim.state = 'walking';
                sim.bubbleText = "🛋️ Taking a break";
                sim.bubbleTimer = 90;
              } else if (roll < 0.75) {
                // Cross floor visit via stairs
                const destFloor = (sim.homeFloor + 1) % 6;
                sim.state = 'escalator_transit';
                sim.transitFromFloor = sim.homeFloor;
                sim.transitToFloor = destFloor;
                sim.transitProgress = 0.0;
                sim.bubbleText = `Stairs to Floor ${destFloor}`;
                sim.bubbleTimer = 140;
                setActiveActionLog(`${sim.name} taking stairs to Floor ${destFloor} for peer sync.`);
              } else {
                sim.state = 'working_at_desk';
              }
            } else if (sim.state === 'drinking_coffee' || sim.state === 'sitting_on_sofa' || sim.state === 'visiting_colleague') {
              if (sim.currentFloor !== sim.homeFloor) {
                sim.state = 'escalator_transit';
                sim.transitFromFloor = sim.currentFloor;
                sim.transitToFloor = sim.homeFloor;
                sim.transitProgress = 0.0;
                sim.bubbleText = `Stairs back to Floor ${sim.homeFloor}`;
                sim.bubbleTimer = 110;
              } else {
                sim.targetX = sim.deskX;
                sim.targetY = sim.deskY;
                sim.state = 'walking';
                sim.bubbleText = "💻 Heading back to desk";
                sim.bubbleTimer = 80;
              }
            }
          }
        }

        // Handle Staircase / Escalator Transit
        if (sim.state === 'escalator_transit' && sim.transitFromFloor !== undefined && sim.transitToFloor !== undefined) {
          sim.transitProgress = (sim.transitProgress || 0) + 0.015;
          if (sim.transitProgress >= 1.0) {
            sim.currentFloor = sim.transitToFloor;
            sim.state = sim.currentFloor === sim.homeFloor ? 'working_at_desk' : 'visiting_colleague';
            sim.curX = sim.currentFloor === sim.homeFloor ? sim.deskX : 3.5;
            sim.curY = sim.currentFloor === sim.homeFloor ? sim.deskY : 3.5;
            sim.bubbleText = sim.currentFloor === sim.homeFloor ? "Back at desk!" : `Arrived on Floor ${sim.currentFloor}!`;
            sim.bubbleTimer = 100;
            sim.subStateTimer = 220;
          }
        }

        // Handle Walking Interpolation
        if (sim.state === 'walking') {
          const dx = sim.targetX - sim.curX;
          const dy = sim.targetY - sim.curY;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.06) {
            const speed = 0.035;
            sim.curX += (dx / dist) * speed;
            sim.curY += (dy / dist) * speed;
            sim.facing = dx >= 0 ? 'SE' : 'SW';
            sim.walkCycle = (sim.walkCycle + 0.25) % 4;
          } else {
            sim.curX = sim.targetX;
            sim.curY = sim.targetY;
            sim.walkCycle = 0;

            if (Math.hypot(sim.curX - sim.deskX, sim.curY - sim.deskY) < 0.2) {
              sim.state = 'working_at_desk';
              sim.facing = 'SE';
            } else if (Math.hypot(sim.curX - 1.5, sim.curY - 2.5) < 0.5) {
              sim.state = 'drinking_coffee';
              sim.bubbleText = "☕ Mmm, fresh brew!";
              sim.bubbleTimer = 110;
            } else if (Math.hypot(sim.curX - 5.5, sim.curY - 1.5) < 0.5) {
              sim.state = 'sitting_on_sofa';
              sim.bubbleText = "🛋️ Relaxing on lounge";
              sim.bubbleTimer = 110;
            }
          }
        }

        if (sim.bubbleTimer && sim.bubbleTimer > 0) {
          sim.bubbleTimer--;
          if (sim.bubbleTimer <= 0) sim.bubbleText = undefined;
        }
      });

      // ==========================================
      // VIEW MODE RENDERING
      // ==========================================
      if (viewMode === 'multi_tower') {
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Architectural Central Spine Background
        ctx.strokeStyle = '#1e293b44';
        ctx.lineWidth = 1;
        ctx.strokeRect(600, 80, 40, 600);

        // 1. Draw Grand Architectural Connecting Staircases
        const drawGrandStairs = (fromFl: number, fromX: number, fromY: number, toFl: number, toX: number, toY: number, label: string) => {
          const pStart = toTowerScreen(fromFl, fromX, fromY);
          const pEnd = toTowerScreen(toFl, toX, toY);

          // Shadow
          ctx.strokeStyle = '#00000088';
          ctx.lineWidth = 28;
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y + 8);
          ctx.lineTo(pEnd.x, pEnd.y + 8);
          ctx.stroke();

          // Outer Beam
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 24;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();

          // Tread track
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 14;
          ctx.stroke();

          // Animated steps
          const stepCount = 14;
          for (let s = 0; s < stepCount; s++) {
            const ratio = ((s / stepCount) + (tick * 0.008)) % 1.0;
            const sx = pStart.x + (pEnd.x - pStart.x) * ratio;
            const sy = pStart.y + (pEnd.y - pStart.y) * ratio;
            ctx.fillStyle = '#713f12';
            ctx.fillRect(sx - 6, sy - 2.5, 12, 4);
          }

          // Glass Safety Railings
          ctx.strokeStyle = '#00f0ffaa';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(pStart.x - 12, pStart.y - 12);
          ctx.lineTo(pEnd.x - 12, pEnd.y - 12);
          ctx.moveTo(pStart.x + 12, pStart.y - 12);
          ctx.lineTo(pEnd.x + 12, pEnd.y - 12);
          ctx.stroke();

          // Clickable Interactive Badge
          const midX = (pStart.x + pEnd.x) / 2;
          const midY = (pStart.y + pEnd.y) / 2 - 8;
          ctx.fillStyle = '#0f172aee';
          ctx.fillRect(midX - 38, midY - 9, 76, 18);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(midX - 38, midY - 9, 76, 18);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`🪜 ${label}`, midX, midY + 3.5);
        };

        // Connect consecutive floors with grand central stairs
        drawGrandStairs(0, 5, 3, 1, 1, 3, "Stairs: F0 ➔ F1");
        drawGrandStairs(1, 2, 1, 2, 5, 4, "Stairs: F1 ➔ F2");
        drawGrandStairs(2, 5, 3, 3, 1, 3, "Stairs: F2 ➔ F3");
        drawGrandStairs(3, 2, 1, 4, 5, 4, "Stairs: F3 ➔ F4");
        drawGrandStairs(4, 5, 3, 5, 1, 3, "Stairs: F4 ➔ F5");

        // 2. Draw Floor Plates for ALL 6 FLOORS
        const floorsToDraw = [0, 1, 2, 3, 4, 5];
        floorsToDraw.forEach(fl => {
          const cfg = TOWER_FLOORS[fl];
          const isSelected = activeFloor === fl;

          // Base Foundation Shadow
          ctx.fillStyle = '#00000066';
          ctx.beginPath();
          ctx.ellipse(cfg.x, cfg.y + 70, 160, 48, 0, 0, Math.PI * 2);
          ctx.fill();

          // Departmental Floor Tiles
          for (let x = 0; x < cfg.gridW; x++) {
            for (let y = 0; y < cfg.gridH; y++) {
              const tp = toTowerScreen(fl, x, y);
              ctx.beginPath();
              ctx.moveTo(tp.x, tp.y);
              ctx.lineTo(tp.x + TILE_W / 2, tp.y + TILE_H / 2);
              ctx.lineTo(tp.x, tp.y + TILE_H);
              ctx.lineTo(tp.x - TILE_W / 2, tp.y + TILE_H / 2);
              ctx.closePath();

              const alt = (x + y) % 2 === 0;
              if (fl === 0) {
                // Executive Rich Mahogany
                ctx.fillStyle = alt ? '#78350f' : '#92400e';
              } else if (fl === 1) {
                // Media Warm Birch Planks
                ctx.fillStyle = alt ? '#d97706' : '#b45309';
              } else if (fl === 2) {
                // Marketing Emerald Ceramic Herringbone
                ctx.fillStyle = alt ? '#065f46' : '#047857';
              } else if (fl === 3) {
                // Video QA Precision Lab Slate
                ctx.fillStyle = alt ? '#1e293b' : '#334155';
              } else if (fl === 4) {
                // Documentation Scandinavian Chalk Tiles
                ctx.fillStyle = alt ? '#f1f5f9' : '#e2e8f0';
              } else {
                // Tech Cyber Anti-Static Server Grid
                ctx.fillStyle = alt ? '#090d16' : '#1e293b';
              }

              ctx.fill();
              ctx.strokeStyle = fl === 5 ? (alt ? '#0284c744' : '#00f0ff33') : (isSelected ? '#ea580c88' : '#33415533');
              ctx.lineWidth = isSelected ? 1.5 : 1;
              ctx.stroke();
            }
          }

          // Departmental Rugs & Floor Accents
          if (fl === 0) {
            // Executive Crimson & Gold Runner Rug
            const rp0 = toTowerScreen(0, 1.5, 1.5);
            const rp1 = toTowerScreen(0, 4.5, 1.5);
            const rp2 = toTowerScreen(0, 4.5, 3.5);
            const rp3 = toTowerScreen(0, 1.5, 3.5);
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.moveTo(rp0.x, rp0.y + TILE_H / 2);
            ctx.lineTo(rp1.x + TILE_W / 2, rp1.y + TILE_H / 2);
            ctx.lineTo(rp2.x, rp2.y + TILE_H);
            ctx.lineTo(rp3.x - TILE_W / 2, rp3.y + TILE_H / 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else if (fl === 1) {
            // Media Studio Cyan Accent Circle Rug
            const cPos = toTowerScreen(1, 3.5, 3.5);
            ctx.fillStyle = '#0284c799';
            ctx.beginPath();
            ctx.ellipse(cPos.x, cPos.y + 10, 36, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (fl === 2) {
            // Marketing Coral Analytics Growth Rug
            const rp0 = toTowerScreen(2, 2.0, 2.0);
            const rp1 = toTowerScreen(2, 5.0, 2.0);
            const rp2 = toTowerScreen(2, 5.0, 4.0);
            const rp3 = toTowerScreen(2, 2.0, 4.0);
            ctx.fillStyle = '#f43f5e55';
            ctx.beginPath();
            ctx.moveTo(rp0.x, rp0.y + TILE_H / 2);
            ctx.lineTo(rp1.x + TILE_W / 2, rp1.y + TILE_H / 2);
            ctx.lineTo(rp2.x, rp2.y + TILE_H);
            ctx.lineTo(rp3.x - TILE_W / 2, rp3.y + TILE_H / 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fb7185';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (fl === 3) {
            // Video QA Precision Amber Target Mat
            const cPos = toTowerScreen(3, 3.5, 3.5);
            ctx.fillStyle = '#f59e0b55';
            ctx.beginPath();
            ctx.ellipse(cPos.x, cPos.y + 10, 36, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (fl === 4) {
            // Documentation Lavender Study Rug
            const rp0 = toTowerScreen(4, 2.0, 2.0);
            const rp1 = toTowerScreen(4, 5.0, 2.0);
            const rp2 = toTowerScreen(4, 5.0, 4.0);
            const rp3 = toTowerScreen(4, 2.0, 4.0);
            ctx.fillStyle = '#7c3aed66';
            ctx.beginPath();
            ctx.moveTo(rp0.x, rp0.y + TILE_H / 2);
            ctx.lineTo(rp1.x + TILE_W / 2, rp1.y + TILE_H / 2);
            ctx.lineTo(rp2.x, rp2.y + TILE_H);
            ctx.lineTo(rp3.x - TILE_W / 2, rp3.y + TILE_H / 2);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (fl === 5) {
            // Tech Glowing Cyan Circuit Seams
            const pC = toTowerScreen(5, 3.5, 3.5);
            ctx.strokeStyle = '#00f0ffaa';
            ctx.lineWidth = 2;
            ctx.strokeRect(pC.x - 30, pC.y - 10, 60, 20);
          }

          // Departmental Lounge Props
          const sofaPos = toTowerScreen(fl, 5.5, 1.5);
          ctx.fillStyle = fl === 0 ? '#1e293b' : fl === 1 ? '#0284c7' : fl === 2 ? '#047857' : fl === 3 ? '#b45309' : fl === 4 ? '#7c3aed' : '#334155';
          ctx.fillRect(sofaPos.x - 14, sofaPos.y - 12, 28, 12);

          const coffeePos = toTowerScreen(fl, 1.5, 2.5);
          ctx.fillStyle = '#475569';
          ctx.fillRect(coffeePos.x - 9, coffeePos.y - 12, 18, 12);

          // Workstations for this floor
          ALL_PERSONNEL_DESKS.filter(d => d.floor === fl).forEach(desk => {
            const dp = toTowerScreen(fl, desk.x, desk.y);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(dp.x - 14, dp.y - 10, 28, 10);
            ctx.fillStyle = desk.chairColor;
            ctx.fillRect(dp.x - 6, dp.y - 4, 12, 4);

            // Glowing Monitor
            ctx.fillStyle = fl === 5 ? '#00f0ff' : fl === 3 ? '#f59e0b' : '#38bdf8';
            ctx.fillRect(dp.x - 6, dp.y - 18, 12, 8);
          });

          // Floating Floor Badge & Title
          const headerP = toTowerScreen(fl, cfg.gridW / 2, 0);
          ctx.fillStyle = isSelected ? '#ea580c' : '#0f172aee';
          ctx.beginPath();
          ctx.roundRect(headerP.x - 84, headerP.y - 28, 168, 22, 6);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#fed7aa' : cfg.labelColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.font = 'bold 9.5px monospace';
          ctx.fillStyle = isSelected ? '#ffffff' : cfg.labelColor;
          ctx.textAlign = 'center';
          ctx.fillText(cfg.name, headerP.x, headerP.y - 14);
        });

        // 3. Draw Characters across all floors in Multi-Tower View
        simList.forEach(sim => {
          let charPos = { x: 0, y: 0 };

          if (sim.state === 'escalator_transit' && sim.transitFromFloor !== undefined && sim.transitToFloor !== undefined) {
            const pFrom = toTowerScreen(sim.transitFromFloor, 3, 3);
            const pTo = toTowerScreen(sim.transitToFloor, 3, 3);
            const p = sim.transitProgress || 0;
            charPos = {
              x: pFrom.x + (pTo.x - pFrom.x) * p,
              y: pFrom.y + (pTo.y - pFrom.y) * p - Math.sin(p * Math.PI) * 16
            };
          } else {
            charPos = toTowerScreen(sim.currentFloor, sim.curX, sim.curY);
          }

          const isWorking = sim.state === 'working_at_desk';
          const isWalking = sim.state === 'walking';
          const bounceY = isWalking ? Math.sin(sim.walkCycle * Math.PI) * 2.5 : 0;
          const yOffset = (isWorking ? -10 : -14) + bounceY;

          // Shadow
          ctx.fillStyle = '#00000066';
          ctx.beginPath();
          ctx.ellipse(charPos.x, charPos.y, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          if (sim.isAuri) {
            const auriImg = getImage(`/assets/sprites/orbi/orbi_${isWorking ? 'working' : (orbiState || 'idle')}.gif`);
            if (auriImg.complete && auriImg.naturalWidth > 0) {
              ctx.drawImage(auriImg, charPos.x - 14, charPos.y + yOffset - 10, 28, 28);
            } else {
              ctx.fillStyle = '#ff6600';
              ctx.fillRect(charPos.x - 7, charPos.y + yOffset - 7, 14, 14);
            }
          } else {
            const spriteImg = getImage(`/assets/sprites/agents/${sim.avatar_file}`);
            if (spriteImg.complete && spriteImg.naturalWidth > 0) {
              ctx.drawImage(spriteImg, charPos.x - 12, charPos.y + yOffset - 12, 24, 24);
            } else {
              ctx.fillStyle = '#0284c7';
              ctx.fillRect(charPos.x - 6, charPos.y + yOffset - 10, 12, 12);
            }
          }

          // Mini Name Tag
          ctx.fillStyle = '#0f172aee';
          ctx.fillRect(charPos.x - 24, charPos.y + 4, 48, 13);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(charPos.x - 24, charPos.y + 4, 48, 13);
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(sim.name, charPos.x, charPos.y + 13);

          if (sim.bubbleText) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            const bWidth = Math.max(sim.bubbleText.length * 6 + 18, 54);
            const bx = charPos.x - bWidth / 2;
            const by = charPos.y + yOffset - 32;

            ctx.beginPath();
            ctx.roundRect(bx, by, bWidth, 20, 6);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 9px sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.fillText(sim.bubbleText, charPos.x, by + 13);
          }
        });

      } else {
        // ==========================================
        // VIEW MODE: SINGLE FLOOR FOCUS (All 6 Floors Decorated with Real Stairs)
        // ==========================================
        const originX = canvas.width / 2;
        const originY = 110;

        const toScreen = (gx: number, gy: number, gz: number = 0) => {
          const sx = originX + (gx - gy) * (TILE_W / 2);
          const sy = originY + (gx + gy) * (TILE_H / 2) - gz;
          return { x: sx, y: sy };
        };

        // 1. LEFT WALL WITH DEPARTMENTAL PALETTES
        const lp0 = toScreen(0, 0, 170);
        const lp1 = toScreen(0, FOCUS_GRID, 170);
        const lp2 = toScreen(0, FOCUS_GRID, 0);
        const lp3 = toScreen(0, 0, 0);

        ctx.beginPath();
        ctx.moveTo(lp0.x, lp0.y);
        ctx.lineTo(lp1.x, lp1.y);
        ctx.lineTo(lp2.x, lp2.y);
        ctx.lineTo(lp3.x, lp3.y);
        ctx.closePath();

        if (activeFloor === 0) {
          ctx.fillStyle = '#0f172a';
        } else if (activeFloor === 1) {
          ctx.fillStyle = '#ea580c';
        } else if (activeFloor === 2) {
          ctx.fillStyle = '#0f766e';
        } else if (activeFloor === 3) {
          ctx.fillStyle = '#1e293b';
        } else if (activeFloor === 4) {
          ctx.fillStyle = '#f1f5f9';
        } else {
          ctx.fillStyle = '#090d16';
        }
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. RIGHT WALL
        const rp0 = toScreen(0, 0, 170);
        const rp1 = toScreen(FOCUS_GRID, 0, 170);
        const rp2 = toScreen(FOCUS_GRID, 0, 0);
        const rp3 = toScreen(0, 0, 0);

        ctx.beginPath();
        ctx.moveTo(rp0.x, rp0.y);
        ctx.lineTo(rp1.x, rp1.y);
        ctx.lineTo(rp2.x, rp2.y);
        ctx.lineTo(rp3.x, rp3.y);
        ctx.closePath();

        if (activeFloor === 0) {
          ctx.fillStyle = '#1e293b';
        } else if (activeFloor === 1) {
          ctx.fillStyle = '#c2410c';
        } else if (activeFloor === 2) {
          ctx.fillStyle = '#115e59';
        } else if (activeFloor === 3) {
          ctx.fillStyle = '#0f172a';
        } else if (activeFloor === 4) {
          ctx.fillStyle = '#f8fafc';
        } else {
          ctx.fillStyle = '#0f172a';
        }
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Wall Displays based on Floor
        if (activeFloor === 2) {
          // Marketing Campaign Funnel & Growth Metrics Display
          const mktP = toScreen(7.0, 0, 85);
          ctx.fillStyle = '#022c22';
          ctx.fillRect(mktP.x - 48, mktP.y - 25, 96, 50);
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.strokeRect(mktP.x - 48, mktP.y - 25, 96, 50);

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 7px monospace';
          ctx.fillText("GROWTH FUNNEL: +24.8% CTR", mktP.x, mktP.y - 14);

          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(mktP.x - 40, mktP.y + 4, 20, 12);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(mktP.x - 15, mktP.y - 2, 20, 18);
          ctx.fillStyle = '#10b981';
          ctx.fillRect(mktP.x + 10, mktP.y - 8, 20, 24);
        } else if (activeFloor === 3) {
          // Video QA Defect & Spectrum Hologram Monitor
          const qaP = toScreen(7.0, 0, 85);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(qaP.x - 48, qaP.y - 25, 96, 50);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(qaP.x - 48, qaP.y - 25, 96, 50);

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 7px monospace';
          ctx.fillText("NEMOTRON QA: 0 DEFECTS", qaP.x, qaP.y - 14);

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(qaP.x - 40, qaP.y + 8);
          for (let i = 0; i < 8; i++) {
            const h = ((tick + i * 2) % 6 < 3 ? 14 : 4);
            ctx.lineTo(qaP.x - 40 + i * 10, qaP.y + 8 - h);
          }
          ctx.stroke();
        } else if (activeFloor === 4) {
          // Sprint Kanban Whiteboard
          const wbP = toScreen(7.0, 0, 85);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(wbP.x - 45, wbP.y - 25, 90, 50);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.strokeRect(wbP.x - 45, wbP.y - 25, 90, 50);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 6.5px monospace';
          ctx.fillText("SPRINT KANBAN BOARD", wbP.x, wbP.y - 15);
          ctx.fillStyle = '#fde047'; ctx.fillRect(wbP.x - 38, wbP.y - 8, 8, 8);
          ctx.fillStyle = '#4ade80'; ctx.fillRect(wbP.x + 22, wbP.y - 4, 8, 8);
        } else if (activeFloor === 5) {
          // NOC Real-Time Monitoring Wall
          const nocP = toScreen(7.0, 0, 85);
          ctx.fillStyle = '#060a12';
          ctx.fillRect(nocP.x - 48, nocP.y - 25, 96, 50);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(nocP.x - 48, nocP.y - 25, 96, 50);
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 7px monospace';
          ctx.fillText("NOC CLOUD TELEMETRY: 99.99%", nocP.x, nocP.y - 14);
        }

        // 3. FLOOR TILES WITH DISTINCT DEPARTMENT COLOR PALETTES
        for (let gx = 0; gx < FOCUS_GRID; gx++) {
          for (let gy = 0; gy < FOCUS_GRID; gy++) {
            const tp = toScreen(gx, gy);
            ctx.beginPath();
            ctx.moveTo(tp.x, tp.y);
            ctx.lineTo(tp.x + TILE_W / 2, tp.y + TILE_H / 2);
            ctx.lineTo(tp.x, tp.y + TILE_H);
            ctx.lineTo(tp.x - TILE_W / 2, tp.y + TILE_H / 2);
            ctx.closePath();

            const alt = (gx + gy) % 2 === 0;
            if (activeFloor === 0) {
              ctx.fillStyle = alt ? '#78350f' : '#92400e';
            } else if (activeFloor === 1) {
              ctx.fillStyle = alt ? '#d97706' : '#b45309';
            } else if (activeFloor === 2) {
              ctx.fillStyle = alt ? '#065f46' : '#047857';
            } else if (activeFloor === 3) {
              ctx.fillStyle = alt ? '#1e293b' : '#334155';
            } else if (activeFloor === 4) {
              ctx.fillStyle = alt ? '#f1f5f9' : '#e2e8f0';
            } else {
              ctx.fillStyle = alt ? '#090d16' : '#1e293b';
            }

            ctx.fill();
            ctx.strokeStyle = activeFloor === 5 
              ? (alt ? '#0284c733' : '#00f0ff22') 
              : (activeFloor === 4 ? '#cbd5e1' : '#451a0333');
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 4. INTERACTIVE CAMPUS STAIRCASE ON THE FLOOR
        const stairP = toScreen(FOCUS_GRID - 2.5, 1.5);

        // Stairwell floor base
        ctx.fillStyle = '#020617';
        ctx.fillRect(stairP.x - 50, stairP.y - 20, 100, 42);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(stairP.x - 50, stairP.y - 20, 100, 42);

        // Animated step treads
        for (let st = 0; st < 6; st++) {
          ctx.fillStyle = st % 2 === 0 ? '#713f12' : '#ca8a04';
          ctx.fillRect(stairP.x - 42 + st * 14, stairP.y - 12 + st * 4, 12, 6);
        }

        // Handrail with glowing gold
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(stairP.x - 45, stairP.y - 14);
        ctx.lineTo(stairP.x + 45, stairP.y + 12);
        ctx.stroke();

        // Directional Action Badges on Stairwell
        if (activeFloor < 5) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(stairP.x - 46, stairP.y - 36, 92, 14);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`▲ STAIRS UP: FLOOR ${activeFloor + 1}`, stairP.x, stairP.y - 26);
        }

        if (activeFloor > 0) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(stairP.x - 46, stairP.y + 24, 92, 14);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`▼ STAIRS DOWN: FLOOR ${activeFloor - 1}`, stairP.x, stairP.y + 34);
        }

        // 5. DEPARTMENTAL RUGS & FURNITURE
        const sofaPos = toScreen(5.5, 1.5);
        ctx.fillStyle = activeFloor === 0 ? '#1e293b' : activeFloor === 1 ? '#0284c7' : activeFloor === 2 ? '#047857' : activeFloor === 3 ? '#b45309' : activeFloor === 4 ? '#7c3aed' : '#334155';
        ctx.fillRect(sofaPos.x - 28, sofaPos.y - 20, 56, 26);

        const cofPos = toScreen(1.5, 2.5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(cofPos.x - 18, cofPos.y - 26, 36, 26);

        // 6. DEPARTMENTAL WORKSTATIONS
        ALL_PERSONNEL_DESKS.filter(d => d.floor === activeFloor).forEach(desk => {
          const pos = toScreen(desk.x, desk.y);

          ctx.fillStyle = activeFloor === 0 ? '#78350f' : activeFloor === 1 ? '#b45309' : activeFloor === 2 ? '#065f46' : activeFloor === 3 ? '#1e293b' : activeFloor === 4 ? '#e2e8f0' : '#1e293b';
          ctx.fillRect(pos.x - 28, pos.y - 22, 56, 22);
          ctx.fillStyle = activeFloor === 0 ? '#92400e' : activeFloor === 1 ? '#d97706' : activeFloor === 2 ? '#047857' : activeFloor === 3 ? '#334155' : activeFloor === 4 ? '#f8fafc' : '#334155';
          ctx.fillRect(pos.x - 28, pos.y - 26, 56, 5);

          // Monitor
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pos.x - 14, pos.y - 48, 28, 22);

          ctx.fillStyle = activeFloor === 1 ? '#06b6d4' : activeFloor === 2 ? '#10b981' : activeFloor === 3 ? '#f59e0b' : '#38bdf8';
          ctx.fillRect(pos.x - 12, pos.y - 46, 24, 18);

          ctx.fillStyle = desk.chairColor;
          ctx.fillRect(pos.x - 10, pos.y - 10, 20, 6);
        });

        // 7. CHARACTERS ON THIS FLOOR
        const floorSims = simList.filter(s => s.currentFloor === activeFloor);
        floorSims.forEach(sim => {
          const pos = toScreen(sim.curX, sim.curY);
          const isWorking = sim.state === 'working_at_desk';
          const isWalking = sim.state === 'walking';
          const bounceY = isWalking ? Math.sin(sim.walkCycle * Math.PI) * 3 : 0;
          const yOffset = (isWorking ? -20 : -26) + bounceY;

          ctx.fillStyle = '#00000044';
          ctx.beginPath();
          ctx.ellipse(pos.x, pos.y, 14, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          if (sim.isAuri) {
            const auriImg = getImage(`/assets/sprites/orbi/orbi_${isWorking ? 'working' : (orbiState || 'idle')}.gif`);
            if (auriImg.complete && auriImg.naturalWidth > 0) {
              ctx.drawImage(auriImg, pos.x - 24, pos.y + yOffset - 18, 48, 48);
            } else {
              ctx.fillStyle = '#ff6600';
              ctx.fillRect(pos.x - 14, pos.y + yOffset - 14, 28, 28);
            }
          } else {
            const spriteImg = getImage(`/assets/sprites/agents/${sim.avatar_file}`);
            if (spriteImg.complete && spriteImg.naturalWidth > 0) {
              ctx.drawImage(spriteImg, pos.x - 20, pos.y + yOffset - 20, 40, 40);
            } else {
              ctx.fillStyle = '#0284c7';
              ctx.fillRect(pos.x - 12, pos.y + yOffset - 18, 24, 24);
            }
          }

          // Name Tag
          ctx.fillStyle = '#0f172aee';
          ctx.fillRect(pos.x - 28, pos.y + 6, 56, 15);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(pos.x - 28, pos.y + 6, 56, 15);
          ctx.font = 'bold 8.5px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(sim.name, pos.x, pos.y + 17);

          if (sim.bubbleText) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            const bWidth = Math.max(sim.bubbleText.length * 6.5 + 20, 60);
            const bx = pos.x - bWidth / 2;
            const by = pos.y + yOffset - 36;

            ctx.beginPath();
            ctx.roundRect(bx, by, bWidth, 22, 6);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 9.5px sans-serif';
            ctx.fillStyle = '#0f172a';
            ctx.fillText(sim.bubbleText, pos.x, by + 14);
          }
        });
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [viewMode, activeFloor, agents, orbiState]);

  // Click on Canvas: Interactive Stairs & Floor Selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;

    if (viewMode === 'multi_tower') {
      // 1. Check if clicked near any of the 5 Grand Central Staircases
      const stairConnectors = [
        { from: 0, to: 1, x: 610, y: 570, label: "Ground Promenade Stairs (Floor 0 ➔ Floor 1)" },
        { from: 1, to: 2, x: 610, y: 465, label: "Ascending Atrium Stairs (Floor 1 ➔ Floor 2)" },
        { from: 2, to: 3, x: 610, y: 360, label: "Mid Skybridge Stairs (Floor 2 ➔ Floor 3)" },
        { from: 3, to: 4, x: 610, y: 255, label: "Upper Escalator Stairs (Floor 3 ➔ Floor 4)" },
        { from: 4, to: 5, x: 610, y: 150, label: "Penthouse Skybridge Stairs (Floor 4 ➔ Floor 5)" }
      ];

      for (const st of stairConnectors) {
        if (Math.hypot(cx - st.x, cy - st.y) < 45) {
          const target = activeFloor === st.from ? st.to : st.from;
          handleUseStairs(target);
          return;
        }
      }

      // 2. Check if clicked directly on any of the 6 Floor Plates
      const TOWER_FLOORS: Record<number, { x: number; y: number }> = {
        0: { x: 330, y: 570 },
        1: { x: 890, y: 570 },
        2: { x: 330, y: 360 },
        3: { x: 890, y: 360 },
        4: { x: 330, y: 150 },
        5: { x: 890, y: 150 }
      };

      for (const [fStr, coords] of Object.entries(TOWER_FLOORS)) {
        const fl = parseInt(fStr, 10);
        if (Math.hypot(cx - coords.x, cy - coords.y) < 110) {
          setActiveFloor(fl);
          setActiveActionLog(`Selected Floor ${fl}: ${FLOOR_CONFIG.find(f => f.floor === fl)?.name}`);
          return;
        }
      }
    } else {
      // In Floor Focus View: Check if clicked on Floor Stairwell Landing
      const originX = canvas.width / 2;
      const originY = 110;
      const stairSx = originX + ((FOCUS_GRID - 2.5) - 1.5) * (TILE_W / 2);
      const stairSy = originY + ((FOCUS_GRID - 2.5) + 1.5) * (TILE_H / 2);

      // Stairs Up Hitbox (upper badge)
      if (activeFloor < 5 && Math.hypot(cx - stairSx, cy - (stairSy - 30)) < 35) {
        handleUseStairs(activeFloor + 1);
        return;
      }
      // Stairs Down Hitbox (lower badge)
      if (activeFloor > 0 && Math.hypot(cx - stairSx, cy - (stairSy + 30)) < 35) {
        handleUseStairs(activeFloor - 1);
        return;
      }
    }

    // Inspect character if clicked near any agent
    for (const sim of simRef.current) {
      if (sim.currentFloor === activeFloor || viewMode === 'multi_tower') {
        const fullAgent = agents.find(a => a.agent_id === sim.agent_id);
        if (fullAgent) {
          onSelectAgent(fullAgent);
          setActiveActionLog(`Inspecting Dossier: ${fullAgent.name} (${fullAgent.role})`);
          return;
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0f17] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-orange-600/20 border border-orange-500/40 rounded-xl text-orange-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-sm text-white tracking-wider">
                {viewMode === 'multi_tower' ? 'Multi-Tier Campus Tower (All 6 Connected Floors)' : FLOOR_CONFIG.find(f => f.floor === activeFloor)?.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {viewMode === 'multi_tower' ? '6-FLOOR ATRIUM' : FLOOR_CONFIG.find(f => f.floor === activeFloor)?.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === 'multi_tower' 
                ? 'Ground Foundation (F0/F1) ➔ Mid Wings (F2/F3) ➔ Cloud Penthouse (F4/F5) connected by central stairs.' 
                : FLOOR_CONFIG.find(f => f.floor === activeFloor)?.subtitle
              }
            </p>
          </div>
        </div>

        {/* View Mode & Simulation Controls */}
        <div className="flex items-center space-x-3">
          {/* Direct Interactive Staircase Navigation */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleUseStairs(activeFloor - 1)}
              disabled={activeFloor <= 0}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-amber-300 hover:bg-amber-500/20"
              title={activeFloor > 0 ? `Take stairs down to Floor ${activeFloor - 1}` : "Already on ground floor"}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Stairs Down</span>
            </button>

            <span className="text-[10px] text-slate-500 font-mono">|</span>

            <button
              onClick={() => handleUseStairs(activeFloor + 1)}
              disabled={activeFloor >= 5}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-emerald-300 hover:bg-emerald-500/20"
              title={activeFloor < 5 ? `Take stairs up to Floor ${activeFloor + 1}` : "Already on top floor"}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Stairs Up</span>
            </button>
          </div>

          {/* Quick Simulation Commands */}
          <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handleTriggerTeamBreak}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-500/20 flex items-center space-x-1.5 transition-colors"
              title="Send agents to coffee & sofa lounge"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Coffee Break</span>
            </button>
            <button
              onClick={handleSummonToDesks}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 flex items-center space-x-1.5 transition-colors"
              title="Call all agents back to workstations"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Back to Work</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('multi_tower')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'multi_tower'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Floor Tower</span>
            </button>
            <button
              onClick={() => setViewMode('floor_focus')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'floor_focus'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Floor Focus</span>
            </button>
          </div>

          {/* Floor Selector (All 6 Floors) */}
          {viewMode === 'floor_focus' && (
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {FLOOR_CONFIG.map((f) => (
                <button
                  key={f.floor}
                  onClick={() => setActiveFloor(f.floor)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeFloor === f.floor
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  F{f.floor}
                </button>
              ))}
            </div>
          )}

          {/* Comms Center Button */}
          {onOpenComms && (
            <button
              onClick={onOpenComms}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center space-x-2 transition-all shadow-md shadow-cyan-600/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Workforce Comms</span>
              {recentMessages.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>
          )}

          {/* Zoom */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom(z => Math.max(0.7, z - 0.15))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 font-bold text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(1.8, z + 0.15))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Isometric Canvas Viewport */}
      <div className="relative flex-1 bg-[#090d14] overflow-auto flex items-center justify-center p-6">
        <div
          className="relative transition-transform duration-150 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <canvas
            ref={canvasRef}
            width={1240}
            height={740}
            onClick={handleCanvasClick}
            className="rounded-2xl border-4 border-slate-800/90 shadow-2xl bg-[#080c16] cursor-pointer"
          />

          {/* Live Action Ticker at bottom */}
          <div className="absolute bottom-5 left-6 bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-4 text-[11px] font-mono text-slate-400 pointer-events-none backdrop-blur-sm">
            <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>HQ MOBILITY FEED:</span>
            </span>
            <span className="text-slate-200">{activeActionLog}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">Click any stairs or floor to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
