/**
 * FloatingChatBot — A sleek, professional, context-specialized floating AI assistant
 * -----------------------------------------------------------------------------------
 * Compact fixed panel with strict width/height boundaries, clean markdown rendering,
 * overflow management, and quick replies.
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Send, Loader2, Bot, User, Sparkles,
  RotateCcw, Copy, Check, AlertCircle, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callGemini } from '@/lib/gemini';

/**
 * Enhanced FormattedContent component:
 * Correctly parses markdown lists, bold text, headings, horizontal rules,
 * and markdown tables with horizontal scrolling so they never overflow the widget.
 */
function FormattedContent({ content }) {
  const lines = content.split('\n');

  // Group consecutive markdown table lines
  const elements = [];
  let tableBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      tableBuffer.push(line.trim());
    } else {
      if (tableBuffer.length > 0) {
        elements.push({ type: 'table', data: [...tableBuffer] });
        tableBuffer = [];
      }
      elements.push({ type: 'line', data: line });
    }
  }
  if (tableBuffer.length > 0) {
    elements.push({ type: 'table', data: [...tableBuffer] });
  }

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed break-words min-w-0 overflow-hidden">
      {elements.map((elem, idx) => {
        if (elem.type === 'table' && Array.isArray(elem.data)) {
          const rows = elem.data.map((r) =>
            r
              .split('|')
              .map((c) => c.trim())
              .filter((_, i, arr) => i > 0 && i < arr.length - 1)
          );
          // Check if row 1 is delimiter like |---|---|
          const isDelimiter = (r) => r.every((cell) => /^[-:\s]+$/.test(cell));
          const headerRow = rows[0];
          const bodyRows = rows.slice(1).filter((r) => !isDelimiter(r));

          return (
            <div key={idx} className="my-2.5 overflow-x-auto rounded-xl border border-border/80 bg-background/80 p-1">
              <table className="w-full text-[11px] border-collapse text-left min-w-[260px]">
                {headerRow && (
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {headerRow.map((cell, cIdx) => (
                        <th key={cIdx} className="p-2 font-bold text-foreground">
                          {cell.replace(/\*\*(.*?)\*\*/g, '$1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 text-foreground/90 leading-tight">
                          <span dangerouslySetInnerHTML={{ __html: cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        const line = elem.data;
        if (!line.trim()) return <div key={idx} className="h-1" />;

        // Horizontal separator
        if (line.trim() === '---' || line.trim() === '***') {
          return <hr key={idx} className="my-2 border-border/60" />;
        }

        // Headings (e.g. ### or ##)
        if (/^#{1,4}\s/.test(line)) {
          const headingText = line.replace(/^#{1,4}\s*/, '').replace(/\*\*/g, '');
          return (
            <p key={idx} className="font-bold text-foreground text-xs sm:text-sm pt-1.5 pb-0.5">
              {headingText}
            </p>
          );
        }

        // Standalone bold line
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return (
            <p key={idx} className="font-bold text-foreground text-xs sm:text-sm pt-1">
              {line.replace(/\*\*/g, '')}
            </p>
          );
        }

        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Bullet list item
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
              <p
                className="flex-1 text-foreground/90 min-w-0 break-words"
                dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•*]\s/, '') }}
              />
            </div>
          );
        }

        // Numbered list item
        if (/^\d+[.)]\s/.test(line)) {
          const num = line.match(/^(\d+)/)?.[1];
          const text = line.replace(/^\d+[.)]\s*/, '');
          const fmtText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 min-w-0">
              <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </span>
              <p
                className="flex-1 text-foreground/90 min-w-0 break-words"
                dangerouslySetInnerHTML={{ __html: fmtText }}
              />
            </div>
          );
        }

        // Regular paragraph
        return (
          <p
            key={idx}
            className="text-foreground/90 break-words min-w-0"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
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
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
      },
    ]);
    setError(null);
  }, [botName, welcomeMessage]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHasOpenedBefore(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const history = updatedMessages.slice(1, -1);
      const assistantReply = await callGemini(systemPrompt, history, text);
      setMessages((prev) => [...prev, { role: 'assistant', content: assistantReply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError(err?.message || 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([{ role: 'assistant', content: welcomeMessage }]);
    setError(null);
    setInput('');
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const botContent = (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label={`Open ${botName}`}
          className={cn(
            'group relative flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95',
            iconGradient,
            'ring-4 ring-white/20 dark:ring-slate-900/30 backdrop-blur-md'
          )}
        >
          {!hasOpenedBefore && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white" />
            </span>
          )}

          <div className="relative flex items-center justify-center">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white transition-transform group-hover:rotate-12" />
            <Sparkles className="h-3 w-3 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <div className="hidden sm:flex flex-col items-start text-left pr-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-85 leading-none">AI Assistant</span>
            <span className="text-xs font-bold leading-tight mt-0.5">{botName}</span>
          </div>

          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/90 hidden sm:inline-block ml-1">
            Ask AI
          </span>
        </button>
      )}

      {/* Professional Floating Chat Widget Panel */}
      {isOpen && (
        <div
          className={cn(
            'flex flex-col overflow-hidden shadow-2xl rounded-2xl border border-border/80 bg-card',
            'w-[calc(100vw-2rem)] sm:w-[380px] md:w-[400px] max-w-[420px]',
            'h-[520px] max-h-[calc(100vh-5rem)]',
            'animate-in fade-in slide-in-from-bottom-4 duration-200'
          )}
        >
          {/* Widget Header */}
          <div className={cn('px-4 py-3 border-b border-border/60 flex items-center justify-between shrink-0', accentBg)}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shadow-sm text-white shrink-0', iconGradient)}>
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-foreground text-xs sm:text-sm truncate">{botName}</h3>
                  <span className="flex h-2 w-2 relative shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context Badge Banner */}
          <div className="px-3.5 py-1.5 bg-muted/40 border-b border-border/40 flex items-center justify-between text-[10px] text-muted-foreground shrink-0">
            <span className="flex items-center gap-1 font-medium truncate">
              <Sparkles className={cn('h-3 w-3 shrink-0', accentColor)} />
              Context-Aware Page Assistant
            </span>
            <span className="font-mono text-[9px] bg-background px-1.5 py-0.5 rounded border border-border/60 shrink-0 ml-2">
              Gemini AI
            </span>
          </div>

          {/* Message History Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs sm:text-sm bg-gradient-to-b from-background to-muted/15 min-w-0">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={index}
                  className={cn('flex items-start gap-2.5 min-w-0', isAssistant ? 'justify-start' : 'justify-end')}
                >
                  {isAssistant && (
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs mt-0.5', botIconBg, botIconColor)}>
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'group relative max-w-[88%] rounded-xl p-3 shadow-2xs min-w-0 overflow-hidden',
                      isAssistant
                        ? 'bg-card border border-border/70 text-foreground rounded-tl-xs'
                        : 'bg-primary text-primary-foreground rounded-tr-xs'
                    )}
                  >
                    <FormattedContent content={msg.content} />

                    {isAssistant && (
                      <div className="mt-2 pt-1.5 border-t border-border/30 flex items-center justify-between text-[9px] text-muted-foreground">
                        <span className="font-medium truncate">{botName}</span>
                        <button
                          onClick={() => handleCopy(msg.content, index)}
                          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity shrink-0 ml-2"
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check className="h-2.5 w-2.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-2.5 w-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs', botIconBg, botIconColor)}>
                  <Bot className="h-3.5 w-3.5 animate-bounce" />
                </div>
                <div className="bg-card border border-border/70 rounded-xl rounded-tl-xs p-3 shadow-2xs flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                  <span>Analyzing context & retrieving answer...</span>
                </div>
              </div>
            )}

            {/* Error Banner with Retry */}
            {error && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{error}</span>
                </div>
                <button
                  onClick={() => handleSend()}
                  className="px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground font-medium text-[11px] flex items-center gap-1 hover:opacity-90 shrink-0"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Suggestions */}
          {quickReplies && quickReplies.length > 0 && messages.length <= 3 && !isLoading && (
            <div className="px-3 py-2 bg-muted/20 border-t border-border/40 shrink-0">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">Suggested questions:</p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {quickReplies.map((qr, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(qr)}
                    className="text-left text-[11px] bg-background hover:bg-primary/5 hover:text-primary border border-border/70 hover:border-primary/40 rounded-lg px-2 py-1 transition-all leading-tight truncate max-w-full"
                  >
                    💡 {qr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer Area */}
          <div className="p-2.5 bg-card border-t border-border/60 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${botName}...`}
                rows={1}
                className="flex-1 resize-none max-h-20 min-h-[36px] px-3 py-2 rounded-xl bg-muted/50 border border-border/80 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 focus:bg-background transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-all',
                  input.trim() && !isLoading
                    ? iconGradient + ' hover:scale-105 active:scale-95'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                )}
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </form>
            <p className="text-[9px] text-center text-muted-foreground mt-1.5">
              Powered by FoodSafety AI • Context Aware Assistant
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(botContent, document.body);
}
