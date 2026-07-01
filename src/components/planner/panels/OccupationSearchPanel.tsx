import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Briefcase, Lightbulb, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { occupationDefaults } from '@/content/templates/occupationDefaults';
import { containerVariants, itemVariants, InfoIcon } from '@/components/planner/ui';
import type { Occupation } from '@/components/planner/types';

export interface OccupationSearchPanelProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  occupations: Occupation[];
  setSelectedOccupation: (o: Occupation) => void;
  isSearching: boolean;
  searchOccupations: (q: string) => void;
  customJobTitle: string;
  setCustomJobTitle: (v: string) => void;
  similarOccupations: Occupation[];
  isSearchingCustomJob: boolean;
  findSimilarOccupations: (title: string) => void;
}

export function OccupationSearchPanel({
  searchQuery,
  setSearchQuery,
  occupations,
  setSelectedOccupation,
  isSearching,
  searchOccupations,
  customJobTitle,
  setCustomJobTitle,
  similarOccupations,
  isSearchingCustomJob,
  findSimilarOccupations,
}: OccupationSearchPanelProps) {
  return (
    <motion.div
      className="max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-[var(--accent-primary)]" />
              Select Your Occupation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for your occupation (e.g., Software Developer, Nurse)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchOccupations(searchQuery)}
                />
                <Button
                  onClick={() => searchOccupations(searchQuery)}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>

              {isSearching ? (
                <div className="py-8 text-center">
                  <LoadingSpinner size="md" text="Searching occupations..." />
                </div>
              ) : occupations.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    {occupations.map((occ) => (
                      <div
                        key={occ.code}
                        className="p-3 border-b last:border-b-0 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                        onClick={() => setSelectedOccupation(occ)}
                      >
                        <div className="font-medium">{occ.title}</div>
                        <div className="text-sm text-[var(--text-tertiary)]">Code: {occ.code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : searchQuery ? (
                <div className="text-center py-4 text-[var(--text-tertiary)]">
                  No occupations found. Try a different search term.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[var(--accent-primary)]" />
              Can't Find Your Occupation?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-[var(--text-secondary)]">
                Enter your job title below and we'll find the closest matching occupation.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your job title (e.g., Growth Hacker, DevOps Engineer)"
                  value={customJobTitle}
                  onChange={(e) => setCustomJobTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && findSimilarOccupations(customJobTitle)}
                />
                <Button
                  onClick={() => findSimilarOccupations(customJobTitle)}
                  disabled={isSearchingCustomJob || !customJobTitle.trim()}
                >
                  {isSearchingCustomJob ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Find Matches'
                  )}
                </Button>
              </div>

              {isSearchingCustomJob ? (
                <div className="py-4 text-center">
                  <LoadingSpinner size="sm" text="Finding similar occupations..." />
                </div>
              ) : similarOccupations.length > 0 ? (
                <div>
                  <h4 className="text-sm font-medium mb-2">Similar Occupations:</h4>
                  <div className="border rounded-md overflow-hidden">
                    {similarOccupations.map((occ) => (
                      <div
                        key={occ.code}
                        className="p-3 border-b last:border-b-0 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors"
                        onClick={() => setSelectedOccupation(occ)}
                      >
                        <div className="font-medium">{occ.title}</div>
                        <div className="text-sm text-[var(--text-tertiary)]">Code: {occ.code}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Start Templates */}
      <motion.div variants={itemVariants}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Quick Start Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Start faster by picking a popular role:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(occupationDefaults).slice(0, 5).map((tpl) => (
                <Button key={tpl.code} variant="outline" className="justify-between" onClick={() => setSelectedOccupation({ code: tpl.code, title: tpl.title, description: 'Quick start template' })}>
                  <span className="font-medium">{tpl.title}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">{tpl.code}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              How This Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-[var(--text-secondary)]">
              <li>Search and select your occupation</li>
              <li>View tasks categorized by automation potential</li>
              <li>Add your own tasks to assess their AI impact</li>
              <li>Explore skill recommendations for career resilience planning</li>
              <li>Find resources to develop those skills</li>
            </ol>
            <div className="mt-4 p-3 bg-[var(--accent-primary)]/10 rounded-md text-sm text-[var(--accent-primary)]">
              <p className="flex items-start gap-2">
                <InfoIcon className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0 mt-0.5" />
                <span>
                  Based on research from "Future of Work with AI Agents: Auditing Automation and Augmentation Potential across the All Workforce"
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
