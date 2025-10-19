
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Copy, Mail, Link2, Clock, Eye, Calendar } from "lucide-react";
import { useShareAnalysis } from "@/hooks/useShareAnalysis";
import { toast } from "sonner";

interface ShareAnalysisModalProps {
  open: boolean;
  onClose: () => void;
  analysisId: string;
  occupationTitle: string;
}

export function ShareAnalysisModal({ open, onClose, analysisId, occupationTitle }: ShareAnalysisModalProps) {
  const [shareType, setShareType] = useState<'link' | 'email' | 'token'>('link');
  const [email, setEmail] = useState('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState('7');
  const [hasViewLimit, setHasViewLimit] = useState(false);
  const [maxViews, setMaxViews] = useState('10');
  const [sharedToken, setSharedToken] = useState<string | null>(null);
  
  const { shareAnalysis, isSharing } = useShareAnalysis();

  const handleShare = () => {
    const expiresAt = hasExpiration 
      ? new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    shareAnalysis({
      analysis_id: analysisId,
      share_type: shareType,
      shared_with_email: shareType === 'email' ? email : undefined,
      expires_at: expiresAt,
      max_views: hasViewLimit ? parseInt(maxViews) : undefined
    });
  };

  const generateShareUrl = (token: string) => {
    return `${window.location.origin}/shared/${token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleClose = () => {
    setSharedToken(null);
    setEmail('');
    setHasExpiration(false);
    setHasViewLimit(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Share Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Analysis</Label>
            <p className="text-sm text-gray-600 mt-1">{occupationTitle}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Share Method</Label>
            <Select value={shareType} onValueChange={(value: any) => setShareType(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Share Link
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Send via Email
                  </div>
                </SelectItem>
                <SelectItem value="token">
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Generate Token
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {shareType === 'email' && (
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="mt-1"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Set Expiration
              </Label>
              <Switch checked={hasExpiration} onCheckedChange={setHasExpiration} />
            </div>
            
            {hasExpiration && (
              <div>
                <Label className="text-sm">Expires in (days)</Label>
                <Input
                  type="number"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  min="1"
                  max="365"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Limit Views
              </Label>
              <Switch checked={hasViewLimit} onCheckedChange={setHasViewLimit} />
            </div>
            
            {hasViewLimit && (
              <div>
                <Label className="text-sm">Maximum Views</Label>
                <Input
                  type="number"
                  value={maxViews}
                  onChange={(e) => setMaxViews(e.target.value)}
                  min="1"
                  max="1000"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {sharedToken && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <Label className="text-sm font-medium text-green-800">Share URL</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={generateShareUrl(sharedToken)}
                  readOnly
                  className="text-xs bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generateShareUrl(sharedToken))}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleShare} 
              disabled={isSharing || (shareType === 'email' && !email)}
              className="flex-1"
            >
              {isSharing ? 'Sharing...' : 'Share Analysis'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
