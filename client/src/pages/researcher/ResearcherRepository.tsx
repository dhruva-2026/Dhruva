import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Filter, CheckCircle2, AlertTriangle, XCircle, RotateCcw, 
  Eye, Calendar, MapPin, Sparkles, Send, X, ShieldAlert, FileText 
} from 'lucide-react';
import { apiFetchResearcherPapers, apiResubmitPaper } from '../../services/api';

interface ResearcherRepositoryProps {
  initialStatus?: string;
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
}

const TABS = [
  { id: 'all', label: 'All Papers' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected (Requires Action)' },
  { id: 'embargoed', label: 'Embargoed' },
  { id: 'draft', label: 'Drafts' }
];

export const ResearcherRepository: React.FC<ResearcherRepositoryProps> = ({
  initialStatus = 'all',
  onReadPaper,
  lang
}) => {
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resubmit Modal state
  const [resubmitTarget, setResubmitTarget] = useState<any | null>(null);
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedAbstract, setRevisedAbstract] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const res = await apiFetchResearcherPapers(activeTab);
      setPapers(res.papers || []);
    } catch (e) {
      console.error('Error loading researcher papers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, [activeTab]);

  const openResubmitModal = (paper: any) => {
    setResubmitTarget(paper);
    setRevisedTitle(paper.title);
    setRevisedAbstract(paper.abstract);
    setRevisionNotes('');
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitTarget) return;

    setSubmitting(true);
    try {
      await apiResubmitPaper(resubmitTarget.id, {
        title: revisedTitle,
        abstract: revisedAbstract,
        revision_notes: revisionNotes
      });
      alert('Paper successfully updated and resubmitted to Admin Verification Queue!');
      setResubmitTarget(null);
      loadPapers();
    } catch (e: any) {
      alert('Error resubmitting paper: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-container py-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>My Research Repository</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Manage Manuscripts & Peer Reviews
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Track verification workflows, examine admin review feedback, manage embargoes, and resubmit papers.
        </p>
      </div>

      {/* TABS */}
      <div className="tab-list">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn text-xs sm:text-sm ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* PAPERS LIST */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400">
          No papers found under this category filter.
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map(p => {
            const isRejected = p.status === 'rejected';
            const isUnderReview = p.status === 'under_review';
            const isEmbargoed = p.status === 'embargoed';

            return (
              <div 
                key={p.id}
                className={`glass-panel p-6 space-y-4 transition-all ${
                  isRejected ? 'border-rose-500/40 bg-rose-950/10' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`badge ${p.polar_region === 'Antarctic' ? 'badge-antarctic' : 'badge-arctic'}`}>
                        {p.polar_region}
                      </span>
                      <span className="badge bg-slate-800 text-cyan-300 border border-slate-700">
                        {p.research_area}
                      </span>
                      <span className={`badge ${
                        p.status === 'published' ? 'badge-published' :
                        p.status === 'under_review' ? 'badge-review' :
                        p.status === 'rejected' ? 'badge-rejected' :
                        p.status === 'embargoed' ? 'badge-embargo' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {p.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {p.authors} • <span className="text-slate-300">{p.institution}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-start flex-shrink-0">
                    {isRejected && (
                      <button
                        onClick={() => openResubmitModal(p)}
                        className="btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Edit & Resubmit</span>
                      </button>
                    )}

                    <button
                      onClick={() => onReadPaper(p.id)}
                      className="btn-cyan text-xs py-1.5 px-3"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Paper</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {p.abstract}
                </p>

                {/* SPECIAL REJECTION CALLOUT BOX */}
                {isRejected && (
                  <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Reviewer Decision: Manuscript Returned with Corrections</span>
                    </div>
                    {p.rejection_reason && (
                      <div className="text-xs text-rose-200 font-semibold">
                        Reason: <span className="font-normal text-rose-100">{p.rejection_reason}</span>
                      </div>
                    )}
                    {p.admin_comment && (
                      <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-rose-900/40 italic">
                        "{p.admin_comment}"
                      </div>
                    )}
                  </div>
                )}

                {/* SPECIAL EMBARGO CALLOUT BOX */}
                {isEmbargoed && (
                  <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-purple-400" />
                      <span>Active Scientific Embargo in Effect</span>
                    </span>
                    <span className="font-mono text-[11px] text-purple-300">
                      Until: {p.embargo_until ? p.embargo_until.slice(0, 10) : 'End of 2026'}
                    </span>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>DOI: <span className="font-mono text-cyan-300">{p.doi || 'Pending'}</span></span>
                    <span>Views: {p.view_count || 0}</span>
                  </div>
                  <div>Submitted: {p.created_at ? p.created_at.slice(0, 10) : '2024'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT & RESUBMIT MODAL */}
      {resubmitTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 border-cyan-400/50 relative">
            <button
              onClick={() => setResubmitTarget(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
                <RotateCcw className="w-4 h-4" />
                <span>Revision & Resubmission</span>
              </div>
              <h2 className="text-xl font-bold text-white">Resubmit Corrected Manuscript</h2>
              <p className="text-xs text-slate-300 mt-1">
                Paper ID: <span className="font-mono text-cyan-300">{resubmitTarget.id}</span>
              </p>
            </div>

            {/* Admin critique reminder */}
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 space-y-1">
              <div className="font-bold">Admin Feedback to Address:</div>
              <div className="italic text-slate-300">"{resubmitTarget.admin_comment}"</div>
            </div>

            <form onSubmit={handleResubmitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Paper Title</label>
                <input
                  type="text"
                  value={revisedTitle}
                  onChange={(e) => setRevisedTitle(e.target.value)}
                  required
                  className="text-xs py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Revised Abstract</label>
                <textarea
                  value={revisedAbstract}
                  onChange={(e) => setRevisedAbstract(e.target.value)}
                  rows={4}
                  required
                  className="text-xs py-2 px-3"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Researcher Revision Notes / Response to Reviewer</label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Explain how vessel noise filters were applied and hydrophone calibration certificates were integrated..."
                  rows={3}
                  required
                  className="text-xs py-2 px-3"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResubmitTarget(null)}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Resubmit for Verification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
