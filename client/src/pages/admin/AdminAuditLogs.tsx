import React, { useState, useEffect } from 'react';
import { ListFilter, ArrowLeft, Shield, Clock, Search, RefreshCw, FileText } from 'lucide-react';
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
    <div className="page-wrapper">
      <div className="page-wrapper-inner space-y-10">
      
      {/* Header */}
      <div className="section-header-block mb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-white transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="section-eyebrow">
            <span className="eyebrow-dot" />
            <Shield className="w-3.5 h-3.5" />
            <span>System Provenance & Security</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tamper-Evident <span className="heading-gradient">System Audit Trail</span>
          </h1>
          <p className="section-subtitle">
            Immutable activity log tracking every submission, AI extraction, reviewer decision, claim verification, and embargo change.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, paper ID, or details..."
            className="text-xs pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg w-full text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Action Type:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
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
      <div className="glass-panel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
            Loading audit records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase text-slate-400 bg-slate-900/90 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Paper ID</th>
                  <th className="py-3 px-4">Details / Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{log.actor}</div>
                      <div className="text-[10px] text-cyan-400 uppercase font-mono">{log.role}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`badge text-[9px] ${
                        log.action.includes('APPROVED') || log.action.includes('PUBLISHED') ? 'badge-published' :
                        log.action.includes('REJECTED') ? 'badge-rejected' :
                        log.action.includes('EMBARGO') ? 'badge-embargo' :
                        log.action.includes('RAG') ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {log.action.replace('RAG_', 'AI_')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                      {log.paper_id || '—'}
                    </td>
                    <td className="py-3 px-4 max-w-md text-slate-300">
                      <div>{log.details || 'System event recorded'}</div>
                      {log.previous_value && log.new_value && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Delta: <span className="line-through text-rose-400">{log.previous_value}</span> → <span className="text-emerald-400 font-bold">{log.new_value}</span>
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
    </div>
  );
};
