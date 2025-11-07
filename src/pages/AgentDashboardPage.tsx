import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import NavigationPremium from '@/components/NavigationPremium';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import {
  Zap,
  Play,
  Pause,
  Trash2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Activity,
  Plus,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { AgentExecuteModal } from '@/components/marketplace/AgentExecuteModal';
import { useNavigate } from 'react-router-dom';

interface Deployment {
  id: string;
  agent_code: string;
  deployment_name: string;
  configuration: any;
  status: string;
  deployed_at: string;
  last_executed_at?: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  total_credits_used: number;
  agentInfo?: {
    name: string;
    description: string;
    category: string;
    icon: string;
  };
}

const AgentDashboardPage = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);

  // Fetch user's deployments
  const { data: deployments, isLoading } = useQuery({
    queryKey: ['agent-deployments'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('agent-deploy', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data.deployments as Deployment[];
    },
    enabled: !!user,
  });

  // Pause/Resume deployment mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ deploymentId, status }: { deploymentId: string; status: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('agent-deploy', {
        method: 'PATCH',
        body: {
          deploymentId,
          status: status === 'active' ? 'paused' : 'active',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-deployments'] });
      toast.success('Deployment status updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update status', { description: error.message });
    },
  });

  // Delete deployment mutation
  const deleteMutation = useMutation({
    mutationFn: async (deploymentId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('agent-deploy', {
        method: 'DELETE',
        body: { deploymentId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-deployments'] });
      toast.success('Deployment deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete deployment', { description: error.message });
    },
  });

  const handleExecute = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setExecuteModalOpen(true);
  };

  const handleToggleStatus = (deployment: Deployment) => {
    toggleStatusMutation.mutate({
      deploymentId: deployment.id,
      status: deployment.status,
    });
  };

  const handleDelete = (deployment: Deployment) => {
    if (confirm(`Are you sure you want to delete "${deployment.deployment_name}"?`)) {
      deleteMutation.mutate(deployment.id);
    }
  };

  const activeDeployments = deployments?.filter((d) => d.status === 'active') || [];
  const pausedDeployments = deployments?.filter((d) => d.status === 'paused') || [];

  // Calculate total stats
  const totalExecutions = deployments?.reduce((sum, d) => sum + d.total_executions, 0) || 0;
  const totalCreditsUsed = deployments?.reduce((sum, d) => sum + d.total_credits_used, 0) || 0;
  const totalSuccessful = deployments?.reduce((sum, d) => sum + d.successful_executions, 0) || 0;
  const successRate = totalExecutions > 0 ? ((totalSuccessful / totalExecutions) * 100).toFixed(1) : '0';

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <NavigationPremium />
        <div className="container mx-auto px-4 py-20 text-center">
          <Card>
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to view your agent deployments</CardDescription>
            </CardHeader>
            <CardFooter className="justify-center">
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <NavigationPremium />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="Loading your deployments..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <NavigationPremium />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Agent Dashboard</h1>
          <p className="text-gray-600">Manage and execute your deployed AI agents</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{activeDeployments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{totalExecutions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{successRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Credits Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{totalCreditsUsed.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {(!deployments || deployments.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <CardTitle className="mb-2">No Agents Deployed</CardTitle>
              <CardDescription className="mb-4">
                Deploy your first AI agent to start automating tasks
              </CardDescription>
              <Button onClick={() => navigate('/marketplace')}>
                <Plus className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Deployments Tabs */}
        {deployments && deployments.length > 0 && (
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Active ({activeDeployments.length})
              </TabsTrigger>
              <TabsTrigger value="paused">
                Paused ({pausedDeployments.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeDeployments.map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onExecute={handleExecute}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paused" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pausedDeployments.map((deployment) => (
                  <DeploymentCard
                    key={deployment.id}
                    deployment={deployment}
                    onExecute={handleExecute}
                    onToggleStatus={handleToggleStatus}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Execute Modal */}
      {selectedDeployment && (
        <AgentExecuteModal
          open={executeModalOpen}
          onOpenChange={setExecuteModalOpen}
          deployment={selectedDeployment}
        />
      )}
    </div>
  );
};

// Deployment Card Component
function DeploymentCard({
  deployment,
  onExecute,
  onToggleStatus,
  onDelete,
}: {
  deployment: Deployment;
  onExecute: (d: Deployment) => void;
  onToggleStatus: (d: Deployment) => void;
  onDelete: (d: Deployment) => void;
}) {
  const successRate =
    deployment.total_executions > 0
      ? ((deployment.successful_executions / deployment.total_executions) * 100).toFixed(1)
      : '0';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <Badge>{deployment.agentInfo?.category || 'Agent'}</Badge>
            <Badge
              variant={deployment.status === 'active' ? 'default' : 'secondary'}
              className={deployment.status === 'active' ? 'bg-green-600' : ''}
            >
              {deployment.status}
            </Badge>
          </div>
          <CardTitle className="text-xl">{deployment.deployment_name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {deployment.agentInfo?.description || deployment.agent_code}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span>{deployment.total_executions} runs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{successRate}% success</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              <span>{deployment.total_credits_used} credits</span>
            </div>
            {deployment.last_executed_at && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>
                  {new Date(deployment.last_executed_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onExecute(deployment)}
            disabled={deployment.status !== 'active'}
          >
            <Play className="h-4 w-4 mr-1" />
            Execute
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleStatus(deployment)}
          >
            {deployment.status === 'active' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(deployment)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default AgentDashboardPage;
