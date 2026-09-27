import React, { useState, useEffect } from 'react';
import {
  Search, Bookmark, Calendar, MapPin, ArrowRight, ChevronLeft, ChevronRight,
  Play, Image as ImageIcon, BarChart2, FileText, X, ExternalLink,
  Layers, Droplets, Waves, Volume2, Maximize2, Download, Eye, Clock, Pause, Sparkles
} from 'lucide-react';
import { apiFetchMedia } from '../../services/api';

interface MediaDisseminationPageProps {
  onReadPaper: (id: string) => void;
  lang: 'en' | 'hi';
}

interface MediaItem {
  id: string;
  title: string;
  type:
    | 'Video'
    | 'Videos & Documentaries'
    | 'Photo Gallery'
    | 'Infographic'
    | 'Infographics'
    | 'News & Updates'
    | 'Expedition Story'
    | 'Image Gallery'
    | 'News'
    | 'Image';
  description: string;
  thumbnail_url: string;
  media_url?: string;
  region: 'Antarctic' | 'Arctic';
  location_name?: string;
  related_paper_id?: string;
  publication_date: string;
  duration?: string;
  photo_count?: string;
  gallery_images?: string[];
  scientific_takeaways?: string[];
  dateline?: string;
  source_badge?: string;
}

const DEFAULT_MEDIA: MediaItem[] = [
  // ─── 1. VIDEOS & DOCUMENTARIES ───
  {
    id: 'med-vid-1',
    title: 'Mission Bharati: Surviving the Antarctic Winter (4K Mini-Doc)',
    type: 'Video',
    description:
      'An intimate 26-minute documentary following 23 Indian scientists and engineers during 8 months of absolute darkness and -48°C blizzards at Bharati Station in the Larsemann Hills.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Bharati Research Station, East Antarctica',
    related_paper_id: 'paper-003',
    publication_date: '2024-05-10',
    duration: '26:40',
    source_badge: '4K Ultra HD Documentary',
  },
  {
    id: 'med-vid-2',
    title: 'Inside Himadri: India’s Arctic Frontier in Svalbard',
    type: 'Video',
    description:
      'Expedition video chronicle documenting how Indian atmospheric scientists track black carbon transport, aerosol optical depth, and Arctic amplification at 79°N in Ny-Ålesund.',
    thumbnail_url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Himadri Station, Ny-Ålesund, Svalbard',
    related_paper_id: 'paper-004',
    publication_date: '2024-04-22',
    duration: '18:15',
    source_badge: 'Field Expedition Log',
  },
  {
    id: 'med-vid-3',
    title: 'IndARC: Anchoring an Underwater Observatory in Kongsfjorden',
    type: 'Video',
    description:
      'Deep-sea robotics and acoustic release deployment footage capturing the recovery and mooring replacement of IndARC at 192 meters below Arctic fjord waters.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Kongsfjorden Deep Basin, Svalbard',
    related_paper_id: 'paper-006',
    publication_date: '2024-03-30',
    duration: '14:50',
    source_badge: 'Deep-Sea Robotics',
  },
  {
    id: 'med-vid-4',
    title: 'Through the Southern Ocean: The 43rd ISEA Voyage',
    type: 'Video',
    description:
      'Cinematic footage of polar vessel MV Vasiliy Golovnin navigating massive tabular icebergs and heavy pack ice in the Roaring Forties and Furious Fifties.',
    thumbnail_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Southern Ocean / Weddell Gyre',
    related_paper_id: 'paper-001',
    publication_date: '2024-02-14',
    duration: '21:30',
    source_badge: 'Cinematic High Seas',
  },

  // ─── 2. PHOTO GALLERIES ───
  {
    id: 'med-photo-1',
    title: 'Adélie Penguin Breeding Colonies of Larsemann Hills',
    type: 'Photo Gallery',
    description:
      'High-resolution 24-frame photo series capturing courtship pebble rituals, chick creching, and south polar skua dynamics around Bharati Station.',
    thumbnail_url: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Larsemann Hills Coastal Islands',
    related_paper_id: 'paper-003',
    publication_date: '2024-04-12',
    photo_count: '18 High-Res Photos',
    gallery_images: [
      'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=900&auto=format&fit=crop&q=85',
    ],
  },
  {
    id: 'med-photo-2',
    title: 'Glacial Rifts and Freshwater Lakes of Schirmacher Oasis',
    type: 'Photo Gallery',
    description:
      'Close-up geological and cryospheric photography of Lake Priyadarshini, meltwater channels, and patterned ground permafrost formations near Maitri Station.',
    thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Schirmacher Oasis, Central Dronning Maud Land',
    related_paper_id: 'paper-005',
    publication_date: '2024-03-25',
    photo_count: '24 High-Res Photos',
    gallery_images: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?w=900&auto=format&fit=crop&q=85',
    ],
  },
  {
    id: 'med-photo-3',
    title: 'Auroral Storms & Noctilucent Clouds over Ny-Ålesund',
    type: 'Photo Gallery',
    description:
      'Spectacular long-exposure astrophotography showcasing geomagnetic storm aurora borealis ribbons and high-altitude ice clouds above Himadri Station.',
    thumbnail_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Ny-Ålesund International Polar Village',
    related_paper_id: 'paper-004',
    publication_date: '2024-02-18',
    photo_count: '16 High-Res Photos',
    gallery_images: [
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&auto=format&fit=crop&q=85',
    ],
  },
  {
    id: 'med-photo-4',
    title: 'Life and Science at 70° South: Winter Over Maitri',
    type: 'Photo Gallery',
    description:
      'Documentary photography following daily routines, greenhouse vegetable hydroponics, geomagnetism lab operations, and blizzard safety protocols.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Maitri Research Station',
    related_paper_id: 'paper-008',
    publication_date: '2024-01-20',
    photo_count: '22 High-Res Photos',
    gallery_images: [
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=900&auto=format&fit=crop&q=85',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&auto=format&fit=crop&q=85',
    ],
  },

  // ─── 3. INFOGRAPHICS ───
  {
    id: 'med-info-1',
    title: 'Anatomy of an Ice Shelf: How Amery Calves Gigantic Icebergs',
    type: 'Infographic',
    description:
      'Step-by-step visual schematic breaking down hydrostatic pressure, subglacial plume melting, rift propagation, and loose tabular berg detachment.',
    thumbnail_url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Amery Ice Shelf Front',
    related_paper_id: 'paper-009',
    publication_date: '2024-04-01',
    scientific_takeaways: [
      'Hydrostatic rift propagation measured at 4.8 cm/day under tidal flexing',
      'Basal melt channels entrain warm modified Circumpolar Deep Water',
      'Produces icebergs exceeding 1,600 sq km in surface area',
    ],
  },
  {
    id: 'med-info-2',
    title: 'Deploying IndARC: High-Seas Telemetry in Kongsfjorden',
    type: 'Infographic',
    description:
      'Interactive diagram depicting subsurface sensor arrays, CTD sensors, acoustic Doppler current profilers (ADCP), and data telemetry at 192m depth.',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Kongsfjorden Marine Transect',
    related_paper_id: 'paper-006',
    publication_date: '2024-02-20',
    scientific_takeaways: [
      'Mooring depth: 192m below fjord surface with zero-ice snag profile',
      'Acoustic Doppler Current Profiler (ADCP) tracks Atlantic water influx',
      'Autonomous acoustic release mechanism triggers yearly turnaround',
    ],
  },
  {
    id: 'med-info-3',
    title: 'Antarctic Ozone Layer Recovery: 40-Year Maitri Data (1985–2026)',
    type: 'Infographic',
    description:
      'Climatological graphic charting Dobson spectrophotometer total ozone column readings over Maitri, tracking CFC decline and healing trajectories.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Maitri Station, Antarctica',
    related_paper_id: 'paper-008',
    publication_date: '2024-03-15',
    scientific_takeaways: [
      'Spring ozone minimum has increased from 112 DU (1998) to 184 DU (2024)',
      'Direct confirmation of Montreal Protocol compliance efficacy',
      'Polar stratospheric cloud (PSC) duration reduced by 8.4 days per decade',
    ],
  },
  {
    id: 'med-info-4',
    title: 'Polar Teleconnections: How Arctic Warming Drives Indian Monsoon Extremes',
    type: 'Infographic',
    description:
      'Atmospheric teleconnection flow chart tracing Arctic sea ice loss, Rossby wave amplification, jet stream meanders, and monsoon rainfall volatility over India.',
    thumbnail_url: 'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Global Teleconnection Belt',
    related_paper_id: 'paper-002',
    publication_date: '2024-01-28',
    scientific_takeaways: [
      'Barents-Kara sea ice loss weakens upper-tropospheric westerly winds',
      'Deep Rossby wave train propagates south toward the Tibetan Plateau',
      'Increases frequency of intense monsoonal dry and wet spells in Central India',
    ],
  },

  // ─── 4. NEWS & UPDATES ───
  {
    id: 'med-news-1',
    title: '44th Indian Scientific Expedition to Antarctica Flagged Off from Goa',
    type: 'News & Updates',
    description:
      'Ministry of Earth Sciences and NCPOR officially deploy 42 polar researchers, engineers, and medical staff aboard ice-class vessel for Maitri and Bharati stations.',
    thumbnail_url: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'NCPOR Headquarters, Goa & Antarctica',
    related_paper_id: 'paper-001',
    publication_date: '2024-05-18',
    dateline: 'Goa / New Delhi • Official MoES Press Release',
  },
  {
    id: 'med-news-2',
    title: 'IndARC Deep-Sea Observatory Completes 10th Year of Uninterrupted Arctic Telemetry',
    type: 'News & Updates',
    description:
      'Indian mission in Svalbard achieves historic decadal milestone in measuring warm Atlantic water advection into the Arctic basin, publishing open-access datasets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&auto=format&fit=crop&q=85',
    region: 'Arctic',
    location_name: 'Ny-Ålesund, Svalbard',
    related_paper_id: 'paper-006',
    publication_date: '2024-04-28',
    dateline: 'Svalbard / IndARC Program Office',
  },
  {
    id: 'med-news-3',
    title: 'Cabinet Approves Roadmap for Next-Generation Maitri-II Antarctic Research Station',
    type: 'News & Updates',
    description:
      'Government greenlights state-of-the-art green polar station featuring renewable microgrids, zero-emission wastewater recycling, and advanced atmospheric labs.',
    thumbnail_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Schirmacher Oasis, Antarctica',
    related_paper_id: 'paper-005',
    publication_date: '2024-03-18',
    dateline: 'Cabinet Committee on Economic Affairs • New Delhi',
  },
  {
    id: 'med-news-4',
    title: 'Dakshin Gangotri: Preserving India’s Historic First Polar Base as Heritage Site',
    type: 'News & Updates',
    description:
      'Commemorative international treaty inspection successfully concludes documentation of Dakshin Gangotri as a protected Antarctic Treaty Historic Site.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=900&auto=format&fit=crop&q=85',
    region: 'Antarctic',
    location_name: 'Dakshin Gangotri Site, Antarctica',
    related_paper_id: 'paper-005',
    publication_date: '2024-02-05',
    dateline: 'Antarctic Treaty Consultative Meeting (ATCM)',
  },
];

