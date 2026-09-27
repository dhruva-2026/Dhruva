import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, BookOpen, ChevronRight } from 'lucide-react';
import { BACKUP_PAPERS, type BackupPaper } from '../data/backupPapers';
import { apiFetchPapers } from '../services/api';

export interface GlobalSearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onReadPaper: (id: string) => void;
  onSearchExplore?: (query: string) => void;
  lang: 'en' | 'hi';
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  isOpen,
  onClose,
  onReadPaper,
  onSearchExplore,
  lang
}) => {
  const [query, setQuery] = useState('');
  const [livePapers, setLivePapers] = useState<BackupPaper[]>(BACKUP_PAPERS);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus input on open & reset query
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Click outside listener: clicks anywhere outside the search container close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay slightly to prevent the click that opened the search from immediately closing it
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 10);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Fetch live papers if backend is active
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchLive = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetchPapers(query.trim() ? { search: query.trim() } : {});
        if (isMounted && res && res.papers && res.papers.length > 0) {
          setLivePapers(res.papers);
        }
      } catch {
        // Fallback remains BACKUP_PAPERS
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchLive, 180);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [query, isOpen]);

  // Search filtering logic across papers
  const cleanQuery = query.trim().toLowerCase();

  const matchingPapers = useMemo(() => {
    const source = livePapers && livePapers.length > 0 ? livePapers : BACKUP_PAPERS;
    if (!cleanQuery) return [];

    return source.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const abstract = (p.abstract || '').toLowerCase();
      const authors = (p.authors || '').toLowerCase();
      const area = (p.research_area || '').toLowerCase();
      const region = (p.polar_region || '').toLowerCase();
      const institution = (p.institution || '').toLowerCase();
      const keywords = (p.keywords || '').toLowerCase();
      const loc = (p.location_name || '').toLowerCase();

      return (
        title.includes(cleanQuery) ||
        abstract.includes(cleanQuery) ||
        authors.includes(cleanQuery) ||
        area.includes(cleanQuery) ||
        region.includes(cleanQuery) ||
        institution.includes(cleanQuery) ||
        keywords.includes(cleanQuery) ||
        loc.includes(cleanQuery)
      );
    });
  }, [cleanQuery, livePapers]);

  if (!isOpen) return null;

  const handlePaperClick = (paperId: string) => {
    onClose();
    onReadPaper(paperId);
  };

  const handleViewAllClick = () => {
    onClose();
    if (onSearchExplore) {
      onSearchExplore(query);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full right-2 sm:right-6 mt-2 w-[calc(100vw-1.5rem)] sm:w-[540px] md:w-[600px] max-w-[95vw] bg-white/98 rounded-2xl border border-cyan-500/25 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.18),0_0_0_1px_rgba(14,116,144,0.1)] backdrop-blur-xl overflow-hidden z-[100] animate-fadeInUp"
      style={{
        transformOrigin: 'top right'
      }}
    >
      {/* Minimal Search Input Box */}
      <div className="flex items-center px-4 py-3 gap-3 border-b border-slate-100 bg-gradient-to-r from-sky-50/40 via-white to-cyan-50/20">
        <Search className={`w-4 h-4 text-cyan-600 shrink-0 ${isLoading ? 'animate-pulse' : ''}`} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (matchingPapers.length > 0) {
                handlePaperClick(matchingPapers[0].id);
              } else if (cleanQuery && onSearchExplore) {
                handleViewAllClick();
              }
            }
          }}
          placeholder={
            lang === 'en'
              ? 'Search polar research papers, authors, topics...'
              : 'ध्रुवीय शोध पत्र, लेखक, विषय खोजें...'
          }
          className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            title="Clear search"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          title="Close search"
          className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Results Container */}
      <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100/80">
        {/* State 1: When user hasn't typed anything yet */}
        {!cleanQuery && (
          <div className="py-6 px-4 text-center">
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'en'
                ? 'Type to search across Indian Arctic & Antarctic research papers...'
                : 'भारतीय आर्कटिक एवं अंटार्कटिक शोध पत्रों में खोजने के लिए टाइप करें...'}
            </p>
          </div>
        )}

        {/* State 2: When matching results found */}
        {cleanQuery && matchingPapers.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>{lang === 'en' ? 'Matched Research Papers' : 'प्रासंगिक शोध पत्र'} ({matchingPapers.length})</span>
              {matchingPapers.length > 5 && (
                <button
                  type="button"
                  onClick={handleViewAllClick}
                  className="text-cyan-600 hover:text-cyan-800 font-semibold normal-case tracking-normal cursor-pointer"
                >
                  {lang === 'en' ? 'View all results →' : 'सभी देखें →'}
                </button>
              )}
            </div>

            {matchingPapers.slice(0, 6).map((paper) => (
              <div
                key={paper.id}
                onClick={() => handlePaperClick(paper.id)}
                className="p-2.5 rounded-xl border border-transparent hover:border-cyan-200 hover:bg-gradient-to-r hover:from-cyan-50/80 hover:to-sky-50/40 transition-all cursor-pointer group flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-sky-100/80 text-cyan-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          paper.polar_region === 'Arctic'
                            ? 'bg-cyan-100 text-cyan-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {paper.polar_region}
                      </span>
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {paper.research_area}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {paper.publication_year}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-cyan-700 leading-snug line-clamp-1">
                      {paper.title}
                    </h4>

                    <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {paper.authors}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 text-cyan-600 text-xs font-semibold">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* State 3: No results found */}
        {cleanQuery && matchingPapers.length === 0 && (
          <div className="py-8 text-center px-4">
            <p className="text-sm font-semibold text-slate-700">
              {lang === 'en' ? 'No relevant information found.' : 'कोई प्रासंगिक जानकारी नहीं मिली।'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'en'
                ? `No polar papers match "${query}". Try different keywords.`
                : `"${query}" से मेल खाता कोई शोध पत्र नहीं मिला। अन्य कीवर्ड का प्रयास करें।`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
