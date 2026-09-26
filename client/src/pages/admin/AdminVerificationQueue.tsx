import React, { useState, useEffect } from 'react';
import { Clock, Shield, CheckCircle2, AlertTriangle, Eye, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { apiFetchAdminQueue } from '../../services/api';

interface AdminVerificationQueueProps {
  onOpenVerification: (paperId: string) => void;
  lang: 'en' | 'hi';
}

export const AdminVerificationQueue: React.FC<AdminVerificationQueueProps> = ({ onOpenVerification, lang }) => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await apiFetchAdminQueue();
        setQueue(res.queue || []);
      } catch (e) {
        console.error('Error loading admin queue:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="page-wrapper-inner space-y-10">
      
      {/* Header */}
      <div className="section-header-block mb-0">
        <div className="section-eyebrow" style={{ borderColor: 'rgba(244, 63, 94, 0.35)', background: 'rgba(244, 63, 94, 0.1)', color: '#FDA4AF' }}>
          <span className="eyebrow-dot" style={{ background: '#F43F5E', boxShadow: '0 0 8px #F43F5E' }} />
          <Shield className="w-3.5 h-3.5" />
          <span>Peer Review & Grounding Audit</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Admin <span className="heading-gradient">Verification Queue</span>
        </h1>
        <p className="section-subtitle">
          Submissions requiring manual scientific verification. Review original paper sections, verify AI claims, check confidence scores, and approve or reject.
        </p>
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400">
          No papers are currently awaiting verification.
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
                className={`glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  isPending ? 'border-amber-400/40 bg-amber-950/10' : ''
                }`}
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`badge ${
                      isPending ? 'badge-review' :
                      isEmbargoed ? 'badge-embargo' :
                      isRejected ? 'badge-rejected' : 'badge-published'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                    <span className={`badge ${p.polar_region === 'Antarctic' ? 'badge-antarctic' : 'badge-arctic'}`}>
                      {p.polar_region}
                    </span>
                    <span className="badge bg-slate-800 text-cyan-300 border border-slate-700">
                      {p.research_area}
                    </span>
                    {p.embargo_enabled === 1 && (
                      <span className="badge badge-embargo">
                        <ShieldAlert className="w-3 h-3" />
                        Embargo Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {p.title}
                  </h3>

                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                    <span>{p.authors}</span>
                    <span>•</span>
                    <span className="text-slate-300">{p.institution}</span>
                    <span>•</span>
                    <span className="text-cyan-400 font-mono">Submitted: {p.created_at ? p.created_at.slice(0, 10) : '2024'}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <strong className="text-white">{p.claim_count || 0}</strong> AI Claims Generated
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <strong className="text-emerald-300">{p.verified_claim_count || 0}</strong> Approved by Reviewer
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-2 md:self-center">
                  <button
                    onClick={() => onOpenVerification(p.id)}
                    className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 whitespace-nowrap shadow-[0_0_15px_rgba(0,198,255,0.4)]"
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
    </div>
  );
};
