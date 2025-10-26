import React from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { getQuickSuggestions } from "./contextDetection";
import { QuickSuggestions } from "./QuickSuggestions";
import { getDeviceId } from "@/utils/device";

export type ChatMessage = { role: "user" | "assistant"; content: string; timestamp: number };

export function AIAssistant() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const loc = useLocation();
  const { user } = useSession();

  const quick = React.useMemo(() => getQuickSuggestions(loc.pathname), [loc.pathname]);

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    const entry: ChatMessage = { role: "user", content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, entry]);
    setInput("");
    setLoading(true);
    try {
      const body = {
        message: msg,
        conversationHistory: messages.map(({ role, content }) => ({ role, content })),
        userProfile: user ? { id: user.id, occupationCode: undefined, careerGoals: undefined } : undefined,
      };
      const { data, error } = await supabase.functions.invoke("ai-career-coach", { body });
      if (error) throw error;
      const assistantText: string = (data as any)?.response || "";
      const assistantEntry: ChatMessage = { role: "assistant", content: assistantText, timestamp: Date.now() };
      setMessages((prev) => [...prev, assistantEntry]);
    } catch (e: any) {
      const errEntry: ChatMessage = { role: "assistant", content: e?.message || "Assistant unavailable.", timestamp: Date.now() };
      setMessages((prev) => [...prev, errEntry]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
          onClick={() => setOpen(true)}
          aria-label="Open AI Assistant"
        >
          💬
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[92vw] h-[540px] bg-white rounded-xl shadow-2xl border flex flex-col">
          <div className="px-3 py-2 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">Career AI Assistant</div>
            <button className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div className="p-3 border-b">
            <QuickSuggestions items={quick} onSelect={(q) => setInput(q)} />
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-gray-600">Ask about concepts (APO, Sharpe), features (how-tos), or your results.</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`text-sm rounded-md p-2 ${m.role === 'user' ? 'bg-blue-50 self-end' : 'bg-gray-50'}`}>{m.content}</div>
            ))}
          </div>
          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
                placeholder="Ask me anything..."
              />
              <button
                className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white disabled:opacity-50"
                onClick={() => send()}
                disabled={loading || !input.trim()}
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
