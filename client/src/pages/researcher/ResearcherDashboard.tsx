import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, BookOpen, Clock, CheckCircle2, XCircle, ShieldAlert, 
  FileEdit, Plus, ArrowRight, RefreshCw, FileText, AlertTriangle, 
  Layers, ExternalLink, Sparkles
} from 'lucide-react';
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
    <div className="site-container py-10 space-y-10">
      
      {/* Header with Quick Action */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Researcher Knowledge Management & Submission Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Polar Research Portal & <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Manuscript Pipeline</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Welcome to your research workspace. Submit new manuscripts for automated AI section-aware vector ingestion, track peer reviews, manage scientific embargoes, and monitor real-time citations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 shrink-0">
          <button
            onClick={onNavigateUpload}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-sky-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Manuscript</span>
          </button>

          <button
            onClick={() => onNavigateRepository('all')}
            className="px-4 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>View All Manuscripts</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS - ALL FULLY INTERACTIVE AND FILTER REPOSITORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <span>Submission Status Overview</span>
          </h2>
          <span className="text-xs text-slate-500">Click any card to filter your repository</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Total Papers */}
          <div 
            onClick={() => onNavigateRepository('all')}
            className="bg-white border border-slate-200 hover:border-sky-400 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
          >
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Total Papers</div>
            <div className="text-3xl font-black text-slate-900 font-mono tabular-nums group-hover:text-sky-600 transition-colors">
              {metrics.totalPapers}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-sky-600 font-medium mt-1.5 bg-sky-50 px-2 py-0.5 rounded-full">
              <span>All Submissions</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Under Review */}
          <div 
            onClick={() => onNavigateRepository('under_review')}
            className="bg-white border border-slate-200 hover:border-amber-400 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
          >
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Under Review</div>
            <div className="text-3xl font-black text-amber-600 font-mono tabular-nums group-hover:scale-105 transition-transform">
              {metrics.underReview}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-1.5 bg-amber-50 px-2 py-0.5 rounded-full">
              <span>Admin Queue</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Published */}
          <div 
            onClick={() => onNavigateRepository('published')}
            className="bg-white border border-slate-200 hover:border-emerald-400 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
          >
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Published</div>
            <div className="text-3xl font-black text-emerald-600 font-mono tabular-nums group-hover:scale-105 transition-transform">
              {metrics.published}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium mt-1.5 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span>Live & Searchable</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Embargoed */}
          <div 
            onClick={() => onNavigateRepository('embargoed')}
            className="bg-white border border-slate-200 hover:border-purple-400 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
          >
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Embargoed</div>
            <div className="text-3xl font-black text-purple-600 font-mono tabular-nums group-hover:scale-105 transition-transform">
              {metrics.embargoed}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-medium mt-1.5 bg-purple-50 px-2 py-0.5 rounded-full">
              <span>Protected Data</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Rejected / Revision Required */}
          <div 
            onClick={() => onNavigateRepository('rejected')}
            className="bg-white border border-slate-200 hover:border-rose-400 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
          >
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Revisions</div>
            <div className="text-3xl font-black text-rose-600 font-mono tabular-nums group-hover:scale-105 transition-transform">
              {metrics.rejected}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-medium mt-1.5 bg-rose-50 px-2 py-0.5 rounded-full">
              <span>Needs Action</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Drafts */}
          <div 
            onClick={() => onNavigateRepository('draft')}
            className="bg-white border border-slate-200 hover:border-slate-400 p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
          >
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1.5">Drafts</div>
            <div className="text-3xl font-black text-slate-700 font-mono tabular-nums group-hover:scale-105 transition-transform">
              {metrics.drafts}
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium mt-1.5 bg-slate-100 px-2 py-0.5 rounded-full">
              <span>Unsubmitted</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>

      {/* RECENT SUBMISSIONS / ACTIVITY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Recent Manuscripts & Activity Log</span>
          </h2>
          <button 
            onClick={() => onNavigateRepository('all')} 
            className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View All in Repository</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : recentPapers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-slate-700 font-semibold text-sm">No recent manuscript submissions found</div>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              You haven't uploaded any research manuscripts yet. Click below to begin the scientific ingestion wizard.
            </p>
            <button
              onClick={onNavigateUpload}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold text-xs shadow hover:bg-sky-700 transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit First Manuscript</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPapers.map((paper: any) => (
              <div 
                key={paper.id} 
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {paper.status === 'published' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>Published</span>
                      </span>
                    )}
                    {paper.status === 'under_review' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Under Admin Review</span>
                      </span>
                    )}
                    {paper.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span>Requires Revisions</span>
                      </span>
                    )}
                    {paper.status === 'embargoed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700">
                        <ShieldAlert className="w-3 h-3 text-purple-500" />
                        <span>Embargoed</span>
                      </span>
                    )}
                    {paper.status === 'draft' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                        <FileEdit className="w-3 h-3 text-slate-500" />
                        <span>Draft</span>
                      </span>
                    )}
                    
                    {paper.polar_region && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-50 border border-sky-100 text-sky-700">
                        {paper.polar_region}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-mono">
                      {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                    {paper.title || 'Untitled Research Manuscript'}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {paper.authors || 'Dr. Ananya Sharma et al.'} {paper.institution ? `• ${paper.institution}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {paper.status === 'rejected' && (
                    <button 
                      onClick={() => onNavigateRepository('rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Edit & Resubmit</span>
                    </button>
                  )}

                  {paper.status === 'published' ? (
                    <button 
                      onClick={() => onReadPaper(paper.id)}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Manuscript</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => onNavigateRepository(paper.status)}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Track Progress</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
};
