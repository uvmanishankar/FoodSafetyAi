import { useState, useRef, useCallback } from 'react';
import { ScanLine, Search, Camera, Loader2, AlertCircle, CheckCircle,
         XCircle, Info, Package, Barcode, Upload, ArrowLeft, ChevronDown, ChevronUp,
         Leaf, Star } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { cn } from '@/lib/utils';
import FloatingChatBot from '@/components/FloatingChatBot';

const ANALYZE_BOT_CONFIG = {
  botName: 'Product Analyst AI',
  subtitle: 'Ask about ingredients, safety & labels',
  systemPrompt: `You are a food product analysis expert for India. Help users understand: food ingredient lists and what each ingredient does, E-numbers and food additives (safe vs harmful), how to read and interpret nutrition labels, allergen information and cross-contamination risks, FSSAI standards for Indian packaged foods, how to identify misleading label claims, and how to compare product safety. Be specific, factual, and provide India-specific regulatory context. Use bullet points and clear sections.`,
  welcomeMessage: `👋 Hi! I'm Product Analyst AI.\n\nI can help you:\n- **Decode any ingredient** on a food label\n- **Explain E-numbers** and food additives\n- **Identify red flags** in ingredient lists\n- **Compare products** for safety\n- **Understand FSSAI standards**\n\n**Paste an ingredient list or ask me anything!**`,
  quickReplies: [
    'What are harmful preservatives?',
    'How to read a nutrition label?',
    'What is TBHQ in food?',
    'Explain E621 (MSG)',
  ],
  accentColor: 'text-blue-600',
  accentBg: 'bg-blue-50',
  iconGradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
  botIconColor: 'text-blue-600',
  botIconBg: 'bg-blue-100',
};

interface AnalysisResult {
  productName: string;
  brand?: string;
  ingredients: string[];
  riskyIngredients: string[];
  safeIngredients: string[];
  nutriScore?: string;
  novaGroup?: number;
  allergens?: string;
  additives?: string[];
  image?: string;
  rawIngredientsText?: string;
  quantity?: string;
}

interface OFFProduct {
  code: string;
  product_name: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_n?: number;
  nutriscore_grade?: string;
  nova_group?: number;
  additives_tags?: string[];
  allergens?: string;
  image_url?: string;
  nutriments?: Record<string, number>;
  quantity?: string;
}

const RISKY_KEYWORDS = [
  'red 40','yellow 5','yellow 6','blue 1','blue 2','green 3',
  'bha','bht','tbhq','sodium nitrate','sodium nitrite',
  'potassium bromate','brominated vegetable oil','bvo',
  'high fructose corn syrup','partially hydrogenated',
  'propyl gallate','carrageenan','aspartame','saccharin','acesulfame',
  'monosodium glutamate','msg','sodium benzoate','sulfite',
  'e102','e110','e122','e124','e129','e211','e320','e321',
];

function analyzeIngredients(text: string) {
  if (!text) return { risky: [] as string[], safe: [] as string[], all: [] as string[] };
  const cleaned = text.toLowerCase().replace(/\(.*?\)/g,' ').replace(/[*_]/g,'');
  const all = cleaned.split(/[,;]/).map(s=>s.trim()).filter(s=>s.length>1&&s.length<60);
  const risky = all.filter(i=>RISKY_KEYWORDS.some(k=>i.includes(k)));
  const safe  = all.filter(i=>!RISKY_KEYWORDS.some(k=>i.includes(k)));
  return { risky, safe, all };
}

function getIngredientCount(product: OFFProduct) {
  if (typeof product.ingredients_n === 'number' && product.ingredients_n > 0) {
    return product.ingredients_n;
  }
  return analyzeIngredients(product.ingredients_text || '').all.length;
}

function dedupeProducts(products: OFFProduct[]) {
  const seen = new Set<string>();
  const unique: OFFProduct[] = [];

  for (const product of products) {
    const codeKey = product.code?.trim();
    const fallbackKey = [
      product.product_name?.trim().toLowerCase() || '',
      product.brands?.trim().toLowerCase() || '',
      (product.ingredients_text || '').trim().toLowerCase().slice(0, 180),
    ].join('|');
    const key = codeKey || fallbackKey;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(product);
  }

  return unique;
}

function NutriScore({ grade }: { grade?: string }) {
  if (!grade) return null;
  const g = grade.toLowerCase();
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-800 tracking-wide nutri-${g}`}>
      Nutri-Score {g.toUpperCase()}
    </span>
  );
}

function NovaGroup({ group }: { group?: number }) {
  if (!group) return null;
  const labels: Record<number,string> = { 1:'Unprocessed', 2:'Processed Culinary', 3:'Processed', 4:'Ultra-processed' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-600 nova-${group}`}>
      NOVA {group} · {labels[group]}
    </span>
  );
}

