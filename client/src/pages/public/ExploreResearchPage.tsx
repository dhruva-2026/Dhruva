import React, { useState, useEffect } from 'react';
import {
  Search, BookOpen, RefreshCw, SlidersHorizontal, ChevronLeft, ChevronRight,
  MapPin, Eye, Calendar, RotateCcw, ChevronDown, User, Building2, Check, X, Filter
} from 'lucide-react';
import { apiFetchPapers } from '../../services/api';
import { BACKUP_PAPERS, type BackupPaper } from '../../data/backupPapers';

interface ExploreResearchPageProps {
  onReadPaper: (id: string) => void;
  onAskPaper: (paper: any) => void;
  lang: 'en' | 'hi';
  initialArea?: string;
  initialSearch?: string;
}

const RESEARCH_AREAS = [
  'All', 'Climate Science', 'Glaciology', 'Oceanography',
  'Atmospheric Science', 'Polar Biology', 'Remote Sensing',
  'Geology', 'Cryosphere', 'Environmental Science'
];

const RESEARCH_INSTITUTIONS = [
  'All Institutions',
  'National Centre for Polar and Ocean Research (NCPOR), Goa',
  'Department of Earth Sciences, IIT Roorkee',
  'Center for Climate & Environmental Studies, IISER Pune',
  'CSIR - National Institute of Oceanography (NIO), Goa',
  'Space Applications Centre (ISRO), Ahmedabad',
  'India Meteorological Department (IMD), New Delhi',
  'Banaras Hindu University, Dept of Geophysics',
  'Divecha Centre for Climate Change, IISc Bengaluru',
  'Wadia Institute of Himalayan Geology'
];

const POLAR_LOCATIONS = [
  { id: 'All', name: 'All Stations & Expeditions' },
  { id: 'loc-1', name: 'Maitri Research Station (Antarctic)' },
  { id: 'loc-2', name: 'Bharati Research Station (Antarctic)' },
  { id: 'loc-3', name: 'Himadri Research Station (Arctic)' },
  { id: 'loc-4', name: 'Dakshin Gangotri Base (Historical Antarctic)' },
  { id: 'loc-5', name: 'IndARC Deep Water Mooring (Arctic)' },
  { id: 'loc-6', name: 'Kongsfjorden Marine Transect (Arctic)' },
  { id: 'loc-7', name: 'Prydz Bay Oceanographic Station (Antarctic)' },
  { id: 'loc-8', name: 'Schirmacher Oasis Glaciological Grid (Antarctic)' },
  { id: 'loc-9', name: 'Ny-Ålesund International Polar Village (Arctic)' },
  { id: 'loc-10', name: 'Weddell Sea Sea-Ice Observation Sector (Antarctic)' }
];

// All publication years from 2026 down to 2000
const CURRENT_YEAR = new Date().getFullYear();
const PUBLICATION_YEARS = Array.from(
  { length: CURRENT_YEAR - 2000 + 1 },
  (_, i) => String(CURRENT_YEAR - i)
);

function getFilteredBackupPapers(params: {
  search?: string;
  region?: string;
  area?: string;
  year?: string;
  sort?: string;
  author?: string;
  institution?: string;
  locationId?: string;
  peerReviewed?: boolean;
  openAccess?: boolean;
}): BackupPaper[] {
  let list = [...BACKUP_PAPERS];

  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.abstract && p.abstract.toLowerCase().includes(q)) ||
      (p.authors && p.authors.toLowerCase().includes(q)) ||
      (p.keywords && p.keywords.toLowerCase().includes(q)) ||
      (p.institution && p.institution.toLowerCase().includes(q))
    );
  }

  if (params.region && params.region !== 'All') {
    list = list.filter(p => p.polar_region?.toLowerCase() === params.region?.toLowerCase());
  }

  if (params.area && params.area !== 'All') {
    list = list.filter(p => p.research_area?.toLowerCase() === params.area?.toLowerCase());
  }

  if (params.year && params.year !== 'All') {
    const y = parseInt(params.year, 10);
    list = list.filter(p => p.publication_year === y);
  }

  if (params.author && params.author.trim()) {
    const a = params.author.trim().toLowerCase();
    list = list.filter(p => p.authors && p.authors.toLowerCase().includes(a));
  }

  if (params.institution && params.institution !== 'All') {
    const inst = params.institution.trim().toLowerCase();
    list = list.filter(p => p.institution && p.institution.toLowerCase().includes(inst));
  }

  if (params.locationId && params.locationId !== 'All') {
    list = list.filter(p => p.location_id === params.locationId);
  }

  if (params.peerReviewed) {
    list = list.filter(p => Boolean(p.doi && p.doi.trim().length > 0));
  }

  if (params.openAccess) {
    list = list.filter(p => p.visibility === 'public' && (!p.embargo_enabled || p.embargo_enabled === 0));
  }

  if (params.sort === 'views') {
    list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  } else if (params.sort === 'oldest') {
    list.sort((a, b) => (a.publication_year || 0) - (b.publication_year || 0) || a.id.localeCompare(b.id));
  } else {
    list.sort((a, b) => (b.publication_year || 0) - (a.publication_year || 0) || a.id.localeCompare(b.id));
  }

  return list;
}

