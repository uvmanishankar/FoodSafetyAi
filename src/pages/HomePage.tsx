import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanLine, FlaskConical, Bell, ArrowRight, Shield,
  Zap, Star, AlertTriangle, CheckCircle, XCircle, ChevronRight,
  TrendingUp, Globe, BarChart3, RefreshCw, Info, Flame, Eye,
  BookOpen, Heart, Microscope, Activity, Leaf, Search,
  Package, Tag, ShoppingCart, Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingChatBot from '@/components/FloatingChatBot';

// ─── Data ─────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  '🚨 Red 40 requires warning labels in the EU — still unrestricted in India',
  '⚠️ Potassium Bromate banned in 40+ countries — check your bread labels',
  '✅ Nova Group 1 foods = minimally processed = healthiest choice',
  '🔬 FSSAI regulates food safety standards across all of India',
  '⚠️ BHA (E320) banned in UK, Japan & EU — check your snack labels',
  '✅ One amla has 600mg Vitamin C — 8× your daily need',
  '🚨 70%+ of Indians are Vitamin D deficient despite abundant sunshine',
  '🔬 Aspartame classified IARC Group 2B — possibly carcinogenic (2023)',
  '⚠️ Average Indian consumes 2× the safe daily sodium limit',
  '✅ Turmeric (curcumin) has proven anti-inflammatory properties',
];

