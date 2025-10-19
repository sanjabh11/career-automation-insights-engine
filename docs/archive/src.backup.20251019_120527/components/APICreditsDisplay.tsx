
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Zap } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

export function APICreditsDisplay() {
  const { profile, isLoading } = useUserProfile();

  if (isLoading || !profile) {
    return null;
  }

  const credits = profile.api_credits || 0;
  const maxCredits = profile.subscription_tier === 'premium' ? 1000 : 100;
  const percentage = Math.min((credits / maxCredits) * 100, 100);
  
  const getStatusColor = () => {
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (percentage <= 20) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
    return <Zap className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">API Credits</span>
          <span className={`text-sm font-bold ${getStatusColor()}`}>
            {credits}/{maxCredits}
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
      <Badge 
        variant={profile.subscription_tier === 'premium' ? 'default' : 'secondary'}
        className="text-xs"
      >
        {profile.subscription_tier || 'free'}
      </Badge>
    </div>
  );
}
