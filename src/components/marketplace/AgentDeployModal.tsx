import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Agent {
  agent_code: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  tags: string[];
  credits_per_execution: number;
  avg_processing_time_seconds?: number;
}

interface AgentDeployModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function AgentDeployModal({ open, onOpenChange, agent }: AgentDeployModalProps) {
  const [deploymentName, setDeploymentName] = useState(agent.name);
  const [deploying, setDeploying] = useState(false);
  const queryClient = useQueryClient();

  const handleDeploy = async () => {
    if (!deploymentName.trim()) {
      toast.error('Please enter a deployment name');
      return;
    }

    setDeploying(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Please sign in to deploy agents');
        return;
      }

      const { data, error } = await supabase.functions.invoke('agent-deploy', {
        body: {
          agentCode: agent.agent_code,
          deploymentName: deploymentName.trim(),
          configuration: {},
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success(`${agent.name} deployed successfully!`, {
        description: `You can now use this agent to automate tasks.`,
      });

      // Invalidate queries to refresh deployments
      queryClient.invalidateQueries({ queryKey: ['agent-deployments'] });

      onOpenChange(false);
      setDeploymentName(agent.name); // Reset for next time
    } catch (error: any) {
      console.error('Deploy error:', error);
      toast.error('Failed to deploy agent', {
        description: error.message,
      });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Deploy {agent.name}
          </DialogTitle>
          <DialogDescription>
            Configure and deploy this AI agent to your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agent Info */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
            <p className="text-sm text-gray-700 mb-3">{agent.description}</p>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">{agent.credits_per_execution} credits per use</span>
              </div>
              {agent.avg_processing_time_seconds && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>~{agent.avg_processing_time_seconds} seconds</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {agent.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Deployment Name */}
          <div className="space-y-2">
            <Label htmlFor="deployment-name">Deployment Name</Label>
            <Input
              id="deployment-name"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value)}
              placeholder="e.g., HR Document Analyzer"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Give this deployment a descriptive name for easy identification
            </p>
          </div>

          {/* What Happens Next */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              What happens next:
            </h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li>Agent will be added to your dashboard</li>
              <li>You can execute it immediately</li>
              <li>Usage will be tracked automatically</li>
              <li>Credits will be deducted per execution</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deploying}>
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={deploying || !deploymentName.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {deploying ? (
              <>
                <span className="animate-spin mr-2">⚡</span>
                Deploying...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Deploy Agent
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
