import { useState, useEffect } from 'react';
import {
  Bell, Loader2, AlertCircle, Clock, ExternalLink, Sparkles,
  Newspaper, RefreshCw, Search, Globe, ShieldAlert, Scale,
  AlertTriangle, Ban, Utensils, FlaskConical, Tag, FileText,
  Siren, ChevronDown, ChevronUp, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callGemini } from '@/lib/gemini';
import FloatingChatBot from '@/components/FloatingChatBot';

const ALERTS_BOT_CONFIG = {
  botName: 'Food Safety Alert AI',
  subtitle: 'Ask about food recalls, alerts & safety news',
  systemPrompt: `You are a food safety alerts expert for India. Help users understand: current food safety recalls and what products are affected, what actions to take when a product is recalled, food contamination risks and how to identify them, FSSAI enforcement actions and recalls, foodborne illness outbreaks and prevention, how to stay updated on food safety news, and how to report unsafe food to FSSAI or local authorities. Be concise, actionable, and India-specific.`,
  welcomeMessage: `👋 Hi! I'm Food Safety Alert AI.\n\nI can help you:\n- **Understand food safety alerts** and recalls\n- **Know what action to take** on recalled products\n- **Identify contamination risks** in your food\n- **Learn about FSSAI** enforcement actions\n- **Report unsafe food** products\n\n**What food safety concern can I help with?**`,
  quickReplies: [
    'What should I do with recalled food?',
    'How to identify food contamination?',
    'How to report unsafe food to FSSAI?',
    'Common food adulterants in India',
  ],
  accentColor: 'text-amber-600',
  accentBg: 'bg-amber-50',
  iconGradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
  botIconColor: 'text-amber-600',
  botIconBg: 'bg-amber-100',
};
// ─── Types ──────────────────────────────────────────────────────────────────

interface Article {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
  author: string | null;
}

type TabKey = 'alerts' | 'regulations';

// ─── Category Queries ───────────────────────────────────────────────────────

const ALERT_CATEGORIES = [
  { label: 'All Alerts', query: '(food safety OR food recall OR food contamination OR food adulteration OR food poisoning) AND (India OR FSSAI OR "Food Safety and Standards Authority of India")', icon: ShieldAlert, color: 'text-red-600' },
  { label: 'Contamination', query: '(food contamination OR contaminated food OR food adulteration OR adulterated spices OR adulterated milk) AND (India OR FSSAI)', icon: AlertTriangle, color: 'text-orange-600' },
  { label: 'Outbreaks', query: '(food poisoning outbreak OR foodborne illness outbreak OR salmonella OR listeria OR e. coli) AND (India OR school OR canteen OR restaurant)', icon: Siren, color: 'text-red-700' },
  { label: 'Unsafe Restaurants', query: '(restaurant hygiene violation OR unsafe restaurant OR food license cancelled OR kitchen raid) AND (FSSAI OR municipal OR India)', icon: Utensils, color: 'text-amber-600' },
  { label: 'Recalls', query: '(food recall OR product recall OR batch recall OR contamination recall) AND (India OR FSSAI OR manufacturer)', icon: Ban, color: 'text-rose-600' },
];

const REGULATION_CATEGORIES = [
  { label: 'All Regulations', query: '(FSSAI regulation OR food safety law India OR food regulation update OR standards notification) AND (India OR ministry)', icon: Scale, color: 'text-blue-600' },
  { label: 'New Laws', query: '(new food safety law India OR FSSAI amendment OR food policy India OR draft regulation) AND (gazette OR notification OR FSSAI)', icon: FileText, color: 'text-indigo-600' },
  { label: 'Labeling Rules', query: '(food labelling rule India OR FSSAI labelling OR packaging regulation OR front-of-pack labelling) AND (India OR FSSAI)', icon: Tag, color: 'text-violet-600' },
  { label: 'Hygiene Guidelines', query: '(restaurant hygiene guideline India OR FSSAI hygiene rating OR food safety standard) AND (FSSAI OR guidelines)', icon: ShieldCheck, color: 'text-emerald-600' },
  { label: 'Food Bans', query: '(food ban India OR banned food ingredient OR FSSAI prohibition OR import ban food) AND (India OR FSSAI)', icon: Ban, color: 'text-red-600' },
  { label: 'Testing Regulations', query: '(food testing regulation India OR NABL food lab OR FSSAI testing standard OR food lab accreditation) AND (India OR FSSAI)', icon: FlaskConical, color: 'text-cyan-600' },
];

