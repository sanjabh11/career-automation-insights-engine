/**
 * AI Career Coach V2
 * Phase 2 Enhancement - Persistent memory, personalized nudges, context-aware
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  context: any;
  created_at: string;
}

interface AICareerCoachV2Props {
  userId: string;
  userProfile?: {
    occupation_code?: string;
    occupation_title?: string;
    career_goals?: string;
  };
}

export const AICareerCoachV2 = ({ userId, userProfile }: AICareerCoachV2Props) => {
  const { toast } = useToast();
  const { requestFeature, checkUsage } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load or create conversation
  useEffect(() => {
    loadConversation();
  }, [userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversation = async () => {
    try {
      // Get or create active conversation
      const { data: convId, error: convError } = await supabase.rpc(
        'get_or_create_conversation',
        { p_user_id: userId }
      );

      if (convError) throw convError;

      setConversationId(convId);

      // Load messages for this conversation
      const { data: messagesData, error: msgError } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (msgError) throw msgError;

      setMessages(messagesData || []);

      // If no messages, send welcome message
      if (!messagesData || messagesData.length === 0) {
        await sendWelcomeMessage(convId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation history',
        variant: 'destructive',
      });
    }
  };

  const sendWelcomeMessage = async (convId: string) => {
    const welcomeContent = `Hi! I'm your AI Career Coach. I'm here to help you navigate automation risks and plan your career transition.

${userProfile?.occupation_title ? `I see you're currently a **${userProfile.occupation_title}**.` : ''}

I can help you with:
- Understanding your automation risk (APO score)
- Identifying automation-resistant career paths
- Creating personalized learning plans
- Calculating ROI on courses and certifications
- Tracking skill development progress

What would you like to explore today?`;

    const { data, error } = await supabase.from('coach_messages').insert({
      conversation_id: convId,
      user_id: userId,
      role: 'assistant',
      content: welcomeContent,
      metadata: { type: 'welcome' },
    }).select().single();

    if (error) {
      console.error('Error sending welcome:', error);
    } else {
      setMessages((prev) => [...prev, data]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    // Check usage limits
    const canUse = await requestFeature('aiChat');
    if (!canUse) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    try {
      // Save user message
      const { data: userMsg, error: userError } = await supabase
        .from('coach_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (userError) throw userError;

      setMessages((prev) => [...prev, userMsg]);

      // Get AI response from Edge Function
      const response = await fetch('/api/ai-career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId,
          userMessage,
          userProfile,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) throw new Error('AI response failed');

      const { message: aiMessage, metadata } = await response.json();

      // Save AI response
      const { data: assistantMsg, error: assistantError } = await supabase
        .from('coach_messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: 'assistant',
          content: aiMessage,
          metadata,
        })
        .select()
        .single();

      if (assistantError) throw assistantError;

      setMessages((prev) => [...prev, assistantMsg]);

      // Generate nudge if AI suggests action
      if (metadata?.suggested_action) {
        await supabase.rpc('generate_career_nudge', {
          p_user_id: userId,
          p_nudge_type: 'skill_recommendation',
          p_title: metadata.suggested_action.title,
          p_message: metadata.suggested_action.message,
          p_action_url: metadata.suggested_action.url,
          p_action_label: metadata.suggested_action.label,
          p_priority: 5,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const usageCheck = checkUsage('aiChat');

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Career Coach
            </CardTitle>
            <CardDescription>
              Personalized career guidance with persistent memory
            </CardDescription>
          </div>
          {usageCheck.limit !== 'unlimited' && (
            <Badge variant="secondary">
              {usageCheck.remaining} / {usageCheck.limit} messages
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-muted mr-12'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3" />
                      AI Coach
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>

                  {/* Metadata badges */}
                  {message.metadata && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {message.metadata.apo_score && (
                        <Badge variant="outline" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          APO: {message.metadata.apo_score}
                        </Badge>
                      )}
                      {message.metadata.recommended_courses && (
                        <Badge variant="outline" className="text-xs">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {message.metadata.recommended_courses} courses
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your automation risk, career transitions, or skill recommendations..."
            className="resize-none"
            rows={3}
            disabled={loading || !usageCheck.allowed}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading || !usageCheck.allowed}
            size="icon"
            className="shrink-0"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Usage Warning */}
        {!usageCheck.allowed && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
            <AlertCircle className="w-4 h-4" />
            <span>
              Message limit reached. Upgrade to continue chatting.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
