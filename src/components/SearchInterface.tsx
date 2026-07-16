
import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Filter, LogIn } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeSearchInput, sanitizeOccupationCode } from '@/utils/inputSanitization';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';
import { useSearchHistoryUnified } from '@/hooks/useSearchHistoryUnified';
import { RateLimitDisplay } from './RateLimitDisplay';
import { searchRateLimiter, checkRateLimit, formatTimeUntilReset } from '@/utils/rateLimiting';
import { useSession } from '@/hooks/useSession';
import { useNavigate, Link } from 'react-router-dom';
import { getFunctionsBaseUrl } from '@/lib/utils';
import { getDeviceId } from '@/utils/device';
import { trackAnalyticsEvent } from '@/hooks/useAnalyticsEvents';
import { getLocalJSON, setLocalJSON } from '@/lib/storage';
import { useSubscriptionWithPrompts } from '@/hooks/useSubscriptionWithPrompts';
import { occupationRiskData } from '@/data/occupationRiskData';

interface SearchInterfaceProps {
  onOccupationSelect: (occupation: unknown) => void;
}

interface SearchResult {
  code: string;
  title: string;
  description: string;
}

interface OccupationSearchResponse {
  occupations?: Array<{
    occupation_code?: string;
    code?: string;
    occupation_title?: string;
    title?: string;
    description?: string;
    summary?: string;
  }>;
}

const cache: Record<string, SearchResult[]> = {};

const normalizeSearchToken = (token: string) => {
  const normalized = token.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return normalized.endsWith('s') && normalized.length > 3 ? normalized.slice(0, -1) : normalized;
};

const searchLocalOccupationRiskData = (term: string, limit: number) => {
  const queryTokens = term
    .split(/\s+/)
    .map(normalizeSearchToken)
    .filter(Boolean);

  if (queryTokens.length === 0) return [];

  return Object.values(occupationRiskData)
    .filter((occupation) => {
      const searchTokens = [
        occupation.title,
        occupation.code,
        occupation.industry,
        occupation.bridgeRole,
        ...occupation.safeSkills,
        ...occupation.reskillingSuggestions,
      ]
        .join(' ')
        .split(/\s+/)
        .map(normalizeSearchToken)
        .filter(Boolean);

      return queryTokens.every((queryToken) =>
        searchTokens.some((searchToken) => searchToken.includes(queryToken) || queryToken.includes(searchToken))
      );
    })
    .slice(0, limit)
    .map((occupation) => ({
      code: occupation.code,
      title: occupation.title,
      description: occupation.seoDescription || `Automation risk profile for ${occupation.title}.`,
    }));
};

