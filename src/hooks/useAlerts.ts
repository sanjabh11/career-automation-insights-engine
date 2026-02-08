import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Alert {
    id: string;
    user_id: string;
    type: 'APO_CHANGE' | 'SKILL_GAP' | 'INACTIVITY' | 'SYSTEM';
    message: string;
    is_read: boolean;
    created_at: string;
    action_link?: string;
}

export function useAlerts() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setAlerts([]);
                setUnreadCount(0);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('alerts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            setAlerts(data || []);
            setUnreadCount(data?.filter(a => !a.is_read).length || 0);
        } catch (err: any) {
            console.error('Error fetching alerts:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const { error } = await supabase
                .from('alerts')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;

            setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err: any) {
            console.error('Error marking alert as read:', err);
            toast.error('Failed to update alert');
        }
    };

    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('alerts')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            setAlerts(alerts.map(a => ({ ...a, is_read: true })));
            setUnreadCount(0);
            toast.success('All alerts marked as read');
        } catch (err: any) {
            console.error('Error marking all alerts as read:', err);
            toast.error('Failed to update alerts');
        }
    };

    useEffect(() => {
        fetchAlerts();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('public:alerts')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'alerts'
            }, (payload) => {
                const newAlert = payload.new as Alert;
                setAlerts(prev => [newAlert, ...prev]);
                setUnreadCount(prev => prev + 1);
                toast.info('New Alert: ' + newAlert.message);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        alerts,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshAlerts: fetchAlerts
    };
}
