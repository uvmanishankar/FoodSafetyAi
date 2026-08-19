/**
 * FoodTestingAIAssistant
 * ──────────────────────────────────────────────────────────────────────────
 * An AI-powered chat assistant embedded inside each test method card.
 * It guides users step-by-step through the test, interprets their results,
 * and provides deep ingredient/adulteration insights in real time.
 */

import { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, User, Loader2, Sparkles, RotateCcw,
  AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Lightbulb, FlaskConical,
  ThumbsUp, ThumbsDown, Microscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callGemini } from '@/lib/gemini';

function buildSystemPrompt(props) {
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

const INITIAL_QUICK_REPLIES = [
  { label: "I'm ready to start", value: "I'm ready to start the test. What should I do first?", icon: '🚀' },
  { label: "What materials do I need?", value: "What materials do I need before I begin?", icon: '📦' },
  { label: "Is this test accurate?", value: "How accurate is this test and what are its limitations?", icon: '🎯' },
  { label: "What am I looking for?", value: "What exactly am I looking for in this test?", icon: '👁️' },
];

const RESULT_QUICK_REPLIES = [
  { label: "I see it passed ✅", value: "The result looks like it passed the test.", icon: '✅' },
  { label: "I see it failed ❌", value: "The result looks like it failed — I can see the signs of adulteration.", icon: '❌' },
  { label: "I'm not sure 🤔", value: "I'm not sure about my result — can you help me interpret what I'm seeing?", icon: '🤔' },
  { label: "Something unexpected happened", value: "Something unexpected happened during the test — can you help?", icon: '⚠️' },
];

function FormattedMessage({ content }) {
  const hasPass = content.includes('✅ PASS') || content.includes('✅ pass');
  const hasFail = content.includes('❌ FAIL') || content.includes('❌ fail');
  const hasInconclusive = content.includes('⚠️ INCONCLUSIVE') || content.includes('⚠️ inconclusive');

  const lines = content.split('\n').filter(Boolean);

  return (
    <div className="space-y-2">
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
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-700 text-foreground">{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
              <p className="text-sm text-foreground/90 leading-relaxed">{line.replace(/^[-•]\s/, '')}</p>
            </div>
          );
        }
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
        if (line.includes('✅ PASS') || line.includes('❌ FAIL') || line.includes('⚠️ INCONCLUSIVE')) {
          return null;
        }
        return line.trim() ? (
          <p key={i} className="text-sm text-foreground/90 leading-relaxed">{line}</p>
        ) : null;
      })}
    </div>
  );
}

export default function FoodTestingAIAssistant(props) {
  return null;
}
