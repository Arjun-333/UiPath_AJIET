import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], description: 'Open Global Command Palette (pages, floors, agents, projects)' },
  { keys: ['?'], description: 'Toggle this Keyboard Shortcuts reference' },
  { keys: ['0', '–', '5'], description: 'Jump directly to Floor 0 – Floor 5 in Virtual HQ' },
  { keys: ['Esc'], description: 'Close active modal or palette' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
    >
      <div
        className="w-full max-w-md bg-[#0d0d0d] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#fa4616]/15 border border-[#fa4616]/40 text-[#fa4616]">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close shortcuts"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {SHORTCUTS.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-1.5 border-b border-[#1c1c1c] last:border-0">
              <span className="text-xs text-slate-300">{s.description}</span>
              <div className="flex items-center gap-1 shrink-0">
                {s.keys.map((k, ki) => (
                  <kbd
                    key={ki}
                    className="px-2 py-0.5 text-[11px] font-mono font-semibold text-white bg-[#1a1a1a] border border-[#333] rounded"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
