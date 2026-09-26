import React, { useState, useEffect } from 'react';
import { ShieldAlert, Unlock, Calendar, Eye, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiFetchResearcherPapers, apiOverrideEmbargo } from '../../services/api';

interface AdminEmbargoManagerProps {
  onBack: () => void;
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
}

export const AdminEmbargoManager: React.FC<AdminEmbargoManagerProps> = ({ onBack, onReadPaper, lang }) => {
  const [embargoedPapers, setEmbargoedPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetchResearcherPapers('embargoed');
      setEmbargoedPapers(res.papers || []);
    } catch (e) {
      console.error('Error fetching embargoed papers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRelease = async (paperId: string) => {
    if (!window.confirm('Are you sure you want to release this paper from embargo? It will immediately become visible to the public portal.')) return;
    try {
      const res = await apiOverrideEmbargo(paperId, 'release');
      alert(res.message);
      loadData();
    } catch (e: any) {
      alert('Error overriding embargo: ' + e.message);
    }
  };

  return (
    <div className="site-container py-12 space-y-10">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Embargo Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            Scientific Embargo Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Enforce or override scientific press and patent embargoes. Papers under active embargo are strictly shielded from public portal searches.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Embargo Policy Banner */}
      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
        <div>
          <strong>Strict Access Enforcement:</strong> When embargoed, a paper's abstract, full text, and search indexes are blocked from all non-authenticated public API queries until released.
        </div>
      </div>

      {/* Papers Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-32 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      ) : embargoedPapers.length === 0 ? (
        <div className="glass-panel p-12 text-center text-xs text-slate-400">
          No papers are currently held under scientific embargo.
        </div>
      ) : (
        <div className="space-y-4">
          {embargoedPapers.map(p => (
            <div key={p.id} className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-purple-500/30">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge badge-embargo">
                    <ShieldAlert className="w-3 h-3" />
                    EMBARGOED
                  </span>
                  <span className="badge bg-slate-800 text-cyan-300 border border-slate-700">
                    {p.research_area}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-400">
                  Author: {p.authors} • <span className="text-slate-300">{p.institution}</span>
                </p>

                <div className="text-xs text-purple-300 pt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Scheduled Public Release: <strong>{p.embargo_until ? p.embargo_until.slice(0, 10) : '2026-12-31'}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onReadPaper(p.id)}
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => handleRelease(p.id)}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,198,255,0.4)]"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Override & Publish</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
