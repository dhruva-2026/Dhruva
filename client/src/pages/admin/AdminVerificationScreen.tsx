import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Sparkles, 
  FileText, Check, X, Edit3, Send, Clock, BookOpen, Layers, ShieldAlert, Eye,
  ExternalLink, CheckCircle, HelpCircle, Share2
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
      <div className="site-container py-20 text-center">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm font-medium">Loading split-screen verification environment...</p>
      </div>
    );
  }

  if (!data || !data.paper) {
    return (
      <div className="site-container py-20 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Paper Not Found in Queue</h2>
        <p className="text-xs text-slate-500">The requested manuscript could not be loaded or is already archived.</p>
        <button onClick={onBack} className="btn-secondary text-xs">Back to Verification Queue</button>
      </div>
    );
  }

  const { paper, sections = [], aiOutput, mcqs = [], flashcards = [], claims = [] } = data;
  const currentSection = sections[selectedSectionIdx] || sections[0];

  return (
    <div className="site-container py-8 space-y-8">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Back to queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                Split-Screen Dual Review
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                paper.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                paper.status === 'under_review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                paper.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                {paper.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 line-clamp-1">
              {paper.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium">Principal Researcher:</span>
          <span className="font-semibold text-slate-900">{paper.researcher_name || paper.authors}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px]">{paper.id}</span>
        </div>
      </div>

      {/* SPLIT-SCREEN MAIN GRID (50% LEFT SOURCE / 50% RIGHT AI) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* LEFT PANE: ORIGINAL RESEARCH PAPER */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Original Manuscript
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Authentic human source text</p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                Page {currentSection?.page_start || 1} {currentSection?.page_end > currentSection?.page_start ? `– ${currentSection.page_end}` : ''}
              </span>
            </div>

            {/* Section Selector Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              {sections.map((sec: any, idx: number) => (
                <button
                  key={sec.id || idx}
                  onClick={() => setSelectedSectionIdx(idx)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    selectedSectionIdx === idx
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {sec.section_name}
                </button>
              ))}
            </div>

            {/* Section Content Display */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-[380px] overflow-y-auto space-y-2">
              <div className="text-xs font-bold text-sky-700 uppercase tracking-wider font-mono">
                Section {currentSection?.section_order || 1}: {currentSection?.section_name || 'Manuscript Excerpt'}
              </div>
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                {currentSection?.content || 'No section content extracted.'}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between font-medium">
            <span>Location: <strong className="text-slate-700">{paper.location_name || paper.polar_region}</strong></span>
            <span>DOI: <strong className="text-slate-700">{paper.doi || 'Pending Ingestion'}</strong></span>
          </div>
        </div>

        {/* RIGHT PANE: AI GENERATED CONTENT */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    AI Generated Outputs
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Plain-language summaries & learning artifacts</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                AI Draft Artifacts
              </span>
            </div>

            {/* AI Review Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              {[
                { id: 'summary', label: 'Summary (EN/HI)' },
                { id: 'findings', label: 'Key Findings' },
                { id: 'learn', label: `Quiz & Flashcards (${mcqs?.length || 0})` },
                { id: 'social', label: 'Social Outreach' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setRightTab(t.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    rightTab === t.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* AI Content Tab 1: Summary */}
            {rightTab === 'summary' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-[380px] overflow-y-auto space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Layman Language Abstract</div>
                  <div className="flex gap-1 text-xs">
                    <button
                      onClick={() => setSummaryLang('en')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        summaryLang === 'en' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setSummaryLang('hi')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        summaryLang === 'hi' ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal p-3 rounded-lg bg-white border border-slate-200">
                  {summaryLang === 'hi'
                    ? (aiOutput?.hindi_summary || 'हिंदी अनुवाद उपलब्ध नहीं है।')
                    : (aiOutput?.english_summary || 'No simplified summary generated yet.')}
                </div>

                {aiOutput?.why_it_matters && (
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-slate-800 space-y-1">
                    <strong className="block text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                      Public Impact / Why It Matters:
                    </strong>
                    <p className="leading-relaxed text-slate-700">{aiOutput.why_it_matters}</p>
                  </div>
                )}
              </div>
            )}

            {/* AI Content Tab 2: Findings */}
            {rightTab === 'findings' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-[380px] overflow-y-auto space-y-2.5">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Extracted Key Discoveries</div>
                {aiOutput?.key_findings && aiOutput.key_findings.length > 0 ? (
                  aiOutput.key_findings.map((f: string, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 flex gap-2.5 items-start">
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">{f}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 p-4 text-center">No distinct key findings extracted.</div>
                )}
              </div>
            )}

            {/* AI Content Tab 3: Learn (Quiz & Cards) */}
            {rightTab === 'learn' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-[380px] overflow-y-auto space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Generated Assessment Questions</div>
                {mcqs.map((m: any, idx: number) => (
                  <div key={m.id || idx} className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <span>Q{idx + 1}: {m.question}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Correct Answer: {m.correct_option}</span>
                    </div>
                    <div className="text-slate-600 text-[11px] leading-relaxed">
                      <strong className="text-slate-700">Explanation:</strong> {m.explanation}
                    </div>
                    <div className="text-sky-700 text-[11px] font-mono bg-sky-50 px-2 py-1 rounded border border-sky-200 inline-block">
                      Grounding Source: {m.source_section} (Page {m.source_page})
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Content Tab 4: Social */}
            {rightTab === 'social' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-[380px] overflow-y-auto space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Public Outreach & Social Media Draft</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                  {aiOutput?.social_media_draft || 'No social media outreach draft generated.'}
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between font-medium">
            <span>Audit: Human-in-the-loop review</span>
            <span className="text-indigo-600 font-semibold">Ready for Claim Evaluation</span>
          </div>
        </div>

      </div>

      {/* BOTTOM PANE: GROUNDING VERIFICATION BLOCK */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Grounding Verification & Evidence Inspection
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Audit each AI-generated claim against original manuscript text. Verify numerical assertions and factual fidelity.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{claims.filter((c: any) => c.decision === 'Approved').length} of {claims.length} Claims Approved</span>
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
                  isApproved ? 'bg-emerald-50/40 border-emerald-200' :
                  isRejected ? 'bg-rose-50/40 border-rose-200' :
                  'bg-slate-50/70 border-slate-200'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {claim.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white text-slate-600 border border-slate-200">
                      {claim.source_section} (Page {claim.source_page})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      Confidence: {Math.round(claim.confidence_score * 100)}%
                    </span>
                  </div>

                  <div>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      isApproved ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                      isRejected ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      Decision: {claim.decision}
                    </span>
                  </div>
                </div>

                {/* Claim vs Evidence Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Generated Claim */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-sky-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Generated Claim:
                    </span>
                    <div className="text-slate-900 font-semibold leading-relaxed">
                      "{claim.generated_claim}"
                    </div>
                  </div>

                  {/* Source Evidence */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Original Source Evidence:
                    </span>
                    <div className="text-slate-700 italic leading-relaxed">
                      "{claim.source_text}"
                    </div>
                  </div>
                </div>

                {/* Reviewer Actions */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 font-medium">
                    {claim.reviewer_comment ? (
                      <span>Reviewer Note: <strong className="text-slate-800">{claim.reviewer_comment}</strong></span>
                    ) : (
                      <span>Select an evaluation decision below:</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleClaimDecision(claim.id, 'Approved')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isApproved
                          ? 'bg-emerald-600 text-white shadow-sm font-bold'
                          : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300'
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
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-white text-sky-700 hover:bg-sky-50 border border-sky-300 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Claim</span>
                    </button>

                    <button
                      onClick={() => handleClaimDecision(claim.id, 'Rejected')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isRejected
                          ? 'bg-rose-600 text-white shadow-sm font-bold'
                          : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-300'
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Final Editorial & Dissemination Decision
            </h3>
            <p className="text-xs text-slate-500">Record formal decision for immutable tamper-evident audit provenance</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Editorial Board Reviewer Comments (Mandatory for Audit Trail)
            </label>
            <textarea
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              rows={2}
              className="text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl w-full text-slate-900 focus:bg-white focus:border-sky-500 transition-colors"
              placeholder="e.g. All claims verified. Approved for public portal publication..."
            />
          </div>

          {/* Embargo handling toggle if embargo exists */}
          {paper.embargo_enabled === 1 && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-purple-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  <span>Paper has Active Scientific Embargo until {paper.embargo_until ? paper.embargo_until.slice(0, 10) : '2026-12-31'}</span>
                </div>
                <div className="text-[11px] text-purple-700">
                  By default, approval keeps the manuscript shielded under "embargoed" status until release date.
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-900 select-none">
                <input
                  type="checkbox"
                  checked={overrideEmbargo}
                  onChange={(e) => setOverrideEmbargo(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                />
                <span>Override Embargo & Publish Immediately</span>
              </label>
            </div>
          )}

          {/* Rejection reason box (optional unless rejecting) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rejection Reason (Required only if returning manuscript to researcher)
            </label>
            <input
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Spectral noise artifacts, incomplete calibration..."
              className="text-xs py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl w-full text-slate-900 focus:bg-white focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => handlePaperDecision('reject')}
              disabled={isProcessingDecision}
              className="btn-danger text-xs py-2.5 px-6 flex items-center gap-2 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Manuscript & Return to Author</span>
            </button>

            <button
              onClick={() => handlePaperDecision('approve')}
              disabled={isProcessingDecision}
              className="btn-primary text-xs py-2.5 px-8 flex items-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{overrideEmbargo || !paper.embargo_enabled ? 'Approve & Publish to Public Portal' : 'Approve with Scheduled Embargo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CLAIM EDIT MODAL */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <Edit3 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Edit AI Claim for Grounding Accuracy</h3>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Original AI Claim</label>
              <textarea
                value={editedClaimText}
                onChange={(e) => setEditedClaimText(e.target.value)}
                rows={3}
                className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-slate-900 focus:bg-white focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Reviewer Audit Note</label>
              <input
                type="text"
                value={claimComment}
                onChange={(e) => setClaimComment(e.target.value)}
                placeholder="Corrected phrasing to reflect exact numerical percentage..."
                className="text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl w-full text-slate-900 focus:bg-white focus:border-sky-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
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
  );
};
