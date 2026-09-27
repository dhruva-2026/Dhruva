import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle2, Clock, XCircle, ShieldAlert, BookOpen, Activity, 
  ArrowRight, BarChart3, ListFilter, Sparkles, Layers, FileCheck
} from 'lucide-react';
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
    <div className="site-container py-10 space-y-10 animate-fadeIn">
      
      {/* Header with Polar Ocean Blue Gradient */}
      <div className="bg-gradient-to-r from-sky-50/90 via-white to-indigo-50/70 border border-sky-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/90 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-sky-600" />
            <span>NCPOR Scientific Review Board & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-heading">
            Admin Verification & <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent">Dissemination Console</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Welcome, Dr. K. Swaminathan. Audit AI-generated claims, verify source evidence, manage publication embargoes, and approve scientific manuscripts for public release.
          </p>
        </div>

        <button
          onClick={onNavigateQueue}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 hover:from-sky-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          <span>Open Verification Queue ({metrics.pendingVerification})</span>
        </button>
      </div>

      {/* METRICS OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div 
          onClick={onNavigateQueue}
          className="bg-white border border-slate-200 hover:border-amber-400 p-5 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
        >
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending Review</span>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono tabular-nums group-hover:scale-105 transition-transform">
            {metrics.pendingVerification}
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-1.5 bg-amber-50 px-2 py-0.5 rounded-full">
            <span>Awaiting Decision</span>
            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-2xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Published</span>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono tabular-nums">
            {metrics.published}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-1.5 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
            Publicly Discoverable
          </div>
        </div>

        <div 
          onClick={onNavigateEmbargo}
          className="bg-white border border-slate-200 hover:border-purple-400 p-5 rounded-2xl cursor-pointer hover:shadow-md transition-all text-center group"
        >
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
            <span>Embargoed</span>
          </div>
          <div className="text-3xl font-black text-purple-600 font-mono tabular-nums group-hover:scale-105 transition-transform">
            {metrics.embargoed}
          </div>
          <div className="inline-flex items-center gap-1 text-[11px] text-purple-700 font-medium mt-1.5 bg-purple-50 px-2 py-0.5 rounded-full">
            <span>Protected Access</span>
            <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-2xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Revisions Needed</span>
          </div>
          <div className="text-3xl font-black text-rose-600 font-mono tabular-nums">
            {metrics.rejected}
          </div>
          <div className="text-[10px] text-rose-700 font-medium mt-1.5 bg-rose-50 px-2 py-0.5 rounded-full inline-block">
            Returned to Author
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl text-center shadow-2xs">
          <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span>Claims Verified</span>
          </div>
          <div className="text-3xl font-black text-sky-600 font-mono tabular-nums">
            {((metrics.verifiedClaims / (metrics.totalClaims || 1)) * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-sky-700 font-medium mt-1.5 bg-sky-50 px-2 py-0.5 rounded-full inline-block">
            {metrics.verifiedClaims} of {metrics.totalClaims} Grounded
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS & MODULES */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-600" />
          <span>Governance & Review Modules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Module 1: Verification Queue */}
          <div 
            onClick={onNavigateQueue}
            className="bg-white border border-slate-200 hover:border-sky-400 p-6 sm:p-7 rounded-3xl flex flex-col justify-between hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Verification & Audit Queue
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review newly submitted manuscripts, audit AI-extracted claims against original source text, and verify interactive learning modules for public dissemination.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Open Queue ({metrics.pendingVerification} Pending)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 2: Embargo Management */}
          <div 
            onClick={onNavigateEmbargo}
            className="bg-white border border-slate-200 hover:border-purple-400 p-6 sm:p-7 rounded-3xl flex flex-col justify-between hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs group-hover:scale-105 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Embargo Management
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manage publication embargo periods for sensitive polar data, strategic findings, and international collaboration mandates before public release.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Manage Embargoes ({metrics.embargoed} Active)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 3: Dissemination Analytics */}
          <div 
            onClick={onNavigateAnalytics}
            className="bg-white border border-slate-200 hover:border-sky-400 p-6 sm:p-7 rounded-3xl flex flex-col justify-between hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-2xs group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Dissemination Analytics
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Track portal engagement, popular research topics, student quiz performance metrics, and global readership of Indian polar research.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Module 4: System Audit Logs */}
          <div 
            onClick={onNavigateAudit}
            className="bg-white border border-slate-200 hover:border-emerald-400 p-6 sm:p-7 rounded-3xl flex flex-col justify-between hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs group-hover:scale-105 transition-transform">
                <ListFilter className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                System Audit Logs
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review comprehensive, immutable logs of all researcher uploads, admin verification decisions, AI pipeline executions, and status changes.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Review Audit Trail</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};
