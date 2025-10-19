
import React, { useState, useEffect, ReactNode } from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'timeout';

interface LoadingStateManagerProps {
  state: LoadingState;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  timeoutMessage?: string;
  onRetry?: () => void;
  progress?: number;
  estimatedTime?: number;
  children?: ReactNode;
  showProgress?: boolean;
  className?: string;
}

export function LoadingStateManager({
  state,
  loadingMessage = 'Loading...',
  successMessage = 'Success!',
  errorMessage = 'Something went wrong',
  timeoutMessage = 'Request timed out',
  onRetry,
  progress,
  estimatedTime,
  children,
  showProgress = false,
  className = ''
}: LoadingStateManagerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTimeEstimate, setShowTimeEstimate] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state === 'loading') {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Show time estimate after 3 seconds
      const estimateTimer = setTimeout(() => {
        setShowTimeEstimate(true);
      }, 3000);

      return () => {
        clearInterval(interval);
        clearTimeout(estimateTimer);
      };
    } else {
      setShowTimeEstimate(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'timeout':
        return <Clock className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    switch (state) {
      case 'loading':
        return loadingMessage;
      case 'success':
        return successMessage;
      case 'error':
        return errorMessage;
      case 'timeout':
        return timeoutMessage;
      default:
        return '';
    }
  };

  const getEstimatedTimeRemaining = () => {
    if (!estimatedTime || !showTimeEstimate) return null;
    
    const remaining = Math.max(0, estimatedTime - elapsedTime);
    if (remaining === 0) return null;
    
    return remaining < 60 
      ? `${remaining} seconds remaining`
      : `${Math.ceil(remaining / 60)} minutes remaining`;
  };

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (state === 'idle') {
    return <>{children}</>;
  }

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        {getIcon()}
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">{getMessage()}</h3>
          
          {state === 'loading' && (
            <div className="space-y-3 w-full">
              {showProgress && typeof progress === 'number' && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
                </div>
              )}
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>Elapsed time: {formatElapsedTime(elapsedTime)}</p>
                {getEstimatedTimeRemaining() && (
                  <p>{getEstimatedTimeRemaining()}</p>
                )}
              </div>
            </div>
          )}
          
          {(state === 'error' || state === 'timeout') && onRetry && (
            <Button onClick={onRetry} className="mt-4">
              Try Again
            </Button>
          )}
        </div>

        {state === 'loading' && (
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>Processing your request</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for managing loading states
export function useLoadingState(initialState: LoadingState = 'idle') {
  const [state, setState] = useState<LoadingState>(initialState);
  const [progress, setProgress] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const startLoading = (withProgress = false) => {
    setState('loading');
    setStartTime(Date.now());
    if (withProgress) {
      setProgress(0);
    }
  };

  const setSuccess = () => {
    setState('success');
    setProgress(100);
  };

  const setError = () => {
    setState('error');
  };

  const setTimeout = () => {
    setState('timeout');
  };

  const reset = () => {
    setState('idle');
    setProgress(0);
    setStartTime(null);
  };

  const updateProgress = (value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  };

  const getElapsedTime = () => {
    return startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  };

  return {
    state,
    progress,
    startLoading,
    setSuccess,
    setError,
    setTimeout,
    reset,
    updateProgress,
    getElapsedTime
  };
}
