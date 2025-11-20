import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Grid, 
  List, 
  Search, 
  ChevronRight,
  Briefcase,
  GraduationCap,
  Heart,
  Wrench,
  Building2,
  Laptop,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCareerClusters } from '@/hooks/useCareerClusters';
import { LoadingSpinner } from './LoadingSpinner';
import type { CareerCluster } from '@/types/onet-enrichment';

interface CareerClusterNavProps {
  onSelectCluster?: (clusterId: string, clusterName: string) => void;
  selectedClusterId?: string;
}

const clusterIcons: Record<string, any> = {
  'IT': Laptop,
  'HL': Heart,
  'ED': GraduationCap,
  'BF': Briefcase,
  'MF': Wrench,
  'GV': Building2,
};

export const CareerClusterNav: React.FC<CareerClusterNavProps> = ({
  onSelectCluster,
  selectedClusterId,
}) => {
  const { data, isLoading } = useCareerClusters();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <Card className="p-6">
        <LoadingSpinner text="Loading career clusters..." />
      </Card>
    );
  }

  const clusters = data?.clusters || [];
  const filteredClusters = clusters.filter(cluster =>
    cluster.cluster_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cluster.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="p-6 shadow-lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Career Clusters</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Explore {clusters.length} career pathways
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search career clusters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clusters Display */}
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {filteredClusters.map((cluster) => {
                const Icon = clusterIcons[cluster.cluster_id] || Briefcase;
                const isSelected = selectedClusterId === cluster.cluster_id;
                
                return (
                  <motion.div
                    key={cluster.cluster_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`
                        p-4 cursor-pointer transition-all h-full
                        ${isSelected 
                          ? 'bg-blue-50 border-blue-500 border-2 shadow-md' 
                          : 'hover:shadow-md border-gray-200'
                        }
                      `}
                      onClick={() => onSelectCluster?.(cluster.cluster_id, cluster.cluster_name)}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={`
                          p-3 rounded-full 
                          ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                        `}>
                          <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <h4 className="font-semibold text-sm line-clamp-2">
                          {cluster.cluster_name}
                        </h4>
                        <Badge variant="secondary" className="text-xs">
                          {cluster.occupationCount || 0} jobs
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {filteredClusters.map((cluster, index) => {
                const Icon = clusterIcons[cluster.cluster_id] || Briefcase;
                const isSelected = selectedClusterId === cluster.cluster_id;
                
                return (
                  <motion.div
                    key={cluster.cluster_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`
                        p-4 cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-blue-50 border-blue-500 border-2 shadow-md' 
                          : 'hover:shadow-md hover:border-gray-300'
                        }
                      `}
                      onClick={() => onSelectCluster?.(cluster.cluster_id, cluster.cluster_name)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`
                            p-2 rounded-lg shrink-0
                            ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}
                          `}>
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1">
                              {cluster.cluster_name}
                            </h4>
                            {cluster.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {cluster.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {cluster.occupationCount || 0}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results */}
        {filteredClusters.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No career clusters match your search</p>
          </div>
        )}
      </div>
    </Card>
  );
};