export const SearchInterface = ({ onOccupationSelect }: SearchInterfaceProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isCalculatingAPO, setIsCalculatingAPO] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [maxResults, setMaxResults] = useState<number>(10);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [rateLimitStatus, setRateLimitStatus] = useState({
    allowed: true,
    remaining: 20,
    resetTime: Date.now(),
    timeUntilReset: 0
  });

  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { addSearch } = useSearchHistoryUnified();
  const { user, loading } = useSession();
  const isGuest = !user;
  const navigate = useNavigate();
  const { requestFeature } = useSubscriptionWithPrompts();

  React.useEffect(() => {
    if (results.length && resultsRef.current) {
      resultsRef.current.focus();
    }
  }, [results.length]);

  // Load recent searches from localStorage on mount
  React.useEffect(() => {
    const history = getLocalJSON<string[]>('search:history', []) || [];
    setRecentSearches(history.slice(0, 5)); // Show max 5 recent
  }, []);

  // Update rate limit status
  React.useEffect(() => {
    const key = user?.id ?? getDeviceId();
    const status = checkRateLimit(searchRateLimiter, key);
    setRateLimitStatus(status);
  }, [user]);

  const { mutate: searchOccupations, isPending: isLoading } = useMutation({
    mutationFn: async ({ term, filter }: { term: string; filter: string }) => {
      // Determine rate limit key (user or device)
      const rateKey = user?.id ?? getDeviceId();

      // Check rate limiting before proceeding
      const rateCheck = checkRateLimit(searchRateLimiter, rateKey);
      setRateLimitStatus(rateCheck);

      if (!rateCheck.allowed) {
        throw new Error(`Rate limit exceeded. Try again in ${formatTimeUntilReset(rateCheck.timeUntilReset)}`);
      }

      // Sanitize inputs
      const sanitizedTerm = sanitizeSearchInput(term);
      const sanitizedFilter = filter ? sanitizeOccupationCode(filter) : '';

      if (!sanitizedTerm) {
        throw new Error('Please enter a valid search term');
      }

      const cacheKey = sanitizedTerm + "_" + sanitizedFilter;
      if (cache[cacheKey]?.length) return cache[cacheKey];

      const fallbackResults = () => searchLocalOccupationRiskData(sanitizedTerm, Math.max(1, Math.min(100, maxResults)));

      const { data, error } = await supabase.functions.invoke('search-occupations', {
        body: {
          keyword: sanitizedTerm,
          limit: Math.max(1, Math.min(100, maxResults)),
        },
      });

      if (error) {
        const fallback = fallbackResults();
        if (fallback.length > 0) return fallback;
        throw new Error(error.message ?? 'Search function failed');
      }

      if (!data || typeof data !== 'object') {
        const fallback = fallbackResults();
        if (fallback.length > 0) return fallback;
        throw new Error('Unexpected response from search-occupations function');
      }

      const searchData = data as OccupationSearchResponse;
      const occupations = Array.isArray(searchData.occupations)
        ? searchData.occupations
        : [];

      let normalized = occupations.map((item) => ({
        code: item.occupation_code || item.code,
        title: item.occupation_title || item.title,
        description: item.description || item.summary || 'An occupation from the O*NET database.',
      })).filter((item): item is SearchResult => Boolean(item.code && item.title));

      if (sanitizedFilter) {
        normalized = normalized.filter((item) => item.code === sanitizedFilter);
      }

      normalized = normalized.slice(0, maxResults);
      if (normalized.length === 0) {
        normalized = fallbackResults();
      }

      cache[cacheKey] = normalized;
      return normalized;
    },
    onSuccess: (data) => {
      setResults(data);

      // Track search in history (temporarily disabled until migration applied)
      // TODO: Re-enable after running: supabase db push
      // addSearch({
      //   search_term: searchTerm,
      //   results_count: data.length
      // });

      // Local-first: persist last search and maintain a small local history
      try {
        const term = (searchTerm || '').trim();
        if (term) {
          // Used by other screens to prefill
          localStorage.setItem('planner:lastSearch', term);
          // Maintain recent terms (dedup, max 10)
          const history = getLocalJSON<string[]>('search:history', []) || [];
          const next = [term, ...history.filter(t => t !== term)].slice(0, 10);
          setLocalJSON('search:history', next);
        }
      } catch (storageError) {
        console.warn('Unable to persist local search history', storageError);
      }

      // Update rate limit status after successful search
      const rateKey = user?.id ?? getDeviceId();
      const status = checkRateLimit(searchRateLimiter, rateKey);
      setRateLimitStatus(status);

      trackAnalyticsEvent({
        event_name: 'search_success',
        event_category: 'engagement',
        event_data: { term: searchTerm, resultsCount: data.length }
      });
    },
    onError: (error: Error) => {
      console.error('Search failed:', error);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: error.message,
      });
      setResults([]);

      trackAnalyticsEvent({
        event_name: 'search_error',
        event_category: 'engagement',
        event_data: { message: error.message, term: searchTerm }
      });
    },
  });

  const handleOccupationClick = async (occupation: SearchResult) => {
    trackAnalyticsEvent({
      event_name: 'search_result_click',
      event_category: 'engagement',
      event_data: { code: occupation.code, title: occupation.title, isGuest }
    });
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in to analyze occupations',
      });
      navigate('/auth');
      return;
    }

    // Check if user has reached APO check limit
    const canProceed = await requestFeature('apoChecks');
    if (!canProceed) {
      // Upgrade prompt will be shown automatically by requestFeature
      return;
    }

    setIsCalculatingAPO(true);
    const start = performance.now();
    try {
      // Get the current session to include Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke('calculate-apo', {
        body: {
          occupation: {
            code: occupation.code,
            title: occupation.title,
          },
        },
        headers,
      });

      if (error) {
        throw new Error(error.message ?? 'APO calculation failed');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Unexpected response from calculate-apo function');
      }

      const latency = Math.round(performance.now() - start);
      trackAnalyticsEvent({
        event_name: 'apo_calculate_success',
        event_category: 'engagement',
        event_data: { code: occupation.code, title: occupation.title, latency }
      });
      trackAnalyticsEvent({
        event_name: 'activation_apo_result_viewed',
        event_category: 'activation',
        event_data: { code: occupation.code, latency }
      });
      onOccupationSelect(data as Record<string, unknown>);
      toast({
        title: 'APO Analysis Complete',
        description: `Automation potential calculated for ${occupation.title}`,
      });
    } catch (error) {
      console.error('APO calculation failed:', error);
      const latency = Math.round(performance.now() - start);
      trackAnalyticsEvent({
        event_name: 'apo_calculate_error',
        event_category: 'engagement',
        event_data: { code: occupation.code, title: occupation.title, latency, message: error instanceof Error ? error.message : 'unknown' }
      });
      toast({
        variant: 'destructive',
        title: 'APO Calculation Failed',
        description: error instanceof Error ? error.message : 'Failed to calculate automation potential',
      });
    } finally {
      setIsCalculatingAPO(false);
    }
  };

  const handleSearch = () => {
    if (!rateLimitStatus.allowed) {
      toast({
        variant: 'destructive',
        title: 'Rate Limit Exceeded',
        description: `Please wait ${formatTimeUntilReset(rateLimitStatus.timeUntilReset)} before searching again.`,
      });
      return;
    }

    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm) {
      setResults([]);
      trackAnalyticsEvent({
        event_name: 'search_submit',
        event_category: 'engagement',
        event_data: { term: trimmedTerm, filter: filter.trim(), isGuest, remaining: rateLimitStatus.remaining }
      });
      searchOccupations({ term: trimmedTerm, filter: filter.trim() });
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Search',
        description: 'Please enter a search term',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    setResults([]);
    searchOccupations({ term, filter: filter.trim() });
  };

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Basic real-time sanitization for display
    const sanitized = value.replace(/[<>]/g, '');
    setSearchTerm(sanitized);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only valid O*NET code characters
    const sanitized = value.replace(/[^0-9.-]/g, '');
    setFilter(sanitized);
  };

  // Show authentication prompt if not logged in
  if (loading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner size="md" text="Loading..." />
      </div>
    );
  }

  // Note: Guests can search (local-first). Auth is still required for APO calculation below.

  return (
    <ErrorBoundary>
      <div className="space-y-6" aria-labelledby="career-search-heading">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-slate-100" id="career-search-heading">
              Career Search
            </h2>
            <Link to="/help" className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] hover:underline transition-colors">Help</Link>
          </div>
          <p className="text-slate-400 text-sm">
            Search for occupations to analyze their automation potential using AI
          </p>
          {isGuest && (
            <div className="mt-2 text-xs text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-lg p-3">
              You are searching in guest mode with device-based limits. <button className="underline font-medium hover:text-[var(--accent-secondary)]" onClick={() => navigate('/auth')}>Sign in</button> for higher limits and cloud sync.
            </div>
          )}
        </div>

        {/* Rate Limit Display */}
        <RateLimitDisplay
          remaining={rateLimitStatus.remaining}
          total={20}
          resetTime={rateLimitStatus.resetTime}
          timeUntilReset={rateLimitStatus.timeUntilReset}
          label="Search Requests"
          variant="search"
        />

        {/* Recent Searches */}
        {recentSearches.length > 0 && !isLoading && results.length === 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-slate-400">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRecentSearchClick(term)}
                  className="px-3 py-1.5 text-sm bg-slate-800/60 hover:bg-[var(--accent-primary)]/20 text-slate-300 hover:text-white border border-slate-600/50 hover:border-[var(--accent-primary)]/50 rounded-lg transition-all duration-200"
                  aria-label={`Search again for ${term}`}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2" role="search" aria-label="Occupation Search Bar">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" aria-hidden="true" />
            <Input
              type="text"
              aria-label="Search Occupation"
              placeholder="Enter occupation, skill, or keyword"
              value={searchTerm}
              onChange={handleSearchTermChange}
              onKeyPress={handleKeyPress}
              className="pl-10"
              maxLength={500}
            />
          </div>
          <Button
            variant="outline"
            aria-label="Show Advanced Filters"
            onClick={() => setShowFilters((show) => !show)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !searchTerm.trim() || !rateLimitStatus.allowed}
            aria-label="Search"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center mt-2" role="region" aria-label="Advanced Filters">
            <div className="flex items-center gap-2">
              <label htmlFor="filter-code" className="text-sm font-medium text-[var(--text-secondary)]">
                Filter by Code
              </label>
              <Input
                id="filter-code"
                type="text"
                aria-label="Filter by Occupation Code (optional)"
                placeholder="E.g. 11-1011"
                className="max-w-[180px]"
                value={filter}
                onChange={handleFilterChange}
                maxLength={20}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="max-results" className="text-sm font-medium text-[var(--text-secondary)]">
                Max Results
              </label>
              <select
                id="max-results"
                aria-label="Maximum results"
                className="border border-[hsl(var(--border))] rounded px-2 py-1 text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value) || 10)}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <LoadingSpinner size="md" text="Searching occupations..." />
          </div>
        )}

        {results.length > 0 && !isLoading && (
          <div
            className="space-y-3"
            tabIndex={0}
            ref={resultsRef}
            aria-live="polite"
            aria-label={`Search results for "${searchTerm}"`}
          >
            <h3 className="font-medium text-slate-200">
              Search Results ({results.length})
            </h3>
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.code}
                  className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-[var(--accent-primary)]/50 hover:bg-slate-800/80 cursor-pointer transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:outline-none"
                  onClick={() => handleOccupationClick(result)}
                  role="button"
                  tabIndex={0}
                  aria-pressed="false"
                  aria-label={`Analyze automation for ${result.title}, code ${result.code}`}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOccupationClick(result);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-[var(--accent-primary)]/20 rounded-lg p-2 mt-1 group-hover:bg-[var(--accent-primary)]/30 transition-colors" aria-hidden="true">
                      <Briefcase className="h-4 w-4 text-[var(--accent-primary)]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-100 group-hover:text-white">{result.title}</h4>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{result.description}</p>
                      <p className="text-xs text-slate-500 mt-2 font-mono">
                        O*NET Code: {result.code}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCalculatingAPO && (
          <div className="text-center py-8" aria-live="assertive" aria-label="Calculating automation potential">
            <LoadingSpinner size="lg" text="Calculating automation potential with AI..." />
          </div>
        )}

        {searchTerm && results.length === 0 && !isLoading && (
          <div className="text-center py-8 text-slate-400" aria-live="polite">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-slate-600" aria-hidden="true" />
            <p className="text-slate-300">No results found for "{searchTerm}"</p>
            <p className="text-sm text-slate-500">Try different keywords or check spelling</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
