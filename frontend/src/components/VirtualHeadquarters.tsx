import React, { useState, useEffect, useRef } from 'react';
import { Agent, AgentMessage, AgentTransitEvent } from '../types';
import { 
  Building2, ZoomIn, ZoomOut, Maximize2, Coffee, Laptop, 
  Sparkles, Layers, MessageSquare 
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

const FLOOR_CONFIG = [
  { floor: 0, name: "Floor 0: Executive Suite", subtitle: "Arjun's CEO Suite, Marcus Vance (COO) & AURI", theme: "executive", badge: "EXECUTIVE" },
  { floor: 1, name: "Floor 1: Media & Creative Studio", subtitle: "Darshan, Shrinithi, Vaishnavi & Shreyank", theme: "creative", badge: "MEDIA PRODUCTION" },
  { floor: 4, name: "Floor 4: Documentation & Campus Hub", subtitle: "Iffah, Jiya & Srijana (Campus Outreach & Compliance)", theme: "admin", badge: "OUTREACH & DOCS" },
  { floor: 5, name: "Floor 5: Technology & Infrastructure", subtitle: "Pratham, Mallika, Vaibhav & Faazil (Systems & DB)", theme: "tech", badge: "TECH & CLOUD" }
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
  const [activeActionLog, setActiveActionLog] = useState<string>("Autonomous corporate workforce operational.");

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

  // Home desk coordinates for all personnel across floors
  const ALL_PERSONNEL_DESKS = [
    // Floor 0 - Executive
    { agent_id: 'arjun_ceo', name: 'Arjun', role: 'Founder & CEO', floor: 0, x: 2, y: 3, chairColor: '#ea580c', isAuri: false },
    { agent_id: 'auri_ceo_interface', name: 'AURI', role: 'Mascot & CEO Interface', floor: 0, x: 4, y: 3, chairColor: '#0284c7', isAuri: true },
    { agent_id: 'coo_01', name: 'Marcus Vance', role: 'COO', floor: 0, x: 5, y: 4, chairColor: '#475569', isAuri: false },
    // Floor 1 - Media Studio
    { agent_id: 'darshan_director', name: 'Darshan', role: 'Video Director', floor: 1, x: 2, y: 4, chairColor: '#ea580c', isAuri: false },
    { agent_id: 'shrinithi_script', name: 'Shrinithi', role: 'Scriptwriter', floor: 1, x: 4, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'vaishnavi_design', name: 'Vaishnavi', role: 'Thumbnail Designer', floor: 1, x: 6, y: 4, chairColor: '#dc2626', isAuri: false },
    { agent_id: 'shreyank_editor', name: 'Shreyank', role: 'Motion Graphics', floor: 1, x: 5, y: 6, chairColor: '#10b981', isAuri: false },
    // Floor 4 - Documentation & Campus Hub
    { agent_id: 'iffah_doc', name: 'Iffah', role: 'Campus Outreach Lead', floor: 4, x: 2, y: 4, chairColor: '#9333ea', isAuri: false },
    { agent_id: 'jiya_research', name: 'Jiya', role: 'Technical Docs', floor: 4, x: 4, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'srijana_quality', name: 'Srijana', role: 'Quality Inspector', floor: 4, x: 6, y: 4, chairColor: '#10b981', isAuri: false },
    // Floor 5 - Technology & Infrastructure
    { agent_id: 'pratham_cto', name: 'Pratham', role: 'CTO & Tech Lead', floor: 5, x: 2, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'mallika_tech', name: 'Mallika', role: 'API & DB Lead', floor: 5, x: 4, y: 4, chairColor: '#10b981', isAuri: false },
    { agent_id: 'vaibhav_devops', name: 'Vaibhav', role: 'DevOps & Security', floor: 5, x: 6, y: 4, chairColor: '#f59e0b', isAuri: false },
    { agent_id: 'faazil_sysadmin', name: 'Faazil', role: 'SysAdmin & Storage', floor: 5, x: 5, y: 6, chairColor: '#6366f1', isAuri: false }
  ];

  // Persistent Initialization & Smooth Task Assignment Updates
  useEffect(() => {
    if (simRef.current.length === 0) {
      // First-time mount initialization
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
      // Smoothly update real status WITHOUT resetting agent positions
      simRef.current.forEach(sim => {
        const real = agents.find(a => a.agent_id === sim.agent_id);
        if (real?.avatar_file) sim.avatar_file = real.avatar_file;

        if (real?.status === 'working') {
          // If work is assigned midway during a walk or break, smoothly return to desk naturally!
          if (sim.currentFloor !== sim.homeFloor) {
            if (sim.state !== 'escalator_transit') {
              sim.state = 'escalator_transit';
              sim.transitFromFloor = sim.currentFloor;
              sim.transitToFloor = sim.homeFloor;
              sim.transitProgress = 0.0;
              sim.bubbleText = "⚡ Work assigned! Escalator to desk";
              sim.bubbleTimer = 110;
              sim.bubbleEmoji = "🔥";
            }
          } else if (Math.hypot(sim.curX - sim.deskX, sim.curY - sim.deskY) > 0.1) {
            // Smoothly walk back to desk
            sim.targetX = sim.deskX;
            sim.targetY = sim.deskY;
            sim.state = 'walking';
            sim.bubbleText = "⚡ Work assigned! Heading back to desk";
            sim.bubbleTimer = 90;
            sim.bubbleEmoji = "🔥";
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
      sim.bubbleText = `Escalator to Floor ${pendingTransit.to_floor}!`;
      sim.bubbleEmoji = "🚶";
      sim.bubbleTimer = 160;
      setActiveActionLog(`${sim.name} taking escalator: Floor ${pendingTransit.from_floor} ➔ Floor ${pendingTransit.to_floor} (${pendingTransit.purpose})`);
    }
  }, [pendingTransit]);

  // Handle incoming message bubbles
  useEffect(() => {
    if (recentMessages.length > 0) {
      const latest = recentMessages[recentMessages.length - 1];
      const senderSim = simRef.current.find(s => s.agent_id === latest.sender_id);
      if (senderSim) {
        senderSim.bubbleText = latest.content.length > 28 ? latest.content.substring(0, 26) + "..." : latest.content;
        senderSim.bubbleTimer = 120;
        senderSim.bubbleEmoji = "💬";
      }
    }
  }, [recentMessages]);

  // Trigger company-wide break
  const handleTriggerTeamBreak = () => {
    simRef.current.forEach((sim, idx) => {
      if (sim.state !== 'escalator_transit') {
        const breakSpotX = idx % 2 === 0 ? 1.5 : 5.5;
        const breakSpotY = idx % 2 === 0 ? 2.5 : 1.5;
        sim.targetX = breakSpotX;
        sim.targetY = breakSpotY;
        sim.state = 'walking';
        sim.bubbleText = idx % 2 === 0 ? "☕ Coffee break!" : "🛋️ Sofa break!";
        sim.bubbleTimer = 120;
      }
    });
    setActiveActionLog("☕ Team break called! All agents heading to lounge areas.");
  };

  const handleSummonToDesks = () => {
    simRef.current.forEach(sim => {
      if (sim.state !== 'escalator_transit') {
        sim.targetX = sim.deskX;
        sim.targetY = sim.deskY;
        sim.state = 'walking';
        sim.bubbleText = "💻 Heading back to desk!";
        sim.bubbleTimer = 100;
      }
    });
    setActiveActionLog("💻 All employees returning to workstations.");
  };

  // Main Canvas Render & AI Update Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    // Floor Center Anchors in Multi-Tier Tower View
    const TOWER_FLOORS = {
      0: { name: "Floor 0: Executive Suite", x: 420, y: 130, gridW: 6, gridH: 6, color: '#1e293b', labelColor: '#f97316' },
      1: { name: "Floor 1: Media Studio", x: 860, y: 240, gridW: 8, gridH: 7, color: '#b91c1c', labelColor: '#38bdf8' },
      4: { name: "Floor 4: Campus Outreach", x: 360, y: 460, gridW: 8, gridH: 7, color: '#7c3aed', labelColor: '#c084fc' },
      5: { name: "Floor 5: Tech Infrastructure", x: 820, y: 550, gridW: 8, gridH: 7, color: '#0f172a', labelColor: '#34d399' }
    };

    const toTowerScreen = (fl: 0 | 1 | 4 | 5, gx: number, gy: number, gz: number = 0) => {
      const base = TOWER_FLOORS[fl];
      const sx = base.x + (gx - gy) * (TILE_W / 2);
      const sy = base.y + (gx + gy) * (TILE_H / 2) - gz;
      return { x: sx, y: sy };
    };

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ==========================================
      // SHARED AGENT AI MOTION UPDATE (Runs every frame without position resets)
      // ==========================================
      const simList = simRef.current;
      simList.forEach(sim => {
        const realAgent = agents.find(a => a.agent_id === sim.agent_id);
        const isRealWorking = realAgent?.status === 'working';

        // 1. If assigned real work
        if (isRealWorking) {
          if (sim.currentFloor !== sim.homeFloor) {
            // Must return home via escalator
            if (sim.state !== 'escalator_transit') {
              sim.state = 'escalator_transit';
              sim.transitFromFloor = sim.currentFloor;
              sim.transitToFloor = sim.homeFloor;
              sim.transitProgress = 0.0;
              sim.bubbleText = "⚡ Task active! Escalator home";
              sim.bubbleTimer = 90;
            }
          } else if (Math.hypot(sim.curX - sim.deskX, sim.curY - sim.deskY) > 0.1) {
            // Walk smoothly back to desk
            sim.targetX = sim.deskX;
            sim.targetY = sim.deskY;
            sim.state = 'walking';
          } else {
            // At desk working
            sim.curX = sim.deskX;
            sim.curY = sim.deskY;
            sim.state = 'working_at_desk';
            sim.facing = 'SE';
          }
        } else {
          // 2. Idle autonomous life behaviors with NATURAL timing (no sudden resets)
          sim.subStateTimer--;
          if (sim.subStateTimer <= 0) {
            sim.subStateTimer = Math.floor(Math.random() * 240) + 200; // 7 to 14 seconds between decisions

            if (sim.state === 'working_at_desk') {
              const roll = Math.random();
              if (roll < 0.3) {
                // Walk to coffee counter
                sim.targetX = 1.5;
                sim.targetY = 2.5;
                sim.state = 'walking';
                sim.bubbleText = "☕ Grabbing coffee";
                sim.bubbleTimer = 90;
              } else if (roll < 0.55) {
                // Walk to sofa lounge
                sim.targetX = 5.5;
                sim.targetY = 1.5;
                sim.state = 'walking';
                sim.bubbleText = "🛋️ Taking a break";
                sim.bubbleTimer = 90;
              } else if (roll < 0.75) {
                // Visit another floor via escalator
                let destFloor: number = sim.homeFloor;
                if (sim.homeFloor === 0) destFloor = 1;
                else if (sim.homeFloor === 1) destFloor = 4;
                else if (sim.homeFloor === 4) destFloor = 1;
                else destFloor = 0;

                sim.state = 'escalator_transit';
                sim.transitFromFloor = sim.homeFloor;
                sim.transitToFloor = destFloor;
                sim.transitProgress = 0.0;
                sim.bubbleText = `Visiting Floor ${destFloor}`;
                sim.bubbleTimer = 140;
                setActiveActionLog(`${sim.name} taking escalator to Floor ${destFloor} for peer sync.`);
              } else {
                // Stay and work
                sim.state = 'working_at_desk';
              }
            } else if (sim.state === 'drinking_coffee' || sim.state === 'sitting_on_sofa' || sim.state === 'visiting_colleague') {
              // Return naturally to workstation
              if (sim.currentFloor !== sim.homeFloor) {
                sim.state = 'escalator_transit';
                sim.transitFromFloor = sim.currentFloor;
                sim.transitToFloor = sim.homeFloor;
                sim.transitProgress = 0.0;
                sim.bubbleText = `Returning to Floor ${sim.homeFloor}`;
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

        // Handle Escalator Transit Movement
        if (sim.state === 'escalator_transit' && sim.transitFromFloor !== undefined && sim.transitToFloor !== undefined) {
          sim.transitProgress = (sim.transitProgress || 0) + 0.012;
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

        // Handle Normal Walking Interpolation
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
            // Arrived naturally at destination
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

        // 1. Draw Escalators
        const drawEscalator = (fromFl: 0 | 1 | 4 | 5, fromX: number, fromY: number, toFl: 0 | 1 | 4 | 5, toX: number, toY: number, label: string) => {
          const pStart = toTowerScreen(fromFl, fromX, fromY);
          const pEnd = toTowerScreen(toFl, toX, toY);

          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 26;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pStart.x, pStart.y);
          ctx.lineTo(pEnd.x, pEnd.y);
          ctx.stroke();

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
            ctx.fillRect(sx - 5, sy - 2, 10, 3);
          }

          // Handrails
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(pStart.x - 12, pStart.y - 12);
          ctx.lineTo(pEnd.x - 12, pEnd.y - 12);
          ctx.moveTo(pStart.x + 12, pStart.y - 12);
          ctx.lineTo(pEnd.x + 12, pEnd.y - 12);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          const midX = (pStart.x + pEnd.x) / 2;
          const midY = (pStart.y + pEnd.y) / 2 - 8;
          ctx.fillText(`⚡ ${label}`, midX - 26, midY);
        };

        drawEscalator(0, 5, 5, 1, 1, 1, "F0 ➔ F1");
        drawEscalator(1, 2, 6, 4, 6, 1, "F1 ➔ F4");
        drawEscalator(4, 7, 5, 5, 1, 2, "F4 ➔ F5");

        // 2. Draw Floor Plates with Distinct Departmental Styling & Colors
        const floorsToDraw: (0 | 1 | 4 | 5)[] = [0, 1, 4, 5];
        floorsToDraw.forEach(fl => {
          const cfg = TOWER_FLOORS[fl];
          const isSelected = activeFloor === fl;

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
                // Executive Rich Mahogany Parquet
                ctx.fillStyle = alt ? '#78350f' : '#92400e';
              } else if (fl === 1) {
                // Media Warm Birch Wood Planks
                ctx.fillStyle = alt ? '#d97706' : '#b45309';
              } else if (fl === 4) {
                // Documentation Scandinavian Light Chalk Tiles
                ctx.fillStyle = alt ? '#f1f5f9' : '#e2e8f0';
              } else {
                // Tech Cyber Dark Anti-Static Server Grid
                ctx.fillStyle = alt ? '#090d16' : '#1e293b';
              }

              ctx.fill();
              ctx.strokeStyle = fl === 5 ? (alt ? '#0284c744' : '#00f0ff33') : (isSelected ? '#ea580c88' : '#33415533');
              ctx.lineWidth = isSelected ? 1.5 : 1;
              ctx.stroke();
            }
          }

          // Departmental Floor Rugs & Floor Accents
          if (fl === 0) {
            // Executive Crimson & Gold Runner Rug
            const rStart = toTowerScreen(0, 1.5, 1.5);
            const rEnd = toTowerScreen(0, 4.5, 3.5);
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            const rp0 = toTowerScreen(0, 1.5, 1.5);
            const rp1 = toTowerScreen(0, 4.5, 1.5);
            const rp2 = toTowerScreen(0, 4.5, 3.5);
            const rp3 = toTowerScreen(0, 1.5, 3.5);
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
            ctx.ellipse(cPos.x, cPos.y + 10, 42, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
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
            ctx.beginPath();
            ctx.strokeRect(pC.x - 30, pC.y - 10, 60, 20);
          }

          // Departmental Break Lounge & Coffee Station Props
          // 1. Sofa at (5.5, 1.5)
          const sofaPos = toTowerScreen(fl, 5.5, 1.5);
          ctx.fillStyle = fl === 0 ? '#1e293b' : fl === 1 ? '#0284c7' : fl === 4 ? '#7c3aed' : '#334155';
          ctx.fillRect(sofaPos.x - 14, sofaPos.y - 12, 28, 12);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(sofaPos.x - 14, sofaPos.y - 14, 28, 3);

          // 2. Coffee Bar at (1.5, 2.5)
          const coffeePos = toTowerScreen(fl, 1.5, 2.5);
          ctx.fillStyle = '#475569';
          ctx.fillRect(coffeePos.x - 10, coffeePos.y - 14, 20, 14);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(coffeePos.x - 6, coffeePos.y - 20, 12, 8); // Espresso / cooler
          ctx.fillStyle = '#eab308';
          ctx.fillRect(coffeePos.x - 2, coffeePos.y - 16, 4, 3); // Mug

          // Floor-specific unique prop in tower view
          if (fl === 5) {
            // Mini Server Racks
            const srvPos = toTowerScreen(5, 1.2, 0.8);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(srvPos.x - 12, srvPos.y - 24, 24, 22);
            ctx.fillStyle = tick % 16 < 8 ? '#10b981' : '#00e5ff';
            ctx.fillRect(srvPos.x - 9, srvPos.y - 20, 4, 3);
            ctx.fillStyle = tick % 20 < 10 ? '#f59e0b' : '#ef4444';
            ctx.fillRect(srvPos.x - 2, srvPos.y - 20, 4, 3);
          } else if (fl === 1) {
            // Mini Studio Camera on Tripod
            const camPos = toTowerScreen(1, 1.5, 5.0);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(camPos.x, camPos.y);
            ctx.lineTo(camPos.x - 5, camPos.y + 10);
            ctx.moveTo(camPos.x, camPos.y);
            ctx.lineTo(camPos.x + 5, camPos.y + 10);
            ctx.stroke();
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(camPos.x - 6, camPos.y - 8, 12, 8);
            ctx.fillStyle = '#ef4444'; // REC tally
            ctx.fillRect(camPos.x + 4, camPos.y - 6, 3, 3);
          } else if (fl === 4) {
            // Mini Office Laser Copier
            const copPos = toTowerScreen(4, 6.5, 2.5);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(copPos.x - 10, copPos.y - 14, 20, 14);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(copPos.x + 4, copPos.y - 12, 3, 3);
          } else if (fl === 0) {
            // Mini Potted Ficus Plant
            const pltPos = toTowerScreen(0, 0.8, 0.8);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(pltPos.x - 5, pltPos.y - 6, 10, 8);
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(pltPos.x, pltPos.y - 12, 7, 0, Math.PI * 2);
            ctx.fill();
          }

          // Floor Label Tag
          const tagP = toTowerScreen(fl, 0, 0, 45);
          ctx.fillStyle = '#0f172aee';
          ctx.fillRect(tagP.x - 70, tagP.y - 12, 140, 24);
          ctx.strokeStyle = cfg.labelColor;
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.strokeRect(tagP.x - 70, tagP.y - 12, 140, 24);

          ctx.font = 'bold 9.5px monospace';
          ctx.fillStyle = cfg.labelColor;
          ctx.textAlign = 'center';
          ctx.fillText(cfg.name, tagP.x, tagP.y + 4);
        });

        // 3. Render Desks & Furniture
        ALL_PERSONNEL_DESKS.forEach(desk => {
          const fl = desk.floor as (0 | 1 | 4 | 5);
          const pos = toTowerScreen(fl, desk.x, desk.y);

          // Departmental Desk Surfaces
          ctx.fillStyle = fl === 0 ? '#78350f' : fl === 1 ? '#b45309' : fl === 4 ? '#e2e8f0' : '#1e293b';
          ctx.fillRect(pos.x - 16, pos.y - 12, 32, 14);
          ctx.fillStyle = fl === 0 ? '#92400e' : fl === 1 ? '#d97706' : fl === 4 ? '#f8fafc' : '#334155';
          ctx.fillRect(pos.x - 16, pos.y - 14, 32, 3);

          // Monitors
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pos.x - 8, pos.y - 30, 16, 12);
          ctx.fillStyle = fl === 5 ? (tick % 16 < 8 ? '#22c55e' : '#00e5ff') : (tick % 16 < 8 ? '#00e5ff' : '#6ee7b7');
          ctx.fillRect(pos.x - 6, pos.y - 28, 12, 8);

          // Chair
          ctx.fillStyle = desk.chairColor;
          ctx.fillRect(pos.x - 6, pos.y - 6, 12, 4);
        });

        // 4. Render Characters in Tower View
        simList.forEach(sim => {
          let charPos = { x: 0, y: 0 };
          if (sim.state === 'escalator_transit' && sim.transitFromFloor !== undefined && sim.transitToFloor !== undefined) {
            const pFrom = toTowerScreen(sim.transitFromFloor as any, 5, 5);
            const pTo = toTowerScreen(sim.transitToFloor as any, 2, 2);
            const prog = sim.transitProgress || 0;
            charPos = {
              x: pFrom.x + (pTo.x - pFrom.x) * prog,
              y: pFrom.y + (pTo.y - pFrom.y) * prog - 12
            };
          } else {
            const fl = sim.currentFloor as (0 | 1 | 4 | 5);
            charPos = toTowerScreen(fl, sim.curX, sim.curY);
          }

          const isWorking = sim.state === 'working_at_desk';
          const isWalking = sim.state === 'walking';
          const bounceY = isWalking ? Math.sin(sim.walkCycle * Math.PI) * 2.5 : 0;
          const yOffset = (isWorking ? -16 : -22) + bounceY;

          ctx.fillStyle = '#00000055';
          ctx.beginPath();
          ctx.ellipse(charPos.x, charPos.y, 11, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          if (sim.isAuri) {
            const auriImg = getImage(`/assets/sprites/orbi/orbi_${isWorking ? 'working' : (orbiState || 'idle')}.gif`);
            if (auriImg.complete && auriImg.naturalWidth > 0) {
              ctx.drawImage(auriImg, charPos.x - 18, charPos.y + yOffset - 12, 36, 36);
            } else {
              ctx.fillStyle = '#ff6600';
              ctx.fillRect(charPos.x - 10, charPos.y + yOffset - 10, 20, 18);
            }
          } else {
            const empImg = getImage(`/assets/sprites/employees/${sim.avatar_file}`);
            if (empImg.complete && empImg.naturalWidth > 0) {
              if (sim.facing === 'SW') {
                ctx.save();
                ctx.translate(charPos.x, charPos.y + yOffset);
                ctx.scale(-1, 1);
                ctx.drawImage(empImg, -14, -10, 28, 32);
                ctx.restore();
              } else {
                ctx.drawImage(empImg, charPos.x - 14, charPos.y + yOffset - 10, 28, 32);
              }
            } else {
              ctx.fillStyle = '#ea580c';
              ctx.fillRect(charPos.x - 7, charPos.y + yOffset, 14, 16);
            }
          }

          // Name Badge
          ctx.fillStyle = '#0f172aee';
          ctx.fillRect(charPos.x - 24, charPos.y + 4, 48, 13);
          ctx.strokeStyle = '#475569';
          ctx.strokeRect(charPos.x - 24, charPos.y + 4, 48, 13);
          ctx.font = 'bold 8px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(sim.name, charPos.x, charPos.y + 13);

          // Speech Bubble
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
        // VIEW MODE: SINGLE FLOOR FOCUS (Vibrant Departmental Theming & Props)
        // ==========================================
        const originX = canvas.width / 2;
        const originY = 110;

        const toScreen = (gx: number, gy: number, gz: number = 0) => {
          const sx = originX + (gx - gy) * (TILE_W / 2);
          const sy = originY + (gx + gy) * (TILE_H / 2) - gz;
          return { x: sx, y: sy };
        };

        // 1. LEFT WALL WITH DEPARTMENTAL PALETTES & TEXTURES
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
          // Executive Midnight Slate Wall with Mahogany Baseboard
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Mahogany baseboard
          const bb0 = toScreen(0, 0, 18);
          const bb1 = toScreen(0, FOCUS_GRID, 18);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(bb0.x, bb0.y);
          ctx.lineTo(bb1.x, bb1.y);
          ctx.stroke();

          // Executive Gold Framed Plaque / Charter
          const plP = toScreen(0, 3.5, 95);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(plP.x - 22, plP.y - 16, 44, 32);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(plP.x - 22, plP.y - 16, 44, 32);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(plP.x - 18, plP.y - 12, 36, 24);
          ctx.fillStyle = '#854d0e';
          ctx.font = 'bold 6.5px monospace';
          ctx.fillText("UiPath AJIET", plP.x, plP.y);
          ctx.font = '5px monospace';
          ctx.fillText("CHARTER", plP.x, plP.y + 7);

        } else if (activeFloor === 1) {
          // Media Exposed Red Brick Wall
          ctx.fillStyle = '#9a3412';
          ctx.fill();
          ctx.strokeStyle = '#7c2d12';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Brick pattern lines
          ctx.strokeStyle = '#fed7aa44';
          ctx.lineWidth = 1;
          for (let z = 20; z < 160; z += 16) {
            const bL0 = toScreen(0, 0, z);
            const bL1 = toScreen(0, FOCUS_GRID, z);
            ctx.beginPath();
            ctx.moveTo(bL0.x, bL0.y);
            ctx.lineTo(bL1.x, bL1.y);
            ctx.stroke();
          }

          // Soundproof Acoustic Foam Panels
          const afP = toScreen(0, 4.0, 95);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(afP.x - 26, afP.y - 20, 52, 40);
          ctx.strokeStyle = '#334155';
          ctx.strokeRect(afP.x - 26, afP.y - 20, 52, 40);
          ctx.fillStyle = '#0284c7';
          ctx.font = 'bold 7px monospace';
          ctx.fillText("ACOUSTIC SOUNDSTAGE", afP.x, afP.y);

        } else if (activeFloor === 4) {
          // Documentation Scandinavian Sage Green Wall
          ctx.fillStyle = '#047857';
          ctx.fill();
          ctx.strokeStyle = '#065f46';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Campus Hackathon Purple Banner
          const banP = toScreen(0, 3.8, 100);
          ctx.fillStyle = '#7c3aed';
          ctx.fillRect(banP.x - 34, banP.y - 18, 68, 36);
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2;
          ctx.strokeRect(banP.x - 34, banP.y - 18, 68, 36);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px monospace';
          ctx.fillText("UiPath COMMUNITY", banP.x, banP.y - 4);
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 6.5px monospace';
          ctx.fillText("AJIET HACKATHON", banP.x, banP.y + 7);

        } else {
          // Tech Cyber Obsidian Wall with Neon Data Conduits
          ctx.fillStyle = '#090d16';
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Glowing Electric Cyan Neon Conduit Traces
          const c0 = toScreen(0, 0, 80);
          const c1 = toScreen(0, FOCUS_GRID, 80);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(c0.x, c0.y);
          ctx.lineTo(c1.x, c1.y);
          ctx.stroke();

          // Vertical drop lines
          const vd0 = toScreen(0, 4.0, 150);
          const vd1 = toScreen(0, 4.0, 20);
          ctx.strokeStyle = '#0284c7aa';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(vd0.x, vd0.y);
          ctx.lineTo(vd1.x, vd1.y);
          ctx.stroke();
        }

        // 2. RIGHT WALL WITH WINDOW & WALL PROPS
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
          ctx.fillStyle = '#c2410c'; // Warm terracotta
        } else if (activeFloor === 4) {
          ctx.fillStyle = '#f8fafc'; // Crisp chalk wall
        } else {
          ctx.fillStyle = '#0f172a'; // Tech slate
        }
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Right Wall Specific Props
        if (activeFloor === 4) {
          // Agile Kanban Whiteboard on Right Wall (Floor 4)
          const wbP = toScreen(7.0, 0, 85);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(wbP.x - 45, wbP.y - 25, 90, 50);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.strokeRect(wbP.x - 45, wbP.y - 25, 90, 50);

          // Header
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 6.5px monospace';
          ctx.fillText("SPRINT KANBAN BOARD", wbP.x, wbP.y - 15);

          // 3 Columns: To Do, In Progress, Done
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(wbP.x - 15, wbP.y - 12); ctx.lineTo(wbP.x - 15, wbP.y + 20);
          ctx.moveTo(wbP.x + 15, wbP.y - 12); ctx.lineTo(wbP.x + 15, wbP.y + 20);
          ctx.stroke();

          // Sticky Notes (Yellow, Pink, Cyan)
          ctx.fillStyle = '#fde047'; ctx.fillRect(wbP.x - 38, wbP.y - 8, 8, 8);
          ctx.fillStyle = '#f472b6'; ctx.fillRect(wbP.x - 38, wbP.y + 4, 8, 8);
          ctx.fillStyle = '#38bdf8'; ctx.fillRect(wbP.x - 8, wbP.y - 6, 8, 8);
          ctx.fillStyle = '#4ade80'; ctx.fillRect(wbP.x + 22, wbP.y - 4, 8, 8);
        } else if (activeFloor === 5) {
          // NOC Real-Time Monitoring Wall Display (Floor 5)
          const nocP = toScreen(7.0, 0, 85);
          ctx.fillStyle = '#060a12';
          ctx.fillRect(nocP.x - 48, nocP.y - 25, 96, 50);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(nocP.x - 48, nocP.y - 25, 96, 50);

          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 7px monospace';
          ctx.fillText("NOC CLOUD TELEMETRY: 99.99%", nocP.x, nocP.y - 14);

          // Metric spikes
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(nocP.x - 40, nocP.y + 10);
          for (let i = 0; i < 8; i++) {
            const h = (i % 2 === 0 ? 12 : 4) + ((tick + i * 3) % 8);
            ctx.lineTo(nocP.x - 40 + i * 10, nocP.y + 10 - h);
          }
          ctx.stroke();
        } else {
          // Window for Floor 0 & 1
          const win0 = toScreen(FOCUS_GRID * 0.22, 0, 140);
          const win1 = toScreen(FOCUS_GRID * 0.85, 0, 140);
          const win2 = toScreen(FOCUS_GRID * 0.85, 0, 45);
          const win3 = toScreen(FOCUS_GRID * 0.22, 0, 45);

          ctx.fillStyle = activeFloor === 0 ? '#38bdf8' : '#7dd3fc';
          ctx.beginPath();
          ctx.moveTo(win0.x, win0.y);
          ctx.lineTo(win1.x, win1.y);
          ctx.lineTo(win2.x, win2.y);
          ctx.lineTo(win3.x, win3.y);
          ctx.closePath();
          ctx.fill();

          // Window frame & mullions
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.stroke();

          // Sunlight glare lines
          ctx.strokeStyle = '#ffffff44';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo((win0.x + win1.x) / 2, (win0.y + win1.y) / 2);
          ctx.lineTo((win2.x + win3.x) / 2, (win2.y + win3.y) / 2);
          ctx.moveTo((win0.x + win3.x) / 2, (win0.y + win3.y) / 2);
          ctx.lineTo((win1.x + win2.x) / 2, (win1.y + win2.y) / 2);
          ctx.stroke();
        }

        // 3. DEPARTMENTAL FLOOR TILES
        for (let x = 0; x < FOCUS_GRID; x++) {
          for (let y = 0; y < FOCUS_GRID; y++) {
            const tp = toScreen(x, y);
            ctx.beginPath();
            ctx.moveTo(tp.x, tp.y);
            ctx.lineTo(tp.x + TILE_W / 2, tp.y + TILE_H / 2);
            ctx.lineTo(tp.x, tp.y + TILE_H);
            ctx.lineTo(tp.x - TILE_W / 2, tp.y + TILE_H / 2);
            ctx.closePath();

            const isAlt = (x + y) % 2 === 0;
            if (activeFloor === 0) {
              // Rich Executive Mahogany Wood Flooring
              ctx.fillStyle = isAlt ? '#78350f' : '#92400e';
            } else if (activeFloor === 1) {
              // Warm Media Birch Planks
              ctx.fillStyle = isAlt ? '#d97706' : '#b45309';
            } else if (activeFloor === 4) {
              // Clean Scandinavian Ceramic Tiles
              ctx.fillStyle = isAlt ? '#f1f5f9' : '#e2e8f0';
            } else {
              // High-tech Raised Perforated Server Grid Tiles
              ctx.fillStyle = isAlt ? '#090d16' : '#1e293b';
            }

            ctx.fill();
            ctx.strokeStyle = activeFloor === 5 
              ? (isAlt ? '#00f0ff33' : '#0284c722')
              : (activeFloor === 4 ? '#cbd5e1' : '#451a0333');
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // 4. FLOOR-SPECIFIC RUGS & CARPET ACCENTS
        if (activeFloor === 0) {
          // Executive Royal Crimson Carpet Runner
          const rp0 = toScreen(1.5, 2.0);
          const rp1 = toScreen(6.5, 2.0);
          const rp2 = toScreen(6.5, 5.5);
          const rp3 = toScreen(1.5, 5.5);
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.moveTo(rp0.x, rp0.y + TILE_H / 2);
          ctx.lineTo(rp1.x + TILE_W / 2, rp1.y + TILE_H / 2);
          ctx.lineTo(rp2.x, rp2.y + TILE_H);
          ctx.lineTo(rp3.x - TILE_W / 2, rp3.y + TILE_H / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (activeFloor === 1) {
          // Studio Vibrant Cyan Geometric Circular Rug
          const cPos = toScreen(4.5, 4.5);
          ctx.fillStyle = '#0284c7aa';
          ctx.beginPath();
          ctx.ellipse(cPos.x, cPos.y + 14, 78, 38, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (activeFloor === 4) {
          // Modern Scandinavian Lavender Study Rug
          const rp0 = toScreen(2.0, 2.5);
          const rp1 = toScreen(6.5, 2.5);
          const rp2 = toScreen(6.5, 5.5);
          const rp3 = toScreen(2.0, 5.5);
          ctx.fillStyle = '#7c3aed55';
          ctx.beginPath();
          ctx.moveTo(rp0.x, rp0.y + TILE_H / 2);
          ctx.lineTo(rp1.x + TILE_W / 2, rp1.y + TILE_H / 2);
          ctx.lineTo(rp2.x, rp2.y + TILE_H);
          ctx.lineTo(rp3.x - TILE_W / 2, rp3.y + TILE_H / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        // 5. DEPARTMENTAL PROPS & EQUIPMENT
        // ----------------------------------------------------
        // A. Shared Lounge Sofa at (5.5, 1.5)
        const sofaPos = toScreen(5.5, 1.5);
        ctx.fillStyle = activeFloor === 0 ? '#1e293b' : activeFloor === 1 ? '#0284c7' : activeFloor === 4 ? '#7c3aed' : '#334155';
        ctx.fillRect(sofaPos.x - 28, sofaPos.y - 20, 56, 26);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sofaPos.x - 28, sofaPos.y - 24, 56, 6);
        // Sofa pillows
        ctx.fillStyle = activeFloor === 0 ? '#ca8a04' : activeFloor === 1 ? '#f59e0b' : '#c084fc';
        ctx.fillRect(sofaPos.x - 24, sofaPos.y - 18, 12, 10);
        ctx.fillRect(sofaPos.x + 12, sofaPos.y - 18, 12, 10);

        // B. Coffee & Refreshment Station at (1.5, 2.5)
        const cofPos = toScreen(1.5, 2.5);
        ctx.fillStyle = '#334155';
        ctx.fillRect(cofPos.x - 18, cofPos.y - 26, 36, 26);
        if (activeFloor === 4) {
          // Water Cooler with Blue Bottle
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(cofPos.x, cofPos.y - 36, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(cofPos.x - 6, cofPos.y - 28, 12, 12);
        } else {
          // Espresso Machine with Chrome Steam Arm
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(cofPos.x - 12, cofPos.y - 36, 24, 14);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(cofPos.x - 4, cofPos.y - 26, 8, 6); // Coffee cup
        }

        // C. Floor-Specific Props
        if (activeFloor === 0) {
          // Floor 0: Tall Brass Potted Ficus Tree at (0.8, 0.8)
          const plP = toScreen(0.8, 0.8);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(plP.x - 9, plP.y - 12, 18, 16);
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(plP.x, plP.y - 24, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(plP.x - 4, plP.y - 28, 10, 0, Math.PI * 2);
          ctx.fill();

          // Glass Trophy Bookcase at (0.8, 5.2)
          const bcP = toScreen(0.8, 5.2);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(bcP.x - 20, bcP.y - 48, 40, 48);
          ctx.fillStyle = '#eab308';
          ctx.fillRect(bcP.x - 12, bcP.y - 38, 8, 10); // Gold Trophy 1
          ctx.fillRect(bcP.x + 4, bcP.y - 24, 8, 10); // Gold Trophy 2

          // AURI Mascot Interface & Docking Station at (3.8, 1.8)
          const dockP = toScreen(3.8, 1.8);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(dockP.x - 16, dockP.y - 24, 32, 22);
          ctx.fillStyle = '#ff6600';
          ctx.fillRect(dockP.x - 16, dockP.y - 26, 32, 4);
          ctx.fillStyle = tick % 16 < 8 ? '#00f0ff' : '#38bdf8';
          ctx.fillRect(dockP.x - 10, dockP.y - 20, 20, 10);
        } else if (activeFloor === 1) {
          // Floor 1: Studio 4K Cinema Camera on Tripod at (1.5, 5.5)
          const camP = toScreen(1.5, 5.5);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(camP.x, camP.y - 20); ctx.lineTo(camP.x - 14, camP.y + 6);
          ctx.moveTo(camP.x, camP.y - 20); ctx.lineTo(camP.x + 14, camP.y + 6);
          ctx.moveTo(camP.x, camP.y - 20); ctx.lineTo(camP.x, camP.y + 8);
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(camP.x - 14, camP.y - 38, 28, 20);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(camP.x + 12, camP.y - 34, 10, 12); // Telephoto lens
          // Red Recording LED
          ctx.fillStyle = tick % 20 < 10 ? '#ef4444' : '#7f1d1d';
          ctx.beginPath();
          ctx.arc(camP.x - 8, camP.y - 32, 4, 0, Math.PI * 2);
          ctx.fill();

          // Professional Ring Light at (7.0, 2.5)
          const rlP = toScreen(7.0, 2.5);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(rlP.x, rlP.y); ctx.lineTo(rlP.x, rlP.y - 40);
          ctx.stroke();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(rlP.x, rlP.y - 48, 12, 0, Math.PI * 2);
          ctx.stroke();
        } else if (activeFloor === 4) {
          // Floor 4: Heavy-Duty Laser Copier at (7.2, 2.2)
          const copP = toScreen(7.2, 2.2);
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(copP.x - 18, copP.y - 28, 36, 28);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(copP.x - 14, copP.y - 34, 28, 6); // Scanner top
          // Pulsing Emerald LED
          ctx.fillStyle = tick % 16 < 8 ? '#10b981' : '#059669';
          ctx.fillRect(copP.x + 6, copP.y - 24, 6, 4);

          // Filing Cabinets at (0.8, 1.2)
          const fcP = toScreen(0.8, 1.2);
          ctx.fillStyle = '#64748b';
          ctx.fillRect(fcP.x - 16, fcP.y - 44, 32, 44);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(fcP.x - 12, fcP.y - 36, 24, 6);
          ctx.fillRect(fcP.x - 12, fcP.y - 24, 24, 6);
          ctx.fillRect(fcP.x - 12, fcP.y - 12, 24, 6);
        } else if (activeFloor === 5) {
          // Floor 5: Enterprise 42U Server Racks along (1.0, 0.8) to (4.0, 0.8)
          [1.0, 2.0, 3.0, 4.0].forEach((rx, idx) => {
            const srvP = toScreen(rx, 0.8);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(srvP.x - 14, srvP.y - 46, 28, 46);
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(srvP.x - 14, srvP.y - 46, 28, 46);

            // Blinking Status LEDs
            for (let row = 0; row < 5; row++) {
              const ledY = srvP.y - 40 + row * 7;
              const blink = (tick + idx * 4 + row) % 18 < 9;
              ctx.fillStyle = blink ? '#22c55e' : '#065f46';
              ctx.fillRect(srvP.x - 10, ledY, 4, 3);
              ctx.fillStyle = blink ? '#00e5ff' : '#0284c7';
              ctx.fillRect(srvP.x - 3, ledY, 4, 3);
              ctx.fillStyle = (tick + row) % 24 < 12 ? '#f59e0b' : '#78350f';
              ctx.fillRect(srvP.x + 4, ledY, 4, 3);
            }
          });

          // Network Patch Rack at (0.8, 3.5)
          const prP = toScreen(0.8, 3.5);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(prP.x - 12, prP.y - 38, 24, 38);
          // Patch cords
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(prP.x - 8, prP.y - 26);
          ctx.quadraticCurveTo(prP.x, prP.y - 16, prP.x + 6, prP.y - 22);
          ctx.stroke();
        }

        // 6. DEPARTMENTAL DESKS IN FOCUS MODE
        ALL_PERSONNEL_DESKS.filter(d => d.floor === activeFloor).forEach(desk => {
          const pos = toScreen(desk.x, desk.y);

          // Workstation Partition / Desk Surface
          ctx.fillStyle = activeFloor === 0 ? '#78350f' : activeFloor === 1 ? '#b45309' : activeFloor === 4 ? '#e2e8f0' : '#1e293b';
          ctx.fillRect(pos.x - 28, pos.y - 22, 56, 22);
          ctx.fillStyle = activeFloor === 0 ? '#92400e' : activeFloor === 1 ? '#d97706' : activeFloor === 4 ? '#f8fafc' : '#334155';
          ctx.fillRect(pos.x - 28, pos.y - 26, 56, 5);

          // Monitor
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pos.x - 14, pos.y - 48, 28, 22);

          // Display Screen Content
          if (activeFloor === 1) {
            // Video Editing Timeline Screen (Magenta audio, cyan video)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pos.x - 12, pos.y - 46, 24, 18);
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(pos.x - 10, pos.y - 43, 20, 5);
            ctx.fillStyle = '#ec4899';
            ctx.fillRect(pos.x - 10, pos.y - 36, 20, 4);
          } else if (activeFloor === 5) {
            // Terminal Window with Green Matrix Code
            ctx.fillStyle = '#022c22';
            ctx.fillRect(pos.x - 12, pos.y - 46, 24, 18);
            ctx.fillStyle = '#22c55e';
            ctx.font = '6px monospace';
            ctx.fillText("> ssh rpa", pos.x, pos.y - 34);
          } else {
            ctx.fillStyle = tick % 16 < 8 ? '#00e5ff' : '#6ee7b7';
            ctx.fillRect(pos.x - 12, pos.y - 46, 24, 18);
          }

          // Chair
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
            }
          } else {
            const empImg = getImage(`/assets/sprites/employees/${sim.avatar_file}`);
            if (empImg.complete && empImg.naturalWidth > 0) {
              if (sim.facing === 'SW') {
                ctx.save();
                ctx.translate(pos.x, pos.y + yOffset);
                ctx.scale(-1, 1);
                ctx.drawImage(empImg, -18, -14, 36, 40);
                ctx.restore();
              } else {
                ctx.drawImage(empImg, pos.x - 18, pos.y + yOffset - 14, 36, 40);
              }
            }
          }

          // Name Tag & Visiting Badge
          const isVisiting = sim.homeFloor !== activeFloor;
          ctx.fillStyle = isVisiting ? '#78350f' : '#0f172aee';
          ctx.fillRect(pos.x - 32, pos.y + 6, 64, 16);
          ctx.strokeStyle = isVisiting ? '#f59e0b' : '#475569';
          ctx.strokeRect(pos.x - 32, pos.y + 6, 64, 16);
          ctx.font = 'bold 8.5px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.fillText(isVisiting ? `[F${sim.homeFloor}] ${sim.name}` : sim.name, pos.x, pos.y + 17);

          // Speech Bubble
          if (sim.bubbleText) {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.5;
            const bWidth = Math.max(sim.bubbleText.length * 6 + 20, 60);
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

  // Click on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;

    if (viewMode === 'multi_tower') {
      const TOWER_FLOORS: Record<number, { x: number; y: number }> = {
        0: { x: 420, y: 130 },
        1: { x: 860, y: 240 },
        4: { x: 360, y: 460 },
        5: { x: 820, y: 550 }
      };

      for (const [fStr, coords] of Object.entries(TOWER_FLOORS)) {
        const fl = parseInt(fStr, 10);
        if (Math.hypot(cx - coords.x, cy - coords.y) < 110) {
          setActiveFloor(fl);
          setActiveActionLog(`Selected Floor ${fl}: ${FLOOR_CONFIG.find(f => f.floor === fl)?.name}`);
          return;
        }
      }
    }

    for (const sim of simRef.current) {
      const fullAgent = agents.find(a => a.agent_id === sim.agent_id);
      if (fullAgent) {
        onSelectAgent(fullAgent);
        setActiveActionLog(`Inspecting Dossier: ${fullAgent.name} (${fullAgent.role})`);
        return;
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
              <span className="font-pixel text-xs text-orange-400">AUTONOMIA HQ //</span>
              <h2 className="text-base font-bold text-white">
                {viewMode === 'multi_tower' ? 'Multi-Tier Campus Complex (All Connected Floors)' : FLOOR_CONFIG.find(f => f.floor === activeFloor)?.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === 'multi_tower' 
                ? 'Escalators and stairs connecting Floor 0, 1, 4, 5 with autonomous inter-department mobility'
                : FLOOR_CONFIG.find(f => f.floor === activeFloor)?.subtitle
              }
            </p>
          </div>
        </div>

        {/* View Mode & Simulation Controls */}
        <div className="flex items-center space-x-3">
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

          {/* Floor Selector (when in focus mode) */}
          {viewMode === 'floor_focus' && (
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {FLOOR_CONFIG.map((f) => (
                <button
                  key={f.floor}
                  onClick={() => setActiveFloor(f.floor)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    activeFloor === f.floor
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Floor {f.floor}
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
            <span className="text-amber-400">Continuous Pathing Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
