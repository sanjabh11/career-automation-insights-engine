
import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatTimeUntilReset } from '@/utils/rateLimiting';

interface RateLimitDisplayProps {
  remaining: number;
  total: number;
  resetTime: number;
  timeUntilReset: number;
  label: string;
  variant?: 'search' | 'analysis' | 'export';
}

export function RateLimitDisplay({ 
  remaining, 
  total, 
  resetTime, 
  timeUntilReset, 
  label,
  variant = 'search' 
}: RateLimitDisplayProps) {
  const [displayTime, setDisplayTime] = useState(timeUntilReset);

  useEffect(() => {
    if (timeUntilReset <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, resetTime - now);
      setDisplayTime(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [resetTime, timeUntilReset]);

  const percentage = (remaining / total) * 100;
  const isLimited = remaining === 0;
  const isLow = percentage < 20;

  const getVariantColor = () => {
    switch (variant) {
      case 'analysis': return 'text-purple-600';
      case 'export': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  const getProgressColor = () => {
    if (isLimited) return 'bg-red-500';
    if (isLow) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
      {isLimited ? (
        <AlertTriangle className="w-4 h-4 text-red-600" />
      ) : (
        <Clock className={`w-4 h-4 ${getVariantColor()}`} />
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          <span className={`text-sm font-bold ${
            isLimited ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {remaining}/{total}
          </span>
        </div>
        
        <Progress 
          value={percentage} 
          className="h-2"
        />
        
        {displayTime > 0 && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {isLimited ? 'Reset in:' : 'Next reset:'}
            </span>
            <span className="text-xs text-gray-600 font-mono">
              {formatTimeUntilReset(displayTime)}
            </span>
          </div>
        )}
      </div>
      
      <Badge 
        variant={isLimited ? 'destructive' : isLow ? 'secondary' : 'default'}
        className="text-xs"
      >
        {isLimited ? 'Limited' : isLow ? 'Low' : 'OK'}
      </Badge>
    </div>
  );
}
