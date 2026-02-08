import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRelatedOccupations } from '@/hooks/useOnetEnrichment';
import { LoadingSpinner } from './LoadingSpinner';

interface RelatedOccupationsPanelProps {
  occupationCode: string;
  onSelectOccupation?: (code: string, title: string) => void;
  maxResults?: number;
}

export const RelatedOccupationsPanel: React.FC<RelatedOccupationsPanelProps> = ({
  occupationCode,
  onSelectOccupation,
  maxResults = 5,
}) => {
  const { relatedOccupations, isLoading } = useRelatedOccupations(occupationCode);

  if (isLoading) {
    return (
      <Card className="p-6">
        <LoadingSpinner text="Loading related occupations..." />
      </Card>
    );
  }

  if (!relatedOccupations || relatedOccupations.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No related occupations found</p>
      </Card>
    );
  }

  const displayedOccupations = relatedOccupations.slice(0, maxResults);

  return (
    <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Similar Careers
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Explore related career paths
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {relatedOccupations.length} found
          </Badge>
        </div>

        {/* Related Occupations List */}
        <div className="space-y-3">
          {displayedOccupations.map((related, index) => (
            <motion.div
              key={related.code}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="p-4 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-purple-400 bg-gradient-to-r from-white to-purple-50/30"
                onClick={() => onSelectOccupation?.(related.code, related.title)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                      {related.title}
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-muted-foreground">Similarity</span>
                      <Progress 
                        value={(related.similarity_score || 0) * 100} 
                        className="h-2 flex-1"
                      />
                      <span className="text-xs font-semibold text-purple-600">
                        {((related.similarity_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {related.code}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOccupation?.(related.code, related.title);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        {relatedOccupations.length > maxResults && (
          <Button variant="outline" className="w-full" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            View All {relatedOccupations.length} Related Occupations
          </Button>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-muted-foreground text-center">
            Similarity based on O*NET occupation characteristics
          </p>
        </div>
      </div>
    </Card>
  );
};
