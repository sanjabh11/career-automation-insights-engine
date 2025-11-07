import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import NavigationPremium from '@/components/NavigationPremium';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import {
  Search,
  Zap,
  FileText,
  Database,
  Mail,
  BarChart,
  Calendar,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { AgentDeployModal } from '@/components/marketplace/AgentDeployModal';
import { AgentDetailModal } from '@/components/marketplace/AgentDetailModal';

interface Agent {
  agent_code: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  tags: string[];
  input_types: string[];
  output_types: string[];
  avg_processing_time_seconds?: number;
  credits_per_execution: number;
  total_executions: number;
  avg_success_rate?: number;
  avg_user_rating?: number;
  status: string;
  version: string;
}

const iconMap: Record<string, any> = {
  FileText,
  Database,
  Mail,
  BarChart,
  Calendar,
  Zap,
};

const MarketplacePage = () => {
  const { user } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Fetch agents from catalog
  const { data: catalogData, isLoading, error } = useQuery({
    queryKey: ['agent-catalog', selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('agent-catalog', {
        body: {
          category: selectedCategory,
        },
      });

      if (error) throw error;
      return data as { agents: Agent[]; filters: any; total: number };
    },
  });

  const agents = catalogData?.agents || [];
  const categories = catalogData?.filters?.categories || [];

  // Filter by search query
  const filteredAgents = agents.filter((agent) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(query) ||
      agent.description.toLowerCase().includes(query) ||
      agent.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const handleDeploy = (agent: Agent) => {
    if (!user) {
      toast.error('Please sign in to deploy agents');
      return;
    }
    setSelectedAgent(agent);
    setDeployModalOpen(true);
  };

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <NavigationPremium />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Loading AI Agent Marketplace..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <NavigationPremium />
        <div className="container mx-auto px-4 py-20">
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Error Loading Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{(error as Error).message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <NavigationPremium />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-medium">5 AI Agents • Ready to Deploy</span>
            </div>

            <h1 className="text-5xl font-bold mb-6">
              AI Agent Marketplace
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
              Deploy pre-built AI agents to automate your most time-consuming tasks.
              Based on 19,000+ analyzed occupation tasks.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search agents by name, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-6 text-lg bg-white/90 backdrop-blur-sm border-0 shadow-lg"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-8">
          <Select
            value={selectedCategory || 'all'}
            onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: string) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-gray-600">
            Showing {filteredAgents.length} of {agents.length} agents
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => {
            const IconComponent = iconMap[agent.icon || 'Zap'] || Zap;

            return (
              <motion.div
                key={agent.agent_code}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-xl transition-shadow border-2 hover:border-blue-300">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary">{agent.category}</Badge>
                    </div>

                    <CardTitle className="text-xl mb-2">{agent.name}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {agent.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {agent.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.tags.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>{agent.credits_per_execution} credits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>~{agent.avg_processing_time_seconds}s</span>
                      </div>
                      {agent.avg_user_rating && agent.avg_user_rating > 0 && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{agent.avg_user_rating.toFixed(1)}/5</span>
                        </div>
                      )}
                      {agent.total_executions > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span>{agent.total_executions.toLocaleString()} uses</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleViewDetails(agent)}
                    >
                      View Details
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      onClick={() => handleDeploy(agent)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Deploy
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No agents found</CardTitle>
              <CardDescription>
                Try adjusting your search or filters to find what you're looking for.
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {selectedAgent && (
        <>
          <AgentDeployModal
            open={deployModalOpen}
            onOpenChange={setDeployModalOpen}
            agent={selectedAgent}
          />
          <AgentDetailModal
            open={detailModalOpen}
            onOpenChange={setDetailModalOpen}
            agent={selectedAgent}
          />
        </>
      )}
    </div>
  );
};

export default MarketplacePage;
