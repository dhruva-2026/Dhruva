import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Sparkles, 
  FileText, Check, X, Edit3, Send, Clock, BookOpen, Layers, ShieldAlert, Eye 
} from 'lucide-react';
import { apiFetchAdminVerification, apiVerifyClaim, apiDecidePaper } from '../../services/api';

interface AdminVerificationScreenProps {
  paperId: string;
  onBack: () => void;
  onViewPublic: (paperId: string) => void;
  lang: 'en' | 'hi';
}

export const AdminVerificationScreen: React.FC<AdminVerificationScreenProps> = ({
  paperId,
  onBack,
  onViewPublic,
  lang
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Left pane selected section
  const [selectedSectionIdx, setSelectedSectionIdx] = useState(0);

  // Right pane AI content tab
  const [rightTab, setRightTab] = useState<'summary' | 'findings' | 'learn' | 'social'>('summary');
  const [summaryLang, setSummaryLang] = useState<'en' | 'hi'>('en');

  // Decision inputs
  const [adminComment, setAdminComment] = useState('All AI statements verified against original text. Approved for portal publication.');
  const [rejectionReason, setRejectionReason] = useState('');
  const [overrideEmbargo, setOverrideEmbargo] = useState(false);
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);

  // Edit claim modal state
  const [editingClaim, setEditingClaim] = useState<any | null>(null);
  const [editedClaimText, setEditedClaimText] = useState('');
  const [claimComment, setClaimComment] = useState('');

  const loadVerificationData = async () => {
    setLoading(true);
    try {
      const res = await apiFetchAdminVerification(paperId);
      setData(res);
    } catch (e) {
      console.error('Error fetching admin verification data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationData();
  }, [paperId]);

  const handleClaimDecision = async (claimId: string, decision: 'Approved' | 'Edited' | 'Rejected', customText?: string) => {
    try {
      await apiVerifyClaim({
        claimId,
        paperId,
        decision,
        reviewerComment: claimComment || `Claim marked as ${decision} by NCPOR Reviewer.`,
        editedText: customText
      });
      setEditingClaim(null);
      setClaimComment('');
      loadVerificationData();
    } catch (e: any) {
      alert('Error updating claim: ' + e.message);
    }
  };

  const handlePaperDecision = async (decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !rejectionReason.trim()) {
      alert('Please specify a rejection reason for the researcher.');
      return;
    }

    setIsProcessingDecision(true);
    try {
      const res = await apiDecidePaper({
        paperId,
        decision,
        comment: adminComment,
        reason: rejectionReason,
        overrideEmbargo
      });
      alert(res.message);
      if (res.status === 'published') {
        onViewPublic(paperId);
      } else {
        onBack();
      }
    } catch (e: any) {
      alert('Error deciding paper: ' + e.message);
    } finally {
      setIsProcessingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-300 text-sm">Loading split-screen verification environment...</p>
      </div>
    );
  }

  if (!data || !data.paper) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Paper Not Found in Queue</h2>
        <button onClick={onBack} className="btn-secondary text-xs">Back to Queue</button>
      </div>
    );
  }

  const { paper, sections, aiOutput, mcqs, flashcards, claims } = data;
  const currentSection = sections[selectedSectionIdx] || sections[0];

  return (
    <div className="page-wrapper">
      <div className="page-wrapper-inner space-y-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px]">
                SPLIT-SCREEN REVIEW
              </span>
              <span className={`badge ${
                paper.status === 'published' ? 'badge-published' :
                paper.status === 'under_review' ? 'badge-review' :
                paper.status === 'rejected' ? 'badge-rejected' : 'badge-embargo'
              }`}>
                Status: {paper.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white mt-1 line-clamp-1">
              {paper.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-slate-400">Researcher:</span>
          <span className="text-xs font-semibold text-cyan-300">{paper.researcher_name || paper.authors}</span>
        </div>
      </div>

      {/* SPLIT-SCREEN MAIN GRID (50% LEFT / 50% RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[520px]">
        
        {/* LEFT PANE: ORIGINAL RESEARCH PAPER */}
        <div className="glass-panel p-6 flex flex-col justify-between space-y-4 border-slate-700/80">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Original Research Paper (Source)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Page {currentSection?.page_start} {currentSection?.page_end > currentSection?.page_start ? `– ${currentSection.page_end}` : ''}
              </span>
            </div>

            {/* Section Selector Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {sections.map((sec: any, idx: number) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionIdx(idx)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    selectedSectionIdx === idx
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sec.section_name}
                </button>
              ))}
            </div>

            {/* Section Content Display */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 max-h-[360px] overflow-y-auto space-y-2">
              <div className="text-xs font-bold text-cyan-400 font-mono">
                Section {currentSection?.section_order}: {currentSection?.section_name}
              </div>
              <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-normal">
                {currentSection?.content}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>Location: {paper.location_name || paper.polar_region}</span>
            <span>DOI: {paper.doi || 'Pending'}</span>
          </div>
        </div>

        {/* RIGHT PANE: AI GENERATED CONTENT */}
        <div className="glass-panel p-6 flex flex-col justify-between space-y-4 border-slate-700/80">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  AI Generated Outputs (For Review)
                </h3>
              </div>
              <span className="badge badge-arctic text-[10px] font-semibold">AI GENERATED DRAFT</span>
            </div>

            {/* AI Review Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'summary', label: 'Summary (EN/HI)' },
                { id: 'findings', label: 'Key Findings' },
                { id: 'learn', label: `Quiz & Cards (${mcqs?.length || 0})` },
                { id: 'social', label: 'Social Outreach' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setRightTab(t.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                    rightTab === t.id
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* AI Content Tab 1: Summary */}
            {rightTab === 'summary' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-h-[360px] overflow-y-auto space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase">Simplified Language Summary</div>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      onClick={() => setSummaryLang('en')}
                      className={`px-2 py-0.5 rounded font-bold ${summaryLang === 'en' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setSummaryLang('hi')}
                      className={`px-2 py-0.5 rounded font-bold ${summaryLang === 'hi' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {summaryLang === 'hi'
                    ? (aiOutput?.hindi_summary || 'हिंदी अनुवाद उपलब्ध नहीं है।')
                    : (aiOutput?.english_summary || 'No summary available.')}
                </div>

                {aiOutput?.why_it_matters && (
                  <div className="p-2.5 rounded bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200">
                    <strong className="block text-[10px] text-cyan-300 uppercase">Public Impact / Why It Matters:</strong>
                    {aiOutput.why_it_matters}
                  </div>
                )}
              </div>
            )}

            {/* AI Content Tab 2: Findings */}
            {rightTab === 'findings' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-h-[360px] overflow-y-auto space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Key Extracted Findings</div>
                {aiOutput?.key_findings ? (
                  aiOutput.key_findings.map((f: string, idx: number) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 flex gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{f}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">No findings extracted.</div>
                )}
              </div>
            )}

            {/* AI Content Tab 3: Learn (Quiz & Cards) */}
            {rightTab === 'learn' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-h-[360px] overflow-y-auto space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase">MCQ Questions & Citations</div>
                {mcqs.map((m: any, idx: number) => (
                  <div key={m.id} className="p-3 rounded bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="font-bold text-white">Q{idx + 1}: {m.question}</div>
                    <div className="text-emerald-400 font-semibold">Correct Option: {m.correct_option}</div>
                    <div className="text-slate-400 text-[11px]">Explanation: {m.explanation}</div>
                    <div className="text-cyan-400 text-[10px] font-mono">
                      Source: {m.source_section} (Page {m.source_page})
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Content Tab 4: Social */}
            {rightTab === 'social' && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 max-h-[360px] overflow-y-auto space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase">Social Media Dissemination Draft</div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono">
                  {aiOutput?.social_media_draft || 'No social draft.'}
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex justify-between">
            <span>Verification: Human-in-the-loop audit</span>
            <span className="text-cyan-400">Ready for Claim Evaluation</span>
          </div>
        </div>

      </div>

      {/* BOTTOM PANE: GROUNDING VERIFICATION BLOCK */}
      <div className="glass-panel p-6 sm:p-8 space-y-6 border-cyan-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">
                Grounding Verification & Evidence Inspection
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Audit each AI claim against original manuscript text. Confirm numerical claims and assertions.
            </p>
          </div>

          <div className="badge badge-verified text-xs">
            {claims.filter((c: any) => c.decision === 'Approved').length} of {claims.length} Claims Approved
          </div>
        </div>

        {/* Claims List */}
        <div className="space-y-4">
          {claims.map((claim: any) => {
            const isApproved = claim.decision === 'Approved';
            const isRejected = claim.decision === 'Rejected';
            const isPending = claim.decision === 'Pending';

            return (
              <div 
                key={claim.id}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  isApproved ? 'bg-emerald-950/20 border-emerald-500/40' :
                  isRejected ? 'bg-rose-950/20 border-rose-500/40' :
                  'bg-slate-900/90 border-slate-800'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{claim.id}</span>
                    <span className="badge bg-slate-800 text-slate-300 text-[10px]">
                      {claim.source_section} (Page {claim.source_page})
                    </span>
                    <span className="badge bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                      Confidence: {Math.round(claim.confidence_score * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`badge text-[10px] ${
                      isApproved ? 'badge-published' :
                      isRejected ? 'badge-rejected' : 'badge-review'
                    }`}>
                      Decision: {claim.decision}
                    </span>
                  </div>
                </div>

                {/* Claim vs Evidence Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Generated Claim */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">AI Generated Claim:</span>
                    <div className="text-white font-medium">"{claim.generated_claim}"</div>
                  </div>

                  {/* Source Evidence */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Original Source Evidence:</span>
                    <div className="text-slate-300 italic">"{claim.source_text}"</div>
                  </div>
                </div>

                {/* Reviewer Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    {claim.reviewer_comment ? (
                      <span>Note: <strong className="text-slate-200">{claim.reviewer_comment}</strong></span>
                    ) : (
                      <span>Click below to record audit decision</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleClaimDecision(claim.id, 'Approved')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isApproved
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'btn-success'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Claim</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingClaim(claim);
                        setEditedClaimText(claim.generated_claim);
                        setClaimComment('');
                      }}
                      className="btn-cyan text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Claim</span>
                    </button>

                    <button
                      onClick={() => handleClaimDecision(claim.id, 'Rejected')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isRejected
                          ? 'bg-rose-500 text-white font-bold'
                          : 'btn-danger'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject Claim</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FINAL ADMIN PUBLICATION DECISION PANEL */}
      <div className="glass-panel p-6 sm:p-8 space-y-6 border-rose-500/30">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h3 className="text-lg font-bold text-white">
            Final Editorial & Dissemination Decision
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Editorial Board Reviewer Comments (Mandatory for Audit Trail)
            </label>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              rows={2}
              className="text-xs py-2 px-3"
              placeholder="e.g. All claims verified. Approved for public portal publication..."
            />
          </div>

          {/* Embargo handling toggle if embargo exists */}
          {paper.embargo_enabled === 1 && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-purple-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>Paper is marked with Scientific Embargo until {paper.embargo_until ? paper.embargo_until.slice(0, 10) : 'end of 2026'}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  By default, approval will keep it hidden under "embargoed" status until release date.
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-cyan-300">
                <input
                  type="checkbox"
                  checked={overrideEmbargo}
                  onChange={(e) => setOverrideEmbargo(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Override Embargo & Publish Immediately</span>
              </label>
            </div>
          )}

          {/* Rejection reason box (optional unless rejecting) */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Rejection Reason (Required only if returning to researcher)
            </label>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Spectral noise artifacts, incomplete calibration..."
              className="text-xs py-2 px-3"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => handlePaperDecision('reject')}
              disabled={isProcessingDecision}
              className="btn-danger text-xs py-2.5 px-6"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Manuscript & Return to Researcher</span>
            </button>

            <button
              onClick={() => handlePaperDecision('approve')}
              disabled={isProcessingDecision}
              className="btn-primary text-xs py-2.5 px-8 shadow-[0_0_20px_rgba(0,198,255,0.5)]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{overrideEmbargo || !paper.embargo_enabled ? 'Approve & Publish to Public Portal' : 'Approve with Scheduled Embargo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CLAIM EDIT MODAL */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 max-w-lg w-full space-y-4 border-cyan-400">
            <h3 className="text-base font-bold text-white">Edit AI Claim for Grounding Accuracy</h3>
            
            <div>
              <label className="block text-xs text-slate-400 mb-1">Original Claim</label>
              <textarea
                value={editedClaimText}
                onChange={(e) => setEditedClaimText(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Reviewer Note</label>
              <input
                type="text"
                value={claimComment}
                onChange={(e) => setClaimComment(e.target.value)}
                placeholder="Corrected phrasing to reflect exact numerical percentage..."
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingClaim(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClaimDecision(editingClaim.id, 'Edited', editedClaimText)}
                className="btn-primary text-xs"
              >
                Save & Verify Claim
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
