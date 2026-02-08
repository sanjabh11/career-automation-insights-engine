import { FormEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCareerCoach } from '@/hooks/useCareerCoach';

export default function ChatCoachPanel() {
  const { messages, sendMessage, isLoading, error } = useCareerCoach();
  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const msg = inputRef.current?.value ?? '';
    if (msg.trim()) {
      sendMessage(msg.trim());
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <h2 className="text-lg font-semibold">AI Career Coach</h2>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === 'user' ? 'text-right' : 'text-left text-primary'
                }
              >
                <p className="inline-block whitespace-pre-wrap rounded-md px-3 py-2 bg-muted">
                  {m.content}
                </p>
              </div>
            ))}
            {isLoading && (
              <p className="text-sm italic text-muted-foreground">Coach is typing…</p>
            )}
            {error && (
              <p className="text-sm text-destructive">Error: {error.message}</p>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask me about your career…"
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
