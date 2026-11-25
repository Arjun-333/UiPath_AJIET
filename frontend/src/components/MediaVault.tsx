import React, { useState } from 'react';
import { Film, Video, Download, Play, CheckCircle2, Award } from 'lucide-react';
import { CertificateStudioModal } from './CertificateStudioModal';

export const MediaVault: React.FC = () => {
  const [showCertStudio, setShowCertStudio] = useState(false);

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-2">
      <div className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Media Production Vault</h2>
            <p className="text-xs text-slate-400">Rendered 1080p MP4s, 9:16 Instagram Reels, Thumbnails &amp; Subtitles</p>
          </div>
        </div>
        <button
          onClick={() => setShowCertStudio(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/25 transition-all"
        >
          <Award className="w-4 h-4" />
          <span>E-Certificate PDF Studio</span>
        </button>
      </div>

      {/* Rendered Project Showcase */}
      <div className="grid grid-cols-2 gap-6">
        {/* 16:9 Master Video */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-orange-400 font-bold">16:9 YOUTUBE MASTER</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono">1080p MP4</span>
          </div>
          <video
            src="/media/test_proj_01/master_16x9.mp4"
            controls
            className="w-full rounded-lg bg-black aspect-video object-contain border border-slate-800"
          />
          <h4 className="text-sm font-bold text-white">Mastering UiPath Document Understanding in 5 Minutes</h4>
          <p className="text-xs text-slate-400">Synthesized audio narration + synchronized slide visuals + SRT burned captions.</p>
        </div>

        {/* 9:16 Vertical Reel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-pink-400 font-bold">9:16 INSTAGRAM REEL</span>
            <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-mono">Vertical MP4</span>
          </div>
          <div className="flex justify-center bg-black/60 rounded-lg p-2 border border-slate-800">
            <video
              src="/media/test_proj_01/reel_9x16.mp4"
              controls
              className="max-h-72 rounded bg-black object-contain"
            />
          </div>
          <h4 className="text-sm font-bold text-white">Stop Extracting PDFs Manually! 🤖</h4>
          <p className="text-xs text-slate-400">Optimized for Instagram Reels & YouTube Shorts with high-contrast text hooks.</p>
        </div>
      </div>

      {/* Branded YouTube Thumbnail */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <span className="text-xs font-mono text-cyan-400 font-bold">1280x720 HIGH-CTR YOUTUBE THUMBNAIL</span>
        <img
          src="/media/test_proj_01/thumbnail.png"
          alt="Thumbnail"
          className="w-full max-w-2xl rounded-lg border border-slate-800 shadow-xl"
        />
      </div>

      {showCertStudio && (
        <CertificateStudioModal onClose={() => setShowCertStudio(false)} />
      )}
    </div>
  );
};
