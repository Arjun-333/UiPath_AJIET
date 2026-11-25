import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Film, Download, Award, Copy, Check, FileText, FolderOpen } from 'lucide-react';

const CertificateStudioModal = lazy(() => import('./CertificateStudioModal').then(m => ({ default: m.CertificateStudioModal })));

interface VaultProject {
  id: string;
  title: string;
  status?: string;
  created_at?: string;
}

export const MediaVault: React.FC = () => {
  const [showCertStudio, setShowCertStudio] = useState(false);
  const [projects, setProjects] = useState<VaultProject[]>([
    { id: 'test_proj_01', title: 'Mastering UiPath Document Understanding in 5 Minutes', status: 'completed' }
  ]);
  const [selectedId, setSelectedId] = useState<string>('test_proj_01');
  const [chaptersText, setChaptersText] = useState<string>('');
  const [copiedChapters, setCopiedChapters] = useState(false);
  const [thumbAvailable, setThumbAvailable] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const list: VaultProject[] = data.map((p: any) => ({
            id: p.id,
            title: p.title || p.id,
            status: p.status,
            created_at: p.created_at
          }));
          if (!list.some(p => p.id === 'test_proj_01')) {
            list.push({ id: 'test_proj_01', title: 'Mastering UiPath Document Understanding in 5 Minutes', status: 'completed' });
          }
          setProjects(list);
          setSelectedId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setThumbAvailable(true);
    setChaptersText('');
    fetch(`/media/${selectedId}/chapters.txt`)
      .then(r => (r.ok ? r.text() : ''))
      .then(txt => setChaptersText(txt.trim()))
      .catch(() => setChaptersText(''));
  }, [selectedId]);

  const selectedProject = projects.find(p => p.id === selectedId) || projects[0];

  const handleCopyChapters = () => {
    if (!chaptersText) return;
    navigator.clipboard.writeText(chaptersText);
    setCopiedChapters(true);
    setTimeout(() => setCopiedChapters(false), 2000);
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-2">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Media Production Vault</h2>
            <p className="text-xs text-slate-400">Rendered 1080p MP4s, 1080x1920 Reels, Subtitles, Chapters &amp; E-Certificates</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dynamic Project Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <FolderOpen className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-transparent text-xs font-mono text-slate-200 focus:outline-none max-w-[240px]"
              aria-label="Select rendered project"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.title.slice(0, 42)} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCertStudio(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/25 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>E-Certificate PDF Studio</span>
          </button>
        </div>
      </div>

      {/* Rendered Project Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 16:9 Master Video */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-orange-400 font-bold">16:9 YOUTUBE MASTER</span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">1080p MP4</span>
              <a
                href={`/media/${selectedId}/master_16x9.mp4`}
                download
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Download 16:9 Master MP4"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <video
            key={`master-${selectedId}`}
            src={`/media/${selectedId}/master_16x9.mp4`}
            controls
            className="w-full rounded-lg bg-black aspect-video object-contain border border-slate-800"
          />
          <h4 className="text-sm font-bold text-white">{selectedProject?.title}</h4>
          <p className="text-xs text-slate-400">1080p Studio Render + Edge Neural TTS + ducked ambient synth pad + burned ASS captions.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={`/media/${selectedId}/subtitles.srt`}
              download
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download .SRT</span>
            </a>
            <a
              href={`/media/${selectedId}/subtitles.ass`}
              download
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Download .ASS</span>
            </a>
          </div>
        </div>

        {/* 9:16 Vertical Reel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-pink-400 font-bold">9:16 INSTAGRAM REEL / SHORTS</span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-mono">1080x1920 MP4</span>
              <a
                href={`/media/${selectedId}/reel_9x16.mp4`}
                download
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Download 9:16 Reel MP4"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <div className="flex justify-center bg-black/60 rounded-lg p-2 border border-slate-800">
            <video
              key={`reel-${selectedId}`}
              src={`/media/${selectedId}/reel_9x16.mp4`}
              controls
              className="max-h-72 rounded bg-black object-contain"
            />
          </div>
          <h4 className="text-sm font-bold text-white">Vertical Short-Form Cut</h4>
          <p className="text-xs text-slate-400">Optimized for Instagram Reels &amp; YouTube Shorts with karaoke ASS captions &amp; progress bar.</p>
        </div>
      </div>

      {/* YouTube Chapters & Thumbnail Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chaptersText && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 font-bold">YOUTUBE CHAPTER MARKERS</span>
              <button
                onClick={handleCopyChapters}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700"
              >
                {copiedChapters ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedChapters ? 'Copied!' : 'Copy Chapters'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
              {chaptersText}
            </pre>
          </div>
        )}

        {thumbAvailable && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <span className="text-xs font-mono text-cyan-400 font-bold block">1280x720 YOUTUBE THUMBNAIL</span>
            <img
              src={`/media/${selectedId}/thumbnail.png`}
              alt="Thumbnail"
              onError={() => setThumbAvailable(false)}
              className="w-full rounded-lg border border-slate-800 shadow-xl"
            />
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        {showCertStudio && (
          <CertificateStudioModal onClose={() => setShowCertStudio(false)} />
        )}
      </Suspense>
    </div>
  );
};