const TYPE_FILTERS = [
  'All',
  'Videos & Documentaries',
  'Photo Galleries',
  'Infographics',
  'News & Updates'
];
const REGION_FILTERS = ['All', 'Arctic', 'Antarctic'];

export const MediaDisseminationPage: React.FC<MediaDisseminationPageProps> = ({ onReadPaper, lang }) => {
  const [mediaList, setMediaList] = useState<MediaItem[]>(DEFAULT_MEDIA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Modal interaction state
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        let apiType: string | undefined = undefined;
        if (selectedType === 'Videos & Documentaries') apiType = 'Video';
        else if (selectedType === 'Photo Galleries') apiType = 'Image';
        else if (selectedType === 'Infographics') apiType = 'Infographic';
        else if (selectedType === 'News & Updates') apiType = 'News';

        const res = await apiFetchMedia({
          type: apiType,
          region: selectedRegion === 'All' ? undefined : selectedRegion,
        });
        if (res.media && res.media.length > 0) {
          const normalized: MediaItem[] = res.media.map((m: any) => {
            const fallbackMatch = DEFAULT_MEDIA.find(d => d.id === m.id);
            let displayType: any = m.type;
            if (m.type === 'Image') displayType = 'Photo Gallery';
            else if (m.type === 'News') displayType = 'News & Updates';
            else if (m.type === 'Video') displayType = 'Video';

            return {
              ...m,
              type: displayType,
              gallery_images: m.gallery_images || fallbackMatch?.gallery_images,
              duration: m.duration || fallbackMatch?.duration,
              photo_count: m.photo_count || fallbackMatch?.photo_count,
              scientific_takeaways: m.scientific_takeaways || fallbackMatch?.scientific_takeaways,
              dateline: m.dateline || fallbackMatch?.dateline,
              source_badge: m.source_badge || fallbackMatch?.source_badge,
            };
          });
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
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location_name && item.location_name.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchType = false;
    if (selectedType === 'All') {
      matchType = true;
    } else if (selectedType === 'Videos & Documentaries') {
      matchType = item.type === 'Video' || item.type === 'Videos & Documentaries' || item.type === 'Expedition Story';
    } else if (selectedType === 'Photo Galleries') {
      matchType = item.type === 'Photo Gallery' || item.type === 'Image Gallery' || item.type === 'Image';
    } else if (selectedType === 'Infographics') {
      matchType = item.type === 'Infographic' || item.type === 'Infographics';
    } else if (selectedType === 'News & Updates') {
      matchType = item.type === 'News & Updates' || item.type === 'News';
    } else {
      matchType = item.type.toLowerCase() === selectedType.toLowerCase();
    }

    const matchRegion =
      selectedRegion === 'All' ||
      item.region.toLowerCase() === selectedRegion.toLowerCase();

    return matchSearch && matchType && matchRegion;
  });

  const cardsPerPage = 6;
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
      case 'Video':
      case 'Videos & Documentaries':
        return { bg: '#E11D48', text: '#FFFFFF', label: 'Video Documentary' };
      case 'Photo Gallery':
      case 'Image Gallery':
      case 'Image':
        return { bg: '#0D9488', text: '#FFFFFF', label: 'Photo Gallery' };
      case 'Infographic':
      case 'Infographics':
        return { bg: '#7C3AED', text: '#FFFFFF', label: 'Infographic' };
      case 'News':
      case 'News & Updates':
        return { bg: '#0284C7', text: '#FFFFFF', label: 'News & Dispatch' };
      case 'Expedition Story':
      default:
        return { bg: '#1D4ED8', text: '#FFFFFF', label: 'Expedition Story' };
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
              'linear-gradient(180deg, rgba(240, 249, 255, 0.4) 0%, rgba(240, 249, 255, 0.12) 60%, transparent 100%)',
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
          {/* Top Row: Eyebrow */}
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
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '36px',
            }}
          >
            {[
              {
                icon: Play,
                text: 'Videos & Documentaries',
                isPlay: true,
                count: mediaList.filter(m => m.type === 'Video' || m.type === 'Videos & Documentaries' || m.type === 'Expedition Story').length,
              },
              {
                icon: ImageIcon,
                text: 'Photo Galleries',
                count: mediaList.filter(m => m.type === 'Photo Gallery' || m.type === 'Image' || m.type === 'Image Gallery').length,
              },
              {
                icon: BarChart2,
                text: 'Infographics',
                count: mediaList.filter(m => m.type === 'Infographic' || m.type === 'Infographics').length,
              },
              {
                icon: FileText,
                text: 'News & Updates',
                count: mediaList.filter(m => m.type === 'News & Updates' || m.type === 'News').length,
              },
            ].map(({ icon: Icon, text, isPlay, count }) => {
              const isActive = selectedType === text;
              return (
                <button
                  key={text}
                  type="button"
                  onClick={() => {
                    setSelectedType(prev => (prev === text ? 'All' : text));
                    setCarouselIndex(0);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 18px 8px 10px',
                    borderRadius: '9999px',
                    border: isActive
                      ? '1.5px solid #0284C7'
                      : '1px solid rgba(14, 116, 144, 0.18)',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(14, 165, 233, 0.06))'
                      : 'rgba(255, 255, 255, 0.85)',
                    fontSize: '13.5px',
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#0284C7' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isActive
                      ? '0 4px 16px rgba(2, 132, 199, 0.18)'
                      : '0 2px 8px rgba(15, 23, 42, 0.04)',
                    transform: isActive ? 'translateY(-1px)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(2, 132, 199, 0.4)';
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.12)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.85)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14, 116, 144, 0.18)';
                      (e.currentTarget as HTMLElement).style.transform = 'none';
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                    }
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      border: isActive
                        ? '1px solid #0284C7'
                        : '1px solid rgba(2, 132, 199, 0.28)',
                      background: isActive
                        ? '#0284C7'
                        : 'rgba(2, 132, 199, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? '#FFFFFF' : '#0284C7',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={16} fill={isActive ? (isPlay ? '#FFFFFF' : 'none') : (isPlay ? '#0284C7' : 'none')} />
                  </div>
                  <span>{text}</span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: isActive ? '#0284C7' : '#E2E8F0',
                        color: isActive ? '#FFFFFF' : '#475569',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {selectedType !== 'All' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType('All');
                  setCarouselIndex(0);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: '1px dashed #94A3B8',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: '#64748B',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#0284C7';
                  (e.currentTarget as HTMLElement).style.color = '#0284C7';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#94A3B8';
                  (e.currentTarget as HTMLElement).style.color = '#64748B';
                }}
              >
                <X size={13} />
                <span>Show All Media</span>
              </button>
            )}
          </div>

          {/* ═══ Unified Search & Dual Filter Bar ═══ */}
          <div className="w-full space-y-3.5">
            {/* Search Input */}
            <div className="w-full flex items-center bg-white/95 border border-slate-200 hover:border-sky-400 focus-within:border-sky-500 rounded-xl sm:rounded-full px-4 py-2.5 shadow-xs backdrop-blur-md transition-all">
              <Search
                size={16}
                className="text-sky-600 mr-2.5 shrink-0"
              />
              <input
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCarouselIndex(0);
                }}
                placeholder="Search stories, infographics, videos, or keywords..."
                className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills: Types + Regions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Type Pills */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                {TYPE_FILTERS.map(t => {
                  const active = selectedType === t;
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedType(t);
                        setCarouselIndex(0);
                      }}
                      className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-sky-600 to-cyan-700 text-white shadow-sm shadow-sky-600/30 border border-transparent'
                          : 'bg-white/90 text-slate-600 border border-slate-200/90 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Region Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Region:</span>
                {REGION_FILTERS.map(r => {
                  const active = selectedRegion === r;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        setSelectedRegion(r);
                        setCarouselIndex(0);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-sky-600 to-cyan-700 text-white shadow-sm shadow-sky-600/30 border border-transparent'
                          : 'bg-white/90 text-slate-600 border border-slate-200/90 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STORIES CAROUSEL / CARDS CONTAINER ═══ */}
      <div
        style={{
          maxWidth: '1520px',
          margin: '0 auto',
          padding: '2rem clamp(1rem, 3vw, 3rem) 4rem',
          position: 'relative',
        }}
      >
        {/* Navigation Arrow Left */}
        {maxPages > 1 && (
          <button
            onClick={handlePrev}
            aria-label="Previous Stories"
            className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-200 text-sky-600 items-center justify-center cursor-pointer shadow-md hover:scale-110 hover:border-sky-500 transition-all"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {maxPages > 1 && (
          <button
            onClick={handleNext}
            aria-label="Next Stories"
            className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-slate-200 text-sky-600 items-center justify-center cursor-pointer shadow-md hover:scale-110 hover:border-sky-500 transition-all"
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        )}

        {/* Responsive Card Grid */}
        {filteredMedia.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <Search size={36} style={{ color: '#94A3B8', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748B', fontSize: '15px' }}>
              No media stories found matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-1 sm:px-8">
            {currentCards.map(item => {
              const badge = getBadgeStyle(item.type);
              const isVideo = item.type === 'Video' || item.type === 'Videos & Documentaries' || item.type === 'Expedition Story';
              const isGallery = item.type === 'Photo Gallery' || item.type === 'Image' || item.type === 'Image Gallery';
              const isInfographic = item.type === 'Infographic' || item.type === 'Infographics';
              const isNews = item.type === 'News' || item.type === 'News & Updates';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item);
                    setIsPlayingVideo(false);
                    setActiveGalleryIndex(0);
                  }}
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
                          zIndex: 2,
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

                    {/* Bottom-Right Category Specific Indicator Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '12px',
                        zIndex: 2,
                        background: 'rgba(15, 23, 42, 0.82)',
                        backdropFilter: 'blur(6px)',
                        padding: '4px 9px',
                        borderRadius: '6px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      }}
                    >
                      {isVideo && (
                        <>
                          <Clock size={11} style={{ color: '#38BDF8' }} />
                          <span>{item.duration || '26:40'}</span>
                        </>
                      )}
                      {isGallery && (
                        <>
                          <ImageIcon size={11} style={{ color: '#34D399' }} />
                          <span>{item.photo_count || '12 Photos'}</span>
                        </>
                      )}
                      {isInfographic && (
                        <>
                          <BarChart2 size={11} style={{ color: '#A78BFA' }} />
                          <span>Interactive Schematic</span>
                        </>
                      )}
                      {isNews && (
                        <>
                          <FileText size={11} style={{ color: '#F472B6' }} />
                          <span>{item.dateline ? item.dateline.split('(')[0].trim() : 'Official Dispatch'}</span>
                        </>
                      )}
                    </div>

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
                        {item.publication_date ? item.publication_date.split('T')[0] : '2024-04-01'}
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
      {activeItem && (() => {
        const isVideo = activeItem.type === 'Video' || activeItem.type === 'Videos & Documentaries' || activeItem.type === 'Expedition Story';
        const isGallery = activeItem.type === 'Photo Gallery' || activeItem.type === 'Image' || activeItem.type === 'Image Gallery';
        const isInfographic = activeItem.type === 'Infographic' || activeItem.type === 'Infographics';
        const isNews = activeItem.type === 'News' || activeItem.type === 'News & Updates';
        const galleryList = (activeItem.gallery_images && activeItem.gallery_images.length > 0)
          ? activeItem.gallery_images
          : [activeItem.thumbnail_url];
        const activePhoto = galleryList[activeGalleryIndex] || activeItem.thumbnail_url;

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => {
              setActiveItem(null);
              setIsPlayingVideo(false);
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(14, 116, 144, 0.22)',
                borderRadius: '24px',
                maxWidth: '780px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 70px rgba(15, 23, 42, 0.25)',
                padding: '28px 32px',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveItem(null);
                  setIsPlayingVideo(false);
                }}
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
                  zIndex: 10,
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

              {/* Type Badge & Meta Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    background: getBadgeStyle(activeItem.type).bg,
                    color: getBadgeStyle(activeItem.type).text,
                  }}
                >
                  {getBadgeStyle(activeItem.type).label}
                </span>

                {activeItem.source_badge && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.25)',
                      color: '#0284C7',
                    }}
                  >
                    {activeItem.source_badge}
                  </span>
                )}

                {isVideo && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#E11D48',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Clock size={12} /> {activeItem.duration || '26:40'} UHD
                  </span>
                )}
              </div>

              {/* Modal Title */}
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1.28,
                  marginBottom: '18px',
                  paddingRight: '36px',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.02em',
                }}
              >
                {activeItem.title}
              </h2>

              {/* ─── 1. VIDEO PLAYER EXPERIENCE ─── */}
              {isVideo && (
                <div
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    background: '#0F172A',
                    border: '1px solid rgba(2, 132, 199, 0.3)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                  }}
                >
                  {/* Player Screen */}
                  <div
                    style={{
                      position: 'relative',
                      height: '340px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    onClick={() => setIsPlayingVideo(prev => !prev)}
                  >
                    <img
                      src={activeItem.thumbnail_url}
                      alt={activeItem.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isPlayingVideo ? 'brightness(0.92)' : 'brightness(0.75)',
                        transition: 'filter 0.3s ease',
                      }}
                    />

                    {/* Central Play/Pause Button */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        background: isPlayingVideo ? 'rgba(15, 23, 42, 0.7)' : 'rgba(2, 132, 199, 0.92)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isPlayingVideo ? (
                        <Pause size={28} fill="#FFFFFF" />
                      ) : (
                        <Play size={28} fill="#FFFFFF" style={{ marginLeft: '4px' }} />
                      )}
                    </div>

                    {/* Streaming Status Overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          background: isPlayingVideo ? 'rgba(34, 197, 94, 0.9)' : 'rgba(15, 23, 42, 0.75)',
                          color: '#FFFFFF',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        {isPlayingVideo ? '● PLAYING (4K 60FPS)' : '▶ 4K DOCUMENTARY PREVIEW'}
                      </span>
                    </div>
                  </div>

                  {/* Player Scrubber & Controls Bar */}
                  <div
                    style={{
                      background: '#090D16',
                      padding: '12px 18px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {/* Simulated Scrubber Bar */}
                    <div
                      style={{
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px',
                        marginBottom: '10px',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: isPlayingVideo ? '42%' : '18%',
                          background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
                          borderRadius: '2px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#94A3B8',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setIsPlayingVideo(prev => !prev)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#38BDF8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {isPlayingVideo ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>
                        <span>
                          {isPlayingVideo ? '08:45' : '02:10'} / {activeItem.duration || '26:40'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>5.1 Surround Field Audio</span>
                        <Volume2 size={15} style={{ color: '#94A3B8', cursor: 'pointer' }} />
                        <Maximize2 size={15} style={{ color: '#94A3B8', cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 2. PHOTO GALLERY LIGHTBOX EXPERIENCE ─── */}
              {isGallery && (
                <div style={{ marginBottom: '20px' }}>
                  {/* Main High-Res Viewer */}
                  <div
                    style={{
                      height: '340px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: '12px',
                      border: '1px solid #E2E8F0',
                      position: 'relative',
                      background: '#0F172A',
                    }}
                  >
                    <img
                      src={activePhoto}
                      alt={activeItem.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'opacity 0.25s ease',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '14px',
                        background: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#F8FAFC',
                      }}
                    >
                      Photo {activeGalleryIndex + 1} of {galleryList.length} • Expedition Archive
                    </div>
                  </div>

                  {/* 4-Thumbnail Strip */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {galleryList.map((imgUrl, idx) => {
                      const isThumbActive = idx === activeGalleryIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveGalleryIndex(idx)}
                          style={{
                            flex: 1,
                            height: '70px',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            border: isThumbActive ? '2.5px solid #0284C7' : '1px solid #CBD5E1',
                            padding: 0,
                            cursor: 'pointer',
                            opacity: isThumbActive ? 1 : 0.65,
                            transform: isThumbActive ? 'scale(1.02)' : 'none',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── 3. INFOGRAPHIC EXPERIENCE ─── */}
              {isInfographic && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      height: '320px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={activeItem.thumbnail_url}
                      alt={activeItem.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'rgba(124, 58, 237, 0.9)',
                        color: '#FFFFFF',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      300 DPI Vector Schematic
                    </div>
                  </div>

                  {/* Key Scientific Takeaways Callout */}
                  <div
                    style={{
                      background: 'rgba(2, 132, 199, 0.05)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      borderRadius: '14px',
                      padding: '16px 20px',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#0284C7',
                        marginBottom: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <Sparkles size={14} /> Key Scientific Observations
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '13px',
                        color: '#334155',
                        lineHeight: 1.7,
                      }}
                    >
                      {activeItem.scientific_takeaways && activeItem.scientific_takeaways.length > 0 ? (
                        activeItem.scientific_takeaways.map((point, pIdx) => (
                          <li key={pIdx} style={{ marginBottom: '4px' }}>
                            {point}
                          </li>
                        ))
                      ) : (
                        <>
                          <li>Grounding line retreat mapped with multi-temporal InSAR satellite interferometry.</li>
                          <li>Sub-ice shelf cavity water temperatures measured at +0.8°C above local freezing point.</li>
                          <li>Basal melting accounts for over 68% of net ice mass flux across the observation corridor.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* ─── 4. NEWS & UPDATES EXPERIENCE ─── */}
              {isNews && (
                <div style={{ marginBottom: '20px' }}>
                  <div
                    style={{
                      height: '240px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: '16px',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <img
                      src={activeItem.thumbnail_url}
                      alt={activeItem.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Dispatch Seal Banner */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(14, 116, 144, 0.08), rgba(2, 132, 199, 0.05))',
                      borderLeft: '4px solid #0284C7',
                      padding: '10px 16px',
                      borderRadius: '4px 10px 10px 4px',
                      marginBottom: '16px',
                      fontSize: '12px',
                      color: '#0369A1',
                      fontWeight: 600,
                    }}
                  >
                    🏛️ NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH (NCPOR) • OFFICIAL BULLETIN
                    {activeItem.dateline && (
                      <div style={{ color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
                        Dateline: {activeItem.dateline}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full Description */}
              <p
                style={{
                  fontSize: '13.8px',
                  color: '#334155',
                  lineHeight: 1.75,
                  marginBottom: '20px',
                }}
              >
                {activeItem.description}
              </p>

              {/* Details Meta Panel */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '12.5px',
                  color: '#64748B',
                  marginBottom: '22px',
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
                  📅 Released:{' '}
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>
                    {activeItem.publication_date}
                  </span>
                </div>
                <div>
                  🌐 Expedition Region:{' '}
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>
                    {activeItem.region}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Secondary Action */}
                {isInfographic ? (
                  <button
                    type="button"
                    onClick={() => alert('Downloading high-resolution 300 DPI vector PDF...')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      background: '#F1F5F9',
                      color: '#0F172A',
                      fontWeight: 600,
                      fontSize: '13px',
                      border: '1px solid #CBD5E1',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#E2E8F0';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
                    }}
                  >
                    <Download size={14} />
                    <span>Download Vector Graphic (PDF)</span>
                  </button>
                ) : (
                  <div />
                )}

                {/* Related Research Paper Action */}
                {activeItem.related_paper_id && (
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
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
