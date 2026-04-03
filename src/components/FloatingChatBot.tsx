/**
 * FloatingChatBot — A beautiful, draggable floating chat assistant
 * -----------------------------------------------------------------
 * Renders as a fixed floating button + slide-up chat panel.
 * Uses Gemini Flash API via the centralized helper.
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageCircle, X, Send, Loader2, Bot, User, Sparkles,
  RotateCcw, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callGemini } from '@/lib/gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface FloatingChatBotProps {
  botName: string;
  subtitle: string;
  systemPrompt: string;
  welcomeMessage: string;
  quickReplies: string[];
  accentColor: string;
  accentBg: string;
  iconGradient: string;
  botIconColor: string;
  botIconBg: string;
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-bold text-foreground">{line.replace(/\*\*/g, '')}</p>;
        }
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0 mt-2" />
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•*]\s/, '') }} />
            </div>
          );
        }
        if (/^\d+[.)]\s/.test(line)) {
          const num = line.match(/^(\d+)/)?.[1];
          const text = line.replace(/^\d+[.)]\s*/, '');
          const fmtText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-800 flex items-center justify-center shrink-0 mt-0.5">{num}</span>
              <p className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: fmtText }} />
            </div>
          );
        }
        return <p key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
}

export default function FloatingChatBot({
  botName,
  subtitle,
  systemPrompt,
  welcomeMessage,
  quickReplies,
  accentColor,
  accentBg,
  iconGradient,
  botIconColor,
  botIconBg,
}: FloatingChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [mounted, setMounted] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const send = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: msg };
    const hist = [...messages, userMsg];
    setMessages(hist);
    setInput('');
    setLoading(true);
    try {
      const reply = await callGemini(systemPrompt, hist, msg);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      let errorMsg: string;
      const e = err as { name?: string; isQuotaExhausted?: boolean; message?: string };
      if (e?.name === 'GeminiQuotaError' && e.isQuotaExhausted) {
        errorMsg = '⚠️ The AI assistant is temporarily unavailable — the daily API quota has been reached. Please try again later (resets within 24 hours).';
      } else if (e?.name === 'GeminiQuotaError') {
        errorMsg = '⏳ Too many requests — please wait a few seconds and try again.';
      } else if (e?.message?.includes('API error')) {
        errorMsg = '❌ API error occurred. Please check your API key configuration.';
      } else {
        errorMsg = '🔌 Connection error. Please check your internet and try again.';
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
  };

  if (!mounted) return null;

  return createPortal((
    <>
      {/* Floating Action Button */}
      <div className="fixed z-[9999] right-4 bottom-4">
        {isOpen ? (
          <button
            onClick={() => setIsOpen(false)}
            className="w-11 h-11 rounded-full bg-foreground/90 hover:bg-foreground flex items-center justify-center shadow-lg transition-all duration-200"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105',
              iconGradient
            )}
          >
            <div className="relative">
              <MessageCircle className="h-5 w-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-[1.5px] border-white animate-pulse" />
            </div>
          </button>
        )}
      </div>

      {/* Chat Panel */}
      <div
        className={cn(
          'fixed z-[9998] rounded-xl border shadow-xl overflow-hidden',
          'transition-all duration-300 origin-bottom-right',
          isOpen
            ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto'
            : 'scale-90 opacity-0 translate-y-4 pointer-events-none',
          'bg-card border-border/80'
        )}
        style={{
          right: 16,
          bottom: 64,
          width: 'min(380px, calc(100vw - 1.5rem))',
        }}
      >
        {/* Header */}
        <div className={cn('px-3.5 py-2.5 flex items-center gap-2.5', iconGradient)}>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', 'bg-white/20')}>
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-tight">{botName}</p>
            <p className="text-white/70 text-[10px] leading-tight">{subtitle}</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/20 flex items-center gap-0.5">
              <Sparkles className="h-2 w-2" /> AI
            </span>
            <button onClick={reset} className="p-1 rounded-md hover:bg-white/15 transition-colors" title="Reset chat">
              <RotateCcw className="h-3.5 w-3.5 text-white/70" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={chatRef}
          onScroll={handleScroll}
          className="h-[340px] overflow-y-auto p-3.5 space-y-3 scroll-smooth bg-gradient-to-b from-muted/20 to-background"
        >
          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5', botIconBg)}>
                  <Bot className={cn('h-3 w-3', botIconColor)} />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[82%] px-3 py-2 rounded-xl leading-relaxed',
                  m.role === 'user'
                    ? `${iconGradient} text-white rounded-tr-sm shadow-sm text-[13px]`
                    : 'bg-card border border-border/60 rounded-tl-sm shadow-sm'
                )}
              >
                {m.role === 'assistant' ? <FormattedContent content={m.content} /> : <p className="text-[13px]">{m.content}</p>}
              </div>
              {m.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-foreground/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3 w-3 text-foreground/60" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', botIconBg)}>
                <Bot className={cn('h-3 w-3', botIconColor)} />
              </div>
              <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-card border border-border/60 shadow-sm flex items-center gap-1.5">
                <Loader2 className={cn('h-3.5 w-3.5 animate-spin', botIconColor)} />
                <span className="text-xs text-muted-foreground">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-[120px] left-1/2 -translate-x-1/2 p-1.5 rounded-full bg-card border border-border shadow-md z-10"
          >
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        )}

        {/* Quick replies */}
        {messages.length <= 2 && !loading && (
          <div className="px-3 pb-1.5 pt-1 flex flex-wrap gap-1.5 border-t border-border/30">
            {quickReplies.slice(0, 3).map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={loading}
                className={cn(
                  'text-[11px] font-medium px-2.5 py-1.5 rounded-lg bg-card border border-border',
                  `hover:border-${accentColor.replace('text-', '')}/40 hover:${accentBg}`,
                  'transition-all disabled:opacity-50 text-left leading-snug'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-2.5 border-t border-border/50 bg-card">
          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Ask something…"
              disabled={loading}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-[13px]
                         focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                         transition-all placeholder:text-muted-foreground/50 disabled:opacity-60"
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shadow-sm',
                iconGradient,
                'hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0'
              )}
            >
              {loading
                ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                : <Send className="h-4 w-4 text-white" />
              }
            </button>
          </div>
        </div>
      </div>
    </>
  ), document.body);
}
