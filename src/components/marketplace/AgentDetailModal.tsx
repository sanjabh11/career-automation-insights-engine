import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Clock, Star, TrendingUp, FileInput, FileOutput, Code } from 'lucide-react';

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

interface AgentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function AgentDetailModal({ open, onOpenChange, agent }: AgentDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">{agent.name}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge>{agent.category}</Badge>
                <Badge variant="outline">v{agent.version}</Badge>
                {agent.status === 'beta' && <Badge variant="secondary">Beta</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{agent.description}</p>
          </div>

          <Separator />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-800 font-medium">Cost</span>
              </div>
              <p className="text-lg font-bold text-green-900">{agent.credits_per_execution}</p>
              <p className="text-xs text-green-700">credits/use</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-800 font-medium">Speed</span>
              </div>
              <p className="text-lg font-bold text-blue-900">~{agent.avg_processing_time_seconds}s</p>
              <p className="text-xs text-blue-700">avg time</p>
            </div>

            {agent.avg_user_rating && agent.avg_user_rating > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs text-yellow-800 font-medium">Rating</span>
                </div>
                <p className="text-lg font-bold text-yellow-900">{agent.avg_user_rating.toFixed(1)}</p>
                <p className="text-xs text-yellow-700">out of 5</p>
              </div>
            )}

            {agent.total_executions > 0 && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-purple-800 font-medium">Usage</span>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {agent.total_executions.toLocaleString()}
                </p>
                <p className="text-xs text-purple-700">executions</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Technical Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Input Types */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileInput className="h-4 w-4 text-blue-600" />
                Input Types
              </h3>
              <div className="flex flex-wrap gap-2">
                {agent.input_types.map((type) => (
                  <Badge key={type} variant="outline" className="font-mono text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Output Types */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileOutput className="h-4 w-4 text-green-600" />
                Output Types
              </h3>
              <div className="flex flex-wrap gap-2">
                {agent.output_types.map((type) => (
                  <Badge key={type} variant="outline" className="font-mono text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Use Cases (Tags) */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Code className="h-4 w-4 text-purple-600" />
              Use Cases & Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {agent.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs capitalize">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {agent.avg_success_rate && agent.avg_success_rate > 0 && (
            <>
              <Separator />
              <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border">
                <h3 className="font-semibold mb-2 text-green-900">Performance</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 mb-1">Success Rate</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${agent.avg_success_rate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {agent.avg_success_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
