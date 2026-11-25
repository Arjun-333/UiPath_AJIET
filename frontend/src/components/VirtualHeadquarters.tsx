import React, { useState, useEffect, useRef } from 'react';
import { Agent, AgentMessage, AgentTransitEvent } from '../types';
import { Floor0IsometricRoom } from './isometric/Floor0IsometricRoom';
import { Floor1IsometricRoom } from './isometric/Floor1IsometricRoom';
import { 
  Building2, Users, Coffee, Laptop, Sparkles, MessageSquare, 
  ChevronRight, ZoomIn, ZoomOut, Maximize2, Layers, Compass, 
  ArrowUp, ArrowDown, Pause, Play, Clock, Eye
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

// Realistic corporate focus activities per employee
const AGENT_WORK_ACTIVITIES: Record<string, { desk: string[]; break: string[]; visit: string[] }> = {
  arjun_ceo: {
    desk: [
      "Reviewing executive growth roadmap for AJIET community",
      "Evaluating departmental video delivery approvals",
      "Analyzing quarterly AI media expansion milestones",
      "Setting strategic directives for creative & tech ops"
    ],
    break: ["Espresso break at executive lounge", "Reflecting on company milestones"],
    visit: ["Inspecting Floor 1 Media Studio", "Checking Floor 5 Cloud Infrastructure"]
  },
  auri_ceo_interface: {
    desk: [
      "Standing by for CEO Arjun's instructions",
      "Monitoring executive telemetry & task feeds",
      "Coordinating inter-floor agent transit",
      "Synthesizing daily operational summary"
    ],
    break: ["Recharging docking station battery", "Syncing memory buffers"],
    visit: ["Delivering executive dispatch to Floor 1", "Syncing with CTO Pratham on Floor 5"]
  },
  coo_01: {
    desk: [
      "Decomposing CEO project workflows into tasks",
      "Balancing departmental workload allocations",
      "Tracking deliverable milestones and handoffs",
      "Auditing operational resource throughput"
    ],
    break: ["Reviewing sprint logs with coffee", "Short rest at executive sofa"],
    visit: ["Syncing with Director Darshan on Floor 1", "Reviewing QA metrics on Floor 3"]
  },
  darshan_director: {
    desk: [
      "Directing scene 4 video composition & pacing",
      "Inspecting FFmpeg render export pipeline",
      "Reviewing motion graphics cuts & color timing",
      "Validating final master 16:9 render release"
    ],
    break: ["Pouring studio coffee at refreshment bar", "Discussing creative pacing on sofa"],
    visit: ["Syncing with Scriptwriter Shrinithi", "Checking defect inspection report on Floor 3"]
  },
  shrinithi_script: {
    desk: [
      "Drafting UiPath Document Understanding hook",
      "Structuring 60-second video narrative flow",
      "Polishing technical taxonomy citations",
      "Timing voiceover narration cadence"
    ],
    break: ["Herbal tea break in studio lounge", "Reading UiPath community release notes"],
    visit: ["Reviewing script draft with Darshan", "Checking doc references on Floor 4"]
  },
  vaishnavi_design: {
    desk: [
      "Crafting high-CTR YouTube thumbnail typography",
      "Adjusting contrast & mascot branding visuals",
      "Selecting high-impact visual color palettes",
      "Exporting 1080p promotional title cards"
    ],
    break: ["Grabbing cappuccino at studio bar", "Sketching thumbnail concepts on lounge"],
    visit: ["Reviewing thumbnail preview with Director", "Consulting Marketing on Floor 2"]
  },
  shreyank_editor: {
    desk: [
      "Compositing 9:16 Instagram reel cuts",
      "Aligning subtitle margins inside safe zone",
      "Fine-tuning motion graphics transitions",
      "Rendering 60fps vertical reels"
    ],
    break: ["Quick espresso recharge at coffee bar", "Relaxing on creative sofa"],
    visit: ["Showing reel cuts to Director Darshan", "Testing audio sync on Floor 3"]
  },
  ananya_marketing: {
    desk: [
      "Analyzing student audience retention on Shorts",
      "Planning Instagram Reels campaign calendar",
      "Optimizing YouTube search tags & metadata",
      "Forecasting campus enrollment engagement"
    ],
    break: ["Iced coffee break at marketing counter", "Reviewing engagement dashboards"],
    visit: ["Consulting Designer Vaishnavi on Floor 1", "Reviewing campus signups on Floor 4"]
  },
  rohit_social: {
    desk: [
      "Scheduling multi-platform video uploads",
      "Monitoring YouTube community comments",
      "Tracking reel engagement CTR analytics",
      "Preparing weekly digital broadcast"
    ],
    break: ["Coffee break at growth lounge", "Checking social notification queues"],
    visit: ["Fetching rendered reels from Floor 1", "Consulting Lead Ananya on growth"]
  },
  tarun_qa: {
    desk: [
      "Scanning video frames for frozen/black defects",
      "Verifying FFmpeg 1080p export integrity",
      "Evaluating Nemotron automated QA logs",
      "Validating scene duration continuity"
    ],
    break: ["Green tea recharge at QA bar", "Reviewing inspection rubric benchmarks"],
    visit: ["Reporting minor cut defect to Darshan", "Auditing subtitle compliance with Kavya"]
  },
  kavya_compliance: {
    desk: [
      "Checking audio LUFS loudness (-14dB standard)",
      "Verifying subtitle timing & safe margins",
      "Auditing UiPath brand trademark usage",
      "Running compliance verification checklist"
    ],
    break: ["Espresso break at test lab lounge", "Calibrating audio monitoring headset"],
    visit: ["Reviewing subtitle timing with Shreyank", "Syncing with Srijana on Floor 4"]
  },
  iffah_doc: {
    desk: [
      "Coordinating Automate Campus Quest",
      "Reviewing student workshop curriculum",
      "Preparing email announcement campaign",
      "Managing academic outreach partnerships"
    ],
    break: ["Tea break at outreach refreshment bar", "Reviewing student feedback letters"],
    visit: ["Checking campaign plan with CEO Arjun", "Syncing with Tech Lead Pratham on Floor 5"]
  },
  jiya_research: {
    desk: [
      "Researching UiPath Action Center APIs",
      "Indexing Taxonomy Manager documentation",
      "Validating OCR Digitizer code samples",
      "Compiling technical reference guide"
    ],
    break: ["Coffee break at documentation bar", "Reading RPA whitepapers on sofa"],
    visit: ["Providing taxonomy reference to Shrinithi", "Checking database schema with Mallika"]
  },
  srijana_quality: {
    desk: [
      "Conducting compliance audit of deliverables",
      "Checking academic certification standards",
      "Verifying email campaign recipient lists",
      "Reviewing student privacy guidelines"
    ],
    break: ["Matcha tea break at doc lounge", "Reviewing compliance checklist"],
    visit: ["Syncing with QA Inspector Tarun on Floor 3", "Auditing security with Vaibhav on Floor 5"]
  },
  pratham_cto: {
    desk: [
      "Monitoring distributed FFmpeg rendering load",
      "Optimizing async event bus throughput",
      "Profiling system memory & CPU overhead",
      "Architecting autonomous agent microservices"
    ],
    break: ["Strong dark espresso at tech bar", "Reviewing cloud architecture blueprints"],
    visit: ["Briefing CEO Arjun on system stability", "Syncing with DB Manager Mallika"]
  },
  mallika_tech: {
    desk: [
      "Managing SQLite connection pooling",
      "Indexing telemetry query execution plans",
      "Validating schema migrations integrity",
      "Auditing API response latencies"
    ],
    break: ["Coffee break at systems bar", "Reviewing database query benchmarks"],
    visit: ["Reviewing server logs with Pratham", "Checking storage volume with Faazil"]
  },
  vaibhav_devops: {
    desk: [
      "Auditing environment variable security",
      "Monitoring Docker container health",
      "Checking automated backup cron jobs",
      "Verifying rate limiter defense policies"
    ],
    break: ["Pouring black coffee at tech bar", "Reviewing network access logs"],
    visit: ["Consulting Faazil on NVMe storage", "Briefing CTO Pratham on uptime"]
  },
  faazil_sysadmin: {
    desk: [
      "Monitoring NVMe SSD storage space",
      "Purging temporary video render caches",
      "Checking local network socket latency",
      "Auditing disk I/O performance"
    ],
    break: ["Espresso recharge at server lounge", "Checking hardware temperature gauges"],
    visit: ["Inspecting server racks on Floor 5", "Syncing with DevOps Vaibhav"]
  }
};

interface CharacterSim {
  agent_id: string;
  name: string;
  role: string;
  department: string;
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
  currentActivity: string;
}

interface HoveredAgentInfo {
  agent_id: string;
  name: string;
  role: string;
  department: string;
  floor: number;
  state: string;
  currentActivity: string;
  screenX: number;
  screenY: number;
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
  const isLegacyUrl = typeof window !== 'undefined' && window.location.search.includes('view=legacy');
  const [viewPreference, setViewPreference] = useState<'isometric' | 'legacy'>(isLegacyUrl ? 'legacy' : 'isometric');
  const [zoom, setZoom] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<'multi_tower' | 'floor_focus'>('floor_focus');
  const [pacingMode, setPacingMode] = useState<'calm' | 'active' | 'paused'>('calm');
  const [hoveredAgent, setHoveredAgent] = useState<HoveredAgentInfo | null>(null);
  const simRef = useRef<CharacterSim[]>([]);
  const animFrameRef = useRef<number>(0);
  const [activeActionLog, setActiveActionLog] = useState<string>("Calm focus mode active: Employees performing deep departmental tasks.");

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
    { agent_id: 'arjun_ceo', name: 'Arjun', role: 'Founder & CEO', department: 'Executive Management', floor: 0, x: 2, y: 3, chairColor: '#ea580c', isAuri: false },
    { agent_id: 'auri_ceo_interface', name: 'AURI', role: 'Mascot & CEO Interface', department: 'Executive Management', floor: 0, x: 4, y: 3, chairColor: '#0284c7', isAuri: true },
    { agent_id: 'coo_01', name: 'Marcus Vance', role: 'COO', department: 'Executive Management', floor: 0, x: 5, y: 4, chairColor: '#475569', isAuri: false },
    // Floor 1 - Media Studio (Ground Right)
    { agent_id: 'darshan_director', name: 'Darshan', role: 'Video Director', department: 'Creative & Video Production', floor: 1, x: 2, y: 4, chairColor: '#ea580c', isAuri: false },
    { agent_id: 'shrinithi_script', name: 'Shrinithi', role: 'Scriptwriter', department: 'Creative & Video Production', floor: 1, x: 4, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'vaishnavi_design', name: 'Vaishnavi', role: 'Thumbnail Designer', department: 'Creative & Video Production', floor: 1, x: 6, y: 4, chairColor: '#dc2626', isAuri: false },
    { agent_id: 'shreyank_editor', name: 'Shreyank', role: 'Motion Graphics', department: 'Creative & Video Production', floor: 1, x: 5, y: 6, chairColor: '#10b981', isAuri: false },
    // Floor 2 - Marketing & Growth Operations (Mid Left)
    { agent_id: 'ananya_marketing', name: 'Ananya', role: 'Growth Strategist', department: 'Marketing & Campaign Management', floor: 2, x: 3, y: 4, chairColor: '#10b981', isAuri: false },
    { agent_id: 'rohit_social', name: 'Rohit', role: 'Social & YouTube Lead', department: 'Marketing & Campaign Management', floor: 2, x: 5, y: 5, chairColor: '#ec4899', isAuri: false },
    // Floor 3 - AI Video QA & Testing Lab (Mid Right)
    { agent_id: 'tarun_qa', name: 'Tarun', role: 'Lead Defect Inspector', department: 'AI Video Quality & QA Lab', floor: 3, x: 3, y: 4, chairColor: '#f59e0b', isAuri: false },
    { agent_id: 'kavya_compliance', name: 'Kavya', role: 'Subtitle & Audio QA', department: 'AI Video Quality & QA Lab', floor: 3, x: 5, y: 5, chairColor: '#8b5cf6', isAuri: false },
    // Floor 4 - Documentation & Campus Hub (Top Left)
    { agent_id: 'iffah_doc', name: 'Iffah', role: 'Campus Outreach Lead', department: 'Administration', floor: 4, x: 2, y: 4, chairColor: '#9333ea', isAuri: false },
    { agent_id: 'jiya_research', name: 'Jiya', role: 'Technical Docs', department: 'Administration', floor: 4, x: 4, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'srijana_quality', name: 'Srijana', role: 'Quality Inspector', department: 'Administration', floor: 4, x: 6, y: 4, chairColor: '#10b981', isAuri: false },
    // Floor 5 - Technology & Infrastructure (Top Right)
    { agent_id: 'pratham_cto', name: 'Pratham', role: 'CTO & Tech Lead', department: 'Technology & Infrastructure', floor: 5, x: 2, y: 4, chairColor: '#0284c7', isAuri: false },
    { agent_id: 'mallika_tech', name: 'Mallika', role: 'API & DB Lead', department: 'Technology & Infrastructure', floor: 5, x: 4, y: 4, chairColor: '#10b981', isAuri: false },
    { agent_id: 'vaibhav_devops', name: 'Vaibhav', role: 'DevOps & Security', department: 'Technology & Infrastructure', floor: 5, x: 6, y: 4, chairColor: '#f59e0b', isAuri: false },
    { agent_id: 'faazil_sysadmin', name: 'Faazil', role: 'SysAdmin & Storage', department: 'Technology & Infrastructure', floor: 5, x: 5, y: 6, chairColor: '#6366f1', isAuri: false }
  ];

  // Persistent Initialization & Smooth Task Assignment Updates
  useEffect(() => {
    if (simRef.current.length === 0) {
      const list: CharacterSim[] = ALL_PERSONNEL_DESKS.map(d => {
        const real = agents.find(a => a.agent_id === d.agent_id);
        const acts = AGENT_WORK_ACTIVITIES[d.agent_id]?.desk || ["Performing assigned operations"];
        return {
          agent_id: d.agent_id,
          name: d.name,
          role: d.role,
          department: d.department,
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
          subStateTimer: Math.floor(Math.random() * 800) + 1200, // Calm long focus
          facing: 'SE',
          walkCycle: 0,
          bubbleText: undefined,
          bubbleTimer: 0,
          bubbleEmoji: d.isAuri ? "🤖" : "💻",
          currentActivity: acts[0]
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
              sim.bubbleText = "⚡ Task active! Stairs home";
              sim.bubbleTimer = 360;
            }
          } else if (Math.hypot(sim.curX - sim.deskX, sim.curY - sim.deskY) > 0.1) {
            sim.targetX = sim.deskX;
            sim.targetY = sim.deskY;
            sim.state = 'walking';
            sim.bubbleText = "⚡ Task active! Walking to desk";
            sim.bubbleTimer = 300;
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
      sim.bubbleTimer = 360;
      setActiveActionLog(`${sim.name} taking stairs: Floor ${pendingTransit.from_floor} ➔ Floor ${pendingTransit.to_floor} (${pendingTransit.purpose})`);
    }
  }, [pendingTransit]);

  // Handle incoming message bubbles
  useEffect(() => {
    if (recentMessages.length > 0) {
      const lastMsg = recentMessages[recentMessages.length - 1];
      const senderSim = simRef.current.find(s => s.agent_id === lastMsg.sender_id);
      if (senderSim) {
        senderSim.bubbleText = lastMsg.content.length > 36 ? lastMsg.content.slice(0, 36) + '...' : lastMsg.content;
        senderSim.bubbleEmoji = "💬";
        senderSim.bubbleTimer = 400; // 6.5s comfortable read
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
      sim.bubbleText = isCoffee ? "☕ Coffee break time!" : "🛋️ Taking a rest at lounge";
      sim.bubbleTimer = 360;
      sim.currentActivity = isCoffee ? "Grabbing coffee & recharging" : "Resting at floor lounge sofa";
    });
    setActiveActionLog("☕ Team break: Staff gathering at department refreshment bars.");
  };

  // Interactive Quick Command: Summon All to Desks
  const handleSummonToDesks = () => {
    simRef.current.forEach(sim => {
      const acts = AGENT_WORK_ACTIVITIES[sim.agent_id]?.desk || ["Focused workstation task"];
      sim.currentActivity = acts[0];

      if (sim.currentFloor !== sim.homeFloor) {
        sim.state = 'escalator_transit';
        sim.transitFromFloor = sim.currentFloor;
        sim.transitToFloor = sim.homeFloor;
        sim.transitProgress = 0.0;
        sim.bubbleText = `Stairs back to Floor ${sim.homeFloor}!`;
        sim.bubbleTimer = 360;
      } else {
        sim.state = 'walking';
        sim.targetX = sim.deskX;
        sim.targetY = sim.deskY;
        sim.bubbleText = "💻 Back to desk work";
        sim.bubbleTimer = 300;
      }
    });
    setActiveActionLog("💻 All employees focused at assigned workstations.");
  };

  // Navigate using stairs directly
  const handleUseStairs = (targetFloor: number) => {
    if (targetFloor < 0 || targetFloor > 5) return;
    const fromFloor = activeFloor;
    setActiveFloor(targetFloor);
    setActiveActionLog(`🪜 Used campus stairs: Floor ${fromFloor} ➔ Floor ${targetFloor} (${FLOOR_CONFIG[targetFloor]?.name})`);

    const mover = simRef.current.find(s => s.currentFloor === fromFloor);
    if (mover) {
      mover.state = 'escalator_transit';
      mover.transitFromFloor = fromFloor;
      mover.transitToFloor = targetFloor;
      mover.transitProgress = 0.0;
      mover.bubbleText = `🪜 Taking stairs to Floor ${targetFloor}!`;
      mover.bubbleTimer = 360;
    }
  };

  // Main Canvas Render & AI Update Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    // Architectural Multi-Tier Campus Coordinates
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
      // SHARED AGENT AI MOTION UPDATE (Calm Corporate Pacing)
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
              sim.bubbleTimer = 360;
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
        } else if (pacingMode !== 'paused') {
          // Autonomous calm corporate behavior
          sim.subStateTimer--;
          if (sim.subStateTimer <= 0) {
            // Calm Pacing: 35 to 75 seconds between decisions
            const intervalBase = pacingMode === 'calm' ? 2400 : 900;
            const intervalJitter = pacingMode === 'calm' ? 1800 : 600;
            sim.subStateTimer = Math.floor(Math.random() * intervalJitter) + intervalBase;

            const acts = AGENT_WORK_ACTIVITIES[sim.agent_id] || {
              desk: ["Working on assigned deliverables"],
              break: ["Coffee break at floor lounge"],
              visit: ["Syncing with colleague"]
            };

            // Count existing bubbles on this floor to avoid visual clutter
            const bubblesOnFloor = simList.filter(s => s.currentFloor === sim.currentFloor && s.bubbleTimer && s.bubbleTimer > 0).length;
            const canShowBubble = bubblesOnFloor < 1; // At most 1 bubble per floor

            if (sim.state === 'working_at_desk') {
              const roll = Math.random();
              if (roll < 0.10) {
                // Occasional Coffee Walk
                sim.targetX = 1.5;
                sim.targetY = 2.5;
                sim.state = 'walking';
                sim.currentActivity = acts.break[0] || "Grabbing fresh coffee";
                if (canShowBubble) {
                  sim.bubbleText = `☕ ${acts.break[0] || "Grabbing coffee"}`;
                  sim.bubbleTimer = 400; // 6.5s read
                }
              } else if (roll < 0.18) {
                // Occasional Lounge Rest
                sim.targetX = 5.5;
                sim.targetY = 1.5;
                sim.state = 'walking';
                sim.currentActivity = acts.break[1] || "Short rest on sofa";
                if (canShowBubble) {
                  sim.bubbleText = `🛋️ ${acts.break[1] || "Resting at lounge"}`;
                  sim.bubbleTimer = 400;
                }
              } else if (roll < 0.22) {
                // Rare Cross-Floor Collaboration via stairs
                const destFloor = (sim.homeFloor + 1) % 6;
                sim.state = 'escalator_transit';
                sim.transitFromFloor = sim.homeFloor;
                sim.transitToFloor = destFloor;
                sim.transitProgress = 0.0;
                sim.currentActivity = `Collaborating on Floor ${destFloor}`;
                if (canShowBubble) {
                  sim.bubbleText = `🪜 Stairs to Floor ${destFloor}`;
                  sim.bubbleTimer = 420;
                }
                setActiveActionLog(`${sim.name} taking stairs to Floor ${destFloor} for departmental alignment.`);
              } else {
                // Deep Work Focus (80% of time)
                sim.state = 'working_at_desk';
                const nextAct = acts.desk[Math.floor(Math.random() * acts.desk.length)];
                sim.currentActivity = nextAct;
                if (canShowBubble && Math.random() < 0.4) {
                  sim.bubbleText = nextAct.length > 34 ? nextAct.slice(0, 34) + '...' : nextAct;
                  sim.bubbleTimer = 420; // 7s read time
                }
              }
            } else if (sim.state === 'drinking_coffee' || sim.state === 'sitting_on_sofa' || sim.state === 'visiting_colleague') {
              // Finish break and return to desk
              if (sim.currentFloor !== sim.homeFloor) {
                sim.state = 'escalator_transit';
                sim.transitFromFloor = sim.currentFloor;
                sim.transitToFloor = sim.homeFloor;
                sim.transitProgress = 0.0;
                sim.currentActivity = `Returning to Floor ${sim.homeFloor}`;
                if (canShowBubble) {
                  sim.bubbleText = `Stairs back to Floor ${sim.homeFloor}`;
                  sim.bubbleTimer = 360;
                }
              } else {
                sim.targetX = sim.deskX;
                sim.targetY = sim.deskY;
                sim.state = 'walking';
                const nextAct = acts.desk[0];
                sim.currentActivity = nextAct;
                if (canShowBubble) {
                  sim.bubbleText = "💻 Resuming focused work";
                  sim.bubbleTimer = 360;
                }
              }
            }
          }
        }

        // Handle Staircase / Escalator Transit
        if (sim.state === 'escalator_transit' && sim.transitFromFloor !== undefined && sim.transitToFloor !== undefined) {
          const transitSpeed = pacingMode === 'calm' ? 0.009 : 0.016;
          sim.transitProgress = (sim.transitProgress || 0) + transitSpeed;
          if (sim.transitProgress >= 1.0) {
            sim.currentFloor = sim.transitToFloor;
            sim.state = sim.currentFloor === sim.homeFloor ? 'working_at_desk' : 'visiting_colleague';
            sim.curX = sim.currentFloor === sim.homeFloor ? sim.deskX : 3.5;
            sim.curY = sim.currentFloor === sim.homeFloor ? sim.deskY : 3.5;
            sim.bubbleText = sim.currentFloor === sim.homeFloor ? "Back at desk!" : `Arrived on Floor ${sim.currentFloor}!`;
            sim.bubbleTimer = 360;
            sim.subStateTimer = 2400; // Settle peacefully on destination
          }
        }

        // Handle Walking Interpolation with Natural Gentle Speed
        if (sim.state === 'walking') {
          const dx = sim.targetX - sim.curX;
          const dy = sim.targetY - sim.curY;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.06) {
            const speed = pacingMode === 'calm' ? 0.016 : 0.028; // Gentle, realistic walking speed
            sim.curX += (dx / dist) * speed;
            sim.curY += (dy / dist) * speed;
            sim.facing = dx >= 0 ? 'SE' : 'SW';
            sim.walkCycle = (sim.walkCycle + 0.16) % 4;
          } else {
            sim.curX = sim.targetX;
            sim.curY = sim.targetY;
            sim.walkCycle = 0;

            if (Math.hypot(sim.curX - sim.deskX, sim.curY - sim.deskY) < 0.2) {
              sim.state = 'working_at_desk';
              sim.facing = 'SE';
            } else if (Math.hypot(sim.curX - 1.5, sim.curY - 2.5) < 0.5) {
              sim.state = 'drinking_coffee';
              sim.subStateTimer = 1800; // Savor coffee for 30s
            } else if (Math.hypot(sim.curX - 5.5, sim.curY - 1.5) < 0.5) {
              sim.state = 'sitting_on_sofa';
              sim.subStateTimer = 1800; // Rest on sofa for 30s
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
            const ratio = ((s / stepCount) + (tick * 0.006)) % 1.0;
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
                ctx.fillStyle = alt ? '#78350f' : '#92400e';
              } else if (fl === 1) {
                ctx.fillStyle = alt ? '#d97706' : '#b45309';
              } else if (fl === 2) {
                ctx.fillStyle = alt ? '#065f46' : '#047857';
              } else if (fl === 3) {
                ctx.fillStyle = alt ? '#1e293b' : '#334155';
              } else if (fl === 4) {
                ctx.fillStyle = alt ? '#f1f5f9' : '#e2e8f0';
              } else {
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
            const cPos = toTowerScreen(1, 3.5, 3.5);
            ctx.fillStyle = '#0284c799';
            ctx.beginPath();
            ctx.ellipse(cPos.x, cPos.y + 10, 36, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (fl === 2) {
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
            const cPos = toTowerScreen(3, 3.5, 3.5);
            ctx.fillStyle = '#f59e0b55';
            ctx.beginPath();
            ctx.ellipse(cPos.x, cPos.y + 10, 36, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (fl === 4) {
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
          const bounceY = isWalking ? Math.sin(sim.walkCycle * Math.PI) * 2.0 : 0;
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
        // VIEW MODE: SINGLE FLOOR FOCUS (Decorated with Real Stairs & Focused Props)
        // ==========================================
        const originX = canvas.width / 2;
        const originY = 110;

        const toScreen = (gx: number, gy: number, gz: number = 0) => {
          const sx = originX + (gx - gy) * (TILE_W / 2);
          const sy = originY + (gx + gy) * (TILE_H / 2) - gz;
          return { x: sx, y: sy };
        };

        // 1. LEFT WALL
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

        ctx.fillStyle = '#020617';
        ctx.fillRect(stairP.x - 50, stairP.y - 20, 100, 42);
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(stairP.x - 50, stairP.y - 20, 100, 42);

        for (let st = 0; st < 6; st++) {
          ctx.fillStyle = st % 2 === 0 ? '#713f12' : '#ca8a04';
          ctx.fillRect(stairP.x - 42 + st * 14, stairP.y - 12 + st * 4, 12, 6);
        }

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(stairP.x - 45, stairP.y - 14);
        ctx.lineTo(stairP.x + 45, stairP.y + 12);
        ctx.stroke();

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
          const bounceY = isWalking ? Math.sin(sim.walkCycle * Math.PI) * 2.5 : 0;
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
  }, [viewMode, activeFloor, agents, orbiState, pacingMode]);

  // Track Mouse Movement for Live Agent Hover Inspector
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / zoom;
    const cy = (e.clientY - rect.top) / zoom;

    const originX = canvas.width / 2;
    const originY = 110;

    let foundSim: CharacterSim | null = null;
    let foundScreenPos = { x: 0, y: 0 };

    for (const sim of simRef.current) {
      let sx = 0;
      let sy = 0;

      if (viewMode === 'multi_tower') {
        const TOWER_FLOORS: Record<number, { x: number; y: number }> = {
          0: { x: 330, y: 570 },
          1: { x: 890, y: 570 },
          2: { x: 330, y: 360 },
          3: { x: 890, y: 360 },
          4: { x: 330, y: 150 },
          5: { x: 890, y: 150 }
        };
        const base = TOWER_FLOORS[sim.currentFloor] || TOWER_FLOORS[0];
        sx = base.x + (sim.curX - sim.curY) * (TILE_W / 2);
        sy = base.y + (sim.curX + sim.curY) * (TILE_H / 2);
      } else {
        if (sim.currentFloor !== activeFloor) continue;
        sx = originX + (sim.curX - sim.curY) * (TILE_W / 2);
        sy = originY + (sim.curX + sim.curY) * (TILE_H / 2);
      }

      if (Math.hypot(cx - sx, cy - sy) < 28) {
        foundSim = sim;
        foundScreenPos = { x: sx, y: sy };
        break;
      }
    }

    if (foundSim) {
      setHoveredAgent({
        agent_id: foundSim.agent_id,
        name: foundSim.name,
        role: foundSim.role,
        department: foundSim.department,
        floor: foundSim.currentFloor,
        state: foundSim.state,
        currentActivity: foundSim.currentActivity,
        screenX: foundScreenPos.x,
        screenY: foundScreenPos.y
      });
    } else {
      setHoveredAgent(null);
    }
  };

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

      // Stairs Up Hitbox
      if (activeFloor < 5 && Math.hypot(cx - stairSx, cy - (stairSy - 30)) < 35) {
        handleUseStairs(activeFloor + 1);
        return;
      }
      // Stairs Down Hitbox
      if (activeFloor > 0 && Math.hypot(cx - stairSx, cy - (stairSy + 30)) < 35) {
        handleUseStairs(activeFloor - 1);
        return;
      }
    }

    // Inspect character if clicked near any agent
    for (const sim of simRef.current) {
      if (sim.currentFloor === activeFloor || viewMode === 'multi_tower') {
        const fullAgent = agents.find(a => a.agent_id === sim.agent_id);
        if (fullAgent && hoveredAgent?.agent_id === sim.agent_id) {
          onSelectAgent(fullAgent);
          setActiveActionLog(`Inspecting Dossier: ${fullAgent.name} (${fullAgent.role})`);
          return;
        }
      }
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'working_at_desk':
        return { label: 'Focused Deep Work', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'drinking_coffee':
        return { label: 'Coffee Break', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'sitting_on_sofa':
        return { label: 'Lounge Rest', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'escalator_transit':
        return { label: 'Stair Transit', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'walking':
        return { label: 'In Transit', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      default:
        return { label: 'Active', color: 'bg-slate-700 text-slate-300 border-slate-600' };
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
          {/* Pacing Speed Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setPacingMode('calm');
                setActiveActionLog("Calm Pacing: Employees focused at desks with readable 7s thought bubbles.");
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                pacingMode === 'calm'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Long focused work intervals, gentle movement, readable bubbles"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Calm Focus</span>
            </button>

            <button
              onClick={() => {
                setPacingMode('active');
                setActiveActionLog("Active Pacing: Moderate walk intervals.");
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                pacingMode === 'active'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Moderate movement intervals"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Active</span>
            </button>

            <button
              onClick={() => {
                setPacingMode('paused');
                setActiveActionLog("Mobility Paused: Employees fixed at workstations for quiet inspection.");
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                pacingMode === 'paused'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pause all autonomous roaming"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          </div>

          {/* Direct Interactive Staircase Navigation */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
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
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handleTriggerTeamBreak}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:bg-amber-500/20 flex items-center space-x-1 transition-colors"
              title="Send agents to coffee & sofa lounge"
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Coffee Break</span>
            </button>
            <button
              onClick={handleSummonToDesks}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 flex items-center space-x-1 transition-colors"
              title="Call all agents back to workstations"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Back to Work</span>
            </button>
          </div>

          {/* View Preference Switcher (Modern Isometric Cutaway vs Legacy Tower) */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setViewPreference('isometric');
                setViewMode('floor_focus');
                setActiveFloor(0);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1 ${
                viewPreference === 'isometric'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="2:1 Isometric Cutaway Room (Screenshot 2 Match)"
            >
              <span>🏢 Isometric Room</span>
            </button>
            <button
              onClick={() => setViewPreference('legacy')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1 ${
                viewPreference === 'legacy'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}
              title="Legacy Diamond Tower View (?view=legacy)"
            >
              <span>📐 Legacy View</span>
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
                  className={`px-2 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
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
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center space-x-1.5 transition-all shadow-md shadow-cyan-600/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comms</span>
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

      {/* Main Viewport: Modern Isometric Cutaway Rooms (Floor 0, Floor 1) vs Legacy Diamond Canvas */}
      {viewPreference === 'isometric' && activeFloor === 0 && viewMode === 'floor_focus' ? (
        <div className="relative flex-1 w-full h-full overflow-hidden bg-[#E6E9F5]">
          <Floor0IsometricRoom
            agents={agents}
            onSelectAgent={onSelectAgent}
            orbiState={orbiState}
            onNavigateFloor={(floor) => setActiveFloor(floor)}
          />
        </div>
      ) : viewPreference === 'isometric' && activeFloor === 1 && viewMode === 'floor_focus' ? (
        <div className="relative flex-1 w-full h-full overflow-hidden bg-[#E6E9F5]">
          <Floor1IsometricRoom
            agents={agents}
            onSelectAgent={onSelectAgent}
            orbiState={orbiState}
            onNavigateFloor={(floor) => setActiveFloor(floor)}
          />
        </div>
      ) : (
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
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredAgent(null)}
              className="rounded-2xl border-4 border-slate-800/90 shadow-2xl bg-[#080c16] cursor-pointer"
            />

            {/* Floating Hover Activity Inspector Card */}
            {hoveredAgent && (
              <div 
                className="absolute pointer-events-none z-30 transition-all duration-75"
                style={{ 
                  left: `${hoveredAgent.screenX}px`, 
                  top: `${hoveredAgent.screenY - 84}px`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <div className="bg-slate-950/95 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md w-72 text-left space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <div>
                      <div className="font-bold text-xs text-white flex items-center space-x-1.5">
                        <span>{hoveredAgent.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Floor {hoveredAgent.floor}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{hoveredAgent.role}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getStatusBadge(hoveredAgent.state).color}`}>
                      {getStatusBadge(hoveredAgent.state).label}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-200 bg-slate-900/90 p-2 rounded-lg border border-slate-800 space-y-0.5">
                    <div className="text-[9px] font-mono text-orange-400 font-bold uppercase tracking-wider">CURRENT FOCUS:</div>
                    <div className="leading-snug">{hoveredAgent.currentActivity}</div>
                  </div>

                  <div className="text-[9px] text-slate-500 font-mono text-center">
                    Click agent to open personnel dossier & history
                  </div>
                </div>
              </div>
            )}

            {/* Live Action Ticker at bottom */}
            <div className="absolute bottom-5 left-6 bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-4 text-[11px] font-mono text-slate-400 pointer-events-none backdrop-blur-sm">
              <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>LIVE HQ FOCUS:</span>
              </span>
              <span className="text-slate-200">
                {hoveredAgent 
                  ? `${hoveredAgent.name} (${hoveredAgent.role}): ${hoveredAgent.currentActivity}` 
                  : activeActionLog
                }
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">
                {pacingMode === 'paused' ? 'Mobility Paused' : pacingMode === 'calm' ? 'Calm Focus Active (7s Read)' : 'Active Flow'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