const QUOTES = [
  { text: "Let food be thy medicine and medicine be thy food.", author: "Hippocrates", year: "400 BC" },
  { text: "You are what you eat. So don't be fast, cheap, easy or fake.", author: "Unknown", year: "" },
  { text: "The food you eat can be either the safest and most powerful form of medicine, or the slowest form of poison.", author: "Ann Wigmore", year: "" },
  { text: "An ounce of prevention is worth a pound of cure. Read every label.", author: "Benjamin Franklin (adapted)", year: "" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn", year: "" },
  { text: "The first wealth is health. Know what goes into your food.", author: "Ralph Waldo Emerson (adapted)", year: "" },
];

const SAFETY_TIPS = [
  { icon: '🧼', tip: 'Wash hands for 20 seconds before and after handling food', category: 'Hygiene' },
  { icon: '🌡️', tip: 'Keep fridge below 4°C and freezer below -18°C to stop bacterial growth', category: 'Storage' },
  { icon: '🥩', tip: 'Cook chicken to 74°C internal temperature — no pink, ever', category: 'Cooking' },
  { icon: '🏷️', tip: 'Always read the ingredients list — not just the front of the pack', category: 'Labelling' },
  { icon: '💧', tip: 'Use safe water for cooking. Boil or filter if uncertain', category: 'Hygiene' },
  { icon: '🔪', tip: 'Use separate cutting boards for raw meat and vegetables', category: 'Cross-contamination' },
  { icon: '🕐', tip: 'Throw away cooked food left at room temperature for over 2 hours', category: 'Storage' },
  { icon: '🥑', tip: 'Eat a rainbow — 5+ different coloured vegetables/fruits per day', category: 'Nutrition' },
  { icon: '📦', tip: 'Check expiry dates, but also look for signs of spoilage (smell, colour, texture)', category: 'Labelling' },
  { icon: '🫙', tip: 'Avoid heating food in plastic containers — use glass or steel', category: 'Safety' },
  { icon: '🌿', tip: 'Wash all fruits and vegetables under running water, even if organic', category: 'Hygiene' },
  { icon: '🚫', tip: 'Never refreeze thawed meat — bacteria multiply rapidly during thawing', category: 'Storage' },
];

const COMPANY_TACTICS_PREVIEW = [
  { icon: Package, title: 'Shrinkflation', desc: 'Same price, same pack — 10–20% less product inside', color: 'text-red-600', bg: 'bg-red-50' },
  { icon: Tag, title: 'Nature-washing', desc: '"Natural", "Pure", "Farm-fresh" have zero legal meaning under FSSAI', color: 'text-green-700', bg: 'bg-green-50' },
  { icon: BarChart3, title: 'Health-washing', desc: '"High protein" bars hiding 40g of sugar behind the claim', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: ShoppingCart, title: 'Deceptive Serving Sizes', desc: 'Calorie counts shown for ¼ of a packet nobody actually eats alone', color: 'text-orange-600', bg: 'bg-orange-50' },
];

const FOOD_FACTS = [
  { emoji: '🍎', fact: 'Apples contain over 300 different chemical compounds, all naturally occurring — none of them artificial additives.', category: 'Nature' },
  { emoji: '🥦', fact: 'Broccoli has more Vitamin C per gram than an orange. One cup provides 135% of your daily Vitamin C need.', category: 'Nutrition' },
  { emoji: '🫐', fact: 'Blueberries are one of the only naturally blue-pigmented foods. Their colour comes from anthocyanins — powerful antioxidants.', category: 'Science' },
  { emoji: '🥕', fact: 'Carrots were originally purple. Orange carrots were selectively bred in 17th-century Netherlands to honour the Dutch royal family.', category: 'History' },
  { emoji: '🌶️', fact: 'Capsaicin in chillies tricks your brain into feeling heat without actual temperature change. It targets the same pain receptors as a hot stove.', category: 'Science' },
  { emoji: '🥑', fact: 'Avocados ripen only after being picked. A tree can hold ripe fruit for months — it acts as natural refrigeration.', category: 'Nature' },
  { emoji: '🍋', fact: 'Lemon juice has a pH of 2–3, which kills most food-borne bacteria including Salmonella and Listeria on contact.', category: 'Safety' },
  { emoji: '🫙', fact: 'Honey found in ancient Egyptian tombs was still edible after 3,000 years. Its low water content and hydrogen peroxide production make it self-preserving.', category: 'History' },
  { emoji: '🌾', fact: 'One grain of wheat contains all three parts: bran (fibre), germ (nutrients), endosperm (starch). White flour removes the first two.', category: 'Nutrition' },
  { emoji: '🍅', fact: 'Tomatoes are botanically a fruit — but the US Supreme Court legally ruled them a vegetable in 1893 for tariff purposes.', category: 'History' },
  { emoji: '🥛', fact: 'Human milk contains over 1,000 types of proteins. Cow milk contains about 25. Infant formula attempts to replicate just the most critical ones.', category: 'Science' },
  { emoji: '🧄', fact: 'Garlic produces allicin — a sulphur compound — only when crushed or chopped. Cooking whole cloves produces different, milder compounds.', category: 'Science' },
];

const STATS = [
  { end: 3000000, label: 'Products Indexed', icon: BarChart3, color: 'text-primary', suffix: '+' },
  { end: 30,      label: 'Countries Covered', icon: Globe,     color: 'text-sky-600', suffix: '+' },
  { end: 100,     label: 'Additives Tracked', icon: FlaskConical, color: 'text-violet-600', suffix: '+' },
  { end: 50,      label: 'Food Diseases Covered', icon: Activity,  color: 'text-red-600', suffix: '+' },
];

const MODULES = [
  { icon: ScanLine,    label: 'Analyze',    title: 'Product Analysis',        desc: 'Scan barcodes or OCR food labels. Instant safety scores and ingredient breakdowns.',        href: '/analyze',        accent: 'from-emerald-500/15 to-teal-500/10', ib: 'bg-emerald-500/12', ic: 'text-emerald-600', stat: '3M+ products', img: 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { icon: Microscope,  label: 'Test',       title: 'Food Testing Guide',       desc: 'Step-by-step AI-guided home and lab tests for milk, honey, oil, spices and more.',         href: '/testing-guide',  accent: 'from-blue-500/12 to-cyan-500/8',   ib: 'bg-blue-500/10',   ic: 'text-blue-600',   stat: 'AI assisted', img: 'https://images.pexels.com/photos/3944457/pexels-photo-3944457.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { icon: Heart,       label: 'Nutrition',  title: 'Diet & Nutrition',         desc: 'Daily intake guides, personalised diet plans, and AI nutrition assistant for Indians.',    href: '/nutrition',      accent: 'from-pink-500/12 to-rose-500/8',   ib: 'bg-pink-500/10',   ic: 'text-pink-600',   stat: 'Personalised', img: 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { icon: Eye,         label: 'Awareness',  title: 'Food Awareness',           desc: 'Expose corporate food tactics, label manipulation, and how to shop smarter.',               href: '/awareness',      accent: 'from-orange-500/12 to-red-500/8',  ib: 'bg-orange-500/10', ic: 'text-orange-600', stat: '10+ tactics', img: 'https://images.pexels.com/photos/3962286/pexels-photo-3962286.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { icon: Activity,    label: 'Diseases',   title: 'Foodborne Diseases',       desc: 'Identify, understand, and prevent food poisoning. AI symptom checker included.',            href: '/foodborne',      accent: 'from-red-500/12 to-rose-500/8',    ib: 'bg-red-500/10',    ic: 'text-red-600',    stat: 'AI diagnosis', img: 'https://images.pexels.com/photos/3945650/pexels-photo-3945650.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { icon: Bell,        label: 'Alerts',     title: 'Safety Alerts',            desc: 'Real-time food recalls, bans, and regulatory updates from FSSAI and global agencies.',     href: '/alerts',         accent: 'from-amber-500/12 to-orange-500/8', ib: 'bg-amber-500/10', ic: 'text-amber-600',  stat: 'Real-time', img: 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

// ─── Ticker ───────────────────────────────────────────────────────────────────
function SafetyTicker() {
  return (
    <div className="relative overflow-hidden bg-foreground text-background py-2.5">
      <div className="flex items-center gap-3 px-4">
        <span className="shrink-0 text-[10px] font-800 uppercase tracking-widest text-primary bg-primary/20 px-2 py-0.5 rounded">
          Live
        </span>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-16 whitespace-nowrap" style={{animation:'ticker 45s linear infinite'}}>
            {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
              <span key={i} className="text-xs font-medium opacity-85 shrink-0">{item}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix='' }: { end:number; suffix?:string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if(e.isIntersecting && !started.current){
        started.current = true;
        const t0 = performance.now();
        const tick = (now:number) => {
          const p = Math.min((now-t0)/2000,1);
          const ease = 1-Math.pow(1-p,3);
          setCount(Math.floor(ease*end));
          if(p<1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },{threshold:0.5});
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  },[end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Quote Rotator ────────────────────────────────────────────────────────────
function QuoteRotator() {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(i => (i+1)%QUOTES.length);
        setFading(false);
      }, 400);
    }, 6000);
    return () => clearInterval(timer);
  }, []);
  const q = QUOTES[idx];
  return (
    <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 sm:p-12 text-center">
      <div className="absolute inset-0 bg-dots opacity-10 pointer-events-none" />
      <Quote className="h-10 w-10 text-primary/40 mx-auto mb-6" />
      <div className={cn('transition-all duration-400', fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0')}>
        <p className="font-display text-xl sm:text-2xl font-700 text-background leading-relaxed mb-4 max-w-2xl mx-auto">
          "{q.text}"
        </p>
        <p className="text-sm text-background/60 font-medium">
          — {q.author}{q.year ? `, ${q.year}` : ''}
        </p>
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-6">
        {QUOTES.map((_,i) => (
          <button key={i} onClick={()=>setIdx(i)}
            className={cn('w-1.5 h-1.5 rounded-full transition-all', i===idx ? 'bg-primary w-4' : 'bg-background/30')} />
        ))}
      </div>
    </div>
  );
}

// ─── Safety Tips Wheel ────────────────────────────────────────────────────────
function SafetyTipsGrid() {
  const [active, setActive] = useState<number|null>(null);
  const cats = [...new Set(SAFETY_TIPS.map(t=>t.category))];
  const [filter, setFilter] = useState<string|null>(null);
  const shown = filter ? SAFETY_TIPS.filter(t=>t.category===filter) : SAFETY_TIPS;
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={()=>setFilter(null)}
          className={cn('text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
            !filter ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/40')}>
          All ({SAFETY_TIPS.length})
        </button>
        {cats.map(c=>(
          <button key={c} onClick={()=>setFilter(c===filter?null:c)}
            className={cn('text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all',
              filter===c ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/40')}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {shown.map((tip,i)=>(
          <button key={i} onClick={()=>setActive(active===i?null:i)}
            className={cn('text-left p-4 rounded-2xl border transition-all duration-200',
              active===i ? 'border-primary/40 bg-primary/6 shadow-glow' : 'border-border bg-card hover:border-primary/30')}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{tip.icon}</span>
              <div>
                <span className={cn('text-[10px] font-700 uppercase tracking-widest',
                  active===i ? 'text-primary' : 'text-muted-foreground/60')}>{tip.category}</span>
                <p className={cn('text-sm leading-relaxed mt-0.5',
                  active===i ? 'text-foreground font-medium' : 'text-muted-foreground')}>{tip.tip}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Food Facts Carousel ──────────────────────────────────────────────────────
function FoodFactsCarousel() {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const [filter, setFilter] = useState<string|null>(null);
  const cats = [...new Set(FOOD_FACTS.map(f=>f.category))];
  const shown = filter ? FOOD_FACTS.filter(f=>f.category===filter) : FOOD_FACTS;
  useEffect(()=>{
    if(!auto) return;
    const t = setTimeout(()=>setIdx(i=>(i+1)%shown.length),4000);
    return ()=>clearTimeout(t);
  },[idx,auto,shown.length]);
  const fact = shown[idx % shown.length];
  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-500" />
          <h3 className="font-display font-700 text-foreground">Food Facts</h3>
        </div>
        <button onClick={()=>setAuto(a=>!a)}
          className={cn('text-[10px] font-700 px-2 py-1 rounded-lg border transition-all',
            auto ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border')}>
          {auto ? '⏸ Auto' : '▶ Play'}
        </button>
      </div>
      {/* Category filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {cats.map(c=>(
          <button key={c} onClick={()=>{setFilter(c===filter?null:c);setIdx(0);}}
            className={cn('text-[10px] font-600 px-2 py-0.5 rounded-lg border transition-all',
              filter===c ? 'bg-amber-500 text-white border-amber-500' : 'bg-muted text-muted-foreground border-border hover:border-amber-300')}>
            {c}
          </button>
        ))}
      </div>
      {/* Fact display */}
      <div className="min-h-[120px] flex flex-col items-center justify-center text-center py-2">
        <div className="text-5xl mb-3">{fact?.emoji}</div>
        <p className="text-sm text-foreground leading-relaxed font-medium">{fact?.fact}</p>
      </div>
      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button onClick={()=>setIdx(i=>(i-1+shown.length)%shown.length)}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronRight className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
        </button>
        <div className="flex gap-1">
          {shown.slice(0,Math.min(shown.length,8)).map((_,i)=>(
            <button key={i} onClick={()=>setIdx(i)}
              className={cn('w-1.5 h-1.5 rounded-full transition-all',
                i===idx%shown.length ? 'bg-amber-500 w-4' : 'bg-border')} />
          ))}
        </div>
        <button onClick={()=>setIdx(i=>(i+1)%shown.length)}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ─── Company Tactics Preview ──────────────────────────────────────────────────
function CompanyTacticsPreview() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {COMPANY_TACTICS_PREVIEW.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className={cn('p-4 rounded-2xl border transition-all hover:shadow-md group', bg,
            color==='text-red-600'?'border-red-200':color==='text-green-700'?'border-green-200':color==='text-blue-600'?'border-blue-200':'border-orange-200')}>
            <div className="flex items-start gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                color==='text-red-600'?'bg-red-100':color==='text-green-700'?'bg-green-100':color==='text-blue-600'?'bg-blue-100':'bg-orange-100')}>
                <Icon className={cn('h-4.5 w-4.5', color)} />
              </div>
              <div>
                <p className={cn('font-display font-700 text-sm mb-1', color)}>{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Link to="/awareness"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow hover:opacity-90 transition-all">
        See All 10 Corporate Tactics <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ─── Danger Ingredient Quick Check ───────────────────────────────────────────
const DANGER_DB: Record<string,{level:'high'|'medium'|'low';why:string;countries:string}> = {
  'red 40':            {level:'high',  why:'Linked to ADHD in children. Warning label required in EU.',        countries:'Restricted: EU'},
  'yellow 5':          {level:'high',  why:'Causes hyperactivity in sensitive children.',                       countries:'Restricted: EU'},
  'bha':               {level:'high',  why:'Possibly carcinogenic. Banned in UK, Japan and EU.',               countries:'Banned: UK, JP, EU'},
  'aspartame':         {level:'medium',why:'IARC Group 2B (possibly carcinogenic, 2023).',                     countries:'Monitored: Global'},
  'sodium benzoate':   {level:'high',  why:'Forms benzene with Vitamin C. Linked to ADHD in children.',        countries:'Restricted: EU'},
  'msg':               {level:'low',   why:'Safe per FDA/WHO. Causes reactions in sensitive individuals.',      countries:'Approved: Global'},
  'sodium nitrite':    {level:'high',  why:'Forms carcinogenic nitrosamines at high heat.',                     countries:'Restricted: EU, US'},
  'potassium bromate': {level:'high',  why:'Classified possible carcinogen (Group 2B) by IARC.',               countries:'Banned: EU, UK, CA, IN'},
  'carrageenan':       {level:'medium',why:'Inflammatory at high doses. Removed from US organic standards.',   countries:'Restricted: US Organic'},
  'tbhq':              {level:'medium',why:'Nausea/vision problems in high doses. Banned in Japan.',           countries:'Banned: JP'},
  'bht':               {level:'medium',why:'Endocrine disruptor at high doses. Restricted in EU.',             countries:'Restricted: EU'},
};
const LEVEL_STYLE = {
  high:   {bg:'bg-red-50',  border:'border-red-200',  text:'text-red-700',  badge:'bg-red-100 text-red-700 border-red-200',  icon:XCircle,       label:'HIGH RISK'},
  medium: {bg:'bg-amber-50',border:'border-amber-200',text:'text-amber-700',badge:'bg-amber-100 text-amber-700 border-amber-200',icon:AlertTriangle,label:'MODERATE'},
  low:    {bg:'bg-blue-50', border:'border-blue-200', text:'text-blue-700', badge:'bg-blue-100 text-blue-700 border-blue-200', icon:Info,          label:'LOW RISK'},
};
function IngredientChecker() {
  const [input,setInput]=useState('');
  const [result,setResult]=useState<(typeof DANGER_DB[string]&{name:string})|null>(null);
  const [notFound,setNotFound]=useState(false);
  const check=(val?:string)=>{
    const k=(val??input).toLowerCase().trim();
    setNotFound(false);setResult(null);if(!k)return;
    const m=Object.entries(DANGER_DB).find(([dk])=>k.includes(dk)||dk.includes(k));
    if(m)setResult({...m[1],name:m[0]});
    else setNotFound(true);
  };
  const s=result?LEVEL_STYLE[result.level]:null;
  const Icon=s?.icon;
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()}
            placeholder="e.g. Red 40, BHA, aspartame…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
        </div>
        <button onClick={()=>check()}
          className="px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow hover:opacity-90 transition-all">
          Check
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {['Red 40','BHA','Aspartame','MSG','Sodium Benzoate'].map(s=>(
          <button key={s} onClick={()=>{setInput(s);check(s);}}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors">
            {s}
          </button>
        ))}
      </div>
      {result&&s&&Icon&&(
        <div className={cn('p-4 rounded-xl border',s.bg,s.border)}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4 shrink-0',s.text)} />
              <p className={cn('font-display font-700 capitalize',s.text)}>{result.name}</p>
            </div>
            <span className={cn('text-[10px] font-800 px-2 py-0.5 rounded border uppercase tracking-wide',s.badge)}>{s.label}</span>
          </div>
          <p className={cn('text-sm mb-1',s.text)}>{result.why}</p>
          <p className={cn('text-xs font-medium opacity-80',s.text)}>{result.countries}</p>
        </div>
      )}
      {notFound&&(
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <p className="font-semibold text-emerald-800 text-sm">Not in our watchlist</p>
          </div>
          <p className="text-xs text-emerald-700">"{input}" isn't flagged. Use the full Ingredient Explorer for a deeper search.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .animate-ticker{animation:ticker 45s linear infinite}
        .animate-ticker:hover{animation-play-state:paused}
      `}</style>
      <div className="page-wrapper">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative flex flex-col justify-center gradient-hero overflow-hidden pt-16 pb-16">
          <div className="hero-orb w-[600px] h-[600px] bg-primary/10 top-[-120px] left-[-150px]" />
          <div className="hero-orb w-[450px] h-[450px] bg-teal-400/7 bottom-[-80px] right-[-80px]" />
          <div className="hero-orb w-[300px] h-[300px] bg-primary/6 top-1/3 right-[15%]" />
          <div className="absolute inset-0 bg-dots opacity-35 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-8 sm:px-12 w-full py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="animate-fade-up inline-flex items-center gap-2 mb-6 px-3.5 py-2 rounded-full border border-primary/25 bg-primary/7 text-primary text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
                  India's Food Safety Intelligence Platform
                </div>
                <h1 className="animate-fade-up delay-100 font-display text-5xl sm:text-6xl lg:text-[4.2rem] font-800 text-foreground mb-5 leading-[1.1] text-balance">
                  Know exactly
                  <span className="block bg-gradient-to-r from-primary via-emerald-500 to-teal-400 bg-clip-text text-transparent">what's in</span>
                  your food.
                </h1>
                <p className="animate-fade-up delay-200 text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                  Scan products or any processed food items, decode every ingredient, test for adulteration, track diseases, plan your diet, and expose corporate food manipulation — all free, all in one place.
                </p>
                <div className="animate-fade-up delay-300 flex flex-wrap gap-3 mb-8">
                  <Link to="/analyze" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl gradient-primary text-white font-semibold shadow-glow hover:shadow-glow-lg hover:opacity-92 transition-all">
                    <ScanLine className="h-4 w-4" /> Analyze a Product <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link to="/testing-guide" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-card font-semibold text-sm hover:border-primary/40 hover:bg-primary/4 transition-all shadow-sm">
                    <Microscope className="h-4 w-4 text-primary" /> Test Your Food
                  </Link>
                </div>
                <div className="animate-fade-up delay-400 flex flex-wrap gap-2">
                  {[
                    {icon:Shield,  text:'3M+ products'},
                    {icon:Globe,   text:'30+ countries'},
                    {icon:Zap,     text:'AI powered'},
                    {icon:Star,    text:'Free forever'},
                  ].map(({icon:Icon,text})=>(
                    <span key={text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 text-foreground/60 text-xs font-medium border border-border/60">
                      <Icon className="h-3 w-3 text-primary" /> {text}
                    </span>
                  ))}
                </div>
              </div>
              {/* Hero right — Beautiful images grid */}
              <div className="animate-fade-up delay-200 grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-border/40 h-48">
                    <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop" alt="Fresh vegetables" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-border/40 h-40">
                    <img src="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=300&h=160&fit=crop" alt="Healthy fruits" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-border/40 h-40">
                    <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=160&fit=crop" alt="Organic food" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-border/40 h-48">
                    <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=200&fit=crop" alt="Nutritious meal" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-float opacity-35">
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-foreground/40" />
            <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-medium">Scroll</span>
          </div>
        </section>

        {/* ── TICKER ───────────────────────────────────────────────────────── */}
        <SafetyTicker />

        {/* ── ANIMATED STATS ───────────────────────────────────────────────── */}
        <section className="border-b border-border/70 bg-muted/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {STATS.map(({end,label,icon:Icon,color,suffix})=>(
                <div key={label} className="flex flex-col items-center text-center p-5 rounded-2xl bg-card border border-border">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                    color==='text-primary'?'bg-primary/10':color==='text-sky-600'?'bg-sky-50':color==='text-violet-600'?'bg-violet-50':'bg-red-50')}>
                    <Icon className={cn('h-5 w-5',color)} />
                  </div>
                  <div className={cn('font-display text-3xl font-800 mb-1',color)}>
                    <AnimatedCounter end={end} suffix={suffix} />
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ALL MODULES GRID ─────────────────────────────────────────────── */}

          {/* ── QUOTE SECTION ────────────────────────────────────────────────── */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold border border-primary/18">
                <Quote className="h-3 w-3" /> Food &amp; Health Wisdom
              </div>
              <h2 className="font-display text-3xl font-800 text-foreground mb-2">Words that nourish the mind</h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">Timeless wisdom about the power of food for your body and life.</p>
            </div>
            <QuoteRotator />
          </section>

          {/* ── ALL MODULES GRID ─────────────────────────────────────────────── */}
        <section className="bg-muted/20 border-y border-border/60 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-primary/8 text-primary text-xs font-semibold border border-primary/18">
                <Leaf className="h-3 w-3" /> Everything in one platform
              </div>
              <h2 className="font-display text-4xl font-800 text-foreground mb-3">8 modules. One mission.</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">From scanning a label to diagnosing food poisoning — we've built every tool for food safety, nutrition, and awareness.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {MODULES.map(({icon:Icon,label,title,desc,href,accent,ib,ic,stat,img},i)=>(
                <Link key={href} to={href}
                  className={cn('group relative flex flex-col p-0 rounded-2xl border border-border bg-card card-hover overflow-hidden animate-fade-up',`delay-${(i%4+1)*100}`)}>
                  {img && (
                    <div className="relative h-32 overflow-hidden bg-muted">
                      <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                    </div>
                  )}
                  <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10 p-6 flex-1 flex flex-col">
                    <div className={`w-11 h-11 rounded-xl ${ib} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-5 w-5 ${ic}`} />
                    </div>
                    <span className="inline-block mb-2 text-[10px] font-800 uppercase tracking-widest text-muted-foreground">{label}</span>
                    <h3 className="font-display text-base font-700 text-foreground mb-2 leading-tight">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">{desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground/60">{stat}</span>
                      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold',ic,'group-hover:translate-x-1 transition-transform')}>
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── SAFETY TIPS ──────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <Shield className="h-3 w-3" /> Safety Tips
              </div>
              <h2 className="font-display text-4xl font-800 text-foreground">12 rules that protect your family</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">Tap any tip to highlight it. Filter by category.</p>
            </div>
          </div>
          <SafetyTipsGrid />
        </section>

        {/* ── COMPANY TACTICS + FOOD FACTS stacked ────────────────────────── */}
        <section className="bg-muted/20 border-y border-border/60 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col gap-16 max-w-3xl mx-auto">
              {/* Company Tactics */}
              <div>
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  <Eye className="h-3 w-3" /> Consumer Warning
                </div>
                <h2 className="font-display text-3xl font-800 text-foreground mb-2">How food companies manipulate you</h2>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">From shrinkflation to health-washing — the tactics behind every shelf in the supermarket. Know what to look for.</p>
                <CompanyTacticsPreview />
              </div>
              {/* Food Facts */}
              <div>
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                  <Flame className="h-3 w-3" /> Did You Know?
                </div>
                <h2 className="font-display text-3xl font-800 text-foreground mb-2">Food science facts</h2>
                <p className="text-muted-foreground mb-6 text-sm leading-relaxed">Surprising, science-backed food facts that will change how you think about what you eat. Auto-rotates every 4 seconds.</p>
                <FoodFactsCarousel />
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
          <div className="relative overflow-hidden p-10 rounded-3xl gradient-primary text-white text-center shadow-glow-lg">
            <div className="absolute inset-0 bg-dots opacity-15 pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20">
                <Leaf className="h-3 w-3" /> Free · No account needed
              </div>
              <h2 className="font-display text-4xl font-800 mb-3 text-balance">Start making smarter food choices today</h2>
              <p className="text-white/80 max-w-md mx-auto mb-8 text-base leading-relaxed">
                Join thousands of Indians making informed decisions about the food on their plate. No login. No payment. Just clarity.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/analyze" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-700 text-sm hover:bg-white/95 transition-all shadow-lg">
                  <ScanLine className="h-4 w-4" /> Analyze a Product
                </Link>
                <Link to="/nutrition" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/15 text-white font-semibold text-sm border border-white/25 hover:bg-white/25 transition-all">
                  <Heart className="h-4 w-4" /> Plan My Diet
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <FloatingChatBot
        botName="FoodSafety AI"
        subtitle="Ask about food safety, ingredients & nutrition"
        systemPrompt={`You are FoodSafety AI — an expert assistant for India's food safety awareness platform. Help users with:
1. Food safety — safe cooking temperatures, storage guidelines, contamination risks
2. Ingredient analysis — what additives mean, E-numbers, which are safe or harmful
3. Nutrition guidance — daily intake, Indian dietary recommendations, deficiency fixes
4. Foodborne illness — symptoms, prevention, which foods cause illness
5. Label reading — how to decode nutrition labels, detect misleading claims
6. FSSAI regulations — Indian food safety standards and consumer rights
Always give practical, clear, India-specific advice. Format with clear sections and bullet points.`}
        welcomeMessage={`👋 Hi! I'm FoodSafety AI — your personal food safety guide.

I can help you with:
- **Ingredient safety** — is this additive safe?
- **Food storage** — how to store food correctly
- **Nutrition** — daily requirements for Indian diet
- **Label reading** — decode any food label instantly

What would you like to know?`}
        quickReplies={[
          'Is Red 40 dye safe to eat?',
          'How do I safely store cooked food?',
          'What does E211 mean on a label?',
          'How much protein does an Indian adult need?',
        ]}
        accentColor="text-emerald-600"
        accentBg="bg-emerald-50"
        iconGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        botIconColor="text-emerald-600"
        botIconBg="bg-emerald-100"
      />
    </>
  );
}
