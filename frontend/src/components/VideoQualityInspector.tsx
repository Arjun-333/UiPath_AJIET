import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, AlertTriangle, CheckCircle, ShieldAlert, Wrench, 
  Sparkles, RefreshCw, Layers, Film, Clock, MessageSquare, Award,
  ChevronRight, Volume2, Eye, FileText, Check, AlertOctagon
} from 'lucide-react';

interface Defect {
  defect_id: string;
  scene_id: string;
  timestamp_range: [number, number];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'visual' | 'audio' | 'subtitle' | 'story' | 'technical';
  explanation: string;
  evidence: Record<string, any>;
  recommended_correction: string;
  responsible_agent: string;
  correction_status: string;
}

interface Scene {
  scene_id: string;
  scene_number: number;
  chapter: string;
  title: string;
  narration: string;
  visual_type: string;
  start_timestamp: number;
  end_timestamp: number;
  duration: number;
  voiceover_asset?: string;
  generation_history?: Array<{ action: string; timestamp: string }>;
}

interface Manifest {
  project_id: string;
  title: string;
  status: string;
  total_duration: number;
  quality_score: number;
  score_breakdown: {
    visual_quality: number;
    audio_quality: number;
    story_alignment: number;
    subtitle_quality: number;
    technical_quality: number;
    branding_presentation: number;
  };
  repair_attempts: number;
  scenes: Scene[];
  defects: Defect[];
}

interface Props {
  projectId: string;
  onClose?: () => void;
}

