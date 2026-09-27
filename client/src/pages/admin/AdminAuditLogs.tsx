import React, { useState, useEffect } from 'react';
import { ListFilter, ArrowLeft, Shield, Clock, Search, RefreshCw, FileText, CheckCircle2, AlertTriangle, Sparkles, Filter } from 'lucide-react';
import { apiFetchAuditLogs } from '../../services/api';

interface AdminAuditLogsProps {
  onBack: () => void;
  lang: 'en' | 'hi';
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ onBack, lang }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAuditLogs();
      setLogs(res.logs || []);
    } catch (e) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const matchesAction = filterAction === 'All' || l.action === filterAction;
    const matchesSearch = !searchTerm.trim() || 
      l.actor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.paper_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

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
          <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>System Provenance & Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tamper-Evident System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Cryptographically chained immutable activity log recording manuscript submissions, AI extractions, claim verifications, reviewer decisions, and embargo adjustments.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, paper ID, or details..."
            className="text-xs pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium cursor-pointer focus:bg-white focus:border-sky-500"
          >
            <option value="All">All Actions</option>
            <option value="PAPER_SUBMITTED">Paper Submitted</option>
            <option value="AI_PROCESSING_COMPLETED">AI Extraction Completed</option>
            <option value="CLAIM_VERIFIED">Claim Verified</option>
            <option value="PAPER_APPROVED">Paper Approved</option>
            <option value="PAPER_PUBLISHED">Paper Published</option>
            <option value="PAPER_REJECTED">Paper Rejected</option>
            <option value="EMBARGO_MODIFIED">Embargo Modified</option>
            <option value="RAG_QUERY_ANSWERED">AI Query Answered</option>
          </select>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit records match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase tracking-wider text-slate-600 bg-slate-50 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor & Role</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Paper ID</th>
                  <th className="py-3.5 px-4">Details / Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.actor}</div>
                      <div className="text-[10px] text-sky-700 uppercase font-mono font-bold">{log.role}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        log.action.includes('APPROVED') || log.action.includes('PUBLISHED') ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                        log.action.includes('REJECTED') ? 'bg-rose-50 text-rose-800 border-rose-300' :
                        log.action.includes('EMBARGO') ? 'bg-purple-50 text-purple-800 border-purple-300' :
                        log.action.includes('RAG') ? 'bg-sky-50 text-sky-800 border-sky-300' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {log.action.replace('RAG_', 'AI_')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600 font-medium">
                      {log.paper_id || '—'}
                    </td>
                    <td className="py-3.5 px-4 max-w-md text-slate-700">
                      <div>{log.details || 'System event recorded'}</div>
                      {log.previous_value && log.new_value && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 inline-block">
                          Delta: <span className="line-through text-rose-600">{log.previous_value}</span> → <span className="text-emerald-700 font-bold">{log.new_value}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
