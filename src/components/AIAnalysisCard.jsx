import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp,
         Sparkles, Users, AlertTriangle, FileText, RefreshCw, Flame, Zap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── parser ─────────────────────────────────────────── */
function parseAISummary(raw) {
  const get = (key) => {
    const match = raw.match(new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z_]+:|$)`, 's'));
    return match ? match[1].trim() : '';
  };
  const rec = raw.includes('RECOMMENDATION: SAFE')
    ? 'SAFE' : raw.includes('RECOMMENDATION: AVOID')
    ? 'AVOID' : 'CAUTION';
  return {
    summary: get('SUMMARY'),
    concerns: get('CONCERNS'),
    recommendation: rec,
    whoShouldCare: get('WHO_SHOULD_CARE'),
  };
}

/* ─── theme ──────────────────────────────────────────── */
const THEME = {
  safe: {
    gradient: 'from-emerald-500 to-teal-500',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'text-emerald-700',
    muted: 'text-emerald-600',
    track: 'bg-emerald-100',
    bar: 'bg-emerald-500',
    label: 'SAFE TO EAT',
    rowBg: 'bg-white/60',
    Icon: ShieldCheck,
  },
  caution: {
    gradient: 'from-amber-500 to-orange-400',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    pill: 'bg-amber-100 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'text-amber-700',
    muted: 'text-amber-600',
    track: 'bg-amber-100',
    bar: 'bg-amber-500',
    label: 'USE CAUTION',
    rowBg: 'bg-white/60',
    Icon: ShieldAlert,
  },
  avoid: {
    gradient: 'from-red-500 to-rose-500',
    lightBg: 'bg-red-50',
    border: 'border-red-200',
    pill: 'bg-red-100 text-red-800 border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    accent: 'text-red-700',
    muted: 'text-red-600',
    track: 'bg-red-100',
    bar: 'bg-red-500',
    label: 'AVOID',
    rowBg: 'bg-white/60',
    Icon: ShieldX,
  },
};

const SEVERITY_CONFIG = {
  high:   { label: 'High Risk',   bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    Icon: Flame },
  medium: { label: 'Moderate',    bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400',  Icon: AlertTriangle },
  low:    { label: 'Low Risk',    bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400',   Icon: Info },
};

const SCORE = { safe: 92, caution: 55, avoid: 18 };

/* ─── animated score ─────────────────────────────────── */
function AnimatedScore({ value, colorClass }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let cur = 0;
    const step = Math.ceil(value / 40);
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setN(cur);
      if (cur >= value) clearInterval(t);
    }, 25);
    return () => clearInterval(t);
  }, [value]);
  return <span className={cn('text-4xl font-black tabular-nums', colorClass)}>{n}</span>;
}

/* ─── loading shimmer ────────────────────────────────── */
function LoadingState() {
  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 overflow-hidden">
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 rounded-full bg-purple-200 animate-pulse" />
          <div className="h-3 w-24 rounded-full bg-purple-100 animate-pulse" />
        </div>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {[100,80,90,60].map((w,i) => (
          <div key={i} className="h-3 rounded-full bg-purple-100 animate-pulse"
            style={{ width:`${w}%`, animationDelay:`${i*0.1}s` }} />
        ))}
      </div>
      <div className="px-5 pb-4">
        <p className="text-xs text-purple-400 font-medium flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Scanning all ingredients for harmful substances…
        </p>
      </div>
    </div>
  );
}

/* ─── collapsible info row ───────────────────────────── */
function InfoRow({ icon: Icon, label, value, accent, muted, border }) {
  const [open, setOpen] = useState(false);
  const isLong = value.length > 80;
  return (
    <div className={cn('rounded-xl border p-3.5 bg-white/60', border)}>
      <div className="flex items-start gap-2.5">
        <div className={cn('p-1.5 rounded-lg shrink-0 bg-white border', border)}>
          <Icon className={cn('w-3.5 h-3.5', muted)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-0.5', muted)}>{label}</p>
          <p className={cn('text-sm leading-relaxed', accent, !open && isLong ? 'line-clamp-2' : '')}>
            {value || '—'}
          </p>
          {isLong && (
            <button onClick={() => setOpen(v => !v)}
              className={cn('mt-1 text-xs font-medium flex items-center gap-0.5', muted)}>
              {open ? <><ChevronUp className="w-3 h-3"/>Show less</> : <><ChevronDown className="w-3 h-3"/>Read more</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── harmful ingredient card ────────────────────────── */
function HarmfulIngredientCard({ item, index }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.medium;
  const { Icon: SevIcon } = sev;

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden transition-all duration-200',
        sev.border,
        open ? 'bg-white' : 'bg-white/70',
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* header row — always visible */}
      <button
        className="w-full text-left px-3.5 py-3 flex items-center gap-3"
        onClick={() => setOpen(v => !v)}
      >
        {/* severity dot */}
        <span className={cn('w-2 h-2 rounded-full shrink-0', sev.dot)} />

        {/* name */}
        <span className="flex-1 text-sm font-semibold text-gray-800 capitalize truncate">
          {item.name}
        </span>

        {/* severity badge */}
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0', sev.bg, sev.text, sev.border)}>
          <SevIcon className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />
          {sev.label}
        </span>

        {/* chevron */}
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {/* expandable detail */}
      {open && (
        <div className="px-3.5 pb-3.5 pt-0 space-y-2.5 border-t border-dashed border-gray-100">
          <div className="pt-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Why it's harmful</p>
            <p className="text-sm text-gray-700 leading-relaxed">{item.reason}</p>
          </div>
          <div className={cn('rounded-lg p-3 border', sev.bg, sev.border)}>
            <p className={cn('text-[10px] font-bold uppercase tracking-widest mb-1', sev.text)}>
              Health effects if consumed regularly
            </p>
            <p className={cn('text-sm leading-relaxed', sev.text)}>{item.healthEffect}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────── */
export default function AIAnalysisCard({
  aiSummary, aiRecommendation, aiHarmfulIngredients = [], loading, onRetry,
}) {
  const [expanded, setExpanded] = useState(true);

  if (loading) return <LoadingState />;
  if (!aiSummary) return null;

  const parsed = parseAISummary(aiSummary);
  const theme = THEME[aiRecommendation];
  const { Icon } = theme;
  const score = SCORE[aiRecommendation];
  const hasConcerns = parsed.concerns && !/^none/i.test(parsed.concerns);

  // Sort: high first, then medium, then low
  const sortedHarmful = [...aiHarmfulIngredients].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 1) - (order[b.severity] ?? 1);
  });

  const highCount = sortedHarmful.filter(h => h.severity === 'high').length;
  const medCount  = sortedHarmful.filter(h => h.severity === 'medium').length;

  return (
    <div className={cn('rounded-2xl border overflow-hidden shadow-sm', theme.border, theme.lightBg)}>
      {/* gradient strip */}
      <div className={cn('bg-gradient-to-r h-1', theme.gradient)} />

      {/* header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', theme.iconBg)}>
          <Icon className={cn('w-5 h-5', theme.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn('font-bold text-sm', theme.accent)}>AI Safety Analysis</h3>
            <span className={cn('text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full border', theme.pill)}>
              {theme.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Powered by Groq · Llama 3</p>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <AnimatedScore value={score} colorClass={theme.accent} />
          <span className="text-[9px] text-muted-foreground font-semibold tracking-wide">SAFETY SCORE</span>
        </div>
        <button className={cn('p-1.5 rounded-lg ml-1', theme.iconBg)}>
          {expanded
            ? <ChevronUp className={cn('w-4 h-4', theme.muted)} />
            : <ChevronDown className={cn('w-4 h-4', theme.muted)} />}
        </button>
      </div>

      {/* score bar */}
      <div className={cn('mx-5 mb-4 h-1.5 rounded-full overflow-hidden', theme.track)}>
        <div className={cn('h-full rounded-full transition-all duration-1000 ease-out', theme.bar)}
          style={{ width: `${score}%` }} />
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">

          {/* summary */}
          <InfoRow icon={FileText} label="Summary" value={parsed.summary}
            accent={theme.accent} muted={theme.muted} border={theme.border} />

          {/* concerns */}
          {hasConcerns ? (
            <InfoRow icon={AlertTriangle} label="Concerns" value={parsed.concerns}
              accent={theme.accent} muted={theme.muted} border={theme.border} />
          ) : (
            <div className={cn('rounded-xl border p-3 bg-white/60 flex items-center gap-2.5', theme.border)}>
              <ShieldCheck className={cn('w-4 h-4 shrink-0', theme.iconColor)} />
              <p className={cn('text-sm', theme.muted)}>No major concerns detected</p>
            </div>
          )}

          {/* who should care */}
          <InfoRow icon={Users} label="Who Should Be Careful" value={parsed.whoShouldCare}
            accent={theme.accent} muted={theme.muted} border={theme.border} />

          {/* ── HARMFUL INGREDIENTS SECTION ── */}
          {sortedHarmful.length > 0 && (
            <div className="space-y-2">
              {/* section header */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-gray-700">
                    Harmful Substances Found
                  </span>
                  <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                    {sortedHarmful.length}
                  </span>
                </div>
                {/* summary pills */}
                <div className="flex gap-1.5">
                  {highCount > 0 && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded-full">
                      {highCount} high
                    </span>
                  )}
                  {medCount > 0 && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      {medCount} moderate
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-400 -mt-1">Tap any ingredient to see why it's harmful and its health effects</p>

              {/* ingredient cards */}
              <div className="space-y-2">
                {sortedHarmful.map((item, i) => (
                  <HarmfulIngredientCard key={i} item={item} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* no harmful ingredients found */}
          {sortedHarmful.length === 0 && aiSummary && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700">No harmful substances detected</p>
                <p className="text-xs text-emerald-600 mt-0.5">All scanned ingredients appear safe for general consumption</p>
              </div>
            </div>
          )}

          {/* retry */}
          {onRetry && (
            <button onClick={onRetry}
              className={cn(
                'w-full mt-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                'bg-white/70 hover:bg-white active:scale-[0.98]',
                theme.border, theme.muted,
              )}>
              <RefreshCw className="w-3 h-3" />
              Re-analyse with AI
            </button>
          )}
        </div>
      )}
    </div>
  );
}
