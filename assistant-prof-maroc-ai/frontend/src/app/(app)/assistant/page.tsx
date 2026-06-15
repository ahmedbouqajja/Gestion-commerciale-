'use client';

import { useRef, useState, useEffect } from 'react';
import { Send, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Markdown } from '@/components/markdown';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import type { ChatMessage } from '@/lib/types';

export default function AssistantPage() {
  const { t, lang } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post<{ reply: string }>('/chat', { messages: next, language: lang });
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: err instanceof Error ? err.message : 'Erreur' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions =
    lang === 'ar'
      ? ['اقترح نشاطاً ممتعاً حول الكسور.', 'كيف أشرح القسمة للتلاميذ؟', 'طريقة بسيطة لتدريس الأفعال.']
      : [
          'Prépare une activité ludique sur les fractions.',
          'Comment expliquer la division aux élèves ?',
          'Donne-moi une méthode simple pour enseigner les verbes.',
        ];

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{t('assistant')}</h1>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border bg-muted/20 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <p className="max-w-md text-muted-foreground">{t('assistantIntro')}</p>
            <div className="flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-lg border bg-background px-4 py-2 text-sm hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : '')}>
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-emerald-100 text-emerald-700',
              )}
            >
              {m.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-4 py-2.5',
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border bg-background',
              )}
            >
              {m.role === 'user' ? <p className="whitespace-pre-wrap text-sm">{m.content}</p> : <Markdown content={m.content} />}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-muted-foreground">{t('generating')}</p>}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex items-end gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t('assistantPlaceholder')}
          className="min-h-[48px] resize-none"
          rows={1}
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="h-12 w-12 shrink-0">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
