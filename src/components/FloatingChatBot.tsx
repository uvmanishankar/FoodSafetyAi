/**
 * FloatingChatBot — A beautiful, draggable floating chat assistant
 * -----------------------------------------------------------------
 * Renders as a fixed floating button + slide-up chat panel.
 * Uses the centralized server-side AI helper.
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

export default function FloatingChatBot(_: FloatingChatBotProps) {
  // Component intentionally disabled — renders nothing to remove the floating AI assistant.
  return null;
}
