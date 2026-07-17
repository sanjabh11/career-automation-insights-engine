/**
 * Pilot Enrollment Client (B2-2)
 *
 * Server-owned eligibility: checks and creates pilot_participants records
 * via the enroll-coach-pilot edge function.
 *
 * Never trusts user_metadata — enrollment is verified server-side.
 */

import { supabase } from '@/integrations/supabase/client';

export interface PilotEnrollment {
    user_id: string;
    country: 'US' | 'CA';
    terms_version: string;
    terms_hash: string;
    active: boolean;
    pilot_status: string;
    enrolled_at: string;
}

/**
 * Check if the current user is enrolled in the coach pilot.
 */
export async function checkPilotEnrollment(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('pilot_participants')
            .select('active')
            .eq('user_id', userId)
            .single();

        if (error || !data) return false;
        return data.active === true;
    } catch {
        return false;
    }
}

/**
 * Enroll the current user in the coach pilot via edge function.
 * Requires country (US/CA) and terms_version acceptance.
 */
export async function enrollInPilot(
    userId: string,
    country: 'US' | 'CA',
    termsVersion: string,
    termsHash: string
): Promise<PilotEnrollment> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.data?.session?.access_token) {
        throw new Error('Authentication required to enroll in pilot');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

    const response = await fetch(`${supabaseUrl}/functions/v1/enroll-coach-pilot`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.data.session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': anonKey,
        },
        body: JSON.stringify({
            country,
            terms_version: termsVersion,
            terms_hash: termsHash,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Enrollment failed' }));
        throw new Error(error.error || 'Failed to enroll in pilot');
    }

    const result = await response.json();
    return result.enrollment as PilotEnrollment;
}
