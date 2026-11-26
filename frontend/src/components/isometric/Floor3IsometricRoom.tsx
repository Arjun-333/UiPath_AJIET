import React from 'react';
import { Agent } from '../../types';
import {
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

const FLOOR3_AGENTS: SimAgentConfig[] = [
  {
    id: 'tarun_qa',
    name: 'Tarun (QA Lead)',
    role: 'Lead Video Defect Inspector & QA Specialist',
    avatarFile: 'tarun_qa.png',
    statusText: 'Inspecting Render Frame Integrity & Sync',
    deskPos: { gx: 3.6, gy: 2.2 },
    loungePos: { gx: 7.8, gy: 10.8 },
    facing: 'SE'
  },
  {
    id: 'kavya_compliance',
    name: 'Kavya (Compliance)',
    role: 'Audio, Subtitle & Margin Compliance Inspector',
    avatarFile: 'kavya_compliance.png',
    statusText: 'Auditing Audio LUFS & Subtitle Safe Zones',
    deskPos: { gx: 9.8, gy: 2.2 },
    loungePos: { gx: 9.0, gy: 10.8 },
    facing: 'NW'
  }
];

export const Floor3IsometricRoom: React.FC<Props> = (props) => {
  const buildFurniture = (queue: RenderItem[], simAgents: { id: string; isSeated: boolean }[]) => {
    const tarun = simAgents.find(a => a.id === 'tarun_qa');
    const kavya = simAgents.find(a => a.id === 'kavya_compliance');

    // QA Reference & Standards Archive
    queue.push(createStudioBookcase(0.8, 1.2, 1.4, 0.6, 62));

    // Tarun's Multi-Monitor Defect Inspection Suite
    queue.push(createVideoEditingDesk(2.4, 1.4, 3.2, 1.3, 38));
    queue.push(createErgonomicChair(3.6, 2.2, tarun?.isSeated));

    // Kavya's Audio & Subtitle Compliance Suite
    queue.push(createDesignDesk(8.4, 1.4, 3.0, 1.3, 38));
    queue.push(createErgonomicChair(9.8, 2.2, kavya?.isSeated));

    // Optical Calibration & QA Test Rig
    queue.push(createStudioCamera(6.4, 5.4, 'NE'));
    queue.push(createStudioSoftboxLight(5.0, 4.6));
    queue.push(createStudioSoftboxLight(8.0, 7.0));

    // Defect Review & Calibration Table
    queue.push(createMeetingTable(2.2, 6.2, 3.4, 2.0));
    queue.push(createErgonomicChair(2.8, 5.4, false));
    queue.push(createErgonomicChair(4.6, 5.4, false));
    queue.push(createErgonomicChair(2.8, 8.6, false));
    queue.push(createErgonomicChair(4.6, 8.6, false));

    // Automated QA Diagnostics Console
    queue.push(createVideoEditingDesk(8.6, 6.4, 3.0, 1.3, 38));

    // Lounge & Refreshments
    queue.push(createStudioCoffeeBar(11.8, 9.8, 1.6, 1.0, 36));
    queue.push(createLoungeSofa(7.2, 10.2, 2.8, 1.2));

    // Staircases
    queue.push(...createStaircaseDown(0.2, 8.5, 13.0, 2, '▼ TO FLOOR 2: MARKETING & GROWTH'));
    queue.push(...createStaircaseUpAlongLeftWall(0.2, 13.0, 8.5, 4, '▲ TO FLOOR 4: DOCS & CAMPUS HUB'));

    // Framing Potted Greenery
    queue.push(createPottedTree(5.8, 1.2));
    queue.push(createPottedTree(0.8, 5.2));
    queue.push(createPottedTree(13.0, 8.6));
    queue.push(createPottedTree(1.6, 13.2));
    queue.push(createPottedTree(13.2, 13.2));
  };

  return (
    <IsometricRoomBase
      {...props}
      floorNumber={3}
      departmentName="AI Video Quality & QA Lab"
      defaultSkills={['Frame Defect Detection', 'Audio LUFS QA', 'Subtitle Safe Zones']}
      defaultTools={['Nemotron Video QA', 'FFprobe Analyzer', 'Auto-Repair Pipeline']}
      initialAgents={FLOOR3_AGENTS}
      buildFurniture={buildFurniture}
      stairsDown={{ targetFloor: 2, badgeText: '▼ DESCEND TO FLOOR 2 (MARKETING & GROWTH) • CLICK TO TRANSIT' }}
      stairsUp={{ targetFloor: 4, badgeText: '▲ ASCEND TO FLOOR 4 (DOCS & CAMPUS HUB) • CLICK TO TRANSIT' }}
    />
  );
};
