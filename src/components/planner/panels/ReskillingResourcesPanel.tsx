import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { Resource, Skill } from '@/components/planner/types';

export interface ReskillingResourcesPanelProps {
  resources: Resource[];
  skillRecommendations: Skill[];
}

export function ReskillingResourcesPanel({ resources, skillRecommendations }: ReskillingResourcesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-600" />
          Reskilling Resources
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-[var(--text-secondary)]">
            Explore these resources to develop the recommended skills and prepare for
            the changing nature of work in your field.
          </p>
        </div>

        {resources.length > 0 ? (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-[var(--accent-primary)]">{resource.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Provider: {resource.provider}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{resource.skillArea}</Badge>
                    {resource.costType && (
                      <Badge className={
                        resource.costType === 'Free' ? 'bg-green-100 text-green-800' :
                          resource.costType === 'Freemium' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
                            'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                      }>
                        {resource.costType}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--accent-primary)] hover:underline"
                  >
                    View Resource →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : skillRecommendations.length > 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Resources Found</h3>
            <p className="text-[var(--text-secondary)] mb-4">
              We couldn't find specific learning resources for this occupation yet.
              Try exploring these general learning platforms:
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto">
              <a href="https://www.coursera.org" target="_blank" rel="noopener noreferrer"
                className="block p-3 border rounded hover:bg-[var(--bg-hover)] text-[var(--accent-primary)] hover:underline">
                Coursera - Online courses from universities and companies
              </a>
              <a href="https://www.linkedin.com/learning" target="_blank" rel="noopener noreferrer"
                className="block p-3 border rounded hover:bg-[var(--bg-hover)] text-[var(--accent-primary)] hover:underline">
                LinkedIn Learning - Professional skill development
              </a>
              <a href="https://www.edx.org" target="_blank" rel="noopener noreferrer"
                className="block p-3 border rounded hover:bg-[var(--bg-hover)] text-[var(--accent-primary)] hover:underline">
                edX - University-level courses and programs
              </a>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            <LoadingSpinner size="sm" />
            <p className="mt-2">Loading resources...</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            Learning Plan
          </h4>
          <p className="text-sm text-yellow-700">
            Consider dedicating 3-5 hours per week to skill development.
            Start with one course or resource, complete it, then move to the next.
            Consistent learning over time will help you adapt to AI-driven changes in your field.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
