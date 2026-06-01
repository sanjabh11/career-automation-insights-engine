import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Organization {
    id: string;
    name: string;
    industry: string;
    size: string;
    billing_email: string;
    created_at: string;
    role?: 'owner' | 'admin' | 'member';
}

export interface OrgMember {
    id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    profile?: {
        full_name: string;
        email: string;
        avatar_url: string;
    };
}

const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

export function useOrganization() {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setOrganization(null);
                setLoading(false);
                return;
            }

            // Fetch org the user belongs to
            const { data: memberData, error: memberError } = await supabase
                .from('organization_members')
                .select('org_id, role, organizations(*)')
                .eq('user_id', user.id)
                .single();

            if (memberError && memberError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                throw memberError;
            }

            if (memberData && memberData.organizations) {
                setOrganization({
                    ...memberData.organizations,
                    role: memberData.role
                });

                // Fetch members if org exists
                const { data: membersData, error: membersError } = await supabase
                    .from('organization_members')
                    .select('*, profile:profiles(full_name, email, avatar_url)')
                    .eq('org_id', memberData.org_id);

                if (membersError) throw membersError;
                setMembers(membersData || []);
            } else {
                setOrganization(null);
                setMembers([]);
            }
        } catch (err: unknown) {
            console.error('Error fetching organization:', err);
        } finally {
            setLoading(false);
        }
    };

    const createOrganization = async (name: string, industry: string, size: string, billingEmail: string) => {
        try {
            const { data, error } = await supabase.rpc('create_organization', {
                name,
                industry,
                size,
                billing_email: billingEmail
            });

            if (error) throw error;

            toast.success('Organization created successfully!');
            fetchOrganization();
            return data;
        } catch (err: unknown) {
            console.error('Error creating organization:', err);
            toast.error(getErrorMessage(err, 'Failed to create organization'));
            throw err;
        }
    };

    const addMembers = async (emails: string[]) => {
        // Note: In a real app, this would invite users via email.
        // For this MVP, we'll simulate adding if users exist, or just show a success message.
        // Since we can't easily look up user_ids by email without a secure backend function,
        // we will implement a placeholder that would typically call an Edge Function.

        toast.info(`Invites sent to ${emails.length} users (Simulation)`);
        return true;
    };

    useEffect(() => {
        fetchOrganization();
    }, []);

    return {
        organization,
        members,
        loading,
        createOrganization,
        addMembers,
        refreshOrganization: fetchOrganization
    };
}
