import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Play, Zap, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface Deployment {
  id: string;
  agent_code: string;
  deployment_name: string;
}

interface AgentExecuteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deployment: Deployment;
}

export function AgentExecuteModal({ open, onOpenChange, deployment }: AgentExecuteModalProps) {
  const [executing, setExecuting] = useState(false);
  const [inputData, setInputData] = useState<any>({});
  const [result, setResult] = useState<any>(null);
  const queryClient = useQueryClient();

  // Agent-specific input fields
  const getInputFields = () => {
    switch (deployment.agent_code) {
      case 'doc-analyzer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="documentText">Document Text</Label>
              <Textarea
                id="documentText"
                rows={8}
                placeholder="Paste your document text here..."
                value={inputData.documentText || ''}
                onChange={(e) => setInputData({ ...inputData, documentText: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the document content you want to analyze
              </p>
            </div>
          </div>
        );

      case 'data-entry-agent':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="sourceText">Source Text</Label>
              <Textarea
                id="sourceText"
                rows={6}
                placeholder="Enter the text containing data to extract..."
                value={inputData.sourceText || ''}
                onChange={(e) => setInputData({ ...inputData, sourceText: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="targetSchema">Target Schema (Optional)</Label>
              <Input
                id="targetSchema"
                placeholder='e.g., {"name": "", "email": "", "phone": ""}'
                value={inputData.targetSchema || ''}
                onChange={(e) => setInputData({ ...inputData, targetSchema: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Specify the structure of data you want extracted (JSON format)
              </p>
            </div>
          </div>
        );

      case 'email-responder':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="emailContent">Email Content</Label>
              <Textarea
                id="emailContent"
                rows={6}
                placeholder="Paste the email you want to respond to..."
                value={inputData.emailContent || ''}
                onChange={(e) => setInputData({ ...inputData, emailContent: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responseType">Response Type</Label>
                <select
                  id="responseType"
                  value={inputData.responseType || 'reply'}
                  onChange={(e) => setInputData({ ...inputData, responseType: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="reply">Reply</option>
                  <option value="forward">Forward</option>
                  <option value="acknowledge">Acknowledge</option>
                </select>
              </div>
              <div>
                <Label htmlFor="tone">Tone</Label>
                <select
                  id="tone"
                  value={inputData.tone || 'professional'}
                  onChange={(e) => setInputData({ ...inputData, tone: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'report-generator':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="data">Data (JSON)</Label>
              <Textarea
                id="data"
                rows={8}
                placeholder='{"metric1": 100, "metric2": 200, ...}'
                value={inputData.data || ''}
                onChange={(e) => setInputData({ ...inputData, data: e.target.value })}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your data in JSON format
              </p>
            </div>
            <div>
              <Label htmlFor="reportTitle">Report Title (Optional)</Label>
              <Input
                id="reportTitle"
                placeholder="e.g., Q4 Performance Report"
                value={inputData.title || ''}
                onChange={(e) => setInputData({ ...inputData, title: e.target.value })}
              />
            </div>
          </div>
        );

      case 'calendar-scheduler':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="meetingRequest">Meeting Request</Label>
              <Textarea
                id="meetingRequest"
                rows={4}
                placeholder="Describe the meeting you want to schedule..."
                value={inputData.meetingRequest || ''}
                onChange={(e) => setInputData({ ...inputData, meetingRequest: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="participants">Participants (comma-separated)</Label>
              <Input
                id="participants"
                placeholder="john@example.com, jane@example.com"
                value={inputData.participants || ''}
                onChange={(e) => setInputData({ ...inputData, participants: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                value={inputData.duration || 60}
                onChange={(e) => setInputData({ ...inputData, duration: parseInt(e.target.value) })}
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label htmlFor="genericInput">Input Data</Label>
            <Textarea
              id="genericInput"
              rows={6}
              placeholder="Enter your input data..."
              value={inputData.input || ''}
              onChange={(e) => setInputData({ ...inputData, input: e.target.value })}
            />
          </div>
        );
    }
  };

  const handleExecute = async () => {
    // Validate input
    const requiredField = Object.keys(inputData)[0];
    if (!inputData[requiredField] || inputData[requiredField].trim() === '') {
      toast.error('Please provide input data');
      return;
    }

    setExecuting(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to execute agents');
        return;
      }

      // Parse data if it's JSON string (for report-generator)
      let processedInput = { ...inputData };
      if (deployment.agent_code === 'report-generator' && inputData.data) {
        try {
          processedInput.data = JSON.parse(inputData.data);
        } catch {
          toast.error('Invalid JSON format for data field');
          setExecuting(false);
          return;
        }
      }

      // Parse participants for calendar-scheduler
      if (deployment.agent_code === 'calendar-scheduler' && inputData.participants) {
        processedInput.participants = inputData.participants.split(',').map((p: string) => p.trim());
      }

      const { data, error } = await supabase.functions.invoke('agent-execute', {
        body: {
          deploymentId: deployment.id,
          agentCode: deployment.agent_code,
          inputData: processedInput,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setResult(data);

      toast.success('Agent executed successfully!', {
        description: `Processing time: ${data.processingTimeMs}ms`,
      });

      // Refresh deployments to update stats
      queryClient.invalidateQueries({ queryKey: ['agent-deployments'] });
    } catch (error: any) {
      console.error('Execute error:', error);
      toast.error('Failed to execute agent', {
        description: error.message,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleClose = () => {
    setInputData({});
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Execute: {deployment.deployment_name}
          </DialogTitle>
          <DialogDescription>
            Configure input and execute this AI agent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Fields */}
          {!result && (
            <div>
              <h3 className="font-semibold mb-4">Input Configuration</h3>
              {getInputFields()}
            </div>
          )}

          {/* Result */}
          {result && (
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">Execution Successful</h3>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>{result.processingTimeMs}ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-600" />
                    <span>{result.creditsCharged} credits</span>
                  </div>
                </div>

                {/* Result Data */}
                <div className="bg-white rounded-lg p-4 border">
                  <h4 className="font-medium mb-2">Result:</h4>
                  <pre className="text-sm overflow-auto max-h-96 bg-gray-50 p-3 rounded">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={executing}>
                Cancel
              </Button>
              <Button
                onClick={handleExecute}
                disabled={executing}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {executing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute Agent
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