export const VideoQualityInspector: React.FC<Props> = ({ projectId, onClose }) => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [repairing, setRepairing] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [manualRequest, setManualRequest] = useState<string>('');
  const [manualType, setManualType] = useState<string>('visual');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fetchManifest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/manifest`);
      if (res.ok) {
        const data = await res.json();
        setManifest(data);
        if (data.scenes && data.scenes.length > 0) {
          setSelectedScene(data.scenes[0]);
        }
      }
    } catch (err) {
      console.error("Error loading manifest:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifest();
  }, [projectId]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const jumpToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTriggerRepair = async () => {
    try {
      setRepairing(true);
      setActionFeedback("⚡ Srijana & Darshan launching autonomous scene repair loop...");
      const res = await fetch(`/api/projects/${projectId}/qa/repair`, { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setActionFeedback("✅ Autonomous repair successful! All scenes revalidated.");
      } else {
        setActionFeedback(`⚠️ Repair completed. Remaining defects: ${result.remaining_defects}`);
      }
      await fetchManifest();
    } catch (err) {
      setActionFeedback("Error triggering repair.");
    } finally {
      setRepairing(false);
    }
  };

  const handleManualCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScene || !manualRequest.trim()) return;

    try {
      setActionFeedback(`⚡ Dispatching correction for ${selectedScene.scene_id}...`);
      const res = await fetch(`/api/projects/${projectId}/qa/manual_correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scene_id: selectedScene.scene_id,
          request_text: manualRequest,
          instruction_type: manualType
        })
      });
      if (res.ok) {
        setManualRequest('');
        setActionFeedback(`✅ Scene ${selectedScene.scene_id} repaired according to CEO instructions!`);
        await fetchManifest();
      }
    } catch (err) {
      setActionFeedback("Error sending manual correction.");
    }
  };

  if (loading && !manifest) {
    return (
      <div className="flex items-center justify-center h-full p-12 text-slate-400 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-orange-500" />
        <span>Loading Video Production Manifest & QA Inspection...</span>
      </div>
    );
  }

  const score = manifest?.quality_score || 0;
  const breakdown = manifest?.score_breakdown || {
    visual_quality: 0,
    audio_quality: 0,
    story_alignment: 0,
    subtitle_quality: 0,
    technical_quality: 0,
    branding_presentation: 0
  };

  const defects = manifest?.defects || [];
  const criticalDefects = defects.filter(d => d.severity === 'CRITICAL');
  const isApproved = manifest?.status === 'quality_approved' || (score >= 80 && criticalDefects.length === 0);

  return (
    <div className="flex flex-col h-full bg-[#0b0f17] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-orange-600/20 border border-orange-500/40 rounded-xl text-orange-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-xs text-orange-400">QA LAB //</span>
              <h2 className="text-base font-bold text-white">Autonomous Video Inspection & Quality Gate</h2>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}>
                {manifest?.status?.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Project ID: {projectId} | Inspected by Srijana (Floor 4) & Darshan (Floor 1)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTriggerRepair}
            disabled={repairing}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-orange-600 hover:bg-orange-500 text-white flex items-center space-x-2 transition-all shadow-md shadow-orange-600/20 disabled:opacity-50"
          >
            <Wrench className={`w-3.5 h-3.5 ${repairing ? 'animate-spin' : ''}`} />
            <span>{repairing ? 'Autonomous Repair Running...' : 'Autonomous Scene Repair'}</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div className="bg-slate-950 border-b border-orange-500/30 px-6 py-2 text-xs font-mono text-orange-300 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Grid Viewport */}
      <div className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-y-auto">
        {/* Left Column: Player & Interactive Timeline (7 cols) */}
        <div className="col-span-7 flex flex-col space-y-4">
          {/* 16:9 Video Player */}
          <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl aspect-video">
            <video
              ref={videoRef}
              src={`/media/${projectId}/master_16x9.mp4`}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              controls
            />
          </div>

          {/* Timestamped Defect Scrubbing Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                <span>SCENE TIMELINE & DEFECT MARKERS:</span>
              </span>
              <span className="text-white font-bold">{currentTime.toFixed(1)}s / {manifest?.total_duration || 0}s</span>
            </div>

            {/* Interactive Timeline Bar with Scene Blocks */}
            <div className="relative h-8 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex">
              {(manifest?.scenes || []).map((sc, idx) => {
                const totalDur = manifest?.total_duration || 100;
                const widthPct = (sc.duration / totalDur) * 100;
                const isSelected = selectedScene?.scene_id === sc.scene_id;
                const sceneDefects = defects.filter(d => d.scene_id === sc.scene_id);
                const hasCritical = sceneDefects.some(d => d.severity === 'CRITICAL');

                return (
                  <div
                    key={sc.scene_id}
                    onClick={() => {
                      setSelectedScene(sc);
                      jumpToTimestamp(sc.start_timestamp);
                    }}
                    style={{ width: `${widthPct}%` }}
                    className={`h-full border-r border-slate-800/80 cursor-pointer transition-all flex items-center justify-center text-[10px] font-mono relative group ${
                      hasCritical ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300' :
                      sceneDefects.length > 0 ? 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300' :
                      'bg-slate-900 hover:bg-slate-800 text-slate-300'
                    } ${isSelected ? 'ring-2 ring-orange-500 z-10' : ''}`}
                    title={`${sc.chapter}: ${sc.title} (${sc.duration}s)`}
                  >
                    <span>S{idx + 1}</span>
                    {sceneDefects.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Jump to Defect Buttons */}
            {defects.length > 0 && (
              <div className="flex items-center space-x-2 overflow-x-auto pt-1">
                <span className="text-[11px] font-mono text-slate-500 shrink-0">Click to Inspect Defect:</span>
                {defects.map((def, idx) => (
                  <button
                    key={def.defect_id}
                    onClick={() => jumpToTimestamp(def.timestamp_range[0])}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1 shrink-0 ${
                      def.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                      def.severity === 'HIGH' ? 'bg-amber-600 text-white' :
                      'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>#{idx + 1} {def.category.toUpperCase()} ({def.timestamp_range[0].toFixed(1)}s)</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CEO Manual Correction Dispatch Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-orange-400 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>CEO MANUAL SCENE CORRECTION:</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Target: {selectedScene ? `${selectedScene.scene_id} (${selectedScene.title})` : 'Select a Scene'}
              </span>
            </div>

            <form onSubmit={handleManualCorrection} className="space-y-3">
              <div className="flex items-center space-x-2">
                {['visual', 'narration', 'subtitle', 'transition'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setManualType(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold capitalize transition-all ${
                      manualType === t ? 'bg-orange-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={manualRequest}
                  onChange={(e) => setManualRequest(e.target.value)}
                  placeholder="e.g. 'Replace this visual', 'Make narration clearer', 'Correct subtitle alignment'..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={!manualRequest.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50"
                >
                  Send to Agents
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Quality Score Gauge & Defect Breakdown (5 cols) */}
        <div className="col-span-5 flex flex-col space-y-4">
          {/* Quality Scorecard */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Quality Inspection Score</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-mono font-black text-white">{score}</span>
                <span className="text-xs text-slate-400"> / 100</span>
              </div>
            </div>

            {/* Score Weights Breakdown */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center space-x-2">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Visual Quality (25%)</span>
                </span>
                <span className="font-bold">{breakdown.visual_quality}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-full" style={{ width: `${breakdown.visual_quality}%` }} />
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-1">
                <span className="flex items-center space-x-2">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audio & Narration (20%)</span>
                </span>
                <span className="font-bold">{breakdown.audio_quality}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${breakdown.audio_quality}%` }} />
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-1">
                <span className="flex items-center space-x-2">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Story Alignment (20%)</span>
                </span>
                <span className="font-bold">{breakdown.story_alignment}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-400 h-full" style={{ width: `${breakdown.story_alignment}%` }} />
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-1">
                <span className="flex items-center space-x-2">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subtitle Precision (15%)</span>
                </span>
                <span className="font-bold">{breakdown.subtitle_quality}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${breakdown.subtitle_quality}%` }} />
              </div>

              <div className="flex items-center justify-between text-slate-300 pt-1">
                <span className="flex items-center space-x-2">
                  <Film className="w-3.5 h-3.5 text-blue-400" />
                  <span>Technical & Codec (10%)</span>
                </span>
                <span className="font-bold">{breakdown.technical_quality}</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-400 h-full" style={{ width: `${breakdown.technical_quality}%` }} />
              </div>
            </div>

            {/* Critical Defect Release Gate Warning */}
            {criticalDefects.length > 0 && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-mono flex items-start space-x-2">
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">RELEASE GATE BLOCKED:</span>
                  <span>{criticalDefects.length} critical defect(s) detected. High scores cannot override critical failures. Autonomous scene repair required.</span>
                </div>
              </div>
            )}
          </div>

          {/* Detected Defects List */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300">
                DETECTED DEFECTS ({defects.length})
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Repair Attempts: {manifest?.repair_attempts || 0} / 3
              </span>
            </div>

            {defects.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-2" />
                <span className="font-mono text-xs font-bold text-white">Zero Defects Detected</span>
                <span className="text-[11px] text-slate-500">All technical, visual, audio and subtitle checks passed.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {defects.map(def => (
                  <div
                    key={def.defect_id}
                    onClick={() => jumpToTimestamp(def.timestamp_range[0])}
                    className="p-3.5 bg-slate-950 border border-slate-800 hover:border-orange-500/50 rounded-xl cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        def.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                        def.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {def.severity} // {def.category.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {def.timestamp_range[0].toFixed(1)}s - {def.timestamp_range[1].toFixed(1)}s
                      </span>
                    </div>

                    <p className="text-xs text-white font-medium">{def.explanation}</p>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Assigned: <strong className="text-orange-400">{def.responsible_agent}</strong></span>
                      <span className="text-emerald-400">Fix: {def.recommended_correction}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
