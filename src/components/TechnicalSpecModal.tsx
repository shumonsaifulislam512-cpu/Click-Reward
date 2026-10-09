import React, { useState } from 'react';
import { TECHNICAL_SPECIFICATIONS } from '../data/technical-spec';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Database, 
  Server, 
  ShieldCheck, 
  CreditCard,
  Code2,
  Terminal
} from 'lucide-react';

export const TechnicalSpecModal: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>(TECHNICAL_SPECIFICATIONS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSection = TECHNICAL_SPECIFICATIONS.find(s => s.id === activeSectionId) || TECHNICAL_SPECIFICATIONS[0];

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSectionIcon = (id: string) => {
    if (id.includes('postgres') || id.includes('mongo')) return <Database className="w-4 h-4 text-blue-400" />;
    if (id.includes('api')) return <Server className="w-4 h-4 text-emerald-400" />;
    if (id.includes('verification')) return <ShieldCheck className="w-4 h-4 text-pink-400" />;
    return <CreditCard className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 border border-blue-900/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400 shadow-md">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-extrabold text-white">Full-Stack Technical Specification & Architecture</h2>
                <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full">
                  Deliverables 1 - 4
                </span>
              </div>
              <p className="text-xs text-slate-400">PostgreSQL DDL &bull; Mongo Schemas &bull; HMAC Ad Verification &bull; bKash PGW Engine</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Code Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
            Specifications & Blueprints
          </div>
          {TECHNICAL_SPECIFICATIONS.map(spec => (
            <button
              key={spec.id}
              onClick={() => setActiveSectionId(spec.id)}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-start space-x-2.5 ${
                activeSectionId === spec.id
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {getSectionIcon(spec.id)}
              </div>
              <div>
                <div className="font-bold leading-tight">{spec.title.split(':')[0]}</div>
                <div className="text-[10px] font-normal text-slate-400 mt-0.5 line-clamp-1">
                  {spec.title.split(':')[1] || spec.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Content Explorer Panel */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          
          {/* Header of Active Section */}
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60">
            <div>
              <h3 className="font-extrabold text-base text-white">{activeSection.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{activeSection.description}</p>
            </div>

            {activeSection.code && (
              <button
                onClick={() => handleCopyCode(activeSection.code!, activeSection.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition-all self-start sm:self-auto"
              >
                {copiedId === activeSection.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Full Snippet</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sequence Diagram if present */}
          {activeSection.diagram && (
            <div className="p-5 bg-slate-950 border-b border-slate-800/80">
              <div className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2 flex items-center">
                <Terminal className="w-3.5 h-3.5 mr-1" /> Protocol Sequence Flow:
              </div>
              <pre className="font-mono text-[11px] text-pink-300 bg-slate-900/90 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
                {activeSection.diagram}
              </pre>
            </div>
          )}

          {/* Code Viewer */}
          {activeSection.code && (
            <div className="p-5 bg-slate-950 flex-1 overflow-x-auto font-mono text-xs">
              <pre className="text-slate-300 whitespace-pre leading-relaxed selection:bg-blue-600 selection:text-white">
                {activeSection.code}
              </pre>
            </div>
          )}

          {/* Architectural Notes Footer */}
          {activeSection.notes && activeSection.notes.length > 0 && (
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300">Architectural Key Points:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {activeSection.notes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
