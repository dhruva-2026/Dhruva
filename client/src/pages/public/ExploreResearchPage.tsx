import React, { useState, useEffect } from 'react';
import { Search, BookOpen, RefreshCw, SlidersHorizontal, ChevronLeft, ChevronRight, MapPin, Eye, Calendar } from 'lucide-react';
import { apiFetchPapers } from '../../services/api';
import { BACKUP_PAPERS, type BackupPaper } from '../../data/backupPapers';

interface ExploreResearchPageProps {
  onReadPaper: (id: string) => void;
  onAskPaper: (paper: any) => void;
  lang: 'en' | 'hi';
  initialArea?: string;
}

const RESEARCH_AREAS = [
  'All', 'Climate Science', 'Glaciology', 'Oceanography',
  'Atmospheric Science', 'Polar Biology', 'Remote Sensing',
  'Geology', 'Cryosphere', 'Environmental Science'
];

const POLAR_IMAGES = [
  '/images/arctic-1.jpg', '/images/arctic-2.jpg', '/images/antarctic-1.jpg',
  '/images/arctic-3.jpg', '/images/antarctic-2.jpg', '/images/arctic-4.jpg',
];

function getPolarImage(idx: number) {
  return POLAR_IMAGES[idx % POLAR_IMAGES.length];
}

