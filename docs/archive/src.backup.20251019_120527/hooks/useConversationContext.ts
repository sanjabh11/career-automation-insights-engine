import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ConversationContext {
  sessionId: string;
  conversationType: 'career_coaching' | 'skill_planning' | 'resume_review' | 'general';
  conversationHistory: ConversationMessage[];
  userContext: Record<string, any>;
  userPreferences: Record<string, any>;
  memorySummary?: string;
  keyFacts?: string[];
  lastInteractionAt: string;
}

interface ManageContextRequest {
  action: 'save' | 'load' | 'update' | 'summarize' | 'clear';
  sessionId: string;
  conversationType?: 'career_coaching' | 'skill_planning' | 'resume_review' | 'general';
  data?: {
    message?: ConversationMessage;
    userContext?: Record<string, any>;
    userPreferences?: Record<string, any>;
    mentionedOccupations?: string[];
    mentionedSkills?: string[];
  };
}

/**
 * Hook to manage conversation context for AI interactions
 * Provides persistent memory across sessions
 */
export function useConversationContext(sessionId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load context for a session
  const { data: context, isLoading } = useQuery({
    queryKey: ["conversation-context", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-context", {
        body: {
          action: 'load',
          sessionId,
        },
      });

      if (error) throw error;
      return data.context as ConversationContext | null;
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Save or update context
  const saveContextMutation = useMutation({
    mutationFn: async (request: Omit<ManageContextRequest, 'action' | 'sessionId'>) => {
      const { data, error } = await supabase.functions.invoke("manage-context", {
        body: {
          action: context ? 'update' : 'save',
          sessionId,
          ...request,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-context", sessionId] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to save context",
        description: error.message,
      });
    },
  });

  // Add a message to the conversation
  const addMessage = (message: ConversationMessage) => {
    return saveContextMutation.mutateAsync({
      data: { message },
    });
  };

  // Update user context
  const updateUserContext = (userContext: Record<string, any>) => {
    return saveContextMutation.mutateAsync({
      data: { userContext },
    });
  };

  // Summarize conversation
  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-context", {
        body: {
          action: 'summarize',
          sessionId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-context", sessionId] });
      toast({
        title: "Conversation Summarized",
        description: "Context has been compressed for better performance",
      });
    },
  });

  // Clear context
  const clearMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-context", {
        body: {
          action: 'clear',
          sessionId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-context", sessionId] });
      toast({
        title: "Context Cleared",
        description: "Conversation history has been reset",
      });
    },
  });

  return {
    context,
    isLoading,
    addMessage,
    updateUserContext,
    summarize: summarizeMutation.mutate,
    clear: clearMutation.mutate,
    isSaving: saveContextMutation.isPending,
    isSummarizing: summarizeMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}

/**
 * Hook to fetch all conversations for the current user
 */
export function useUserConversations() {
  return useQuery({
    queryKey: ["user-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_context")
        .select("session_id, conversation_type, last_interaction_at, memory_summary")
        .order("last_interaction_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });
}
