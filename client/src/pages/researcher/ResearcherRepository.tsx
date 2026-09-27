import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Filter, CheckCircle2, AlertTriangle, XCircle, RotateCcw, 
  Eye, Calendar, MapPin, Sparkles, Send, X, ShieldAlert, FileText,
  Clock, ArrowRight, Check
} from 'lucide-react';
import { apiFetchResearcherPapers, apiResubmitPaper } from '../../services/api';

interface ResearcherRepositoryProps {
  initialStatus?: string;
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
}

const TABS = [
  { id: 'all', label: 'All Manuscripts' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Revisions Required' },
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

  // Sync activeTab when initialStatus prop changes from outside (e.g. Dashboard click)
  useEffect(() => {
    if (initialStatus) {
      setActiveTab(initialStatus);
    }
  }, [initialStatus]);

  // Resubmit Modal state
  const [resubmitTarget, setResubmitTarget] = useState<any | null>(null);
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedAbstract, setRevisedAbstract] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

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
    setRevisedTitle(paper.title || '');
    setRevisedAbstract(paper.abstract || '');
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
      setNotification('Manuscript successfully revised and resubmitted to the Admin Verification Queue!');
      setTimeout(() => setNotification(null), 4000);
      setResubmitTarget(null);
      loadPapers();
    } catch (e: any) {
      alert('Error resubmitting paper: ' + (e.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-container py-10 space-y-8">
      
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Researcher Repository & Submission Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manuscript Library & <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">Peer Review Log</span>
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Track verification states, examine admin review feedback, inspect metadata schemas, manage scientific embargoes, and submit revisions.
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/20'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* PAPERS LIST */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-slate-800 font-bold text-sm">No manuscripts found under this filter</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            There are currently no research submissions matching the "{TABS.find(t => t.id === activeTab)?.label}" category.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {papers.map(p => {
            const isRejected = p.status === 'rejected';
            const isUnderReview = p.status === 'under_review';
            const isEmbargoed = p.status === 'embargoed';
            const isPublished = p.status === 'published';

            return (
              <div 
                key={p.id}
                className={`bg-white border rounded-2xl p-6 space-y-4 transition-all shadow-sm hover:shadow-md ${
                  isRejected 
                    ? 'border-rose-300 bg-rose-50/20' 
                    : isEmbargoed
                    ? 'border-purple-200 bg-purple-50/10'
                    : 'border-slate-200 hover:border-sky-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {p.polar_region && (
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          p.polar_region === 'Antarctic' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}>
                          {p.polar_region}
                        </span>
                      )}

                      {p.research_area && (
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {p.research_area}
                        </span>
                      )}

                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        isUnderReview ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        isEmbargoed ? 'bg-purple-50 text-purple-700 border border-purple-200' : 
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {p.status ? p.status.replace('_', ' ').toUpperCase() : 'SUBMITTED'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{p.authors}</span>
                      {p.institution ? ` • ${p.institution}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:self-start shrink-0">
                    {isRejected && (
                      <button
                        onClick={() => openResubmitModal(p)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Edit & Resubmit</span>
                      </button>
                    )}

                    <button
                      onClick={() => onReadPaper(p.id)}
                      className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{isPublished ? 'Read Published Paper' : 'View Manuscript Record'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {p.abstract}
                </p>

                {/* SPECIAL REJECTION CALLOUT BOX */}
                {isRejected && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Reviewer Feedback: Manuscript Requires Scientific Corrections</span>
                    </div>
                    {p.rejection_reason && (
                      <div className="text-xs text-rose-900 font-semibold">
                        Primary Reason: <span className="font-normal text-rose-800">{p.rejection_reason}</span>
                      </div>
                    )}
                    {p.admin_comment && (
                      <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-rose-100 italic">
                        "{p.admin_comment}"
                      </div>
                    )}
                  </div>
                )}

                {/* SPECIAL EMBARGO CALLOUT BOX */}
                {isEmbargoed && (
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-semibold">
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      <span>Scientific Data Embargo Active (Pre-publication protection)</span>
                    </span>
                    <span className="font-mono text-xs text-purple-700 bg-purple-100/80 px-2.5 py-1 rounded-md">
                      Protected Until: {p.embargo_until ? new Date(p.embargo_until).toLocaleDateString() : 'End of Cycle'}
                    </span>
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>DOI: <span className="font-mono text-sky-700 font-semibold">{p.doi || 'Assigned Post-Review'}</span></span>
                    {p.location_id && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>Station/Sector: {p.location_id}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    Submitted: <span className="text-slate-600 font-medium">{p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT & RESUBMIT MODAL */}
      {resubmitTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setResubmitTarget(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
                <RotateCcw className="w-4 h-4" />
                <span>Revision & Resubmission Workflow</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Resubmit Corrected Manuscript</h2>
              <p className="text-xs text-slate-500 mt-1">
                Manuscript ID: <span className="font-mono text-sky-600 font-semibold">{resubmitTarget.id}</span>
              </p>
            </div>

            {/* Admin critique reminder */}
            {resubmitTarget.admin_comment && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                <div className="font-bold">Reviewer Feedback to Address:</div>
                <div className="italic text-slate-700 bg-white p-2.5 rounded-lg border border-rose-100">
                  "{resubmitTarget.admin_comment}"
                </div>
              </div>
            )}

            <form onSubmit={handleResubmitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Paper Title
                </label>
                <input
                  type="text"
                  value={revisedTitle}
                  onChange={(e) => setRevisedTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Revised Abstract & Methodological Highlights
                </label>
                <textarea
                  value={revisedAbstract}
                  onChange={(e) => setRevisedAbstract(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Response to Reviewer / Correction Notes
                </label>
                <textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Detail the exact corrections made (e.g., updated calibration curves, clarified sensor depths, revised error margins)..."
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition-all resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResubmitTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Resubmitting...' : 'Resubmit to Review Queue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