type Tab = 'barcode' | 'search' | 'ocr';

export default function AnalyzePage() {
  const [tab, setTab] = useState<Tab>('barcode');
  const [barcodeQ, setBarcodeQ] = useState('');
  const [nameQ, setNameQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrPct, setOcrPct] = useState(0);
  const [ocrMsg, setOcrMsg] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [searchResults, setSearchResults] = useState<OFFProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const searchCache = useRef<Map<string, OFFProduct[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => { setResult(null); setSearchResults([]); setError(null); setOcrPct(0); setOcrMsg(''); };

  const buildResult = (p: OFFProduct) => {
    const { risky, safe, all } = analyzeIngredients(p.ingredients_text || '');
    setResult({
      productName: p.product_name || 'Unknown Product', brand: p.brands,
      ingredients: all, riskyIngredients: risky, safeIngredients: safe,
      nutriScore: p.nutriscore_grade, novaGroup: p.nova_group,
      allergens: p.allergens,
      additives: p.additives_tags?.map(a=>a.replace('en:','')),
      image: p.image_url, quantity: p.quantity,
      rawIngredientsText: p.ingredients_text,
    });
  };

  /** Go back from product detail to the search results list */
  const backToResults = () => {
    setResult(null);
    setError(null);
    setPreview(null);
  };

  const fetchBarcode = async (code: string) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code.trim()}.json`);
      const d = await r.json();
      if (d.status !== 1 || !d.product) { setError(`Barcode "${code}" not found in OpenFoodFacts.`); return; }
      buildResult(d.product);
    } catch { setError('Network error. Check your connection and try again.'); }
    finally { setLoading(false); }
  };

  const searchName = useCallback(async (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) return;
    if (trimmed.length < 2) {
      setError('Please enter at least 2 characters to search.');
      setSearchResults([]);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // Return cached results if available
    if (searchCache.current.has(trimmed)) {
      setSearchResults(searchCache.current.get(trimmed)!);
      setResult(null);
      return;
    }

    setLoading(true); setError(null); setResult(null); setSearchResults([]);
    try {
      const r = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(trimmed)}&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,brands,ingredients_text,ingredients_n,nutriscore_grade,nova_group,additives_tags,allergens,image_url,quantity`,
        { signal: ac.signal }
      );
      const d = await r.json();
      const products: OFFProduct[] = d.products || [];

      const withIngredients = products.filter((product: OFFProduct) => {
        if (!product.product_name) return false;
        return getIngredientCount(product) > 0;
      });

      const valid = dedupeProducts(withIngredients);

      if (!valid.length) {
        setError(`No products with ingredient count found for "${q}". Try a different name.`);
        return;
      }
      searchCache.current.set(trimmed, valid);
      setSearchResults(valid);
    } catch (e: any) {
      if (e?.name === 'AbortError') return; // ignore aborted
      setError('Network error. Check your connection and try again.');
    }
    finally { setLoading(false); }
  }, []);

  const doOCR = async (file: File) => {
    reset(); setLoading(true); setOcrMsg('Initializing OCR engine…'); setOcrPct(5);
    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') { setOcrPct(Math.round(m.progress*75)+15); setOcrMsg('Recognizing text…'); }
          else if (m.status.includes('loading')) { setOcrMsg('Loading language data…'); setOcrPct(10); }
          else if (m.status.includes('init')) { setOcrMsg('OCR ready…'); setOcrPct(15); }
        },
      });
      setOcrMsg('Scanning image…');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      setOcrPct(95); setOcrMsg('Analyzing…');
      if (!text || text.trim().length < 10) {
        setError('No readable text found. Try a clearer, well-lit photo.'); setLoading(false); return;
      }
      const barMatch = text.match(/\b(\d{8,13})\b/);
      if (barMatch) { setOcrMsg('Found barcode, looking up product…'); setOcrPct(98); await fetchBarcode(barMatch[1]); return; }
      const ingMatch = text.match(/ingredients?[:\s]+(.+?)(?:\n\n|\z|allergen|contains|warning)/is);
      const ingText = ingMatch ? ingMatch[1] : text;
      const { risky, safe, all } = analyzeIngredients(ingText);
      setResult({ productName:'Product from Image', ingredients:all, riskyIngredients:risky, safeIngredients:safe, rawIngredientsText:text });
      setOcrPct(100); setOcrMsg('Done!');
    } catch(e) {
      setError(`OCR failed: ${e instanceof Error ? e.message : 'Unknown error'}. Try barcode or name search.`);
    } finally { setLoading(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Please upload an image file.'); return; }
    new FileReader().onload = ev => setPreview(ev.target?.result as string);
    const fr = new FileReader(); fr.onload = ev => setPreview(ev.target?.result as string); fr.readAsDataURL(f);
    doOCR(f);
  };

  const tabs: { id: Tab; icon: any; label: string; sub: string }[] = [
    { id:'barcode', icon:Barcode,  label:'Barcode',    sub:'EAN / UPC' },
    { id:'search',  icon:Search,   label:'Search Name', sub:'Product name' },
    { id:'ocr',     icon:Camera,   label:'Scan Label',  sub:'OCR photo' },
  ];

  return (
    <div className="page-wrapper pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full
                          bg-primary/8 text-primary text-xs font-semibold border border-primary/18">
            <ScanLine className="h-3 w-3" />
            Product Analysis
          </div>
          <h1 className="font-display text-4xl font-800 text-foreground mb-2">
            Analyze any food product
          </h1>
          <p className="text-muted-foreground">
            Scan barcodes, search by name, or photograph a label — we'll decode every ingredient instantly.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1.5 bg-muted/60 rounded-2xl mb-8 border border-border/60">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); reset(); }}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200',
                tab === t.id
                  ? 'bg-card shadow-sm text-foreground border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <t.icon className={cn('h-4.5 w-4.5 mb-0.5', tab===t.id ? 'text-primary' : 'text-muted-foreground')} />
              <span className={tab===t.id ? 'font-semibold' : ''}>{t.label}</span>
              <span className="text-[10px] text-muted-foreground/60 hidden sm:block">{t.sub}</span>
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {tab === 'barcode' && (
          <div className="animate-fade-in">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h2 className="font-display font-700 text-lg mb-1">Barcode Lookup</h2>
              <p className="text-sm text-muted-foreground mb-5">Enter any EAN-8, EAN-13, or UPC barcode number.</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="e.g. 3017620422003"
                    value={barcodeQ}
                    onChange={e => setBarcodeQ(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && barcodeQ && fetchBarcode(barcodeQ)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background
                               text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                <button
                  onClick={() => barcodeQ && fetchBarcode(barcodeQ)}
                  disabled={!barcodeQ || loading}
                  className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow
                             hover:shadow-glow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Analyze'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Try <code className="font-code bg-muted px-1.5 py-0.5 rounded text-xs">3017620422003</code> (Nutella) or{' '}
                <code className="font-code bg-muted px-1.5 py-0.5 rounded text-xs">0021000613922</code> (Oreos)
              </p>
            </div>
          </div>
        )}

        {tab === 'search' && (
          <div className="animate-fade-in">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm mb-6">
              <h2 className="font-display font-700 text-lg mb-1">Search by Name</h2>
              <p className="text-sm text-muted-foreground mb-5">Search OpenFoodFacts' database of 3M+ products.</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    placeholder="e.g. Nutella, Coca Cola, Oreo…"
                    value={nameQ}
                    onChange={e => setNameQ(e.target.value)}
                    onKeyDown={e => e.key==='Enter' && nameQ && searchName(nameQ)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background
                               text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                <button
                  onClick={() => nameQ && searchName(nameQ)}
                  disabled={!nameQ || loading}
                  className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow
                             hover:shadow-glow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </button>
              </div>
            </div>

            {searchResults.length > 0 && !result && (
              <div>
                <p className="text-sm font-semibold text-foreground mb-4">{searchResults.length} products found — tap to analyze:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {searchResults.map(p => (
                    <button
                      key={p.code}
                      onClick={() => buildResult(p)}
                      className="group text-left p-3 rounded-2xl bg-card border border-border card-hover shadow-sm"
                    >
                      {p.image_url
                        ? <img src={p.image_url} alt={p.product_name} className="w-full h-24 object-contain rounded-xl mb-2 bg-muted/30"
                            onError={e=>(e.currentTarget.style.display='none')} />
                        : <div className="w-full h-24 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                            <Package className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                      }
                      <p className="text-xs font-semibold line-clamp-2 text-foreground">{p.product_name}</p>
                      {p.brands && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{p.brands}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Ingredients: {getIngredientCount(p)}
                      </p>
                      {p.nutriscore_grade && (
                        <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-700 nutri-${p.nutriscore_grade.toLowerCase()}`}>
                          {p.nutriscore_grade.toUpperCase()}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'ocr' && (
          <div className="animate-fade-in">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <h2 className="font-display font-700 text-lg mb-1">Scan Product Label</h2>
              <p className="text-sm text-muted-foreground mb-5">Upload or photograph a food label — OCR extracts and analyzes ingredients.</p>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/40 rounded-2xl p-10 text-center
                           cursor-pointer transition-colors group mb-4"
              >
                {preview
                  ? <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-xl object-contain mb-2" />
                  : <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-foreground transition-colors">
                      <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium text-sm">Drop image here or click to browse</p>
                      <p className="text-xs opacity-60">JPG, PNG, WEBP up to 10MB</p>
                    </div>
                }
              </div>

              <div className="flex gap-3">
                <button onClick={() => fileRef.current?.click()} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-background
                             text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50">
                  <Upload className="h-4 w-4" /> Upload Image
                </button>
                <button onClick={() => cameraRef.current?.click()} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-background
                             text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50">
                  <Camera className="h-4 w-4" /> Take Photo
                </button>
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

              {loading && ocrPct > 0 && (
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{ocrMsg}</span>
                    <span className="font-semibold text-foreground">{ocrPct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-primary rounded-full transition-all duration-300"
                      style={{ width: `${ocrPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && tab !== 'ocr' && (
          <div className="mt-6 flex items-center justify-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Fetching from OpenFoodFacts…</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-destructive/7 border border-destructive/20">
            <AlertCircle className="h-4.5 w-4.5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8 space-y-5 animate-fade-up">
            {/* Product card */}
            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
              <div className="flex gap-5">
                {result.image && (
                  <img src={result.image} alt={result.productName}
                    className="w-24 h-24 object-contain rounded-xl bg-white border border-border shrink-0"
                    onError={e=>(e.currentTarget.style.display='none')} />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-2xl font-800 text-foreground leading-tight">{result.productName}</h2>
                  {result.brand && <p className="text-muted-foreground text-sm mt-0.5">{result.brand}</p>}
                  {result.quantity && <p className="text-xs text-muted-foreground/70 mt-0.5">{result.quantity}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <NutriScore grade={result.nutriScore} />
                    <NovaGroup group={result.novaGroup} />
                  </div>
                </div>
              </div>
            </div>

            {/* Safety overview cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className={cn('p-4 rounded-2xl border text-center',
                result.riskyIngredients.length===0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                {result.riskyIngredients.length===0
                  ? <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-1.5" />
                  : <XCircle    className="h-6 w-6 text-red-600 mx-auto mb-1.5" />}
                <p className={cn('font-display font-800 text-lg',
                  result.riskyIngredients.length===0 ? 'text-emerald-700' : 'text-red-700')}>
                  {result.riskyIngredients.length===0 ? 'Clear' : result.riskyIngredients.length}
                </p>
                <p className="text-xs text-muted-foreground">Concerns</p>
              </div>
              <div className="p-4 rounded-2xl border bg-card text-center">
                <Info className="h-6 w-6 text-blue-500 mx-auto mb-1.5" />
                <p className="font-display font-800 text-lg text-foreground">{result.ingredients.length}</p>
                <p className="text-xs text-muted-foreground">Ingredients</p>
              </div>
              <div className="p-4 rounded-2xl border bg-card text-center">
                <Package className="h-6 w-6 text-purple-500 mx-auto mb-1.5" />
                <p className="font-display font-800 text-lg text-foreground">{result.additives?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Additives</p>
              </div>
            </div>

            {/* Risky ingredients */}
            {result.riskyIngredients.length > 0 && (
              <div className="p-5 rounded-2xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-4.5 w-4.5 text-red-600" />
                  <h3 className="font-display font-700 text-red-700">Ingredients of Concern ({result.riskyIngredients.length})</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.riskyIngredients.map((i,idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold border border-red-200 capitalize">{i}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Allergens */}
            {result.allergens && result.allergens.replace(/,/g,'').trim().length > 3 && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
                  <h3 className="font-display font-700 text-amber-700">Allergens</h3>
                </div>
                <p className="text-sm text-amber-800">{result.allergens.replace(/en:/g,'').replace(/,/g,', ')}</p>
              </div>
            )}

            {/* Additives */}
            {result.additives && result.additives.length > 0 && (
              <div className="p-5 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4.5 w-4.5 text-blue-500" />
                  <h3 className="font-display font-700 text-foreground">Additives ({result.additives.length})</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.additives.map((a,i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-code uppercase border border-border">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Full ingredients */}
            {result.ingredients.length > 0 && (
              <div className="p-5 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="h-4.5 w-4.5 text-primary" />
                  <h3 className="font-display font-700 text-foreground">All Ingredients</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.ingredients.map((i,idx) => (
                    <span key={idx}
                      className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border capitalize',
                        result.riskyIngredients.includes(i)
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-muted text-muted-foreground border-border'
                      )}
                    >{i}</span>
                  ))}
                </div>
              </div>
            )}

            {tab === 'ocr' && result.rawIngredientsText && (
              <details className="p-5 rounded-2xl bg-muted/50 border border-border">
                <summary className="text-xs font-semibold text-muted-foreground cursor-pointer">Raw OCR Output</summary>
                <pre className="mt-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-36 overflow-y-auto font-code">{result.rawIngredientsText}</pre>
              </details>
            )}

            <button
              onClick={backToResults}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> {searchResults.length > 0 ? 'Back to results' : 'Analyze another product'}
            </button>
          </div>
        )}
      </div>
      <FloatingChatBot {...ANALYZE_BOT_CONFIG} />
    </div>
  );
}
