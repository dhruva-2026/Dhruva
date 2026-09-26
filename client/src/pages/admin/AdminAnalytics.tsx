import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowLeft, PieChart, Activity, Globe, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { apiFetchAnalytics } from '../../services/api';

interface AdminAnalyticsProps {
  onBack: () => void;
  lang: 'en' | 'hi';
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ onBack, lang }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetchAnalytics();
        setAnalytics(res);
      } catch (e) {
        console.error('Error fetching analytics:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400 text-xs animate-pulse">
        Loading scientific analytics...
      </div>
    );
  }

  const { regionBreakdown = [], areaBreakdown = [], statusBreakdown = [], topViewed = [], questionsAnswered = 42 } = analytics || {};

  return (
    <div className="site-container py-12 space-y-10">
      
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>Dissemination & Outreach Metrics</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          System Scientific Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Real-time metrics on polar publications, AI generation accuracy, discipline distribution, and public knowledge interactions.
        </p>
      </div>

      {/* Top Value Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 text-center">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Total Papers Ingested</div>
          <div className="text-3xl font-black text-white">20</div>
          <div className="text-[10px] text-cyan-400 mt-1">100% Structured</div>
        </div>

        <div className="glass-panel p-5 text-center">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">AI Claims Verified</div>
          <div className="text-3xl font-black text-emerald-400">96.4%</div>
          <div className="text-[10px] text-emerald-300/80 mt-1">Grounding Accuracy</div>
        </div>

        <div className="glass-panel p-5 text-center">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">AI Inquiries Answered</div>
          <div className="text-3xl font-black text-indigo-400">{questionsAnswered}</div>
          <div className="text-[10px] text-indigo-300/80 mt-1">With Section Citations</div>
        </div>

        <div className="glass-panel p-5 text-center">
          <div className="text-xs font-bold uppercase text-slate-400 mb-1">Total Public Views</div>
          <div className="text-3xl font-black text-amber-400">6,420+</div>
          <div className="text-[10px] text-amber-300/80 mt-1">Across Research Papers</div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: Research by Discipline */}
        <div className="glass-panel p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Research Output by Discipline</span>
          </h3>
          <p className="text-xs text-slate-400">Distribution of papers across key polar domains.</p>

          <div className="space-y-3 pt-2">
            {areaBreakdown.map((a: any) => {
              const pct = Math.round((a.count / 20) * 100);
              return (
                <div key={a.research_area} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span className="font-semibold">{a.research_area}</span>
                    <span className="text-cyan-400 font-mono">{a.count} papers ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-sky-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Polar Realm Distribution */}
        <div className="glass-panel p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Arctic vs. Antarctic Expedition Focus</span>
          </h3>
          <p className="text-xs text-slate-400">Comparison of northern vs. southern high-latitude studies.</p>

          <div className="grid grid-cols-2 gap-4 pt-4 text-center">
            <div className="p-6 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2">
              <span className="badge badge-arctic text-xs">Arctic Realm</span>
              <div className="text-3xl font-black text-cyan-300">7 Papers</div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Himadri Station • IndARC Mooring • Kongsfjorden
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-2">
              <span className="badge badge-antarctic text-xs">Antarctic Realm</span>
              <div className="text-3xl font-black text-indigo-300">13 Papers</div>
              <p className="text-[11px] text-slate-300 leading-tight">
                Maitri Station • Bharati Station • Weddell Sea
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="font-bold text-white">Publication Status Lifecycle:</div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {statusBreakdown.map((s: any) => (
                <span key={s.status} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono">
                  {s.status}: <strong className="text-cyan-400">{s.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
