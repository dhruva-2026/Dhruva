import React, { useState, useEffect } from 'react';
import { UploadCloud, BookOpen, Clock, CheckCircle2, XCircle, ShieldAlert, FileEdit, Plus, ArrowRight, RefreshCw } from 'lucide-react';
import { apiFetchResearcherDashboard } from '../../services/api';

interface ResearcherDashboardProps {
  onNavigateUpload: () => void;
  onNavigateRepository: (status?: string) => void;
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
}

export const ResearcherDashboard: React.FC<ResearcherDashboardProps> = ({
  onNavigateUpload,
  onNavigateRepository,
  onReadPaper,
  lang
}) => {
  const [metrics, setMetrics] = useState<any>({
    totalPapers: 0,
    underReview: 0,
    published: 0,
    rejected: 0,
    drafts: 0,
    embargoed: 0
  });
  const [recentPapers, setRecentPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetchResearcherDashboard();
      setMetrics(res.metrics || {});
      setRecentPapers(res.recentPapers || []);
    } catch (e) {
      console.error('Error fetching researcher dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-wrapper-inner space-y-10">
      
      {/* Header with quick CTA */}
      <div className="section-header-block mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="section-eyebrow">
            <span className="eyebrow-dot" />
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Researcher Knowledge Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Researcher Portal & <span className="heading-gradient">Submission Hub</span>
          </h1>
          <p className="section-subtitle">
            Welcome, Dr. Ananya Sharma (NCPOR Goa). Manage your polar papers, review statuses, and AI generation pipeline.
          </p>
        </div>

        <button
          onClick={onNavigateUpload}
          className="btn-primary shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Research Paper</span>
        </button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div 
          onClick={() => onNavigateRepository('all')}
          className="glass-panel p-4 cursor-pointer hover:border-cyan-400/50 transition-all text-center group"
        >
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2">Total Papers</div>
          <div className="text-3xl font-black text-white font-mono tabular-nums group-hover:scale-105 transition-transform">{metrics.totalPapers}</div>
          <div className="text-[10px] text-cyan-400 font-medium mt-1.5">In Repository</div>
        </div>

        <div 
          onClick={() => onNavigateRepository('under_review')}
          className="glass-panel p-4 cursor-pointer hover:border-amber-400/50 transition-all text-center group"
        >
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2">Under Review</div>
          <div className="text-3xl font-black text-amber-400 font-mono tabular-nums group-hover:scale-105 transition-transform">{metrics.underReview}</div>
          <div className="text-[10px] text-amber-300/90 font-medium mt-1.5">In Admin Queue</div>
        </div>

        <div 
          onClick={() => onNavigateRepository('published')}
          className="glass-panel p-4 cursor-pointer hover:border-emerald-400/50 transition-all text-center group"
        >
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2">Published</div>
          <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums group-hover:scale-105 transition-transform">{metrics.published}</div>
          <div className="text-[10px] text-emerald-300/90 font-medium mt-1.5">Publicly Searchable</div>
        </div>

        <div 
          onClick={() => onNavigateRepository('embargoed')}
          className="glass-panel p-4 cursor-pointer hover:border-purple-400/50 transition-all text-center group"
        >
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2">Embargoed</div>
          <div className="text-3xl font-black text-purple-400 font-mono tabular-nums group-hover:scale-105 transition-transform">{metrics.embargoed}</div>
          <div className="text-[10px] text-purple-300/90 font-medium mt-1.5">Pending Release</div>
        </div>

        <div 
          onClick={() => onNavigateRepository('rejected')}
          className="glass-panel p-4 cursor-pointer hover:border-rose-400/50 transition-all text-center group"
        >
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2">Rejected</div>
          <div className="text-3xl font-black text-rose-400 font-mono tabular-nums group-hover:scale-105 transition-transform">{metrics.rejected}</div>
          <div className="text-[10px] text-rose-300/90 font-medium mt-1.5">Needs correction</div>
        </div>

        <div 
          onClick={() => onNavigateRepository('drafts')}
          className="glass-panel p-4 cursor-pointer hover:border-slate-400/50 transition-all text-center group"
        >
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2">Drafts</div>
          <div className="text-3xl font-black text-slate-300 font-mono tabular-nums group-hover:scale-105 transition-transform">{metrics.drafts}</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1.5">Not Submitted</div>
        </div>
      </div>

      {/* RECENT SUBMISSIONS / ACTIVITY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Recent Activity & Submissions
          </h2>
          <button onClick={() => onNavigateRepository()} className="text-xs text-cyan-400 hover:text-white font-semibold">
            View All →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : recentPapers.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-sm">
            No recent submissions found. Click "Upload Research Paper" to start.
          </div>
        ) : (
          <div className="space-y-3">
            {recentPapers.map((paper: any) => (
              <div key={paper.id} className="glass-panel p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-400/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {paper.status === 'published' && <span className="badge badge-published">Published</span>}
                    {paper.status === 'under_review' && <span className="badge badge-review">Under Review</span>}
                    {paper.status === 'rejected' && <span className="badge badge-rejected">Rejected</span>}
                    {paper.status === 'embargoed' && <span className="badge badge-embargo">Embargoed</span>}
                    {paper.status === 'draft' && <span className="badge bg-slate-800 text-slate-400 border border-slate-700">Draft</span>}
                    
                    <span className="text-[10px] text-slate-500 font-mono">{paper.created_at}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate pr-4">
                    {paper.title || 'Untitled Draft'}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {paper.status === 'draft' || paper.status === 'rejected' ? (
                    <button className="btn-secondary h-8 px-3 text-xs">
                      <FileEdit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  ) : null}

                  {paper.status === 'published' ? (
                    <button 
                      onClick={() => onReadPaper(paper.id)}
                      className="btn-cyan h-8 px-3 text-xs"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>View Portal</span>
                    </button>
                  ) : (
                    <button className="btn-secondary h-8 px-3 text-xs">
                      <Clock className="w-3 h-3" />
                      <span>Status Tracker</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      </div>
    </div>
  );
};
