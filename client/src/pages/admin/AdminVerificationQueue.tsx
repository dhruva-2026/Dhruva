import React, { useState, useEffect } from 'react';
import { 
  Clock, Shield, CheckCircle2, AlertTriangle, Eye, ArrowRight, 
  ShieldAlert, Sparkles, FileText, ArrowLeft, RefreshCw 
} from 'lucide-react';
import { apiFetchAdminQueue } from '../../services/api';

interface AdminVerificationQueueProps {
  onOpenVerification: (paperId: string) => void;
  lang: 'en' | 'hi';
}

export const AdminVerificationQueue: React.FC<AdminVerificationQueueProps> = ({ onOpenVerification, lang }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAdminQueue();
      setQueue(res.queue || []);
    } catch (e) {
      console.error('Error loading admin queue:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="site-container py-10 space-y-8 animate-fadeIn">
      
      {/* Header with Polar Ocean Blue Gradient */}
      <div className="bg-gradient-to-r from-sky-50/90 via-white to-indigo-50/70 border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/90 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>Peer Review & Grounding Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-heading">
            Admin <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">Verification Queue</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Manuscript submissions requiring scientific audit. Examine original paper sections, verify AI-extracted claims, inspect confidence scores, and approve or reject submissions.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 border border-slate-200" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-slate-800 font-bold text-sm">Verification Queue is Clear</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            All submitted manuscripts have been reviewed and verified. New submissions from researchers will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map(p => {
            const isPending = p.status === 'under_review' || p.status === 'submitted';
            const isEmbargoed = p.status === 'embargoed';
            const isRejected = p.status === 'rejected';

            return (
              <div 
                key={p.id}
                className={`bg-white border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all shadow-sm hover:shadow-md ${
                  isPending ? 'border-amber-200 bg-amber-50/15' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      isEmbargoed ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      isRejected ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {p.status.replace('_', ' ').toUpperCase()}
                    </span>

                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      p.polar_region === 'Antarctic' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}>
                      {p.polar_region}
                    </span>

                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {p.research_area}
                    </span>

                    {p.embargo_enabled === 1 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        <ShieldAlert className="w-3 h-3 text-purple-500" />
                        <span>Embargo Active</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {p.title}
                  </h3>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700">{p.authors}</span>
                    <span>•</span>
                    <span>{p.institution}</span>
                    <span>•</span>
                    <span className="text-slate-400 font-mono">Submitted: {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span><strong className="text-slate-900">{p.claim_count || 0}</strong> AI Claims Generated</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span><strong>{p.verified_claim_count || 0}</strong> Approved by Reviewer</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 md:self-center">
                  <button
                    onClick={() => onOpenVerification(p.id)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Split-Screen Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
