
import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Briefcase, Filter } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeSearchInput, sanitizeOccupationCode } from '@/utils/inputSanitization';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';
import { useSearchHistory } from '@/hooks/useSearchHistory';

interface SearchInterfaceProps {
  onOccupationSelect: (occupation: any) => void;
}

const cache: Record<string, any[]> = {};

export const SearchInterface = ({ onOccupationSelect }: SearchInterfaceProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isCalculatingAPO, setIsCalculatingAPO] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { addSearch } = useSearchHistory();

  React.useEffect(() => {
    if (results.length && resultsRef.current) {
      resultsRef.current.focus();
    }
  }, [results.length]);

  const { mutate: searchOccupations, isPending: isLoading } = useMutation({
    mutationFn: async ({ term, filter }: { term: string; filter: string }) => {
      // Sanitize inputs
      const sanitizedTerm = sanitizeSearchInput(term);
      const sanitizedFilter = filter ? sanitizeOccupationCode(filter) : '';
      
      if (!sanitizedTerm) {
        throw new Error('Please enter a valid search term');
      }

      const cacheKey = sanitizedTerm + "_" + sanitizedFilter;
      if (cache[cacheKey]) return cache[cacheKey];
      
      const onetQuery = sanitizedFilter
        ? `search?keyword=${encodeURIComponent(sanitizedTerm)}&end=10&code=${encodeURIComponent(sanitizedFilter)}`
        : `search?keyword=${encodeURIComponent(sanitizedTerm)}&end=10`;
        
      const { data, error } = await supabase.functions.invoke('onet-proxy', {
        body: { onetPath: onetQuery },
      });
      
      if (error) throw new Error(`Search failed: ${error.message}`);
      if (data.error) throw new Error(`API Error: ${data.error}`);

      let occs: any[] = [];
      if (data.occupation) {
        occs = Array.isArray(data.occupation) ? data.occupation : [data.occupation];
      } else if (data.code && data.title) {
        occs = [data];
      }
      
      cache[cacheKey] = occs;
      return occs;
    },
    onSuccess: (data) => {
      const processedResults = data.map((item: any) => ({
        code: item.code,
        title: item.title,
        description: item.description || `An occupation from the O*NET database.`,
      }));
      
      setResults(processedResults);
      
      // Track search in history
      addSearch({
        search_term: searchTerm,
        results_count: processedResults.length
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
    },
  });

  const handleOccupationClick = async (occupation: any) => {
    setIsCalculatingAPO(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-apo', {
        body: { occupation },
      });
      
      if (error) throw new Error(`APO calculation failed: ${error.message}`);
      if (data.error) throw new Error(`APO calculation error: ${data.error}`);
      
      onOccupationSelect(data);
      toast({
        title: 'APO Analysis Complete',
        description: `Automation potential calculated for ${occupation.title}`,
      });
    } catch (error) {
      console.error('APO calculation failed:', error);
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
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm) {
      setResults([]);
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

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Basic real-time sanitization for display
    const sanitized = value.replace(/[<>]/g, '');
    setSearchTerm(sanitized);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only valid O*NET code characters
    const sanitized = value.replace(/[^0-9\-\.]/g, '');
    setFilter(sanitized);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6" aria-labelledby="career-search-heading">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2" id="career-search-heading">
            Career Search
          </h2>
          <p className="text-gray-600 text-sm">
            Search for occupations to analyze their automation potential using AI
          </p>
        </div>
        
        <div className="flex space-x-2" role="search" aria-label="Occupation Search Bar">
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
            disabled={isLoading || !searchTerm.trim()} 
            aria-label="Search"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        
        {showFilters && (
          <div className="flex gap-3 items-center mt-2" role="region" aria-label="Advanced Filters">
            <label htmlFor="filter-code" className="text-sm font-medium text-gray-800">
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
        )}
        
        {isLoading && (
          <div className="text-center py-8">
            <LoadingSpinner size="md" text="Searching occupations..." />
          </div>
        )}
        
        {results.length > 0 && !isLoading && (
          <div
            className="space-y-2"
            tabIndex={0}
            ref={resultsRef}
            aria-live="polite"
            aria-label={`Search results for "${searchTerm}"`}
          >
            <h3 className="font-medium text-gray-900">
              Search Results ({results.length})
            </h3>
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.code}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                  onClick={() => handleOccupationClick(result)}
                  role="button"
                  tabIndex={0}
                  aria-pressed="false"
                  aria-label={`Analyze automation for ${result.title}, code ${result.code}`}
                  onKeyPress={e => {
                    if (e.key === "Enter" || e.key === " ") handleOccupationClick(result);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-lg p-2 mt-1" aria-hidden="true">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{result.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{result.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
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
          <div className="text-center py-8 text-gray-500" aria-live="polite">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
            <p>No results found for "{searchTerm}"</p>
            <p className="text-sm">Try different keywords or check spelling</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};
