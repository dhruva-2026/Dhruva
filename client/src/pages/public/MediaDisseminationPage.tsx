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
          // Normalize server types to match UI tabs if necessary
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
        return { bg: '#1D4ED8', text: '#FFFFFF', border: 'none' };
      case 'Infographic':
        return { bg: '#6366F1', text: '#FFFFFF', border: 'none' };
      case 'Image Gallery':
      case 'Image':
        return { bg: '#0D9488', text: '#FFFFFF', border: 'none' };
      case 'News':
      default:
        return { bg: '#0284C7', text: '#FFFFFF', border: 'none' };
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
        {/* Hero background — same image as other pages */}
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
            filter: 'brightness(0.72) contrast(1.1)',
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* Multi-layer Gradient Overlay matching the reference */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(2, 8, 28, 0.45) 0%, rgba(2, 8, 28, 0.65) 60%, rgba(2, 6, 23, 0.95) 100%)',
          }}
        />

        {/* Aurora Radial Glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: '15%',
            width: '600px',
            height: '350px',
            background: 'radial-gradient(ellipse at center, rgba(0, 229, 255, 0.18), transparent 70%)',
            pointerEvents: 'none',
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
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#00E5FF',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#00E5FF',
                  boxShadow: '0 0 8px #00E5FF',
                }}
              />
              {lang === 'en' ? 'Polar Science Dissemination' : 'ध्रुवीय विज्ञान प्रसार'}
            </div>

            {/* Right quote with accent line */}
            <div style={{ textAlign: 'right', maxWidth: '280px' }}>
              <p
                style={{
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: 'rgba(226, 232, 240, 0.85)',
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
                  background: '#00E5FF',
                  marginTop: '8px',
                  marginLeft: 'auto',
                  borderRadius: '2px',
                  boxShadow: '0 0 10px rgba(0, 229, 255, 0.7)',
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
            <span style={{ color: '#FFFFFF' }}>Expedition Stories,</span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #00E5FF 0%, #38BDF8 65%, #60A5FA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Infographics & Media
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: '0.96rem',
              color: 'rgba(203, 213, 225, 0.88)',
              lineHeight: 1.7,
              maxWidth: '680px',
              marginBottom: '32px',
            }}
          >
            {lang === 'en'
              ? 'Visual storytelling from Indian Antarctic expeditions (Maitri, Bharati) and Arctic campaigns (Himadri). Infographics, field photography, videos and more — bringing polar science closer to everyone.'
              : 'भारतीय अंटार्कटिक अभियानों और आर्कटिक अभियानों से दृश्य कहानियां, इन्फोग्राफिक्स और फील्ड फोटोग्राफी।'}
          </p>

          {/* 4 Feature Type Buttons (Circular Icon Badges) */}
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
                  color: 'rgba(226, 232, 240, 0.95)',
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
                    border: '1px solid rgba(0, 229, 255, 0.4)',
                    background: 'rgba(0, 229, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00E5FF',
                    flexShrink: 0,
                    boxShadow: '0 0 14px rgba(0, 229, 255, 0.18)',
                  }}
                >
                  <Icon size={16} fill={isPlay ? '#00E5FF' : 'none'} />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* ═══ Unified Search & Dual Filter Capsule Bar ═══ */}
          <div
            style={{
              background: 'rgba(4, 12, 34, 0.88)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              padding: '6px 8px 6px 18px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              boxShadow: '0 10px 36px rgba(0, 0, 0, 0.45)',
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
                  color: '#00E5FF',
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
                  color: '#FFFFFF',
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
                      border: active ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      transition: 'all 0.18s ease',
                      background: active
                        ? 'linear-gradient(135deg, #00E5FF, #00BCD4)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: active ? '#020617' : '#94A3B8',
                      boxShadow: active ? '0 2px 14px rgba(0, 229, 255, 0.4)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                        (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                        (e.currentTarget as HTMLElement).style.color = '#94A3B8';
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
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
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
                      border: active ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      transition: 'all 0.18s ease',
                      background: active
                        ? 'linear-gradient(135deg, #00E5FF, #00BCD4)'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: active ? '#020617' : '#94A3B8',
                      boxShadow: active ? '0 2px 12px rgba(0, 229, 255, 0.35)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
                        (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
                        (e.currentTarget as HTMLElement).style.color = '#94A3B8';
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
            background: 'rgba(3, 10, 28, 0.85)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            color: '#00E5FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(0, 229, 255, 0.25)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.1)';
            (e.currentTarget as HTMLElement).style.borderColor = '#00E5FF';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 22px rgba(0, 229, 255, 0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 229, 255, 0.4)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(0, 229, 255, 0.25)';
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
            background: 'rgba(3, 10, 28, 0.85)',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            color: '#00E5FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(0, 229, 255, 0.25)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1.1)';
            (e.currentTarget as HTMLElement).style.borderColor = '#00E5FF';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 22px rgba(0, 229, 255, 0.6)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-50%) scale(1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 229, 255, 0.4)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 14px rgba(0, 229, 255, 0.25)';
          }}
        >
          <ChevronRight size={22} strokeWidth={2.5} />
        </button>

        {/* 3-Column Card Grid */}
        {filteredMedia.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <Search size={36} style={{ color: '#475569', margin: '0 auto 12px' }} />
            <p style={{ color: '#94A3B8', fontSize: '15px' }}>
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
                    background: 'rgba(4, 12, 34, 0.94)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0, 229, 255, 0.45)';
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 16px 45px rgba(0, 0, 0, 0.65), 0 0 20px rgba(0, 229, 255, 0.15)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.45)';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  {/* Card Image Area with Type Badge and Bookmark */}
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

                    {/* Gradient Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to bottom, rgba(2, 6, 23, 0.25) 0%, rgba(2, 6, 23, 0.7) 100%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Infographic Labels Overlay (for Anatomy of an Ice Shelf) */}
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
                          color: '#E0F2FE',
                        }}
                      >
                        {/* Top schematic labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(2, 8, 26, 0.65)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
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
                              background: 'rgba(2, 8, 26, 0.65)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                            }}
                          >
                            <Droplets size={10} style={{ color: '#38BDF8' }} />
                            <span>Melt Channels</span>
                          </div>
                        </div>

                        {/* Bottom schematic labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(2, 8, 26, 0.65)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
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
                              background: 'rgba(2, 8, 26, 0.65)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                            }}
                          >
                            <span>Subglacial Flow →</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Type Badge on Top-Left (e.g., EXPEDITION STORY, INFOGRAPHIC, IMAGE GALLERY) */}
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
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)',
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
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        background: 'rgba(2, 8, 24, 0.65)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: bookmarked.has(item.id) ? '#00E5FF' : 'rgba(226, 232, 240, 0.85)',
                        transition: 'all 0.15s ease',
                        zIndex: 2,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(0, 229, 255, 0.2)';
                        (e.currentTarget as HTMLElement).style.color = '#00E5FF';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(2, 8, 24, 0.65)';
                        (e.currentTarget as HTMLElement).style.color = bookmarked.has(item.id)
                          ? '#00E5FF'
                          : 'rgba(226, 232, 240, 0.85)';
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
                        color: '#FFFFFF',
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
                        color: 'rgba(148, 163, 184, 0.9)',
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
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
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
                          color: '#94A3B8',
                        }}
                      >
                        <Calendar size={13} style={{ color: '#64748B' }} />
                        {item.publication_date}
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '12px',
                          color: '#94A3B8',
                        }}
                      >
                        <MapPin size={13} style={{ color: '#00E5FF' }} />
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
                        fontWeight: 600,
                        color: '#00E5FF',
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
                    background: active ? '#00E5FF' : 'rgba(255, 255, 255, 0.25)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: active ? '0 0 10px rgba(0, 229, 255, 0.6)' : 'none',
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
            background: 'rgba(2, 6, 23, 0.85)',
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
              background: 'rgba(4, 12, 36, 0.98)',
              border: '1px solid rgba(0, 229, 255, 0.35)',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.2)',
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
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#94A3B8';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
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
                  background: 'rgba(0, 229, 255, 0.12)',
                  border: '1px solid rgba(0, 229, 255, 0.4)',
                  color: '#00E5FF',
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
                color: '#FFFFFF',
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
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
                color: 'rgba(226, 232, 240, 0.9)',
                lineHeight: 1.7,
                marginBottom: '18px',
              }}
            >
              {activeItem.description}
            </p>

            {/* Details panel */}
            <div
              style={{
                background: 'rgba(2, 6, 23, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12.5px',
                color: '#94A3B8',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                📍 Location:{' '}
                <span style={{ color: '#00E5FF', fontWeight: 600 }}>
                  {activeItem.location_name || activeItem.region}
                </span>
              </div>
              <div>
                📅 Published:{' '}
                <span style={{ color: '#E2E8F0', fontWeight: 600 }}>
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
                    background: 'linear-gradient(135deg, #00E5FF, #00BCD4)',
                    color: '#020617',
                    fontWeight: 700,
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0, 229, 255, 0.4)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(0, 229, 255, 0.6)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0, 229, 255, 0.4)';
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