const ITEMS_PER_PAGE = 6;

export const ExploreResearchPage: React.FC<ExploreResearchPageProps> = ({ onReadPaper, onAskPaper, lang, initialArea, initialSearch }) => {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedArea, setSelectedArea] = useState(initialArea || 'All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  // Advanced Filters State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authorQuery, setAuthorQuery] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [peerReviewedOnly, setPeerReviewedOnly] = useState(false);
  const [openAccessOnly, setOpenAccessOnly] = useState(false);

  useEffect(() => {
    if (initialArea) {
      setSelectedArea(initialArea);
    }
  }, [initialArea]);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchTerm(initialSearch);
      setPage(1);
    }
  }, [initialSearch]);

  const loadPapers = async () => {
    setLoading(true);
    const filterParams: Record<string, any> = {
      search: searchTerm,
      region: selectedRegion,
      area: selectedArea,
      year: selectedYear,
      sort: sortBy,
    };
    if (authorQuery.trim()) filterParams.author = authorQuery.trim();
    if (selectedInstitution !== 'All') filterParams.institution = selectedInstitution;
    if (selectedLocation !== 'All') filterParams.locationId = selectedLocation;
    if (peerReviewedOnly) filterParams.peerReviewed = true;
    if (openAccessOnly) filterParams.openAccess = true;

    try {
      const res = await apiFetchPapers(filterParams);
      if (res && Array.isArray(res.papers) && res.papers.length > 0) {
        setPapers(res.papers);
      } else {
        const fallback = getFilteredBackupPapers(filterParams);
        setPapers(fallback);
      }
      setPage(1);
    } catch (e) {
      console.warn('API fetch failed, loading fallback research papers:', e);
      const fallback = getFilteredBackupPapers(filterParams);
      setPapers(fallback);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, [
    selectedRegion,
    selectedArea,
    selectedYear,
    sortBy,
    selectedInstitution,
    selectedLocation,
    peerReviewedOnly,
    openAccessOnly,
  ]);

  // Debounced search on author
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPapers();
    }, 350);
    return () => clearTimeout(timer);
  }, [authorQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPapers();
  };

  // Full reset clears all primary and advanced filters
  const handleReset = () => {
    setSearchTerm('');
    setSelectedRegion('All');
    setSelectedArea('All');
    setSelectedYear('All');
    setSortBy('latest');
    setAuthorQuery('');
    setSelectedInstitution('All');
    setSelectedLocation('All');
    setPeerReviewedOnly(false);
    setOpenAccessOnly(false);
    setPage(1);
  };

  // Count active filters
  const advancedFiltersActiveCount =
    (authorQuery.trim() ? 1 : 0) +
    (selectedInstitution !== 'All' ? 1 : 0) +
    (selectedLocation !== 'All' ? 1 : 0) +
    (peerReviewedOnly ? 1 : 0) +
    (openAccessOnly ? 1 : 0);

  const totalFiltersActiveCount =
    (searchTerm.trim() ? 1 : 0) +
    (selectedRegion !== 'All' ? 1 : 0) +
    (selectedArea !== 'All' ? 1 : 0) +
    (selectedYear !== 'All' ? 1 : 0) +
    (sortBy !== 'latest' ? 1 : 0) +
    advancedFiltersActiveCount;

  const totalPages = Math.max(1, Math.ceil(papers.length / ITEMS_PER_PAGE));
  const pagedPapers = papers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const selectStyle: React.CSSProperties = {
    width: '100%',
    background: '#FFFFFF',
    border: '1px solid rgba(14, 116, 144, 0.22)',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    color: '#0F172A',
    outline: 'none',
    appearance: 'none' as any,
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '16px',
    paddingRight: '32px',
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ═══ HERO SECTION ═══ */}
      <div style={{ position: 'relative', minHeight: '280px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        {/* Background gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(240,249,255,0.4) 0%, rgba(240,249,255,0.12) 60%, transparent 100%)',
          zIndex: 1,
        }} />
        <img
          src="/images/hero-polar.jpg"
          alt="Polar research"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%', opacity: 0.15 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Science badge — top right (hidden on mobile to prevent overlapping hero text) */}
        <div className="hidden sm:block" style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 2, textAlign: 'right' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#64748B', lineHeight: 1.7 }}>
            SCIENCE<br />FOR A SUSTAINABLE<br />
            <span style={{ color: '#0284C7', fontWeight: 800 }}>POLAR FUTURE</span>
          </div>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #0284C7)', marginTop: '4px', borderRadius: '2px' }} />
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '5rem clamp(1rem,3vw,2.5rem) 2.5rem' }}>
          <div className="section-eyebrow" style={{ marginBottom: '10px' }}>
            <span className="eyebrow-dot" />
            <span>Explore Research</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            Discover{' '}
            <span className="heading-gradient">
              Polar Knowledge
            </span>
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.65, maxWidth: '520px' }}>
            Access peer-reviewed research, datasets, and scientific insights from India's polar expeditions and global collaborations.
          </p>
        </div>
      </div>

      {/* ═══ SEARCH + FILTER PANEL ═══ */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 clamp(1rem,3vw,2.5rem)' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.94)',
          border: '1px solid rgba(14, 116, 144, 0.18)',
          borderRadius: '16px', padding: '20px 24px 16px',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
          marginTop: '-32px', position: 'relative', zIndex: 10,
        }}>

          {/* Search row */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
              <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by keyword, topic, author, title..."
                style={{
                  width: '100%', background: '#FFFFFF', border: '1px solid rgba(14, 116, 144, 0.22)',
                  borderRadius: '10px', paddingLeft: '44px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
                  fontSize: '14px', color: '#0F172A', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#0284C7'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(14, 116, 144, 0.22)'; }}
              />
            </div>

            {/* Search button */}
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '0 22px',
              borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF', boxShadow: '0 4px 14px rgba(2,132,199,0.3)', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-heading)', height: '44px'
            }}>
              <Search size={15} />
              Search
            </button>

            {/* Workable Advanced Filters button */}
            <button
              type="button"
              id="btn-advanced-filters"
              onClick={() => setShowAdvanced(prev => !prev)}
              aria-expanded={showAdvanced}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px',
                borderRadius: '10px',
                border: showAdvanced || advancedFiltersActiveCount > 0 ? '1px solid #0284C7' : '1px solid #CBD5E1',
                cursor: 'pointer',
                fontSize: '13px', fontWeight: 600,
                background: showAdvanced ? '#E0F2FE' : (advancedFiltersActiveCount > 0 ? '#F0F9FF' : '#F8FAFC'),
                color: showAdvanced || advancedFiltersActiveCount > 0 ? '#0284C7' : '#475569',
                whiteSpace: 'nowrap', transition: 'all 0.18s ease',
                height: '44px'
              }}
              onMouseEnter={(e) => {
                if (!showAdvanced) {
                  (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                  (e.currentTarget as HTMLElement).style.color = '#0284C7';
                }
              }}
              onMouseLeave={(e) => {
                if (!showAdvanced) {
                  (e.currentTarget as HTMLElement).style.borderColor = advancedFiltersActiveCount > 0 ? '#0284C7' : '#CBD5E1';
                  (e.currentTarget as HTMLElement).style.color = advancedFiltersActiveCount > 0 ? '#0284C7' : '#475569';
                }
              }}
            >
              <SlidersHorizontal size={15} style={{ color: showAdvanced || advancedFiltersActiveCount > 0 ? '#0284C7' : '#64748B' }} />
              <span>Advanced Filters</span>
              {advancedFiltersActiveCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '20px', height: '20px', borderRadius: '10px',
                  background: '#0284C7', color: '#FFFFFF', fontSize: '11px', fontWeight: 700,
                  padding: '0 5px'
                }}>
                  {advancedFiltersActiveCount}
                </span>
              )}
              <ChevronDown
                size={14}
                style={{
                  transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: showAdvanced ? '#0284C7' : '#94A3B8'
                }}
              />
            </button>
          </form>

          {/* ═══ ADVANCED FILTERS EXPANDABLE DRAWER ═══ */}
          {showAdvanced && (
            <div
              id="advanced-filters-panel"
              style={{
                background: '#F8FAFC',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '16px',
                boxShadow: 'inset 0 2px 6px rgba(15, 23, 42, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={15} style={{ color: '#0284C7' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                    Advanced Polar Scientific Filters
                  </span>
                  {advancedFiltersActiveCount > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7', background: '#E0F2FE', padding: '2px 8px', borderRadius: '999px' }}>
                      {advancedFiltersActiveCount} active
                    </span>
                  )}
                </div>

                {advancedFiltersActiveCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthorQuery('');
                      setSelectedInstitution('All');
                      setSelectedLocation('All');
                      setPeerReviewedOnly(false);
                      setOpenAccessOnly(false);
                    }}
                    style={{
                      fontSize: '12px', color: '#64748B', background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
                  >
                    <RotateCcw size={12} />
                    Reset Advanced Parameters
                  </button>
                )}
              </div>

              {/* Advanced Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                {/* Author Search */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '6px' }}>
                    Author / Lead Scientist
                  </div>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      value={authorQuery}
                      onChange={(e) => setAuthorQuery(e.target.value)}
                      placeholder="e.g. Dr. Ananya Sharma, Arjun Rao..."
                      style={{
                        width: '100%', background: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px',
                        padding: '8px 12px 8px 32px', fontSize: '13px', color: '#0F172A', outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#0284C7'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                    />
                    {authorQuery && (
                      <button
                        type="button"
                        onClick={() => setAuthorQuery('')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Research Institution */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '6px' }}>
                    Affiliated Institution
                  </div>
                  <select
                    value={selectedInstitution}
                    onChange={(e) => setSelectedInstitution(e.target.value)}
                    style={selectStyle}
                  >
                    {RESEARCH_INSTITUTIONS.map(inst => (
                      <option key={inst} value={inst === 'All Institutions' ? 'All' : inst}>{inst}</option>
                    ))}
                  </select>
                </div>

                {/* Station / Location */}
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '6px' }}>
                    Polar Station / Observatory
                  </div>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    style={selectStyle}
                  >
                    {POLAR_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles & Quick Presets */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '12px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={peerReviewedOnly}
                      onChange={(e) => setPeerReviewedOnly(e.target.checked)}
                      style={{ accentColor: '#0284C7', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>Peer-Reviewed (DOI Verified)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={openAccessOnly}
                      onChange={(e) => setOpenAccessOnly(e.target.checked)}
                      style={{ accentColor: '#0284C7', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span>Open Access Full-Text</span>
                  </label>
                </div>

                {/* Quick Station Presets */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Quick Station:</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('Antarctic'); setSelectedLocation('loc-2'); }}
                    style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px',
                      border: selectedLocation === 'loc-2' ? '1px solid #0284C7' : '1px solid #CBD5E1',
                      background: selectedLocation === 'loc-2' ? '#E0F2FE' : '#FFFFFF',
                      color: selectedLocation === 'loc-2' ? '#0284C7' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Bharati Station
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('Antarctic'); setSelectedLocation('loc-1'); }}
                    style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px',
                      border: selectedLocation === 'loc-1' ? '1px solid #0284C7' : '1px solid #CBD5E1',
                      background: selectedLocation === 'loc-1' ? '#E0F2FE' : '#FFFFFF',
                      color: selectedLocation === 'loc-1' ? '#0284C7' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Maitri Station
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRegion('Arctic'); setSelectedLocation('loc-3'); }}
                    style={{
                      fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '6px',
                      border: selectedLocation === 'loc-3' ? '1px solid #0284C7' : '1px solid #CBD5E1',
                      background: selectedLocation === 'loc-3' ? '#E0F2FE' : '#FFFFFF',
                      color: selectedLocation === 'loc-3' ? '#0284C7' : '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Himadri Station
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Primary Filter row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'start', paddingTop: '14px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>

            {/* Polar Region */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Polar Region</div>
              <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '3px' }}>
                {['All', 'Arctic', 'Antarctic'].map(r => {
                  const active = selectedRegion === r;
                  return (
                    <button key={r} type="button" onClick={() => setSelectedRegion(r)} style={{
                      flex: 1, padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 700, transition: 'all 0.15s',
                      background: active ? '#0284C7' : 'transparent',
                      color: active ? '#FFFFFF' : '#64748B',
                      boxShadow: active ? '0 2px 6px rgba(2,132,199,0.3)' : 'none',
                      whiteSpace: 'nowrap', textAlign: 'center'
                    }}>
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Discipline / Area */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Discipline / Area</div>
              <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} style={selectStyle}>
                {RESEARCH_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Publication Year (Includes all years from 2000 to present) */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Publication Year</div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={selectStyle}
                aria-label="Filter by Publication Year"
              >
                <option value="All">All Years (2000–{CURRENT_YEAR})</option>
                {PUBLICATION_YEARS.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Sort Order</div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
                <option value="latest">Latest First</option>
                <option value="views">Most Viewed</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {totalFiltersActiveCount > 0 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(148, 163, 184, 0.25)' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Active Filters:</span>
              {searchTerm.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Search: "{searchTerm}"
                  <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {selectedRegion !== 'All' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Region: {selectedRegion}
                  <button type="button" onClick={() => setSelectedRegion('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {selectedArea !== 'All' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Area: {selectedArea}
                  <button type="button" onClick={() => setSelectedArea('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {selectedYear !== 'All' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Year: {selectedYear}
                  <button type="button" onClick={() => setSelectedYear('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {authorQuery.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Author: {authorQuery}
                  <button type="button" onClick={() => setAuthorQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {selectedInstitution !== 'All' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Institution: {selectedInstitution.length > 25 ? selectedInstitution.slice(0, 25) + '...' : selectedInstitution}
                  <button type="button" onClick={() => setSelectedInstitution('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {selectedLocation !== 'All' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Station: {POLAR_LOCATIONS.find(l => l.id === selectedLocation)?.name.split(' (')[0] || selectedLocation}
                  <button type="button" onClick={() => setSelectedLocation('All')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {peerReviewedOnly && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Peer-Reviewed Only
                  <button type="button" onClick={() => setPeerReviewedOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
              {openAccessOnly && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px', background: '#E0F2FE', color: '#0369A1' }}>
                  Open Access Only
                  <button type="button" onClick={() => setOpenAccessOnly(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0369A1', display: 'flex' }}><X size={11} /></button>
                </span>
              )}
            </div>
          )}

          {/* Results count & ALWAYS-VISIBLE Clear Filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Found:</span>
              <span style={{ color: '#0284C7', fontWeight: 700, fontSize: '14px' }}>
                {papers.length} Published Paper{papers.length === 1 ? '' : 's'}
              </span>
              {totalFiltersActiveCount > 0 && (
                <span style={{ fontSize: '11px', color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '1px 8px', borderRadius: '999px' }}>
                  ({totalFiltersActiveCount} filter{totalFiltersActiveCount > 1 ? 's' : ''} applied)
                </span>
              )}
            </div>

            {/* Clear Filters option: VISIBLE ALL THE TIME */}
            <button
              type="button"
              id="btn-clear-filters"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 14px',
                borderRadius: '8px',
                border: totalFiltersActiveCount > 0 ? '1px solid #0284C7' : '1px solid #CBD5E1',
                background: totalFiltersActiveCount > 0 ? '#E0F2FE' : '#FFFFFF',
                color: totalFiltersActiveCount > 0 ? '#0284C7' : '#64748B',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                (e.currentTarget as HTMLElement).style.color = '#0284C7';
                (e.currentTarget as HTMLElement).style.background = '#F0F9FF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = totalFiltersActiveCount > 0 ? '#0284C7' : '#CBD5E1';
                (e.currentTarget as HTMLElement).style.color = totalFiltersActiveCount > 0 ? '#0284C7' : '#64748B';
                (e.currentTarget as HTMLElement).style.background = totalFiltersActiveCount > 0 ? '#E0F2FE' : '#FFFFFF';
              }}
              title="Reset all search queries and filters to defaults"
            >
              <RotateCcw size={13} style={{ transform: totalFiltersActiveCount > 0 ? 'rotate(-45deg)' : 'none', transition: 'transform 0.2s' }} />
              <span>Clear Filters</span>
              {totalFiltersActiveCount > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  background: '#0284C7',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  padding: '1px 6px',
                }}>
                  {totalFiltersActiveCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ═══ PAPER CARDS GRID ═══ */}
        <div style={{ marginTop: '28px', marginBottom: '32px' }}>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ height: '360px', borderRadius: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : pagedPapers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Search size={24} style={{ color: '#64748B' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>No research papers found</h3>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Try broadening your search or resetting filters.</p>
              <button onClick={handleReset} style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pagedPapers.map((paper, idx) => (
                <ExploreCard key={paper.id} paper={paper} idx={(page - 1) * ITEMS_PER_PAGE + idx} onRead={onReadPaper} lang={lang} />
              ))}
            </div>
          )}
        </div>

        {/* ═══ PAGINATION ═══ */}
        {!loading && papers.length > ITEMS_PER_PAGE && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: page === 1 ? '#94A3B8' : '#334155', fontSize: '13px', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                <ChevronLeft size={15} /> Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 700, transition: 'all 0.15s',
                  background: page === n ? '#0284C7' : '#F1F5F9',
                  color: page === n ? '#FFFFFF' : '#475569',
                  boxShadow: page === n ? '0 2px 8px rgba(2,132,199,0.3)' : 'none',
                }}>
                  {n}
                </button>
              ))}
              {totalPages > 5 && <span style={{ color: '#94A3B8', fontSize: '13px' }}>...</span>}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: page === totalPages ? '#94A3B8' : '#334155', fontSize: '13px', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                Next <ChevronRight size={15} />
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, papers.length)} of {papers.length} papers
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══ INLINE PAPER CARD ═══ */
function ExploreCard({ paper, idx, onRead }: { paper: any; idx: number; onRead: (id: string) => void; lang: string }) {
  const isAntarctic = paper.polar_region === 'Antarctic';
  const regionColor = isAntarctic ? '#4338CA' : '#0369A1';

  const imgUrls = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70',
    'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=600&q=70',
    'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=600&q=70',
    'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=70',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=70',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=70',
  ];
  const imgUrl = imgUrls[idx % imgUrls.length];

  return (
    <div
      style={{
        borderRadius: '14px', overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.92)',
        border: '1px solid rgba(14, 116, 144, 0.16)',
        boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.22s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(15, 23, 42, 0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.16)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(15, 23, 42, 0.06)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {/* Card image */}
      <div style={{ position: 'relative', height: '140px', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={imgUrl}
          alt="Polar landscape"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(15, 23, 42, 0.3) 100%)' }} />
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(148,163,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
          </svg>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: '5px',
            background: isAntarctic ? '#EEF2FF' : '#E0F2FE',
            border: `1px solid ${isAntarctic ? '#C7D2FE' : '#BAE6FD'}`,
            color: regionColor,
          }}>
            <MapPin size={8} />
            {paper.polar_region?.toUpperCase()}
          </span>
          {paper.research_area && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '5px',
              background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569',
            }}>
              {paper.research_area?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onRead(paper.id)}
          style={{
            fontSize: '14px', fontWeight: 700, color: '#0F172A', lineHeight: 1.35,
            marginBottom: '6px', cursor: 'pointer', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#0284C7'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#0F172A'; }}
        >
          {paper.title}
        </h3>

        {/* Authors */}
        <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {paper.authors}
        </p>

        {/* Abstract excerpt */}
        <p style={{
          fontSize: '12px', color: '#475569', lineHeight: 1.6, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: '12px',
        }}>
          {paper.abstract}
        </p>
      </div>

      {/* Card footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px 14px',
        borderTop: '1px solid rgba(148, 163, 184, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
            <Calendar size={11} style={{ color: '#94A3B8' }} />
            {paper.publication_year}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
            <Eye size={11} style={{ color: '#94A3B8' }} />
            {paper.view_count || 0}
          </span>
          {paper.location_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0284C7', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin size={10} />
              {paper.location_name}
            </span>
          )}
        </div>
        <button
          onClick={() => onRead(paper.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(2, 132, 199, 0.35)',
            background: 'rgba(2, 132, 199, 0.08)', color: '#0284C7',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(2, 132, 199, 0.16)';
            (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(2, 132, 199, 0.08)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.35)';
          }}
        >
          <BookOpen size={11} />
          Read
        </button>
      </div>
    </div>
  );
}
