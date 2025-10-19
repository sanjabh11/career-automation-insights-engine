import { useEffect, useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChatMessage, loadChatHistory, saveChatHistory } from '@/utils/chatCache';
import { useUserProfile } from '@/hooks/useUserProfile';

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface CoachResponse {
  response: string;
  followUpQuestions?: string[];
  actionItems?: string[];
  usage?: {
    totalTokens: number;
    promptTokens?: number;
    completionTokens?: number;
  };
}

export function useCareerCoach() {
  const { data: userProfile } = useUserProfile();
  const userId = userProfile?.id ?? 'anonymous';

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadChatHistory(userId),
  );

  // Persist chat history when userId changes
  useEffect(() => {
    saveChatHistory(userId, messages);
  }, [userId, messages]);

  const mutation = useMutation<CoachResponse, Error, string>({
    mutationFn: async (message) => {
      const body = {
        message,
        conversationHistory: messages.slice(-20), // send last 20 msgs
        userProfile: userProfile ? { id: userProfile.id, occupationCode: userProfile.occupationCode, careerGoals: userProfile.careerGoals } : undefined,
      };
      const resp = await fetch(`${FUNCTIONS_BASE}/ai-career-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(await resp.text());
      return resp.json();
    },
    onSuccess: (data, newMessage) => {
      const updated: ChatMessage[] = [
        ...messages,
        { id: crypto.randomUUID(), role: 'user', content: newMessage },
        { id: crypto.randomUUID(), role: 'assistant', content: data.response },
      ];
      setMessages(updated);
    },
  });

  const sendMessage = useCallback(
    (msg: string) => {
      if (!msg.trim()) return;
      mutation.mutate(msg);
      // optimistic UI
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', content: msg },
      ]);
    },
    [mutation],
  );

  return {
    messages,
    sendMessage,
    isLoading: mutation.isLoading,
    error: mutation.error,
  };
}
