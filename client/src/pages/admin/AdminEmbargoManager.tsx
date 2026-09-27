import React, { useState, useEffect } from 'react';
import { ShieldAlert, Unlock, Calendar, Eye, AlertCircle, ArrowLeft, RefreshCw, CheckCircle2, Lock, Building, MapPin } from 'lucide-react';
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
    if (!window.confirm('Are you sure you want to release this paper from scientific embargo? It will immediately become discoverable on the public portal.')) return;
    try {
      const res = await apiOverrideEmbargo(paperId, 'release');
      alert(res.message);
      loadData();
    } catch (e: any) {
      alert('Error overriding embargo: ' + e.message);
    }
  };

  return (
    <div className="site-container py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Embargo Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Scientific Embargo Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Enforce or override scientific press and patent embargoes. Papers under active embargo are shielded from public portal discovery until their designated release date.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Embargo Policy Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-3 shadow-sm">
        <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-purple-950 font-bold">Strict Access Enforcement Policy:</strong>
          <p className="leading-relaxed text-purple-800">
            When a manuscript is embargoed, its full text, extracted key claims, learning artifacts, and semantic search vector embeddings are blocked from unauthenticated public searches until released by an authorized NCPOR administrator.
          </p>
        </div>
      </div>

      {/* Papers Table / Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200" />
          ))}
        </div>
      ) : embargoedPapers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 shadow-sm space-y-2">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="font-semibold text-slate-700">No papers are currently held under scientific embargo.</p>
          <p className="text-slate-400">All reviewed manuscripts have either been published or returned to researchers.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {embargoedPapers.map(p => (
            <div key={p.id} className="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    EMBARGOED
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {p.research_area}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-500">
                    {p.id}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {p.title}
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    Author: {p.authors}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Building className="w-3.5 h-3.5" />
                    {p.institution}
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {p.location_name || p.polar_region}
                  </span>
                </div>

                <div className="text-xs text-purple-800 pt-1 flex items-center gap-2 font-medium bg-purple-50/70 px-3 py-1.5 rounded-lg border border-purple-200/80 inline-flex">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>Scheduled Public Release: <strong className="text-purple-950 font-bold">{p.embargo_until ? p.embargo_until.slice(0, 10) : '2026-12-31'}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-auto">
                <button
                  onClick={() => onReadPaper(p.id)}
                  className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Manuscript</span>
                </button>

                <button
                  onClick={() => handleRelease(p.id)}
                  className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer shadow-sm"
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
