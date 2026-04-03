/**
 * FoodTestingAIAssistant
 * ──────────────────────────────────────────────────────────────────────────
 * A Gemini-powered chat assistant embedded inside each test method card.
 * It guides users step-by-step through the test, interprets their results,
 * and provides deep ingredient/adulteration insights in real time.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, User, Loader2, Sparkles, RotateCcw,
  AlertTriangle, CheckCircle2, XCircle, Info,
  ChevronDown, ChevronUp, Lightbulb, FlaskConical,
  ThumbsUp, ThumbsDown, Microscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callGemini } from '@/lib/gemini';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickReply {
  label: string;
  value: string;
  icon?: string;
}

export interface AIAssistantProps {
  foodName: string;
  foodEmoji: string;
  methodName: string;
  methodType: 'home' | 'lab';
  whatItDetects: string;
  adulterants: string[];
  steps: { step: number; title: string; desc: string }[];
  materials: string[];
}

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt(props: AIAssistantProps): string {
  return `You are an expert food safety testing assistant specialising in food adulteration detection. You are embedded inside a step-by-step food testing guide for testing ${props.foodName}.

CURRENT TEST CONTEXT:
- Food being tested: ${props.foodName} ${props.foodEmoji}
- Test name: ${props.methodName}
- Test type: ${props.methodType === 'home' ? 'Home test (uses everyday household items)' : 'Laboratory test (certified equipment)'}
- What this test detects: ${props.whatItDetects}
- Adulterants targeted: ${props.adulterants.join(', ')}
- Materials required: ${props.materials.join(', ')}
- Test steps: ${props.steps.map(s => `Step ${s.step}: ${s.title} — ${s.desc}`).join(' | ')}

YOUR ROLE:
1. GUIDE the user step by step through this specific test. Ask them what step they're on.
2. INTERPRET their observations — when they describe what they see (colour, smell, texture, reaction), tell them what it means.
3. GIVE VERDICT — clearly tell them if their ${props.foodName} passes or fails the test.
4. EXPLAIN WHY — after giving a result, explain the science behind what they observed.
5. PROVIDE INGREDIENT INSIGHTS — give detailed health and safety insights about any adulteration found:
   - What the adulterant is
   - Health risks (short-term and long-term)
   - Why manufacturers add it
   - What regulatory bodies (FSSAI, FDA, EU) say about it
   - How common it is in India
6. SUGGEST NEXT STEPS — if adulterant is found, tell them what to do (FSSAI complaint, avoid consumption, etc.)

PERSONALITY: Warm, knowledgeable, encouraging. Use simple language — the user may not be a scientist. Use emojis occasionally. Be precise about results but compassionate about concerns.

FORMATTING: Use short paragraphs. When giving the final verdict, clearly mark it as ✅ PASS or ❌ FAIL or ⚠️ INCONCLUSIVE. Always end with a helpful next step or follow-up question.

IMPORTANT: Only discuss topics related to food safety, this specific test, and ingredient/adulteration insights. If asked unrelated questions, gently redirect.`;
}

// ─── Quick reply suggestions based on test stage ─────────────────────────────

const INITIAL_QUICK_REPLIES: QuickReply[] = [
  { label: "I'm ready to start", value: "I'm ready to start the test. What should I do first?", icon: '🚀' },
  { label: "What materials do I need?", value: "What materials do I need before I begin?", icon: '📦' },
  { label: "Is this test accurate?", value: "How accurate is this test and what are its limitations?", icon: '🎯' },
  { label: "What am I looking for?", value: "What exactly am I looking for in this test?", icon: '👁️' },
];

const RESULT_QUICK_REPLIES: QuickReply[] = [
  { label: "I see it passed ✅", value: "The result looks like it passed the test.", icon: '✅' },
  { label: "I see it failed ❌", value: "The result looks like it failed — I can see the signs of adulteration.", icon: '❌' },
  { label: "I'm not sure 🤔", value: "I'm not sure about my result — can you help me interpret what I'm seeing?", icon: '🤔' },
  { label: "Something unexpected happened", value: "Something unexpected happened during the test — can you help?", icon: '⚠️' },
];

// ─── Format AI message content ────────────────────────────────────────────────

function FormattedMessage({ content }: { content: string }) {
  // Parse verdict markers
  const hasPass = content.includes('✅ PASS') || content.includes('✅ pass');
  const hasFail = content.includes('❌ FAIL') || content.includes('❌ fail');
  const hasInconclusive = content.includes('⚠️ INCONCLUSIVE') || content.includes('⚠️ inconclusive');

  const lines = content.split('\n').filter(Boolean);

  return (
    <div className="space-y-2">
      {/* Verdict banner if present */}
      {hasPass && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 mb-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm font-700 text-emerald-800">RESULT: PASS — Your sample appears genuine</p>
        </div>
      )}
      {hasFail && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 mb-2">
          <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm font-700 text-red-800">RESULT: FAIL — Adulteration detected</p>
        </div>
      )}
      {hasInconclusive && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm font-700 text-amber-800">RESULT: INCONCLUSIVE — Further testing recommended</p>
        </div>
      )}

      {lines.map((line, i) => {
        // Bold headers (lines ending with : or starting with **)
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-700 text-foreground">{line.replace(/\*\*/g, '')}</p>;
        }
        // Bullet points
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
              <p className="text-sm text-foreground/90 leading-relaxed">{line.replace(/^[-•]\s/, '')}</p>
            </div>
          );
        }
        // Numbered steps
        if (/^\d+\./.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1];
          const text = line.replace(/^\d+\.\s*/, '');
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-800
                               flex items-center justify-center shrink-0 mt-0.5">{num}</span>
              <p className="text-sm text-foreground/90 leading-relaxed">{text}</p>
            </div>
          );
        }
        // Skip verdict lines (already shown in banner)
        if (line.includes('✅ PASS') || line.includes('❌ FAIL') || line.includes('⚠️ INCONCLUSIVE')) {
          return null;
        }
        // Normal text
        return line.trim() ? (
          <p key={i} className="text-sm text-foreground/90 leading-relaxed">{line}</p>
        ) : null;
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FoodTestingAIAssistant(props: AIAssistantProps) {
  const { foodName, foodEmoji, methodName, methodType } = props;

  const [isOpen,      setIsOpen]      = useState(false);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [stage,       setStage]       = useState<'initial' | 'testing' | 'result'>('initial');
  const [insightOpen, setInsightOpen] = useState(false);
  const [insights,    setInsights]    = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message — only when messages exist
  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Auto-send greeting
      sendWelcome();
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // ── Welcome message (no API call needed — instant) ──────────────────────
  const sendWelcome = () => {
    const welcome: Message = {
      role: 'assistant',
      content: `Hi! 👋 I'm your AI food safety assistant for the **${methodName}** test on ${foodEmoji} **${foodName}**.

I'll guide you through each step, interpret your observations, tell you exactly what the result means, and give you detailed insights about any adulterants found.

${methodType === 'lab' ? '⚠️ This is a lab test — please ensure you have proper safety equipment before starting.' : '🏠 This test can be done at home with common items.'}

What would you like to know first?`,
      timestamp: new Date(),
    };
    setMessages([welcome]);
  };

  // ── Call Gemini API ────────────────────────────────────────────────────────
  const callAI = async (userMessage: string, history: Message[]) => {
    const systemPrompt = buildSystemPrompt(props);
    return callGemini(
      systemPrompt,
      history.map(m => ({ role: m.role, content: m.content })),
      userMessage,
    );
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);
    setShowReplies(false);

    // Detect stage progression
    const lower = text.toLowerCase();
    if (lower.includes('start') || lower.includes('begin') || lower.includes('ready')) setStage('testing');
    if (lower.includes('pass') || lower.includes('fail') || lower.includes('result') ||
        lower.includes('blue') || lower.includes('colour') || lower.includes('color') ||
        lower.includes('smell') || lower.includes('float') || lower.includes('sink') ||
        lower.includes('bubble') || lower.includes('dissolve') || lower.includes('see')) {
      setStage('result');
    }

    try {
      const reply = await callAI(text, newHistory);
      const assistantMsg: Message = { role: 'assistant', content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);

      // After getting a result, show quick replies again
      if (reply.includes('PASS') || reply.includes('FAIL') || reply.includes('INCONCLUSIVE')) {
        setTimeout(() => setShowReplies(true), 800);
      }
    } catch (err: any) {
      let errorContent: string;
      if (err?.name === 'GeminiQuotaError' && err.isQuotaExhausted) {
        errorContent = '⚠️ The AI assistant is temporarily unavailable — the daily API quota has been reached. Please try again later (resets within 24 hours). In the meantime, you can follow the step-by-step instructions shown above the chat.';
      } else if (err?.name === 'GeminiQuotaError') {
        errorContent = '⏳ Too many requests — please wait a few seconds and try again.';
      } else {
        errorContent = "🔌 I'm having trouble connecting right now. Please check your internet connection and try again. In the meantime, you can follow the step-by-step instructions shown above the chat.";
      }
      const errMsg: Message = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fetch ingredient deep insight ─────────────────────────────────────────
  const fetchInsights = async () => {
    if (insights) { setInsightOpen(o => !o); return; }
    setInsightOpen(true);
    setInsightLoading(true);

    try {
      const insightText = await callGemini(
        'You are a food safety expert. Provide comprehensive, factual food safety reports.',
        [],
        `Provide a comprehensive food safety insight report for: ${foodName}

Cover these sections clearly with headers:
1. **Why it gets adulterated** — economic/logistical reasons
2. **Most common adulterants** — list: ${props.adulterants.join(', ')}
3. **Health risks** — short-term symptoms and long-term dangers for each adulterant
4. **FSSAI standards** — what Indian regulations say (acceptable limits, banned substances)
5. **How to buy safely** — practical tips for consumers to avoid adulterated ${foodName}
6. **Red flags to watch** — visual/smell/texture cues that suggest adulteration before testing

Keep each section concise (2-3 sentences). Use bullet points inside sections. Be factual and clear.`,
      );
      setInsights(insightText);
    } catch {
      setInsights('Could not load insights right now. Please try again.');
    } finally {
      setInsightLoading(false);
    }
  };

  // ── Reset chat ─────────────────────────────────────────────────────────────
  const resetChat = () => {
    setMessages([]);
    setStage('initial');
    setShowReplies(true);
    setTimeout(() => sendWelcome(), 100);
  };

  const quickReplies = stage === 'result' ? RESULT_QUICK_REPLIES : INITIAL_QUICK_REPLIES;

  return (
    <div className="mt-5 border-t border-border/50 pt-5">

      {/* ── Ingredient Insights Panel ─────────────────────────────────────── */}
      <div className={cn(
        'mb-4 rounded-2xl border overflow-hidden transition-all duration-300',
        insightOpen ? 'border-violet-200 shadow-md' : 'border-violet-200/60'
      )}>
        <button
          onClick={fetchInsights}
          className="w-full flex items-center justify-between gap-3 p-4 bg-violet-50/60 hover:bg-violet-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-violet-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-700 text-violet-900">
                AI Ingredient Insights — {foodEmoji} {foodName}
              </p>
              <p className="text-xs text-violet-600">Health risks · FSSAI standards · Buying tips · Red flags</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-700 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200 uppercase tracking-wide">
              AI Powered
            </span>
            {insightOpen
              ? <ChevronUp   className="h-4 w-4 text-violet-500" />
              : <ChevronDown className="h-4 w-4 text-violet-500" />
            }
          </div>
        </button>

        {insightOpen && (
          <div className="px-5 pb-5 pt-4 bg-violet-50/30 border-t border-violet-100">
            {insightLoading ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                <p className="text-sm text-violet-700">Generating insights for {foodName}…</p>
              </div>
            ) : (
              <div className="prose-sm max-w-none">
                <FormattedMessage content={insights} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── AI Assistant Chat ─────────────────────────────────────────────── */}
      <div className={cn(
        'rounded-2xl border overflow-hidden transition-all duration-300',
        isOpen
          ? (methodType === 'home' ? 'border-emerald-300 shadow-lg' : 'border-blue-300 shadow-lg')
          : 'border-border'
      )}>

        {/* Chat header / toggle */}
        <button
          onClick={() => setIsOpen(o => !o)}
          className={cn(
            'w-full flex items-center justify-between gap-3 p-4 transition-colors',
            isOpen
              ? (methodType === 'home' ? 'bg-emerald-600' : 'bg-blue-700')
              : 'bg-foreground hover:bg-foreground/90'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center',
              isOpen ? 'bg-white/20' : 'bg-primary/30'
            )}>
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-700 text-white">
                AI Testing Assistant
              </p>
              <p className="text-xs text-white/70">
                {isOpen ? 'Ask me anything about this test' : `Get guided help for "${methodName}"`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-700 px-2 py-1 rounded-full bg-white/15 text-white/90 border border-white/20">
              <Sparkles className="h-2.5 w-2.5" /> Gemini AI
            </span>
            {isOpen
              ? <ChevronUp   className="h-4 w-4 text-white/80" />
              : <ChevronDown className="h-4 w-4 text-white/80" />
            }
          </div>
        </button>

        {/* Chat body */}
        {isOpen && (
          <div className="flex flex-col bg-card">

            {/* Context pill */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/50">
              {methodType === 'home'
                ? <><span className="text-xs">🏠</span><span className="text-xs text-muted-foreground">Home test</span></>
                : <><Microscope className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Lab test</span></>
              }
              <span className="text-muted-foreground/40">·</span>
              <FlaskConical className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{methodName}</span>
              <div className="ml-auto">
                <button
                  onClick={resetChat}
                  title="Reset conversation"
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-muted/60 border border-border/60 rounded-tl-sm'
                  )}>
                    {msg.role === 'assistant'
                      ? <FormattedMessage content={msg.content} />
                      : <p>{msg.content}</p>
                    }
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/60">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Analysing…</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {showReplies && messages.length > 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2 border-t border-border/30 pt-3">
                <p className="w-full text-[10px] font-600 text-muted-foreground uppercase tracking-wider mb-1">Quick replies</p>
                {quickReplies.map(r => (
                  <button
                    key={r.value}
                    onClick={() => sendMessage(r.value)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                               bg-card border border-border hover:border-primary/40 hover:bg-primary/5
                               text-foreground transition-all disabled:opacity-50"
                  >
                    {r.icon && <span>{r.icon}</span>}
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Result quick actions */}
            {stage === 'result' && (
              <div className="px-4 pb-2 flex gap-2">
                <button
                  onClick={() => sendMessage("The test passed — what should I know about the purity of my sample?")}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
                             bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> It passed
                </button>
                <button
                  onClick={() => sendMessage("The test failed — I found adulteration. What are the health risks and what should I do now?")}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold
                             bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                >
                  <ThumbsDown className="h-3.5 w-3.5" /> It failed
                </button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
                  placeholder={`Ask about ${methodName}… e.g. "I see a blue colour, what does this mean?"`}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50
                             transition-all placeholder:text-muted-foreground/60 disabled:opacity-60"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow
                             hover:shadow-glow-lg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  {isLoading
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Send className="h-4 w-4 text-white" />
                  }
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
                AI responses are for guidance only. For official results, use FSSAI-certified labs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
