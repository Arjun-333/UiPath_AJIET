import React from 'react';
import { Agent } from '../../types';
import {
  createExecutiveDesk,
  createDesignDesk,
  createErgonomicChair,
  createFilingCabinetWithCat,
  createMeetingTable,
  createStudioBookcase,
  createStudioCoffeeBar,
  createLoungeSofa,
  createPottedTree,
  createStaircaseDown,
  createStaircaseUpAlongLeftWall,
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
  pacingMode?: 'calm' | 'break' | 'active';
  skipBakedLabels?: boolean;
  onAgentPositionsUpdate?: (positions: AgentPositionInfo[]) => void;
}

const FLOOR4_AGENTS: SimAgentConfig[] = [
  {
    id: 'iffah_doc',
    name: 'Iffah (Outreach)',
    role: 'Lead Documentation & Campus Outreach Lead',
    avatarFile: 'iffah_doc.png',
    statusText: 'Coordinating AJIET Campus Campaigns',
    deskPos: { gx: 3.6, gy: 2.2 },
    loungePos: { gx: 7.8, gy: 10.8 },
    facing: 'SE'
  },
  {
    id: 'jiya_research',
    name: 'Jiya (Research)',
    role: 'Research & Technical Documentation Specialist',
    avatarFile: 'jiya_research.png',
    statusText: 'Compiling Technical Guides & SOPs',
    deskPos: { gx: 9.8, gy: 2.2 },
    loungePos: { gx: 9.0, gy: 10.8 },
    facing: 'NW'
  },
  {
    id: 'srijana_quality',
    name: 'Srijana (Quality)',
    role: 'Quality & Compliance Inspector',
    avatarFile: 'srijana_quality.png',
    statusText: 'Verifying Documentation & Policy Compliance',
    deskPos: { gx: 9.8, gy: 7.2 },
    loungePos: { gx: 8.4, gy: 11.4 },
    facing: 'NW'
  }
];

export const Floor4IsometricRoom: React.FC<Props> = (props) => {
  const buildFurniture = (queue: RenderItem[], simAgents: { id: string; isSeated: boolean }[]) => {
    const iffah = simAgents.find(a => a.id === 'iffah_doc');
    const jiya = simAgents.find(a => a.id === 'jiya_research');
    const srijana = simAgents.find(a => a.id === 'srijana_quality');

    // Documentation & Research Library
    queue.push(createStudioBookcase(0.8, 1.2, 1.4, 0.6, 62));
    queue.push(createFilingCabinetWithCat(1.2, 4.4));

    // Iffah's Outreach Lead Desk
    queue.push(createExecutiveDesk(2.4, 1.4, 3.0, 1.3, 38));
    queue.push(createErgonomicChair(3.6, 2.2, iffah?.isSeated));

    // Jiya's Technical Docs Desk
    queue.push(createDesignDesk(8.4, 1.4, 3.0, 1.3, 38));
    queue.push(createErgonomicChair(9.8, 2.2, jiya?.isSeated));

    // Srijana's Compliance Review Desk
    queue.push(createDesignDesk(8.6, 6.4, 3.0, 1.3, 38));
    queue.push(createErgonomicChair(9.8, 7.2, srijana?.isSeated));

    // Campus Outreach & Editorial Review Table
    queue.push(createMeetingTable(2.4, 6.2, 3.4, 2.0));
    queue.push(createErgonomicChair(3.0, 5.4, false));
    queue.push(createErgonomicChair(4.8, 5.4, false));
    queue.push(createErgonomicChair(3.0, 8.6, false));
    queue.push(createErgonomicChair(4.8, 8.6, false));

    // Lounge & Refreshments
    queue.push(createStudioCoffeeBar(11.8, 9.8, 1.6, 1.0, 36));
    queue.push(createLoungeSofa(7.2, 10.2, 2.8, 1.2));

    // Staircases
    queue.push(...createStaircaseDown(0.2, 8.5, 13.0, 3, '▼ TO FLOOR 3: AI VIDEO QA LAB'));
    queue.push(...createStaircaseUpAlongLeftWall(0.2, 13.0, 8.5, 5, '▲ TO FLOOR 5: TECH & CLOUD'));

    // Framing Potted Greenery
    queue.push(createPottedTree(5.8, 1.2));
    queue.push(createPottedTree(0.8, 6.2));
    queue.push(createPottedTree(13.0, 8.6));
    queue.push(createPottedTree(1.6, 13.2));
    queue.push(createPottedTree(13.2, 13.2));
  };

  return (
    <IsometricRoomBase
      {...props}
      floorNumber={4}
      departmentName="Administration & Campus Hub"
      defaultSkills={['Technical Writing', 'Campus Outreach', 'Compliance Review']}
      defaultTools={['Docs Knowledge Base', 'AJIET Outreach CRM', 'Policy Auditor']}
      initialAgents={FLOOR4_AGENTS}
      buildFurniture={buildFurniture}
      stairsDown={{ targetFloor: 3, badgeText: '▼ DESCEND TO FLOOR 3 (AI VIDEO QA LAB) • CLICK TO TRANSIT' }}
      stairsUp={{ targetFloor: 5, badgeText: '▲ ASCEND TO FLOOR 5 (TECH & CLOUD) • CLICK TO TRANSIT' }}
    />
  );
};
