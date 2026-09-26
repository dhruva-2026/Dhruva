import React, { useState, useEffect } from 'react';
import {
  Search, Bookmark, Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight,
  Play, Image as ImageIcon, BarChart2, FileText, X, ExternalLink,
  Layers, Droplets, Waves
} from 'lucide-react';
import { apiFetchMedia } from '../../services/api';

interface MediaDisseminationPageProps {
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
}

interface MediaItem {
  id: string;
  title: string;
  type: 'Expedition Story' | 'Infographic' | 'Image Gallery' | 'News';
  description: string;
  thumbnail_url: string;
  media_url?: string;
  region: 'Antarctic' | 'Arctic';
  location_name?: string;
  related_paper_id?: string;
  publication_date: string;
}

const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: 'med-1',
    title: "Dakshin Gangotri: Preserving India's Polar Heritage",
    type: 'Expedition Story',
    description:
      "Commemorative report on preserving Dakshin Gangotri, India's historic first station established 40 years ago, as an Antarctic Treaty Historic Site.",
    thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Dakshin Gangotri Site, Antarctica',
    related_paper_id: 'paper-005',
    publication_date: '2024-04-18',
  },
  {
    id: 'med-2',
    title: 'Anatomy of an Ice Shelf: How Amery Calves Gigantic Icebergs',
    type: 'Infographic',
    description:
      'Educational visual breakdown explaining hydrostatic rift propagation, marine ice formation, and subglacial basal melt channels.',
    thumbnail_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Amery Ice Shelf, East Antarctica',
    related_paper_id: 'paper-009',
    publication_date: '2024-04-01',
  },
  {
    id: 'med-3',
    title: 'The Arctic Polar Night at Himadri Station',
    type: 'Image Gallery',
    description:
      'A visual journey through 24 hours of darkness — auroral electrojets, atmospheric phenomena, and life at Himadri during the polar night.',
    thumbnail_url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Ny-Ålesund, Svalbard',
    related_paper_id: 'paper-004',
    publication_date: '2024-03-12',
  },
  {
    id: 'med-4',
    title: 'Deploying IndARC: High-Seas Robotics in Kongsfjorden',
    type: 'Infographic',
    description:
      "Detailed interactive schematic explaining how India's IndARC deep-water mooring operates at 192m depth under Arctic ice without freezing.",
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Kongsfjorden Fjord, Svalbard',
    related_paper_id: 'paper-006',
    publication_date: '2024-02-20',
  },
  {
    id: 'med-5',
    title: 'Adélie Penguin Colonies Around Bharati Station',
    type: 'Image Gallery',
    description:
      'High-definition telephoto imagery of breeding Adélie penguin pairs and skua nest monitoring in the Larsemann Hills coastal islands.',
    thumbnail_url: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Larsemann Hills, Antarctica',
    related_paper_id: 'paper-003',
    publication_date: '2024-03-05',
  },
  {
    id: 'med-6',
    title: 'Sunrise Over Maitri: 40 Years of Indian Presence in Antarctica',
    type: 'Expedition Story',
    description:
      'A photo documentary commemorating 40 continuous years of scientific expeditions at Maitri Station in the Schirmacher Oasis.',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Maitri Station, Schirmacher Oasis',
    related_paper_id: 'paper-005',
    publication_date: '2024-01-15',
  },
];

const TYPE_FILTERS = ['All', 'Expedition Story', 'Infographic', 'Image Gallery', 'News'];
const REGION_FILTERS = ['All', 'Arctic', 'Antarctic'];

