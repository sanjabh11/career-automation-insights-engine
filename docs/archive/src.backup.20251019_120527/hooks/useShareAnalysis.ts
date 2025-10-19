
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ShareAnalysisData {
  analysis_id: string;
  share_type: 'link' | 'email' | 'token';
  shared_with_email?: string;
  expires_at?: string;
  max_views?: number;
}

export interface SharedAnalysis {
  id: string;
  share_token: string;
  share_type: string;
  shared_with_email?: string;
  expires_at?: string;
  view_count: number;
  max_views?: number;
  is_active: boolean;
  created_at: string;
  analysis_id: string;
}

interface ShareViewResponse {
  success?: boolean;
  analysis?: any;
  shared_by?: string;
  view_count?: number;
  error?: string;
}

export function useShareAnalysis() {
  const [isSharing, setIsSharing] = useState(false);
  const queryClient = useQueryClient();

  const shareAnalysisMutation = useMutation({
    mutationFn: async (shareData: ShareAnalysisData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('shared_analyses')
        .insert({
          user_id: user.id,
          analysis_id: shareData.analysis_id,
          share_type: shareData.share_type,
          shared_with_email: shareData.shared_with_email,
          expires_at: shareData.expires_at,
          max_views: shareData.max_views
        })
        .select()
        .single();

      if (error) throw error;

      // If sharing via email, send the email
      if (shareData.share_type === 'email' && shareData.shared_with_email) {
        const emailResult = await supabase.functions.invoke('send-shared-analysis', {
          body: {
            share_token: data.share_token,
            recipient_email: shareData.shared_with_email,
            analysis_id: shareData.analysis_id
          }
        });

        if (emailResult.error) {
          console.warn('Email sending failed:', emailResult.error);
          toast.warning('Analysis shared but email delivery failed');
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared_analyses'] });
      toast.success('Analysis shared successfully!');
    },
    onError: (error) => {
      console.error('Error sharing analysis:', error);
      toast.error('Failed to share analysis');
    }
  });

  const getSharedAnalysis = async (shareToken: string): Promise<ShareViewResponse> => {
    try {
      setIsSharing(true);
      const { data, error } = await supabase.rpc('increment_share_view', {
        share_token_param: shareToken
      });

      if (error) throw error;
      
      // Type cast the Json response to our expected interface
      const response = data as ShareViewResponse;
      
      if (response?.error) {
        throw new Error(response.error);
      }

      return response;
    } catch (error) {
      console.error('Error getting shared analysis:', error);
      throw error;
    } finally {
      setIsSharing(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    const { error } = await supabase
      .from('shared_analyses')
      .update({ is_active: false })
      .eq('id', shareId);

    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['shared_analyses'] });
    toast.success('Share access revoked');
  };

  return {
    shareAnalysis: shareAnalysisMutation.mutate,
    getSharedAnalysis,
    revokeShare,
    isSharing: isSharing || shareAnalysisMutation.isPending
  };
}
