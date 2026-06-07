import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { Fund } from '../../types/fund';
import { categoryLabel, formatScore } from '../../utils/format';
import Badge from '../ui/Badge';

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/rankings', label: 'Rankings' },
  { to: '/compare', label: 'Compare' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/data-management', label: 'Data' },
];

// Simple scoring for search results
function scoreMatch(query: string, fund: Fund): number {
  const q = query.toLowerCase();
  const name = fund.name.toLowerCase();
  const amc = (fund.amc || '').toLowerCase();

  if (name === q) return 100;
  if (name.startsWith(q)) return 80;
  if (amc === q) return 70;
  if (amc.startsWith(q)) return 60;
  if (name.includes(q)) return 40;
  if (amc.includes(q)) return 30;
  return 0;
}

export default function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read fund list from React Query cache
  const allFunds = queryClient.getQueryData<Fund[]>(['funds']) || [];

  const results = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return allFunds
      .map((f) => ({ fund: f, score: scoreMatch(searchQuery, f) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((r) => r.fund);
  }, [allFunds, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectFund = useCallback(
    (fund: Fund) => {
      navigate(`/fund/${fund.id}`);
      setSearchQuery('');
      setShowResults(false);
      setMobileSearchOpen(false);
      setHighlightIdx(-1);
    },
    [navigate]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && highlightIdx >= 0 && results[highlightIdx]) {
        e.preventDefault();
        selectFund(results[highlightIdx]);
      } else if (e.key === 'Escape') {
        setShowResults(false);
        setMobileSearchOpen(false);
        inputRef.current?.blur();
      }
    },
    [results, highlightIdx, selectFund]
  );

  // Get composite score for display
  const getFundScore = (fund: Fund): string => {
    // Try to get from cached fund detail
    const detail = queryClient.getQueryData<{ metrics?: { composite_score?: number | null } }>(['fund', fund.id]);
    if (detail?.metrics?.composite_score != null) return formatScore(detail.metrics.composite_score);
    return '';
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:block">MF Analysis</span>
          </Link>

          {/* Desktop Search */}
          <div ref={searchRef} className="relative hidden md:block flex-1 max-w-sm">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search funds..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                  setHighlightIdx(-1);
                }}
                onFocus={() => setShowResults(true)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>

            {/* Results dropdown */}
            {showResults && results.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-[400px] overflow-y-auto z-50">
                {results.map((fund, idx) => {
                  const score = getFundScore(fund);
                  return (
                    <button
                      key={fund.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectFund(fund)}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                        idx === highlightIdx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      } ${idx > 0 ? 'border-t border-gray-50' : ''}`}
                    >
                      <div className="mt-0.5">
                        <Badge category={fund.category} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{fund.name}</p>
                        <p className="text-xs text-gray-500">
                          {fund.amc} · {categoryLabel(fund.category)}
                          {score && ` · Score: ${score}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1 shrink-0">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile: search icon + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div ref={searchRef} className="md:hidden pb-3 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search funds..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
                setHighlightIdx(-1);
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {showResults && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl max-h-[300px] overflow-y-auto z-50">
                {results.map((fund, idx) => (
                  <button
                    key={fund.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectFund(fund)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      idx === highlightIdx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    } ${idx > 0 ? 'border-t border-gray-50' : ''}`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{fund.name}</p>
                    <p className="text-xs text-gray-500">{fund.amc} · {categoryLabel(fund.category)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile nav links */}
        <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
