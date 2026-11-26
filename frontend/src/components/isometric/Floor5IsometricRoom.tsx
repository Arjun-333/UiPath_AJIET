import React from 'react';
import { Agent } from '../../types';
import {
  createExecutiveDesk,
  createVideoEditingDesk,
  createErgonomicChair,
  createMeetingTable,
  createStudioBookcase,
  createStudioCoffeeBar,
  createLoungeSofa,
  createPottedTree,
  createStaircaseDown,
  RenderItem
} from './isoEngine';
import { AgentPositionInfo } from './Floor0IsometricRoom';
import { IsometricRoomBase, SimAgentConfig } from './IsometricRoomBase';

interface Props {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  orbiState: string;
  onNavigateFloor?: (floor: number) => void;
  zoom?: number;
  pan?: { x: number; y: number };
  pacingMode?: 'calm' | 'break' | 'active' | 'paused';
  skipBakedLabels?: boolean;
  onAgentPositionsUpdate?: (positions: AgentPositionInfo[]) => void;
}

const FLOOR5_AGENTS: SimAgentConfig[] = [
  {
    id: 'pratham_cto',
    name: 'Pratham (CTO)',
    role: 'Chief Technology Officer & Technical Architecture Lead',
    avatarFile: 'pratham_cto.png',
    statusText: 'Architecting Distributed Agent Runtime',
    deskPos: { gx: 3.6, gy: 2.2 },
    loungePos: { gx: 7.4, gy: 10.8 },
    facing: 'SE'
  },
  {
    id: 'mallika_tech',
    name: 'Mallika (API/DB)',
    role: 'Lead API & Database Systems Manager',
    avatarFile: 'mallika_tech.png',
    statusText: 'Optimizing FastAPI & SQLite Telemetry',
    deskPos: { gx: 9.8, gy: 2.2 },
    loungePos: { gx: 8.6, gy: 10.8 },
    facing: 'NW'
  },
  {
    id: 'vaibhav_devops',
    name: 'Vaibhav (DevOps)',
    role: 'DevOps & Infrastructure Security Supervisor',
    avatarFile: 'vaibhav_devops.png',
    statusText: 'Monitoring CI/CD & Service Health',
    deskPos: { gx: 9.8, gy: 7.2 },
    loungePos: { gx: 9.8, gy: 10.8 },
    facing: 'NW'
  },
  {
    id: 'faazil_sysadmin',
    name: 'Faazil (SysAdmin)',
    role: 'Lead System Administrator & Storage Infrastructure',
    avatarFile: 'faazil_sysadmin.png',
    statusText: 'Managing Media Vault & GPU Storage',
    deskPos: { gx: 4.8, gy: 6.2 },
    loungePos: { gx: 8.0, gy: 11.4 },
    facing: 'SE'
  }
];

export const Floor5IsometricRoom: React.FC<Props> = (props) => {
  const buildFurniture = (queue: RenderItem[], simAgents: { id: string; isSeated: boolean }[]) => {
    const pratham = simAgents.find(a => a.id === 'pratham_cto');
    const mallika = simAgents.find(a => a.id === 'mallika_tech');
    const vaibhav = simAgents.find(a => a.id === 'vaibhav_devops');
    const faazil = simAgents.find(a => a.id === 'faazil_sysadmin');

    // Server & Storage Racks along back wall
    queue.push(createStudioBookcase(0.8, 1.2, 1.4, 0.6, 62));
    queue.push(createStudioBookcase(11.8, 1.2, 1.4, 0.6, 62));

    // Pratham's CTO Command Desk
    queue.push(createExecutiveDesk(2.4, 1.4, 3.2, 1.3, 38));
    queue.push(createErgonomicChair(3.6, 2.2, pratham?.isSeated));

    // Mallika's API & DB Engineering Console
    queue.push(createVideoEditingDesk(8.4, 1.4, 3.0, 1.3, 38));
    queue.push(createErgonomicChair(9.8, 2.2, mallika?.isSeated));

    // Vaibhav's DevOps Security Console
    queue.push(createVideoEditingDesk(8.6, 6.4, 3.0, 1.3, 38));
    queue.push(createErgonomicChair(9.8, 7.2, vaibhav?.isSeated));

    // Faazil's SysAdmin & Storage Desk
    queue.push(createVideoEditingDesk(3.6, 5.4, 3.0, 1.3, 38));
    queue.push(createErgonomicChair(4.8, 6.2, faazil?.isSeated));

    // Architecture & Incident War-Room Table (clear of staircase landing)
    queue.push(createMeetingTable(3.8, 9.2, 2.8, 1.5));

    // Penthouse Lounge & Coffee Bar
    queue.push(createStudioCoffeeBar(11.8, 9.8, 1.6, 1.0, 36));
    queue.push(createLoungeSofa(7.2, 10.2, 2.8, 1.2));

    // Staircase Down to Floor 4 (Top Floor — no upward stairs)
    queue.push(...createStaircaseDown(0.2, 8.5, 13.0, 4, '▼ TO FLOOR 4: DOCS & CAMPUS HUB'));

    // Framing Potted Greenery
    queue.push(createPottedTree(6.2, 1.2));
    queue.push(createPottedTree(0.8, 5.2));
    queue.push(createPottedTree(13.0, 8.6));
    queue.push(createPottedTree(1.6, 13.2));
    queue.push(createPottedTree(13.2, 13.2));
  };

  return (
    <IsometricRoomBase
      {...props}
      floorNumber={5}
      departmentName="Technology & Infrastructure"
      defaultSkills={['System Architecture', 'FastAPI & SQLite', 'DevOps & Storage']}
      defaultTools={['WebSocket Telemetry', 'Docker & CI/CD', 'Media Vault Storage']}
      initialAgents={FLOOR5_AGENTS}
      buildFurniture={buildFurniture}
      stairsDown={{ targetFloor: 4, badgeText: '▼ DESCEND TO FLOOR 4 (DOCS & CAMPUS HUB) • CLICK TO TRANSIT' }}
    />
  );
};
