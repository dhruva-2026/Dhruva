import React from 'react';
import { BookOpen, MapPin, Calendar, Eye, FileText, Sparkles, ShieldAlert } from 'lucide-react';

interface PaperCardProps {
  paper: any;
  onRead: (id: string) => void;
  onAsk?: (paper: any) => void;
  lang?: 'en' | 'hi';
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, onRead, onAsk, lang = 'en' }) => {
  const isAntarctic = paper.polar_region === 'Antarctic';

  return (
    <div className="glass-panel p-6 sm:p-7 flex flex-col justify-between hover:border-cyan-400/50 hover:shadow-[0_12px_36px_rgba(0,240,255,0.18)] transition-all group relative overflow-hidden h-full">
      
      {/* Aurora glow accent line on top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 transition-all group-hover:h-1.5"
        style={{
          background: isAntarctic 
            ? 'linear-gradient(90deg, #818CF8, #38BDF8)' 
            : 'linear-gradient(90deg, #00F0FF, #2DD4BF)'
        }}
      />

      <div className="space-y-3.5 flex-1 flex flex-col">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`badge ${isAntarctic ? 'badge-antarctic' : 'badge-arctic'}`}>
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{paper.polar_region}</span>
            </span>
            <span className="badge bg-slate-900/80 text-cyan-300 border border-slate-700/60 font-medium">
              {paper.research_area}
            </span>
          </div>

          {paper.embargo_enabled === 1 && (
            <span className="badge badge-embargo">
              <ShieldAlert className="w-3 h-3 shrink-0" />
              <span>EMBARGOED</span>
            </span>
          )}
        </div>

        {/* Paper Title with fixed min-height for perfect row alignment */}
        <div className="space-y-1.5">
          <h3 
            onClick={() => onRead(paper.id)}
            className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer card-title-grid"
            title={paper.title}
          >
            {paper.title}
          </h3>

          <p className="text-xs text-sky-200/80 font-medium line-clamp-1 flex items-center gap-1.5">
            <span className="truncate">{paper.authors}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 truncate">{paper.institution}</span>
          </p>
        </div>

        {/* Abstract Snippet */}
        <p className="text-xs sm:text-sm text-slate-300/90 line-clamp-3 leading-relaxed font-normal flex-1">
          {paper.abstract}
        </p>
      </div>

      {/* Footer Info & Actions pinned to bottom */}
      <div className="card-meta-footer mt-5">
        <div className="flex items-center gap-3.5 text-slate-400">
          <span className="meta-item">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{paper.publication_year}</span>
          </span>
          <span className="meta-item">
            <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{paper.view_count || 0}</span>
          </span>
          {paper.location_name && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-cyan-400/90 font-medium truncate max-w-[120px]">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{paper.location_name}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onAsk && (
            <button
              onClick={() => onAsk(paper)}
              className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all flex items-center justify-center cursor-pointer"
              title="Ask DHRUVA AI about this paper"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onRead(paper.id)}
            className="btn-cyan py-1.5 px-3.5 text-xs font-semibold cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Read' : 'पढ़ें'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