const NEWS_DOMAINS = [
  'fssai.gov.in',
  'who.int',
  'thehindu.com',
  'indianexpress.com',
  'timesofindia.indiatimes.com',
  'hindustantimes.com',
  'livemint.com',
  'business-standard.com',
  'moneycontrol.com',
  'ndtv.com',
  'newindianexpress.com',
].join(',');

const NOISE_TERMS = [
  'recipe', 'celebrity', 'restaurant review', 'stock price', 'share price', 'quarterly earnings',
  'fashion', 'movie', 'music', 'sports', 'cricket', 'election campaign', 'travel', 'astrology',
];

const ALERT_SIGNAL_TERMS = [
  'food recall', 'recall', 'contamination', 'adulteration', 'food poisoning', 'foodborne', 'outbreak',
  'unsafe', 'seized', 'raid', 'license cancelled', 'hygiene violation', 'sample failed',
  'substandard', 'misbranded', 'spurious',
];

const REGULATION_SIGNAL_TERMS = [
  'fssai', 'regulation', 'standard', 'notification', 'gazette', 'compliance', 'guideline',
  'labelling', 'packaging', 'licence', 'enforcement', 'advisory', 'ban', 'prohibition',
  'testing protocol', 'nabl',
];

const INDIA_SIGNAL_TERMS = [
  'india', 'indian', 'fssai', 'food safety and standards authority of india', 'ministry of health',
  'state food safety',
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function articleText(a: Article) {
  return `${a.title || ''} ${a.description || ''} ${a.source?.name || ''}`.toLowerCase();
}

function countHits(text: string, terms: string[]) {
  return terms.reduce((n, t) => (text.includes(t) ? n + 1 : n), 0);
}

function relevanceScore(article: Article, isRegulation: boolean) {
  const text = articleText(article);
  const signalTerms = isRegulation ? REGULATION_SIGNAL_TERMS : ALERT_SIGNAL_TERMS;
  let score = 0;

  score += countHits(text, signalTerms) * 3;
  score += countHits(text, INDIA_SIGNAL_TERMS) * 2;
  score -= countHits(text, NOISE_TERMS) * 4;

  if (text.includes('fssai')) score += 5;
  if (text.includes('recall') || text.includes('outbreak') || text.includes('contamination')) score += 2;
  if (article.source?.name?.toLowerCase().includes('fssai')) score += 6;

  return score;
}

function normalizeAndRankArticles(rawArticles: Article[], isRegulation: boolean) {
  const unique = new Map<string, Article>();

  for (const article of rawArticles || []) {
    if (!article?.title || article.title === '[Removed]' || !article?.url) continue;

    const key = `${article.title.trim().toLowerCase()}|${article.url.trim().toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, article);
  }

  const ranked = Array.from(unique.values())
    .map(article => ({ article, score: relevanceScore(article, isRegulation) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
    })
    .map(({ article }) => article);

  if (ranked.length > 0) return ranked;

  return Array.from(unique.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// GDELT queries: plain space-separated keywords only — no quotes, no OR.
// Quoted phrases and OR operators cause GDELT's query parser to return empty results.
const GDELT_ALERT_QUERIES = [
  'food safety recall contamination india',
  'food contamination adulteration india fssai',
  'food poisoning foodborne outbreak india',
  'restaurant hygiene violation fssai india',
  'food recall india manufacturer',
];

const GDELT_REGULATION_QUERIES = [
  'fssai regulation standard notification india',
  'food safety law regulation india amendment',
  'food labelling packaging regulation fssai',
  'fssai hygiene guideline india',
  'food ban prohibited ingredient fssai india',
  'food testing accreditation standard india fssai',
];

// GDELT seendate compact format: "20260317T120000Z" → standard ISO-8601
function parseGdeltDate(seendate?: string): string {
  if (!seendate) return new Date().toISOString();
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  try { return new Date(seendate).toISOString(); } catch { return new Date().toISOString(); }
}

type GdeltRawArticle = { title?: string; seendate?: string; url?: string; socialimage?: string; domain?: string; sourcecountry?: string };

function mapGdeltArticles(articles: GdeltRawArticle[]): Article[] {
  return (articles || [])
    .filter(a => a?.title && a?.url)
    .map(a => ({
      title: a.title!,
      description: null,
      url: a.url!,
      urlToImage: a.socialimage || null,
      publishedAt: parseGdeltDate(a.seendate),
      source: { name: a.domain || a.sourcecountry || 'GDELT' },
      author: null,
    }));
}

async function fetchGdeltFallback(catIdx: number, isRegulation: boolean): Promise<Article[]> {
  const queries = isRegulation ? GDELT_REGULATION_QUERIES : GDELT_ALERT_QUERIES;
  const specific = queries[Math.min(catIdx, queries.length - 1)];
  const broad = isRegulation ? 'fssai food regulation india' : 'food safety india';

  // Run category-specific and broad queries in parallel for maximum coverage
  const [specRes, broadRes] = await Promise.allSettled([
    fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(specific)}&mode=ArtList&maxrecords=50&sort=datedesc&format=json`),
    fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(broad)}&mode=ArtList&maxrecords=50&sort=datedesc&format=json`),
  ]);

  const allMapped: Article[] = [];
  for (const res of [specRes, broadRes]) {
    if (res.status !== 'fulfilled' || !res.value.ok) continue;
    try {
      const data = await res.value.json();
      allMapped.push(...mapGdeltArticles(data?.articles || []));
    } catch { /* ignore */ }
  }

  return normalizeAndRankArticles(allMapped, isRegulation);
}

// ─── RSS Feeds ───────────────────────────────────────────────────────────────
const RSS_FEEDS = [
  { url: 'https://www.foodsafetynews.com/feed/', title: 'Food Safety News' },
  { url: 'https://efsa.europa.eu/en/rss/rss.xml', title: 'EFSA' },
];

// Parse raw RSS/XML string with the browser's built-in DOMParser
function parseRSSXml(xmlText: string, feedTitle: string): Article[] {
  const articles: Article[] = [];
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    doc.querySelectorAll('item').forEach(item => {
      const title = item.querySelector('title')?.textContent?.trim();
      const link =
        item.querySelector('link')?.textContent?.trim() ||
        item.querySelector('guid')?.textContent?.trim();
      if (!title || !link || !link.startsWith('http')) return;
      const desc = item.querySelector('description')?.textContent?.trim();
      const pub = item.querySelector('pubDate')?.textContent?.trim();
      let publishedAt = new Date().toISOString();
      try { if (pub) publishedAt = new Date(pub).toISOString(); } catch { /* keep default */ }
      articles.push({
        title,
        description: desc ? desc.replace(/<[^>]*>/g, '').slice(0, 300) : null,
        url: link,
        urlToImage: null,
        publishedAt,
        source: { name: feedTitle },
        author: null,
      });
    });
  } catch { /* silently skip malformed XML */ }
  return articles;
}

async function fetchRSSFallback(isRegulation: boolean): Promise<Article[]> {
  const allArticles: Article[] = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, title }) => {
      let items: Article[] = [];

      // Attempt 1: rss2json.com (structured JSON, easiest to consume)
      try {
        const r = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=30`
        );
        if (r.ok) {
          const d = await r.json();
          if (d.status === 'ok' && Array.isArray(d.items) && d.items.length > 0) {
            const feedName: string = d.feed?.title || title;
            items = d.items
              .filter((i: { title?: string; link?: string }) => i.title && i.link)
              .map((i: { title: string; link: string; description?: string; enclosure?: { link?: string }; thumbnail?: string; pubDate?: string; author?: string }) => ({
                title: i.title,
                description: i.description ? (i.description as string).replace(/<[^>]*>/g, '').slice(0, 300) : null,
                url: i.link,
                urlToImage: i.enclosure?.link || i.thumbnail || null,
                publishedAt: i.pubDate ? (() => { try { return new Date(i.pubDate!).toISOString(); } catch { return new Date().toISOString(); } })() : new Date().toISOString(),
                source: { name: feedName },
                author: i.author || null,
              }));
          }
        }
      } catch { /* fall through to next proxy */ }

      // Attempt 2: allorigins.win CORS proxy + native DOMParser XML parsing
      if (items.length === 0) {
        try {
          const r = await fetch(
            `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
          );
          if (r.ok) {
            const d = await r.json();
            if (d?.contents) items = parseRSSXml(d.contents as string, title);
          }
        } catch { /* ignore */ }
      }

      allArticles.push(...items);
    })
  );

  return normalizeAndRankArticles(allArticles, isRegulation);
}

// ─── Article Card Component (with image) ────────────────────────────────────

function ArticleCard({ article, showSummarize }: { article: Article; showSummarize?: boolean }) {
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSummarize = async () => {
    if (summary) { setExpanded(e => !e); return; }
    setSummarizing(true);
    try {
      const result = await callGemini(
        'You are a food safety expert. Summarize this news article in 2-3 concise bullet points for a general consumer. Focus on: what happened, who it affects, and what consumers should do. Keep it clear and actionable.',
        [],
        `Summarize:\n\nTitle: ${article.title}\n\nDescription: ${article.description || 'No description available.'}\n\nSource: ${article.source.name}`
      );
      setSummary(result);
      setExpanded(true);
    } catch {
      setSummary('Could not generate summary. Please try again.');
      setExpanded(true);
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
      onClick={e => {
        // Prevent navigation if clicking AI summarize
        if ((e.target as HTMLElement).closest('[data-summarize]')) e.preventDefault();
      }}
    >
      {/* Image */}
      {article.urlToImage && (
        <div className="relative h-44 overflow-hidden bg-muted">
          <img
            src={article.urlToImage}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-2 left-3 text-[10px] font-700 px-2 py-1 rounded-lg bg-black/50 text-white/90 backdrop-blur-sm flex items-center gap-1">
            <Globe className="h-2.5 w-2.5" />
            {article.source.name}
          </span>
        </div>
      )}

      <div className="flex-1 p-5">
        {!article.urlToImage && (
          <span className="text-[10px] font-700 px-2 py-1 rounded-lg bg-muted text-muted-foreground border border-border mb-2 inline-flex items-center gap-1">
            <Globe className="h-2.5 w-2.5" />
            {article.source.name}
          </span>
        )}
        <h3 className="font-display font-700 text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
            {article.description}
          </p>
        )}

        {/* AI Summarize button */}
        {showSummarize && (
          <div className="mt-3" data-summarize>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSummarize(); }}
              disabled={summarizing}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                summary
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-gradient-to-r from-primary to-emerald-500 text-white shadow-glow hover:opacity-90'
              )}
            >
              {summarizing ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Summarizing…</>
              ) : summary ? (
                <><Sparkles className="h-3 w-3" /> {expanded ? 'Hide Summary' : 'Show Summary'}</>
              ) : (
                <><Sparkles className="h-3 w-3" /> AI Summarize</>
              )}
            </button>
            {summary && expanded && (
              <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-sm text-foreground leading-relaxed">
                <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" /> AI-Generated Summary
                </div>
                {summary}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
            <Clock className="h-3 w-3" />
            {timeAgo(article.publishedAt)}
          </div>
          <span className="text-xs font-semibold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Read <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [tab, setTab] = useState<TabKey>('alerts');
  const [alertCat, setAlertCat] = useState(0);
  const [regCat, setRegCat] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Live news state
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch live news: NewsAPI (primary) → GDELT + RSS feeds (parallel fallback)
  const fetchNews = async (catIdx: number, isRegulation: boolean) => {
    setLoading(true);
    setError(null);
    const cats = isRegulation ? REGULATION_CATEGORIES : ALERT_CATEGORIES;

    try {
      // ── Primary: NewsAPI via Vite dev proxy ──────────────────────────────
      let primaryArticles: Article[] = [];
      try {
        const q = encodeURIComponent(cats[catIdx].query);
        const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
        const res = await fetch(
          `/api/news/v2/everything?q=${q}&searchIn=title,description&language=en&sortBy=publishedAt&domains=${NEWS_DOMAINS}&from=${encodeURIComponent(from)}&pageSize=40`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok') {
            primaryArticles = normalizeAndRankArticles(data.articles || [], isRegulation);
            // Broaden query if too few domain-restricted results
            if (primaryArticles.length < 6) {
              const broadRes = await fetch(
                `/api/news/v2/everything?q=${q}&searchIn=title,description&language=en&sortBy=publishedAt&from=${encodeURIComponent(from)}&pageSize=40`
              );
              if (broadRes.ok) {
                const broadData = await broadRes.json();
                if (broadData.status === 'ok') {
                  primaryArticles = normalizeAndRankArticles(broadData.articles || [], isRegulation);
                }
              }
            }
          }
        }
      } catch {
        // NewsAPI unavailable — fall through to free sources
      }

      if (primaryArticles.length >= 6) {
        setArticles(primaryArticles);
        return;
      }

      // ── Fallback: GDELT + RSS feeds in parallel ──────────────────────────
      const [gdeltResult, rssResult] = await Promise.allSettled([
        fetchGdeltFallback(catIdx, isRegulation),
        fetchRSSFallback(isRegulation),
      ]);

      const gdelt = gdeltResult.status === 'fulfilled' ? gdeltResult.value : [];
      const rss = rssResult.status === 'fulfilled' ? rssResult.value : [];

      // Merge all sources — NewsAPI partial results + GDELT + RSS
      const combined = normalizeAndRankArticles(
        [...primaryArticles, ...gdelt, ...rss],
        isRegulation
      );

      if (combined.length > 0) {
        setArticles(combined);
      } else {
        setError('Could not load live news from any source. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(tab === 'alerts' ? alertCat : regCat, tab === 'regulations');
  }, [tab, alertCat, regCat]);

  // Filter articles by search
  const filtered = articles.filter(a => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return a.title.toLowerCase().includes(s) || a.description?.toLowerCase().includes(s);
  });

  return (
    <div className="page-wrapper pt-20">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative gradient-hero border-b border-border/60 overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-amber-500/6 top-[-100px] right-[-100px]" />
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-full
                              border border-amber-300/60 bg-amber-50/80 text-amber-700 text-xs font-semibold">
                <Bell className="h-3.5 w-3.5" />
                Safety Alerts & Regulations
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-800 text-foreground mb-4 text-balance leading-[1.1]">
                Stay informed.
                <span className="block bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Stay safe.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Real-time contamination alerts, food recall notices, food poisoning outbreaks, and the latest FSSAI regulation updates — all fetched live with AI-powered summaries.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: ShieldAlert, label: 'Live alerts' },
                  { icon: Scale,       label: 'Regulation news' },
                  { icon: Sparkles,    label: 'AI summarizer' },
                  { icon: Globe,       label: 'Real-time feed' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground shadow-sm">
                    <Icon className="h-4 w-4 text-amber-600" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block relative pb-6 pl-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&h=500&fit=crop&q=80"
                  alt="Food safety monitoring and alerts"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-2 z-10">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Siren className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">Live News Feed</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Powered by NewsAPI</p>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" /> Real-time alerts
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> AI summaries
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1.5 bg-muted/60 rounded-2xl border border-border/60 mb-8 w-fit">
          <button
            onClick={() => { setTab('alerts'); setSearchTerm(''); }}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === 'alerts'
                ? 'bg-card shadow text-foreground border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            🚨 Alerts
          </button>
          <button
            onClick={() => { setTab('regulations'); setSearchTerm(''); }}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
              tab === 'regulations'
                ? 'bg-card shadow text-foreground border border-border/60'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Scale className="h-4 w-4" />
            📰 Regulation News
          </button>
        </div>

        {/* ═══ ALERTS TAB ═══ */}
        {tab === 'alerts' && (
          <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2 flex-wrap flex-1">
                {ALERT_CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setAlertCat(i)}
                      className={cn(
                        'text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5',
                        alertCat === i
                          ? 'bg-primary text-white border-primary shadow-glow'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search alerts…"
                  className="pl-8 pr-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-48"
                />
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-red-600" />
                <h2 className="font-display text-xl font-700 text-foreground">Live Safety Alerts</h2>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {!loading && (
                  <span className="text-[10px] font-700 px-2 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-200">
                    {filtered.length} results
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchNews(alertCat, false)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {/* Content */}
            <NewsGrid articles={filtered} loading={loading} error={error} onRetry={() => fetchNews(alertCat, false)} showSummarize />
          </div>
        )}

        {/* ═══ REGULATION NEWS TAB ═══ */}
        {tab === 'regulations' && (
          <div className="space-y-8">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2 flex-wrap flex-1">
                {REGULATION_CATEGORIES.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setRegCat(i)}
                      className={cn(
                        'text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5',
                        regCat === i
                          ? 'bg-primary text-white border-primary shadow-glow'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search regulations…"
                  className="pl-8 pr-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-48"
                />
              </div>
            </div>

            {/* AI Summarizer Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-emerald-500/8 to-teal-500/6 border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shrink-0 shadow-glow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-700 text-foreground text-lg mb-1">AI Regulation Summarizer</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click the <span className="font-semibold text-primary">"AI Summarize"</span> button on any article to get an instant, AI-generated plain-English summary of what changed, who it affects, and what you need to do.
                  </p>
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-700 text-foreground">Live Regulation News</h2>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {!loading && (
                  <span className="text-[10px] font-700 px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 border border-blue-200">
                    {filtered.length} results
                  </span>
                )}
              </div>
              <button
                onClick={() => fetchNews(regCat, true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
                Refresh
              </button>
            </div>

            {/* Content */}
            <NewsGrid articles={filtered} loading={loading} error={error} onRetry={() => fetchNews(regCat, true)} showSummarize />
          </div>
        )}

        {/* Attribution */}
        <div className="mt-10 pt-6 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground/60">
            All news is fetched live from{' '}
            <a href="https://newsapi.org" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">NewsAPI</a>
            ,{' '}
            <a href="https://www.gdeltproject.org" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">GDELT</a>
            , and{' '}
            <a href="https://www.foodsafetynews.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Food Safety News</a>
            . No static data is used. AI summaries powered by Gemini. Content is for informational purposes only.
          </p>
        </div>
      </div>
      <FloatingChatBot {...ALERTS_BOT_CONFIG} />
    </div>
  );
}

// ─── Reusable News Grid ─────────────────────────────────────────────────────

function NewsGrid({
  articles,
  loading,
  error,
  onRetry,
  showSummarize,
}: {
  articles: Article[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  showSummarize?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Fetching live news…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 p-5 rounded-2xl bg-destructive/7 border border-destructive/20">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-destructive">Could not fetch live news</p>
          <p className="text-xs text-destructive/80 mt-1">{error}</p>
          <button
            onClick={onRetry}
            className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Newspaper className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-display font-700 text-foreground">No articles found</p>
        <p className="text-sm text-muted-foreground mt-1">Try a different search term or category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.slice(0, 15).map((article, i) => (
        <ArticleCard
          key={`${article.url}-${i}`}
          article={article}
          showSummarize={showSummarize}
        />
      ))}
    </div>
  );
}
