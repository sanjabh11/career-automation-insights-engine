/**
 * Automation Risk Alerts Panel
 * Phase 2 Feature - Monthly automation risk monitoring and notifications
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  occupation_code: string;
  occupation_title: string;
  alert_type: 'apo_change' | 'new_automation_tech' | 'job_market_shift' | 'skill_demand_change' | 'monthly_summary';
  previous_apo_score: number | null;
  current_apo_score: number | null;
  change_magnitude: number | null;
  details: any;
  recommendations: any;
  status: 'pending' | 'sent' | 'viewed' | 'dismissed';
  created_at: string;
  viewed_at: string | null;
}

export const AutomationRiskAlertsPanel = ({ userId }: { userId: string }) => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'viewed'>('all');

  useEffect(() => {
    loadAlerts();

    // Subscribe to new alerts
    const channel = supabase
      .channel('automation-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'automation_alerts',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev]);
          toast({
            title: 'New Automation Alert',
            description: (payload.new as Alert).occupation_title,
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsViewed = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('automation_alerts')
        .update({ status: 'viewed', viewed_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? { ...alert, status: 'viewed' as const, viewed_at: new Date().toISOString() }
            : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as viewed:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('automation_alerts')
        .update({ status: 'dismissed' })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));

      toast({
        title: 'Alert Dismissed',
        description: 'This alert has been removed from your feed.',
      });
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getAlertIcon = (type: Alert['alert_type']) => {
    switch (type) {
      case 'apo_change':
        return <TrendingUp className="w-5 h-5 text-amber-500" />;
      case 'new_automation_tech':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'job_market_shift':
        return <TrendingDown className="w-5 h-5 text-blue-500" />;
      case 'skill_demand_change':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'monthly_summary':
        return <Calendar className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getAlertTitle = (alert: Alert) => {
    switch (alert.alert_type) {
      case 'apo_change':
        return `APO Score Changed: ${alert.occupation_title}`;
      case 'new_automation_tech':
        return `New Automation Technology Detected`;
      case 'job_market_shift':
        return `Job Market Update: ${alert.occupation_title}`;
      case 'skill_demand_change':
        return `Skill Demand Changed`;
      case 'monthly_summary':
        return `Monthly Automation Report`;
      default:
        return 'Automation Alert';
    }
  };

  const getAlertMessage = (alert: Alert) => {
    if (alert.alert_type === 'apo_change' && alert.previous_apo_score && alert.current_apo_score) {
      const direction = alert.current_apo_score > alert.previous_apo_score ? 'increased' : 'decreased';
      const magnitude = Math.abs(alert.change_magnitude || 0);
      return `Your occupation's automation risk ${direction} by ${magnitude.toFixed(1)} points (${alert.previous_apo_score.toFixed(1)} → ${alert.current_apo_score.toFixed(1)})`;
    }

    if (alert.details?.summary) {
      return alert.details.summary;
    }

    return 'Review this alert for important updates about automation risk.';
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'pending') return alert.status === 'pending' || alert.status === 'sent';
    if (filter === 'viewed') return alert.status === 'viewed';
    return alert.status !== 'dismissed';
  });

  const pendingCount = alerts.filter((a) => a.status === 'pending' || a.status === 'sent').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Automation Risk Alerts
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Stay informed about changes to your automation risk
            </CardDescription>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'viewed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('viewed')}
            >
              Read
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading alerts...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === 'pending'
                  ? 'No new alerts'
                  : filter === 'viewed'
                  ? 'No read alerts'
                  : 'No alerts yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                We'll notify you of any changes to your automation risk
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${
                    alert.status === 'pending' || alert.status === 'sent'
                      ? 'bg-muted/50 border-primary'
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.alert_type)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">
                          {getAlertTitle(alert)}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getAlertMessage(alert)}
                        </p>

                        {/* Recommendations */}
                        {alert.recommendations && (
                          <div className="mt-3 space-y-2">
                            {alert.recommendations.actions?.map((action: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs">
                                <CheckCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                <span>{action}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* APO Change Badge */}
                        {alert.change_magnitude && (
                          <Badge
                            variant={alert.change_magnitude > 0 ? 'destructive' : 'default'}
                            className="mt-2"
                          >
                            {alert.change_magnitude > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {alert.change_magnitude > 0 ? '+' : ''}
                            {alert.change_magnitude.toFixed(1)} pts
                          </Badge>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(alert.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                          {alert.viewed_at && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      {(alert.status === 'pending' || alert.status === 'sent') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsViewed(alert.id)}
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissAlert(alert.id)}
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
