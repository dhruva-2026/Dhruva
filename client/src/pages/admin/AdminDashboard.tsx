import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Clock, XCircle, ShieldAlert, BookOpen, Activity, ArrowRight, BarChart3, ListFilter } from 'lucide-react';
import { apiFetchAdminDashboard } from '../../services/api';

interface AdminDashboardProps {
  onNavigateQueue: () => void;
  onNavigateAudit: () => void;
  onNavigateAnalytics: () => void;
  onNavigateEmbargo: () => void;
  lang: 'en' | 'hi';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateQueue,
  onNavigateAudit,
  onNavigateAnalytics,
  onNavigateEmbargo,
  lang
}) => {
  const [metrics, setMetrics] = useState<any>({
    pendingVerification: 0,
    approved: 0,
    rejected: 0,
    embargoed: 0,
    published: 0,
    totalClaims: 0,
    verifiedClaims: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetchAdminDashboard();
        setMetrics(res.metrics || {});
      } catch (e) {
        console.error('Error loading admin dashboard:', e);
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
      <div className="section-header-block mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="section-eyebrow" style={{ borderColor: 'rgba(244, 63, 94, 0.35)', background: 'rgba(244, 63, 94, 0.1)', color: '#FDA4AF' }}>
            <span className="eyebrow-dot" style={{ background: '#F43F5E', boxShadow: '0 0 8px #F43F5E' }} />
            <Shield className="w-3.5 h-3.5" />
            <span>NCPOR Scientific Review Board</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Admin Verification & <span className="heading-gradient">Dissemination Console</span>
          </h1>
          <p className="section-subtitle">
            Welcome, Dr. K. Swaminathan. Audit AI-generated claims, verify source evidence, manage embargoes, and approve manuscripts for public release.
          </p>
        </div>

        <button
          onClick={onNavigateQueue}
          className="btn-danger text-xs sm:text-sm py-2.5 px-5 flex items-center gap-2 shrink-0"
        >
          <Clock className="w-4 h-4" />
          <span>Open Verification Queue ({metrics.pendingVerification})</span>
        </button>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div 
          onClick={onNavigateQueue}
          className="glass-panel p-5 cursor-pointer hover:border-amber-400/60 transition-all text-center group"
        >
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Review</span>
          </div>
          <div className="text-3xl font-black text-amber-400 font-mono tabular-nums group-hover:scale-105 transition-transform">
            {metrics.pendingVerification}
          </div>
          <div className="text-[10px] text-amber-300/90 font-medium mt-1.5">Awaiting Decision</div>
        </div>

        <div className="glass-panel p-5 text-center">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Published</span>
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono tabular-nums">
            {metrics.published}
          </div>
          <div className="text-[10px] text-emerald-300/90 font-medium mt-1.5">Publicly Available</div>
        </div>

        <div className="glass-panel p-5 text-center">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.14em] mb-2 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Embargoed</span>
          </div>
          <div className="text-3xl font-black text-purple-400 font-mono tabular-nums">
            {metrics.embargoed}
          </div>
          <div className="text-[10px] text-purple-300/90 font-medium mt-1.5">Waiting for clearance</div>
        </div>

        <div className="glass-panel p-5 text-center">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Rejected</span>
          </div>
          <div className="text-3xl font-black text-rose-400">
            {metrics.rejected}
          </div>
          <div className="text-[10px] text-rose-300/80 mt-1.5">Needs correction</div>
        </div>

        <div className="glass-panel p-5 text-center">
          <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Claims Verified</span>
          </div>
          <div className="text-3xl font-black text-cyan-400">
            {((metrics.verifiedClaims / (metrics.totalClaims || 1)) * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-cyan-300/80 mt-1.5">Of {metrics.totalClaims} total claims</div>
        </div>
      </div>

      {/* QUICK ACTIONS & MODULES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        
        <div 
          onClick={onNavigateQueue}
          className="glass-panel p-6 sm:p-8 flex flex-col justify-between hover:border-rose-400/50 cursor-pointer transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center text-rose-400 mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition-colors mb-2">
              Verification & Audit Queue
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Review newly uploaded manuscripts, verify AI-extracted claims against original source text, and approve interactive learning modules for public dissemination.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Open Queue</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={onNavigateEmbargo}
          className="glass-panel p-6 sm:p-8 flex flex-col justify-between hover:border-purple-400/50 cursor-pointer transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-400 mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors mb-2">
              Embargo Management
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Manage publication embargo periods for sensitive polar data, strategic findings, and international collaboration mandates before public release.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Manage Embargoes</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={onNavigateAnalytics}
          className="glass-panel p-6 sm:p-8 flex flex-col justify-between hover:border-cyan-400/50 cursor-pointer transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">
              Dissemination Analytics
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Track portal engagement, popular research topics, student quiz performance metrics, and global viewership of Indian polar research.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>View Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        <div 
          onClick={onNavigateAudit}
          className="glass-panel p-6 sm:p-8 flex flex-col justify-between hover:border-emerald-400/50 cursor-pointer transition-all group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-4">
              <ListFilter className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
              System Audit Logs
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Review comprehensive, immutable logs of all researcher uploads, admin verification decisions, AI pipeline executions, and status changes.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Review Logs</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

      </div>
      
      </div>
    </div>
  );
};