function getFilteredBackupPapers(params: {
  search?: string;
  region?: string;
  area?: string;
  year?: string;
  sort?: string;
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

export const ExploreResearchPage: React.FC<ExploreResearchPageProps> = ({ onReadPaper, onAskPaper, lang, initialArea }) => {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedArea, setSelectedArea] = useState(initialArea || 'All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  // Sync initialArea if changed from navigation
  useEffect(() => {
    if (initialArea) {
      setSelectedArea(initialArea);
    }
  }, [initialArea]);

  const loadPapers = async () => {
    setLoading(true);
    try {
      const res = await apiFetchPapers({ search: searchTerm, region: selectedRegion, area: selectedArea, year: selectedYear, sort: sortBy });
      if (res && Array.isArray(res.papers) && res.papers.length > 0) {
        setPapers(res.papers);
      } else if (!searchTerm && selectedRegion === 'All' && selectedArea === 'All' && selectedYear === 'All') {
        // Fallback to all 20 previous research papers from the project backup
        const fallback = getFilteredBackupPapers({ search: searchTerm, region: selectedRegion, area: selectedArea, year: selectedYear, sort: sortBy });
        setPapers(fallback);
      } else if (res && Array.isArray(res.papers)) {
        setPapers(res.papers);
      } else {
        const fallback = getFilteredBackupPapers({ search: searchTerm, region: selectedRegion, area: selectedArea, year: selectedYear, sort: sortBy });
        setPapers(fallback);
      }
      setPage(1);
    } catch (e) {
      console.warn('API fetch failed, loading all previous research papers from project backup:', e);
      const fallback = getFilteredBackupPapers({ search: searchTerm, region: selectedRegion, area: selectedArea, year: selectedYear, sort: sortBy });
      setPapers(fallback);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPapers(); }, [selectedRegion, selectedArea, selectedYear, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); loadPapers(); };

  const handleReset = () => {
    setSearchTerm(''); setSelectedRegion('All'); setSelectedArea('All'); setSelectedYear('All'); setSortBy('latest');
  };

  const totalPages = Math.max(1, Math.ceil(papers.length / ITEMS_PER_PAGE));
  const pagedPapers = papers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const selectStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(4,10,24,0.9)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', padding: '9px 12px', fontSize: '13px', color: '#FFFFFF',
    outline: 'none', appearance: 'none' as any, cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px',
    paddingRight: '32px',
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ═══ HERO SECTION ═══ */}
      <div style={{ position: 'relative', minHeight: '280px', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        {/* Background image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(4,12,30,0.3) 0%, rgba(4,12,30,0.55) 60%, rgba(4,12,30,0.92) 100%)',
          zIndex: 1,
        }} />
        <img
          src="/images/hero-polar.jpg"
          alt="Polar research"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Science badge — top right */}
        <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 2, textAlign: 'right' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#94A3B8', lineHeight: 1.7 }}>
            SCIENCE<br />FOR A SUSTAINABLE<br />
            <span style={{ color: '#00F0FF' }}>POLAR FUTURE</span>
          </div>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #00F0FF)', marginTop: '4px', borderRadius: '2px' }} />
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '1600px', margin: '0 auto', padding: '5rem clamp(1rem,3vw,2.5rem) 2.5rem' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#00F0FF', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
            Explore Research
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '12px' }}>
            Discover{' '}
            <span style={{ background: 'linear-gradient(135deg, #00F0FF, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Polar Knowledge
            </span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'rgba(203,213,225,0.85)', lineHeight: 1.65, maxWidth: '420px' }}>
            Access peer-reviewed research, datasets, and scientific insights<br />
            from India's polar expeditions and global collaborations.
          </p>
        </div>
      </div>

      {/* ═══ SEARCH + FILTER PANEL ═══ */}
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 clamp(1rem,3vw,2.5rem)' }}>
        <div style={{
          background: 'rgba(6,14,32,0.96)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '16px', padding: '20px 24px 16px',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          marginTop: '-32px', position: 'relative', zIndex: 10,
        }}>

          {/* Search row */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by keyword, topic, author, title..."
                style={{
                  width: '100%', background: 'rgba(4,10,24,0.8)', border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '10px', paddingLeft: '44px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px',
                  fontSize: '14px', color: '#FFFFFF', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.18s',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(0,240,255,0.5)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.09)'; }}
              />
            </div>
            {/* Search button */}
            <button type="submit" style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '0 22px',
              borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700,
              background: 'linear-gradient(135deg, #00E5FF 0%, #0BC5EB 100%)',
              color: '#020617', boxShadow: '0 0 20px rgba(0,229,255,0.3)', whiteSpace: 'nowrap',
              fontFamily: 'var(--font-heading)',
            }}>
              <Search size={15} />
              Search
            </button>
            {/* Advanced Filters button */}
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: '#94A3B8',
              whiteSpace: 'nowrap', transition: 'all 0.18s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,240,255,0.4)'; (e.currentTarget as HTMLElement).style.color = '#E2E8F0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}
            >
              <SlidersHorizontal size={15} />
              Advanced Filters
            </button>
          </form>

          {/* Filter row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: '20px', alignItems: 'start', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Polar Region */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Polar Region</div>
              <div style={{ display: 'flex', gap: '4px', background: 'rgba(4,10,24,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '3px' }}>
                {['All', 'Arctic', 'Antarctic'].map(r => {
                  const active = selectedRegion === r;
                  return (
                    <button key={r} type="button" onClick={() => setSelectedRegion(r)} style={{
                      padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 600, transition: 'all 0.15s',
                      background: active ? '#00E5FF' : 'transparent',
                      color: active ? '#020617' : '#94A3B8',
                      boxShadow: active ? '0 2px 8px rgba(0,229,255,0.3)' : 'none',
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

            {/* Publication Year */}
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#64748B', marginBottom: '8px' }}>Publication Year</div>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={selectStyle}>
                <option value="All">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
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

          {/* Results count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              Found:{' '}
              <span style={{ color: '#00F0FF', fontWeight: 700 }}>{papers.length} Published Papers</span>
            </div>
            {(searchTerm || selectedRegion !== 'All' || selectedArea !== 'All' || selectedYear !== 'All') && (
              <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#E2E8F0'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}>
                <RefreshCw size={12} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* ═══ PAPER CARDS GRID ═══ */}
        <div style={{ marginTop: '28px', marginBottom: '32px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ height: '360px', borderRadius: '14px', background: 'rgba(11,20,48,0.6)', border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
            </div>
          ) : pagedPapers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Search size={24} style={{ color: '#64748B' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>No research papers found</h3>
              <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>Try broadening your search or resetting filters.</p>
              <button onClick={handleReset} style={{ padding: '10px 24px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: '#CBD5E1', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {pagedPapers.map((paper, idx) => (
                <ExploreCard key={paper.id} paper={paper} idx={(page - 1) * ITEMS_PER_PAGE + idx} onRead={onReadPaper} lang={lang} />
              ))}
            </div>
          )}
        </div>

        {/* ═══ PAGINATION ═══ */}
        {!loading && papers.length > ITEMS_PER_PAGE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '3rem' }}>
            {/* Prev / page numbers / Next */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: page === 1 ? '#475569' : '#CBD5E1', fontSize: '13px', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
                <ChevronLeft size={15} /> Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 700, transition: 'all 0.15s',
                  background: page === n ? '#00E5FF' : 'rgba(255,255,255,0.04)',
                  color: page === n ? '#020617' : '#94A3B8',
                  boxShadow: page === n ? '0 0 14px rgba(0,229,255,0.35)' : 'none',
                }}>
                  {n}
                </button>
              ))}
              {totalPages > 5 && <span style={{ color: '#475569', fontSize: '13px' }}>...</span>}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: page === totalPages ? '#475569' : '#CBD5E1', fontSize: '13px', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
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

/* ═══ INLINE PAPER CARD (matches reference image style) ═══ */
function ExploreCard({ paper, idx, onRead, lang }: { paper: any; idx: number; onRead: (id: string) => void; lang: string }) {
  const isAntarctic = paper.polar_region === 'Antarctic';
  const regionColor = isAntarctic ? '#818CF8' : '#38BDF8';

  // Polar landscape images — fallback gradient if image missing
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
        background: 'rgba(8,16,38,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.22s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,240,255,0.35)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,240,255,0.12)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
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
            (e.target as HTMLImageElement).parentElement!.style.background = `linear-gradient(135deg, rgba(6,14,32,1) 0%, rgba(${isAntarctic ? '30,20,80' : '0,40,80'},1) 100%)`;
          }}
        />
        {/* Gradient overlay on image */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(4,10,24,0.15) 0%, rgba(4,10,24,0.55) 100%)' }} />
        {/* File icon top-right */}
        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(4,10,24,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(148,163,184,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            background: isAntarctic ? 'rgba(129,140,248,0.15)' : 'rgba(56,189,248,0.15)',
            border: `1px solid ${isAntarctic ? 'rgba(129,140,248,0.35)' : 'rgba(56,189,248,0.35)'}`,
            color: regionColor,
          }}>
            <MapPin size={8} />
            {paper.polar_region?.toUpperCase()}
          </span>
          {paper.research_area && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '5px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94A3B8',
            }}>
              {paper.research_area?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onRead(paper.id)}
          style={{
            fontSize: '14px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.35,
            marginBottom: '6px', cursor: 'pointer', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#67E8F9'; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.color = '#FFFFFF'; }}
        >
          {paper.title}
        </h3>

        {/* Authors */}
        <p style={{ fontSize: '11px', color: '#64748B', marginBottom: '8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {paper.authors}
        </p>

        {/* Abstract excerpt */}
        <p style={{
          fontSize: '12px', color: 'rgba(148,163,184,0.85)', lineHeight: 1.6, flex: 1,
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
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
            <Calendar size={11} style={{ color: '#475569' }} />
            {paper.publication_year}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748B' }}>
            <Eye size={11} style={{ color: '#475569' }} />
            {paper.view_count || 0}
          </span>
          {paper.location_name && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#38BDF8', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin size={10} />
              {paper.location_name}
            </span>
          )}
        </div>
        <button
          onClick={() => onRead(paper.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.4)',
            background: 'rgba(0,240,255,0.06)', color: '#00F0FF',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,240,255,0.14)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,240,255,0.7)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(0,240,255,0.06)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,240,255,0.4)';
          }}
        >
          <BookOpen size={11} />
          Read
        </button>
      </div>
    </div>
  );
}