export const MediaDisseminationPage: React.FC<MediaDisseminationPageProps> = ({ onReadPaper, lang }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>(DEFAULT_MEDIA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetchMedia({
          type: selectedType === 'All' ? undefined : (selectedType === 'Image Gallery' ? 'Image' : selectedType),
          region: selectedRegion === 'All' ? undefined : selectedRegion,
        });
        if (res.media && res.media.length > 0) {
          const normalized: MediaItem[] = res.media.map((m: any) => ({
            ...m,
            type: m.type === 'Image' ? 'Image Gallery' : m.type,
          }));
          setMediaList(normalized);
        } else {
          setMediaList(DEFAULT_MEDIA);
        }
      } catch (e) {
        setMediaList(DEFAULT_MEDIA);
      }
    }
    load();
  }, [selectedType, selectedRegion]);

  const toggleBookmark = (id: string) => {
    setBookmarked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredMedia = mediaList.filter(item => {
    const matchSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType =
      selectedType === 'All' ||
      item.type.toLowerCase() === selectedType.toLowerCase() ||
      (selectedType === 'Image Gallery' && item.type.toLowerCase() === 'image');

    const matchRegion =
      selectedRegion === 'All' ||
      item.region.toLowerCase() === selectedRegion.toLowerCase();

    return matchSearch && matchType && matchRegion;
  });

  const cardsPerPage = 3;
  const maxPages = Math.max(1, Math.ceil(filteredMedia.length / cardsPerPage));

  const handlePrev = () => {
    setCarouselIndex(prev => (prev > 0 ? prev - 1 : maxPages - 1));
  };

  const handleNext = () => {
    setCarouselIndex(prev => (prev < maxPages - 1 ? prev + 1 : 0));
  };

  const currentCards = filteredMedia.slice(
    carouselIndex * cardsPerPage,
    carouselIndex * cardsPerPage + cardsPerPage
  );

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'Expedition Story':
        return { bg: '#1D4ED8', text: '#FFFFFF' };
      case 'Infographic':
        return { bg: '#6366F1', text: '#FFFFFF' };
      case 'Image Gallery':
      case 'Image':
        return { bg: '#0D9488', text: '#FFFFFF' };
      case 'News':
      default:
        return { bg: '#0284C7', text: '#FFFFFF' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ═══ HERO SECTION ═══ */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '440px',
        }}
      >
        <img
          src="/images/hero-polar.jpg"
          alt="Polar hero"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 40%',
            opacity: 0.12,
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(240, 249, 255, 0.6) 0%, rgba(255, 255, 255, 0.85) 60%, #FFFFFF 100%)',
          }}
        />

        {/* Hero Content Container */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '1520px',
            margin: '0 auto',
            padding: 'clamp(3rem, 5vw, 4.5rem) clamp(1.2rem, 3vw, 3rem) 2.5rem',
          }}
        >
          {/* Top Row: Eyebrow + Quote */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '16px',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            {/* Eyebrow badge */}
            <div className="section-eyebrow">
              <span className="eyebrow-dot" />
              <span>{lang === 'en' ? 'Polar Science Dissemination' : 'ध्रुवीय विज्ञान प्रसार'}</span>
            </div>

            {/* Right quote with accent line */}
            <div style={{ textAlign: 'right', maxWidth: '280px' }}>
              <p
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: '#64748B',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                "Real stories.
                <br />
                Greater understanding.
                <br />
                A colder, brighter tomorrow."
              </p>
              <div
                style={{
                  width: '42px',
                  height: '3px',
                  background: '#0284C7',
                  marginTop: '8px',
                  marginLeft: 'auto',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(2.3rem, 5.2vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              marginBottom: '18px',
            }}
          >
            <span style={{ color: '#0F172A' }}>Expedition Stories,</span>
            <br />
            <span className="heading-gradient">
              Infographics & Media
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.96rem',
              color: '#475569',
              lineHeight: 1.7,
              maxWidth: '680px',
              marginBottom: '32px',
            }}
          >
            {lang === 'en'
              ? 'Visual storytelling from Indian Antarctic expeditions (Maitri, Bharati) and Arctic campaigns (Himadri). Infographics, field photography, videos and more — bringing polar science closer to everyone.'
              : 'भारतीय अंटार्कटिक अभियानों और आर्कटिक अभियानों से दृश्य कहानियां, इन्फोग्राफिक्स और फील्ड फोटोग्राफी।'}
          </p>

          {/* 4 Feature Type Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '36px',
            }}
          >
            {[
              { icon: Play, text: 'Videos & Documentaries', isPlay: true },
              { icon: ImageIcon, text: 'Photo Galleries' },
              { icon: BarChart2, text: 'Infographics' },
              { icon: FileText, text: 'News & Updates' },
            ].map(({ icon: Icon, text, isPlay }) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: '1px solid rgba(2, 132, 199, 0.28)',
                    background: 'rgba(2, 132, 199, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0284C7',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} fill={isPlay ? '#0284C7' : 'none'} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* ═══ Unified Search & Dual Filter Capsule Bar ═══ */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.94)',
              border: '1px solid rgba(14, 116, 144, 0.18)',
              borderRadius: '9999px',
              padding: '6px 8px 6px 18px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                flex: '1 1 240px',
                minWidth: '200px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={16}
                style={{
                  color: '#0284C7',
                  marginRight: '10px',
                  flexShrink: 0,
                }}
              />
              <input
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCarouselIndex(0);
                }}
                placeholder="Search stories, infographics, videos, or keywords..."
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '8px 0',
                  fontSize: '13px',
                  color: '#0F172A',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Middle: Content Type Pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {TYPE_FILTERS.map(t => {
                const active = selectedType === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setSelectedType(t);
                      setCarouselIndex(0);
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '9999px',
                      border: active ? 'none' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      transition: 'all 0.18s ease',
                      background: active
                        ? 'linear-gradient(135deg, #0284C7, #0369A1)'
                        : '#F1F5F9',
                      color: active ? '#FFFFFF' : '#64748B',
                      boxShadow: active ? '0 2px 10px rgba(2, 132, 199, 0.35)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = '#E2E8F0';
                        (e.currentTarget as HTMLElement).style.color = '#0F172A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
                        (e.currentTarget as HTMLElement).style.color = '#64748B';
                      }
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Right: Region Filters */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '10px',
                borderLeft: '1px solid #E2E8F0',
              }}
            >
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                Region:
              </span>
              {REGION_FILTERS.map(r => {
                const active = selectedRegion === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRegion(r);
                      setCarouselIndex(0);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: active ? 'none' : '1px solid #E2E8F0',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      transition: 'all 0.18s ease',
                      background: active
                        ? 'linear-gradient(135deg, #0284C7, #0369A1)'
                        : '#F1F5F9',
                      color: active ? '#FFFFFF' : '#64748B',
                      boxShadow: active ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = '#E2E8F0';
                        (e.currentTarget as HTMLElement).style.color = '#0F172A';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
                        (e.currentTarget as HTMLElement).style.color = '#64748B';
                      }
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STORIES CAROUSEL / CARDS CONTAINER ═══ */}
      <div
        style={{
          maxWidth: '1520px',
          margin: '0 auto',
          padding: '2.5rem clamp(1.2rem, 3vw, 3rem) 4rem',
          position: 'relative',
        }}
      >
        {/* Navigation Arrow Left */}
        <button
          onClick={handlePrev}
          aria-label="Previous Stories"
          style={{
            position: 'absolute',
            left: '8px',
            top: '46%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid rgba(14, 116, 144, 0.25)',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.1)';
            (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.25)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.25)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.08)';
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        {/* Navigation Arrow Right */}
        <button
          onClick={handleNext}
          aria-label="Next Stories"
          style={{
            position: 'absolute',
            right: '8px',
            top: '46%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid rgba(14, 116, 144, 0.25)',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.1)';
            (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.25)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.25)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.08)';
          }}
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>

        {/* 3-Column Card Grid */}
        {filteredMedia.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <Search size={36} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748B', fontSize: '15px' }}>
              No media stories found matching your filter criteria.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              padding: '0 28px',
            }}
          >
            {currentCards.map(item => {
              const badge = getBadgeStyle(item.type);
              const isInfographic = item.type === 'Infographic';

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  style={{
                    borderRadius: '18px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid rgba(14, 116, 144, 0.16)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 8px 30px rgba(15, 23, 42, 0.06)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(15, 23, 42, 0.1)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.16)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(15, 23, 42, 0.06)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  {/* Card Image Area */}
                  <div
                    style={{
                      position: 'relative',
                      height: '200px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.6s ease',
                      }}
                      onMouseEnter={e => {
                        (e.target as HTMLImageElement).style.transform = 'scale(1.06)';
                      }}
                      onMouseLeave={e => {
                        (e.target as HTMLImageElement).style.transform = 'scale(1)';
                      }}
                    />

                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to bottom, transparent 30%, rgba(15, 23, 42, 0.4) 100%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Infographic Labels Overlay */}
                    {isInfographic && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(15, 23, 42, 0.75)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            <Layers size={10} style={{ color: '#38BDF8' }} />
                            <span>Ice Shelf</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(15, 23, 42, 0.75)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            <Droplets size={10} style={{ color: '#38BDF8' }} />
                            <span>Melt Channels</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(15, 23, 42, 0.75)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            <Waves size={10} style={{ color: '#38BDF8' }} />
                            <span>Ocean Currents</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(15, 23, 42, 0.75)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            <span>Subglacial Flow →</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Type Badge on Top-Left */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          background: badge.bg,
                          color: badge.text,
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                        }}
                      >
                        {item.type}
                      </span>
                    </div>

                    {/* Bookmark Toggle in Top-Right */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleBookmark(item.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.4)',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: bookmarked.has(item.id) ? '#0284C7' : '#64748B',
                        transition: 'all 0.15s ease',
                        zIndex: 2,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                        (e.currentTarget as HTMLElement).style.color = '#0284C7';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.9)';
                        (e.currentTarget as HTMLElement).style.color = bookmarked.has(item.id)
                          ? '#0284C7'
                          : '#64748B';
                      }}
                    >
                      <Bookmark size={15} fill={bookmarked.has(item.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div
                    style={{
                      padding: '18px 20px 14px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Title */}
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#0F172A',
                        lineHeight: 1.35,
                        marginBottom: '10px',
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '-0.01em',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: '#475569',
                        lineHeight: 1.6,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Card Meta Footer */}
                  <div
                    style={{
                      padding: '12px 20px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(148, 163, 184, 0.2)',
                    }}
                  >
                    {/* Date and Region */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#64748B',
                        }}
                      >
                        <Calendar size={13} style={{ color: '#94A3B8' }} />
                        {item.publication_date}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#0284C7',
                          fontWeight: 600,
                        }}
                      >
                        <MapPin size={13} style={{ color: '#0284C7' }} />
                        {item.region}
                      </span>
                    </div>

                    {/* View Story Link */}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#0284C7',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      View Story <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Carousel Pagination Dots */}
        {maxPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginTop: '36px',
            }}
          >
            {Array.from({ length: maxPages }).map((_, idx) => {
              const active = carouselIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={`Page ${idx + 1}`}
                  style={{
                    width: active ? '24px' : '6px',
                    height: '6px',
                    borderRadius: active ? '3px' : '50%',
                    background: active ? '#0284C7' : '#CBD5E1',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ MEDIA DETAIL MODAL ═══ */}
      {activeItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setActiveItem(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(14, 116, 144, 0.22)',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(15, 23, 42, 0.18)',
              padding: '24px 28px',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveItem(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#0F172A';
                (e.currentTarget as HTMLElement).style.background = '#E2E8F0';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#64748B';
                (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
              }}
            >
              <X size={18} />
            </button>

            {/* Type badge */}
            <div style={{ marginBottom: '12px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  color: '#0284C7',
                }}
              >
                {activeItem.type}
              </span>
            </div>

            {/* Modal Title */}
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.3,
                marginBottom: '16px',
                paddingRight: '36px',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {activeItem.title}
            </h2>

            {/* Image Preview */}
            <div
              style={{
                height: '300px',
                borderRadius: '14px',
                overflow: 'hidden',
                marginBottom: '18px',
                border: '1px solid #E2E8F0',
              }}
            >
              <img
                src={activeItem.thumbnail_url}
                alt={activeItem.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Full description */}
            <p
              style={{
                fontSize: '13.5px',
                color: '#334155',
                lineHeight: 1.7,
                marginBottom: '18px',
              }}
            >
              {activeItem.description}
            </p>

            {/* Details panel */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12.5px',
                color: '#64748B',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                📍 Location:{' '}
                <span style={{ color: '#0284C7', fontWeight: 600 }}>
                  {activeItem.location_name || activeItem.region}
                </span>
              </div>
              <div>
                📅 Published:{' '}
                <span style={{ color: '#0F172A', fontWeight: 600 }}>
                  {activeItem.publication_date}
                </span>
              </div>
            </div>

            {/* Related Research Paper Action */}
            {activeItem.related_paper_id && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    const pid = activeItem.related_paper_id;
                    setActiveItem(null);
                    if (pid) onReadPaper(pid);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284C7, #0369A1)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(2, 132, 199, 0.45)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.35)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <span>Read Related Research Paper</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
