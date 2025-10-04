import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X, 
  Star, 
  Sparkles,
  GraduationCap,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import type { SearchFilters } from '@/types/onet-enrichment';
import { BrightOutlookBadge } from './BrightOutlookBadge';
import { formatWage, getJobZoneName } from '@/types/onet-enrichment';

export const AdvancedSearchPanel: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  
  const { search, results, total, hasMore, loadMore, isSearching, reset } = useAdvancedSearch();

  const handleSearch = () => {
    search(keyword, filters);
  };

  const handleReset = () => {
    setKeyword('');
    setFilters({});
    reset();
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== null).length;

  return (
    <div className="space-y-4">
      <Card className="p-6 shadow-lg">
        {/* Search Bar */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search occupations by keyword..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            {(keyword || activeFilterCount > 0) && (
              <Button variant="ghost" onClick={handleReset}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Bright Outlook Filter */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Label htmlFor="bright-outlook" className="flex items-center gap-2 cursor-pointer">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span>Bright Outlook</span>
                      </Label>
                      <Switch
                        id="bright-outlook"
                        checked={filters.brightOutlook || false}
                        onCheckedChange={(checked) => updateFilter('brightOutlook', checked)}
                      />
                    </div>

                    {/* STEM Filter */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Label htmlFor="stem" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>STEM Occupations</span>
                      </Label>
                      <Switch
                        id="stem"
                        checked={filters.stem || false}
                        onCheckedChange={(checked) => updateFilter('stem', checked)}
                      />
                    </div>

                    {/* Green Filter */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Label htmlFor="green" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        <span>Green Economy</span>
                      </Label>
                      <Switch
                        id="green"
                        checked={filters.green || false}
                        onCheckedChange={(checked) => updateFilter('green', checked)}
                      />
                    </div>

                    {/* Job Zone Filter */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                        Education Level
                      </Label>
                      <Select
                        value={filters.jobZone?.toString() || ''}
                        onValueChange={(value) => updateFilter('jobZone', value ? parseInt(value) : undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any level</SelectItem>
                          {[1, 2, 3, 4, 5].map((zone) => (
                            <SelectItem key={zone} value={zone.toString()}>
                              Zone {zone}: {getJobZoneName(zone)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Min Wage Filter */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Min Salary
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g., 50000"
                        value={filters.minWage || ''}
                        onChange={(e) => updateFilter('minWage', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>

                    {/* Max Wage Filter */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Max Salary
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g., 150000"
                        value={filters.maxWage || ''}
                        onChange={(e) => updateFilter('maxWage', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                Search Results
                <span className="text-muted-foreground font-normal ml-2">
                  ({total} found)
                </span>
              </h3>
            </div>

            <div className="space-y-3">
              {results.map((occupation, index) => (
                <motion.div
                  key={occupation.occupation_code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {occupation.occupation_title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {occupation.occupation_code}
                          </p>
                        </div>
                        {occupation.bright_outlook && (
                          <BrightOutlookBadge
                            hasBrightOutlook={true}
                            category={occupation.bright_outlook_category}
                            size="sm"
                          />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {occupation.is_stem && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            STEM
                          </Badge>
                        )}
                        {occupation.job_zone && (
                          <Badge variant="outline" className="text-xs">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Zone {occupation.job_zone}
                          </Badge>
                        )}
                        {occupation.median_wage_annual && (
                          <Badge variant="outline" className="text-xs text-green-700">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatWage(occupation.median_wage_annual)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <Button 
                onClick={loadMore} 
                disabled={isSearching}
                variant="outline"
                className="w-full"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More Results
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
