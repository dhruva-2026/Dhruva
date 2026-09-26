import React, { useState } from 'react';
import { 
  UploadCloud, FileText, CheckCircle2, ChevronRight, ChevronLeft, 
  Sparkles, Layers, Shield, Clock, MapPin, Calendar, Send, Check 
} from 'lucide-react';
import { apiUploadPaper } from '../../services/api';

interface PaperUploadWizardProps {
  onCompleted: (paperId: string) => void;
  onCancel: () => void;
  lang: 'en' | 'hi';
}

const STEPS = [
  '1. Document',
  '2. Metadata',
  '3. Discipline',
  '4. Region',
  '5. Location',
  '6. Embargo',
  '7. Review',
  '8. Processing'
];

export const PaperUploadWizard: React.FC<PaperUploadWizardProps> = ({ onCompleted, onCancel, lang }) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    title: 'Aerosol Optical Depth and Black Carbon Inversions in Kongsfjorden',
    abstract: 'This paper documents continuous measurements of equivalent black carbon (eBC) and aerosol optical properties over Kongsfjorden during the transition from polar night to spring sunlit conditions. Springtime Arctic Haze events show elevated soot accumulation linked to transboundary Eurasian air parcel transport.',
    authors: 'Dr. Ananya Sharma, Dr. Meera Sen',
    institution: 'National Centre for Polar and Ocean Research (NCPOR), Goa',
    research_area: 'Atmospheric Science',
    polar_region: 'Arctic',
    location_id: 'loc-3',
    keywords: 'aerosol optical depth, black carbon, Kongsfjorden, Himadri station, Arctic haze',
    publication_year: 2024,
    doi: '10.1016/j.polar.2024.08.019',
    embargo_enabled: 0,
    embargo_until: '2026-12-31',
    embargo_reason: ''
  });

  // Processing Stages Animation State
  const [pipelineStage, setPipelineStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submittedPaperId, setSubmittedPaperId] = useState<string | null>(null);

  const STAGES = [
    'Uploaded manuscript validated',
    'Extracting 8 structured sections (Abstract, Methods, Results...)',
    'Generating dense vector chunk embeddings (128-dim)',
    'Indexing chunks into SQLite Vector Database',
    'Generating simple English & Hindi summaries',
    'Synthesizing MCQs & 3D flashcards with source grounding',
    'Mapping claims to source citations & confidence scoring',
    'Queued for Admin Review in Verification Queue'
  ];

  const handleNext = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 7) {
      submitPaper();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitPaper = async () => {
    setCurrentStep(8);
    setIsProcessing(true);

    // Simulate animated pipeline step-by-step
    for (let i = 0; i < STAGES.length; i++) {
      setPipelineStage(i);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const res = await apiUploadPaper(formData);
      setSubmittedPaperId(res.paperId);
      setIsProcessing(false);
    } catch (e: any) {
      alert('Error during submission: ' + e.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="site-container-narrow py-12 space-y-10">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
          <UploadCloud className="w-4 h-4" />
          <span>Manuscript Ingestion Workflow</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Upload Research Paper to DHRUVA
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Step-by-step scientific ingestion wizard with automated section extraction, vector chunking, and AI grounding.
        </p>
      </div>

      {/* STEPPER PROGRESS BAR */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[620px] gap-2">
          {STEPS.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : isCurrent
                      ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/20 font-black'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : stepNum}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${
                    isCurrent ? 'text-cyan-400' : 'text-slate-400'
                  }`}>
                    {s}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    stepNum < currentStep ? 'bg-emerald-500' : 'bg-slate-800'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FORM WIZARD CONTAINER */}
      <div className="glass-panel p-6 sm:p-8 space-y-6">
        
        {/* STEP 1: UPLOAD PDF */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">Step 1: Select Manuscript File</h3>
            <p className="text-xs text-slate-400">Upload your PDF manuscript for scientific ingestion and section-aware grounding.</p>

            <div className="border-2 border-dashed border-cyan-400/30 rounded-2xl p-8 text-center space-y-4 bg-slate-900/40 hover:border-cyan-400/60 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white">polar_manuscript_submission_2024.pdf</div>
                <div className="text-xs text-slate-400">PDF document • 14 Pages • 2.4 MB</div>
              </div>
              <div className="badge badge-verified text-xs">
                ✓ PDF structure & text layers verified
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <span>Selected sample: <strong className="text-cyan-300">Himadri Station Kongsfjorden Aerosols Study</strong></span>
              <span className="badge badge-arctic text-[10px] font-semibold">PRE-LOADED MANUSCRIPT</span>
            </div>
          </div>
        )}

        {/* STEP 2: METADATA */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">Step 2: Paper Metadata</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Abstract</label>
              <textarea
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Authors</label>
                <input
                  type="text"
                  value={formData.authors}
                  onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Institution</label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Keywords</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">DOI</label>
                <input
                  type="text"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DISCIPLINE */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">Step 3: Primary Research Area</h3>
            <p className="text-xs text-slate-400">Select the polar science domain for categorical indexing and review assignment.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {[
                'Climate Science', 'Glaciology', 'Oceanography',
                'Atmospheric Science', 'Polar Biology', 'Remote Sensing',
                'Geology', 'Cryosphere', 'Environmental Science'
              ].map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setFormData({ ...formData, research_area: area })}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    formData.research_area === area
                      ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm">{area}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: REGION */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">Step 4: Polar Realm</h3>
            <p className="text-xs text-slate-400">Identify whether fieldwork was conducted in Arctic or Antarctic territories.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, polar_region: 'Arctic', location_id: 'loc-3' })}
                className={`p-6 rounded-2xl text-left border transition-all ${
                  formData.polar_region === 'Arctic'
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <span className="badge badge-arctic text-xs mb-2">Arctic Realm (North)</span>
                <div className="text-base font-bold text-white mb-1">High Arctic / Svalbard / Kongsfjorden</div>
                <div className="text-xs text-slate-300">Indian Station: Himadri • IndARC Mooring</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, polar_region: 'Antarctic', location_id: 'loc-1' })}
                className={`p-6 rounded-2xl text-left border transition-all ${
                  formData.polar_region === 'Antarctic'
                    ? 'bg-indigo-950/70 border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.25)]'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <span className="badge badge-antarctic text-xs mb-2">Antarctic Realm (South)</span>
                <div className="text-base font-bold text-white mb-1">East Antarctica / Schirmacher / Larsemann</div>
                <div className="text-xs text-slate-300">Indian Stations: Maitri • Bharati • Dakshin Gangotri</div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: LOCATION */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-white">Step 5: Polar Research Station / Site</h3>
            <p className="text-xs text-slate-400">Map the manuscript to one of India's research facilities or observational mooring sectors.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                { id: 'loc-3', name: 'Himadri Research Station', region: 'Arctic' },
                { id: 'loc-5', name: 'IndARC Deep Water Mooring', region: 'Arctic' },
                { id: 'loc-1', name: 'Maitri Research Station', region: 'Antarctic' },
                { id: 'loc-2', name: 'Bharati Research Station', region: 'Antarctic' },
                { id: 'loc-7', name: 'Prydz Bay Oceanographic Station', region: 'Antarctic' },
                { id: 'loc-10', name: 'Weddell Sea Sector', region: 'Antarctic' }
              ].map(loc => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, location_id: loc.id })}
                  className={`p-4 rounded-xl text-left border transition-all flex items-center justify-between ${
                    formData.location_id === loc.id
                      ? 'bg-cyan-950/70 border-cyan-400 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{loc.name}</div>
                    <div className="text-[10px] text-slate-400">{loc.region}</div>
                  </div>
                  {formData.location_id === loc.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: EMBARGO SETTINGS */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white">Step 6: Scientific Embargo Settings</h3>
              <p className="text-xs text-slate-400">Specify whether this research requires a pre-publication embargo.</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.embargo_enabled === 1}
                  onChange={(e) => setFormData({ ...formData, embargo_enabled: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white">Enable Scientific Embargo</div>
                  <div className="text-[11px] text-slate-400">
                    If enabled, this paper will remain completely hidden from the public portal until released by an administrator.
                  </div>
                </div>
              </label>

              {formData.embargo_enabled === 1 && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Embargo Expiry Date</label>
                    <input
                      type="date"
                      value={formData.embargo_until}
                      onChange={(e) => setFormData({ ...formData, embargo_until: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reason for Embargo</label>
                    <input
                      type="text"
                      value={formData.embargo_reason}
                      onChange={(e) => setFormData({ ...formData, embargo_reason: e.target.value })}
                      placeholder="e.g. Pending journal publication, patent application, international treaty review..."
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: REVIEW */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold text-white">Step 7: Pre-Submission Review</h3>
              <p className="text-xs text-slate-400">Verify manuscript parameters before initiating the automated AI extraction and grounding pipeline.</p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Title</span>
                <div className="font-bold text-white text-sm mt-0.5">{formData.title}</div>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold text-[10px] block">Abstract</span>
                <div className="text-slate-300 mt-0.5 leading-relaxed">{formData.abstract}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-500 uppercase font-bold text-[10px] block">Discipline</span>
                  <div className="text-cyan-300 font-semibold">{formData.research_area}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-bold text-[10px] block">Region</span>
                  <div className="text-cyan-300 font-semibold">{formData.polar_region}</div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-bold text-[10px] block">Embargo</span>
                  <div className="font-semibold text-slate-200">
                    {formData.embargo_enabled ? `Active until ${formData.embargo_until}` : 'None (Public upon Approval)'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-bold text-[10px] block">Uploader</span>
                  <div className="font-semibold text-slate-200">Dr. Ananya Sharma</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: LIVE PROCESSING PIPELINE ANIMATION */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-fadeIn text-center py-4">
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {isProcessing ? 'Automated Polar Science Processing Pipeline' : 'Manuscript Successfully Ingested!'}
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                {isProcessing 
                  ? 'Extracting sections, calculating vector embeddings, generating bilingual summaries, MCQs, and linking grounding claims...'
                  : 'Your paper has completed AI extraction and has been entered into the Admin Verification Queue.'}
              </p>
            </div>

            {/* Step list with live checks */}
            <div className="max-w-md mx-auto space-y-2 text-left text-xs">
              {STAGES.map((st, sIdx) => {
                const isDone = pipelineStage > sIdx || !isProcessing;
                const isCurrent = pipelineStage === sIdx && isProcessing;

                return (
                  <div 
                    key={sIdx}
                    className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
                      isDone
                        ? 'bg-slate-900/90 border-emerald-500/40 text-emerald-200'
                        : isCurrent
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 font-semibold animate-pulse'
                        : 'bg-slate-950/50 border-slate-800/60 text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                    )}
                    <span>{st}</span>
                  </div>
                );
              })}
            </div>

            {/* Post Completion Action */}
            {!isProcessing && submittedPaperId && (
              <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => onCompleted(submittedPaperId)}
                  className="btn-primary"
                >
                  <span>View in My Research Repository</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOTTOM NAVIGATION BUTTONS */}
        {currentStep < 8 && (
          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <button
              onClick={currentStep === 1 ? onCancel : handleBack}
              className="btn-secondary"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{currentStep === 1 ? 'Cancel' : 'Previous Step'}</span>
            </button>

            <button
              onClick={handleNext}
              className="btn-primary"
            >
              <span>{currentStep === 7 ? 'Initiate AI Ingestion & Submit' : 'Continue'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
