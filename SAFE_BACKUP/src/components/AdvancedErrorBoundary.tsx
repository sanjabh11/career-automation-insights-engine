
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Send, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class AdvancedErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorId: Date.now().toString() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        errorId: this.state.errorId
      };

      // In production, send to error tracking service
      console.log('Error Report:', errorReport);
      
      // Optional: Store in Supabase for debugging
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(errorReport));
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined });
  };

  private handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard');
    });
  };

  private handleReportIssue = () => {
    const errorDetails = encodeURIComponent(
      `Error ID: ${this.state.errorId}\nMessage: ${this.state.error?.message}\nURL: ${window.location.href}`
    );
    const githubUrl = `https://github.com/your-repo/issues/new?title=Error%20Report&body=${errorDetails}`;
    window.open(githubUrl, '_blank');
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-8 text-center max-w-2xl mx-auto mt-8 border-red-200">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
              <CardTitle className="text-2xl text-red-800">Oops! Something went wrong</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              We encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>
            
            <div className="bg-red-50 p-4 rounded-lg text-left">
              <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
              <p className="text-sm text-red-600 font-mono break-all">
                {this.state.error?.message}
              </p>
              {this.state.errorId && (
                <p className="text-xs text-red-500 mt-2">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-left text-sm bg-gray-100 p-4 rounded">
                <summary className="cursor-pointer font-medium mb-2">
                  Technical Details (Development Mode)
                </summary>
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                  {this.state.error?.stack}
                </pre>
                <hr className="my-2" />
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button variant="outline" onClick={this.handleCopyError} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Error
              </Button>
              
              <Button variant="outline" onClick={this.handleReportIssue} className="gap-2">
                <Send className="h-4 w-4" />
                Report Issue
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              If the problem persists, please try refreshing the page or contact support.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
