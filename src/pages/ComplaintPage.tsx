import { useState, useEffect, useRef } from 'react';
import {
  FileText, MapPin, Camera, Send, Search, CheckCircle2, Clock,
  AlertTriangle, ShieldCheck, Eye, Loader2, Sparkles, User, Mail,
  Phone, Store, ChevronRight, Bot, BarChart3, TrendingUp, XCircle,
  Upload, Circle, ArrowRight, Info, Shield, ClipboardList, Activity,
  Building2, Siren, MessageSquare, ChevronDown, X, Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { callGemini } from '@/lib/gemini';
import FloatingChatBot from '@/components/FloatingChatBot';

const COMPLAINT_BOT_CONFIG = {
  botName: 'Consumer Rights AI',
  subtitle: 'Help with food complaints & consumer rights',
  systemPrompt: `You are a consumer rights expert specializing in food safety complaints in India. Help users with: how to file a food complaint with FSSAI or local food safety authorities, what constitutes a valid food safety violation under Indian law, consumer rights under the Food Safety and Standards Act 2006, how to document evidence for a complaint (photos, receipts, batch numbers), what penalties food companies face for violations, how to escalate complaints if unresolved, and National Consumer Helpline (1800-11-4000) and FSSAI helpline information. Be practical, empowering, and India-specific.`,
  welcomeMessage: `👋 Hi! I'm Consumer Rights AI.\n\nI can help you:\n- **File a food complaint** with FSSAI or authorities\n- **Know your rights** as a food consumer\n- **Document evidence** for your complaint\n- **Understand penalties** for food violations\n- **Escalate unresolved** complaints\n\n**What food issue are you facing?**`,
  quickReplies: [
    'How do I file an FSSAI complaint?',
    'What are my consumer rights for food?',
    'Found a foreign object in food - what to do?',
    'How to report food poisoning?',
  ],
  accentColor: 'text-purple-600',
  accentBg: 'bg-purple-50',
  iconGradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
  botIconColor: 'text-purple-600',
  botIconBg: 'bg-purple-100',
};import type { LucideIcon } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Complaint {
  id: string;
  name: string;
  contact: string;
  location: string;
  establishment: string;
  category: string;
  description: string;
  photos: string[];
  status: ComplaintStatus;
  submittedAt: string;
  timeline: TimelineEvent[];
  aiCategory?: string;
  aiPriority?: 'Critical' | 'High' | 'Medium' | 'Low';
  aiSummary?: string;
}

type ComplaintStatus = 'Submitted' | 'Under Review' | 'Inspection Scheduled' | 'Action Taken' | 'Resolved';

interface TimelineEvent {
  status: ComplaintStatus;
  date: string;
  note: string;
}

interface Hotspot {
  area: string;
  city: string;
  complaints: number;
  trend: 'rising' | 'stable' | 'declining';
  topIssue: string;
  riskLevel: 'Critical' | 'High' | 'Medium';
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Unhygienic Restaurant',
  'Expired Food Products',
  'Food Poisoning Incident',
  'Contaminated Food',
  'Fake / Adulterated Food',
  'Mislabeled Products',
  'Insect / Foreign Object in Food',
  'Other',
];

const STATUS_CONFIG: Record<ComplaintStatus, { color: string; icon: LucideIcon; bg: string }> = {
  'Submitted':            { color: 'text-blue-600',    icon: Send,          bg: 'bg-blue-100' },
  'Under Review':         { color: 'text-amber-600',   icon: Eye,           bg: 'bg-amber-100' },
  'Inspection Scheduled': { color: 'text-purple-600',  icon: ClipboardList, bg: 'bg-purple-100' },
  'Action Taken':         { color: 'text-orange-600',  icon: Activity,      bg: 'bg-orange-100' },
  'Resolved':             { color: 'text-emerald-600', icon: CheckCircle2,  bg: 'bg-emerald-100' },
};

const ALL_STATUSES: ComplaintStatus[] = ['Submitted', 'Under Review', 'Inspection Scheduled', 'Action Taken', 'Resolved'];

const MOCK_HOTSPOTS: Hotspot[] = [
  { area: 'Chandni Chowk', city: 'Delhi', complaints: 34, trend: 'rising', topIssue: 'Unhygienic street food stalls', riskLevel: 'Critical' },
  { area: 'Charminar', city: 'Hyderabad', complaints: 28, trend: 'rising', topIssue: 'Food stored in open containers', riskLevel: 'High' },
  { area: 'Mohammed Ali Road', city: 'Mumbai', complaints: 22, trend: 'stable', topIssue: 'Expired ingredients used', riskLevel: 'High' },
  { area: 'Koramangala', city: 'Bengaluru', complaints: 18, trend: 'declining', topIssue: 'Cloud kitchen hygiene issues', riskLevel: 'Medium' },
  { area: 'Anna Nagar', city: 'Chennai', complaints: 15, trend: 'stable', topIssue: 'Food poisoning cases', riskLevel: 'Medium' },
  { area: 'Hazratganj', city: 'Lucknow', complaints: 12, trend: 'rising', topIssue: 'Adulterated milk products', riskLevel: 'High' },
];

// Helper to generate complaint IDs
const generateId = () => `FS-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

// Helper: get complaints from localStorage
function getStoredComplaints(): Complaint[] {
  try {
    return JSON.parse(localStorage.getItem('food_complaints') || '[]');
  } catch { return []; }
}
function storeComplaints(complaints: Complaint[]) {
  localStorage.setItem('food_complaints', JSON.stringify(complaints));
}

type TabKey = 'submit' | 'track' | 'hotspots';

// ─── Component ──────────────────────────────────────────────────────────────

export default function ComplaintPage() {
  const [tab, setTab] = useState<TabKey>('submit');

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] hero-orb opacity-30" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] hero-orb opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-full border border-red-300/60 bg-red-50/80 text-red-700 text-xs font-semibold">
                <Siren className="h-3.5 w-3.5"/>Citizen Complaint System
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-800 text-foreground mb-4 leading-[1.1]">
                Report unsafe
                <span className="block bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">food & restaurants</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                File complaints about unhygienic food, contaminated products, or food poisoning incidents. Track your complaint status in real-time with AI-powered categorisation and smart hotspot detection.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: FileText, label: 'File complaint' },
                  { icon: Search, label: 'Track status' },
                  { icon: Bot, label: 'AI auto-categoriser' },
                  { icon: MapPin, label: 'Hotspot detection' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium shadow-sm">
                    <Icon className="h-4 w-4 text-red-600" />{label}
                  </span>
                ))}
              </div>
            </div>
            {/* Hero Image */}
            <div className="hidden lg:block relative pb-6 pl-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                <img
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&h=500&fit=crop&q=80"
                  alt="Filing a food safety complaint"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-2 z-10">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Siren className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">Report &amp; Track</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">AI-powered complaint system</p>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> FSSAI integrated
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5" /> AI analysis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 glass border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 py-2 overflow-x-auto no-scrollbar">
            {([
              { key: 'submit' as TabKey, label: '📝 Submit Complaint', icon: FileText },
              { key: 'track' as TabKey, label: '📊 Track Complaint', icon: Search },
              { key: 'hotspots' as TabKey, label: '📍 Safety Hotspots', icon: MapPin },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  tab === key
                    ? 'gradient-primary text-white shadow-glow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {tab === 'submit' && <SubmitComplaintTab />}
        {tab === 'track' && <TrackComplaintTab />}
        {tab === 'hotspots' && <HotspotsTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: Submit Complaint
// ═══════════════════════════════════════════════════════════════════════════

function SubmitComplaintTab() {
  const [form, setForm] = useState({
    name: '', contact: '', location: '', establishment: '', category: '', description: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [submitted, setSubmitted] = useState<Complaint | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setPhotos(prev => [...prev, ev.target!.result as string].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.contact.trim()) errs.contact = 'Email or phone is required';
    if (!form.location.trim()) errs.location = 'Location is required';
    if (!form.establishment.trim()) errs.establishment = 'Restaurant / shop name is required';
    if (!form.category) errs.category = 'Select a category';
    if (!form.description.trim()) errs.description = 'Describe the issue';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const analyzeWithAI = async (description: string, category: string): Promise<{ aiCategory: string; aiPriority: string; aiSummary: string }> => {
    try {
      const prompt = `You are a food safety complaint analyzer for the FSSAI (Food Safety and Standards Authority of India).
Analyze this citizen complaint and return a JSON object with exactly these keys:
- "category": the most accurate complaint category (e.g., "Food Contamination", "Unhygienic Conditions", "Expired Products", "Food Poisoning", "Adulterated Food", "Foreign Object in Food", "Mislabeled Products")
- "priority": exactly one of "Critical", "High", "Medium", or "Low"
- "summary": a 1-2 sentence professional summary of the complaint for the inspector

Complaint Category Selected: ${category}
Complaint Description: ${description}

Return ONLY the JSON object, no markdown.`;
      const result = await callGemini(prompt, [], '');
      const cleaned = result.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        aiCategory: parsed.category || category,
        aiPriority: parsed.priority || 'Medium',
        aiSummary: parsed.summary || description.slice(0, 100),
      };
    } catch {
      return { aiCategory: category, aiPriority: 'Medium', aiSummary: description.slice(0, 120) };
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setAiAnalyzing(true);

    // AI analysis
    const ai = await analyzeWithAI(form.description, form.category);
    setAiAnalyzing(false);

    const complaint: Complaint = {
      id: generateId(),
      name: form.name.trim(),
      contact: form.contact.trim(),
      location: form.location.trim(),
      establishment: form.establishment.trim(),
      category: form.category,
      description: form.description.trim(),
      photos,
      status: 'Submitted',
      submittedAt: new Date().toISOString(),
      timeline: [{ status: 'Submitted', date: new Date().toISOString(), note: 'Complaint registered successfully' }],
      aiCategory: ai.aiCategory,
      aiPriority: ai.aiPriority as Complaint['aiPriority'],
      aiSummary: ai.aiSummary,
    };

    // Simulate random progression for demo
    const progressCount = Math.floor(Math.random() * 3);
    const now = Date.now();
    if (progressCount >= 1) {
      complaint.status = 'Under Review';
      complaint.timeline.push({ status: 'Under Review', date: new Date(now - 86400000 * 2).toISOString(), note: 'Assigned to local food inspector for review' });
    }
    if (progressCount >= 2) {
      complaint.status = 'Inspection Scheduled';
      complaint.timeline.push({ status: 'Inspection Scheduled', date: new Date(now - 86400000).toISOString(), note: 'Inspector visit scheduled for this week' });
    }

    const existing = getStoredComplaints();
    storeComplaints([complaint, ...existing]);
    setSubmitted(complaint);
    setSubmitting(false);
  };

  if (submitted) {
    return <SubmitSuccess complaint={submitted} onNew={() => {
      setSubmitted(null);
      setForm({ name: '', contact: '', location: '', establishment: '', category: '', description: '' });
      setPhotos([]);
    }} />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border/60 bg-muted/30">
            <h2 className="font-display text-xl font-700 text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> File a Complaint
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Report unsafe food, unhygienic restaurants, or food safety violations</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Row 1: Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Full Name" icon={User} error={errors.name}>
                <input
                  type="text" placeholder="Your full name"
                  value={form.name} onChange={e => handleChange('name', e.target.value)}
                  className={cn('form-input', errors.name && 'border-red-400')}
                />
              </FieldGroup>
              <FieldGroup label="Email / Phone" icon={Mail} error={errors.contact}>
                <input
                  type="text" placeholder="email@example.com or +91 XXXXX"
                  value={form.contact} onChange={e => handleChange('contact', e.target.value)}
                  className={cn('form-input', errors.contact && 'border-red-400')}
                />
              </FieldGroup>
            </div>

            {/* Row 2: Location & Establishment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Location / Area" icon={MapPin} error={errors.location}>
                <input
                  type="text" placeholder="City, area, or address"
                  value={form.location} onChange={e => handleChange('location', e.target.value)}
                  className={cn('form-input', errors.location && 'border-red-400')}
                />
              </FieldGroup>
              <FieldGroup label="Restaurant / Shop Name" icon={Store} error={errors.establishment}>
                <input
                  type="text" placeholder="Name of the establishment"
                  value={form.establishment} onChange={e => handleChange('establishment', e.target.value)}
                  className={cn('form-input', errors.establishment && 'border-red-400')}
                />
              </FieldGroup>
            </div>

            {/* Category */}
            <FieldGroup label="Complaint Category" icon={AlertTriangle} error={errors.category}>
              <div className="relative">
                <select
                  value={form.category} onChange={e => handleChange('category', e.target.value)}
                  className={cn('form-input appearance-none pr-10', !form.category && 'text-muted-foreground', errors.category && 'border-red-400')}
                >
                  <option value="">Select a category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </FieldGroup>

            {/* Description */}
            <FieldGroup label="Describe the Issue" icon={MessageSquare} error={errors.description}>
              <textarea
                rows={4} placeholder="Provide details: what happened, when, how it affected you…"
                value={form.description} onChange={e => handleChange('description', e.target.value)}
                className={cn('form-input resize-none', errors.description && 'border-red-400')}
              />
            </FieldGroup>

            {/* Photo Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                <Camera className="h-4 w-4 text-muted-foreground" /> Photo Evidence <span className="text-muted-foreground font-normal">(optional, up to 5)</span>
              </label>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
              <div className="flex flex-wrap gap-3">
                {photos.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                    <img src={src} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Upload</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200',
                'gradient-primary text-white shadow-glow hover:shadow-glow-lg hover:opacity-90 disabled:opacity-60'
              )}
            >
              {submitting ? (
                <>
                  {aiAnalyzing ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Loader2 className="h-4 w-4 animate-spin" />}
                  {aiAnalyzing ? 'AI analyzing your complaint…' : 'Submitting…'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Complaint
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* How it works */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-700 text-base text-foreground mb-4 flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> How It Works
          </h3>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Submit Complaint', desc: 'Fill the form and upload evidence photos', icon: Send, color: 'bg-blue-100 text-blue-600' },
              { step: 2, title: 'AI Analysis', desc: 'AI auto-categorises and assigns priority', icon: Bot, color: 'bg-purple-100 text-purple-600' },
              { step: 3, title: 'Authority Review', desc: 'Food safety inspector reviews your complaint', icon: Eye, color: 'bg-amber-100 text-amber-600' },
              { step: 4, title: 'Inspection', desc: 'On-site inspection of the establishment', icon: ClipboardList, color: 'bg-orange-100 text-orange-600' },
              { step: 5, title: 'Resolution', desc: 'Action taken and complaint resolved', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
            ].map(({ step, title, desc, icon: Icon, color }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step}. {title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Features */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl p-5">
          <h3 className="font-display font-700 text-base text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" /> AI-Powered Features
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Auto Categorisation', desc: 'AI reads your description and assigns the correct category automatically' },
              { title: 'Priority Assessment', desc: 'Urgency level (Critical/High/Medium/Low) based on complaint severity' },
              { title: 'Smart Summary', desc: 'AI generates a concise professional summary for inspectors' },
              { title: 'Hotspot Detection', desc: 'Identifies areas with frequent complaints as food safety risk zones' },
            ].map(item => (
              <div key={item.title} className="flex gap-2 items-start">
                <Bot className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-display font-700 text-base text-foreground mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" /> Tips for Strong Evidence
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Take clear, well-lit photos of the issue',
              'Include photos of the establishment name/signboard',
              'Capture date stamps (receipts, expiry labels)',
              'Document dirty kitchens, spoiled food, or insects',
              'Keep original packaging of contaminated products',
            ].map((tip, i) => (
              <li key={i} className="flex gap-2 items-start">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Field Group helper ─────────────────────────────────────────────────────

function FieldGroup({ label, icon: Icon, error, children }: { label: string; icon: LucideIcon; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
        <Icon className="h-4 w-4 text-muted-foreground" /> {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
}

// ─── Submit Success ─────────────────────────────────────────────────────────

function SubmitSuccess({ complaint, onNew }: { complaint: Complaint; onNew: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Top success banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-800 mb-1">Complaint Submitted!</h2>
          <p className="text-white/80 text-sm">Your complaint has been registered successfully</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Complaint ID */}
          <div className="bg-muted/40 border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Your Complaint ID</p>
            <p className="font-display text-3xl font-800 text-primary tracking-wide">{complaint.id}</p>
            <p className="text-xs text-muted-foreground mt-1">Save this ID to track your complaint status</p>
          </div>

          {/* AI Analysis Results */}
          {complaint.aiCategory && (
            <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 rounded-xl p-4">
              <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" /> AI Analysis
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">AI Category</p>
                  <p className="text-sm font-semibold text-foreground">{complaint.aiCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold',
                    complaint.aiPriority === 'Critical' ? 'bg-red-100 text-red-700' :
                    complaint.aiPriority === 'High' ? 'bg-orange-100 text-orange-700' :
                    complaint.aiPriority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {complaint.aiPriority}
                  </span>
                </div>
              </div>
              {complaint.aiSummary && (
                <div className="mt-3 pt-3 border-t border-purple-200/40">
                  <p className="text-xs text-muted-foreground">AI Summary for Inspector</p>
                  <p className="text-sm text-foreground mt-0.5">{complaint.aiSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* Complaint details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Status</p><p className="font-semibold text-blue-600">{complaint.status}</p></div>
            <div><p className="text-xs text-muted-foreground">Category</p><p className="font-semibold">{complaint.category}</p></div>
            <div><p className="text-xs text-muted-foreground">Location</p><p className="font-semibold">{complaint.location}</p></div>
            <div><p className="text-xs text-muted-foreground">Establishment</p><p className="font-semibold">{complaint.establishment}</p></div>
          </div>

          {/* Photos */}
          {complaint.photos.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Evidence Uploaded ({complaint.photos.length} photos)</p>
              <div className="flex gap-2">
                {complaint.photos.map((src, i) => (
                  <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onNew}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted/40 transition-colors"
            >
              File Another Complaint
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(complaint.id)}
              className="flex-1 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity"
            >
              Copy Complaint ID
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: Track Complaint
// ═══════════════════════════════════════════════════════════════════════════

function TrackComplaintTab() {
  const [searchId, setSearchId] = useState('');
  const [found, setFound] = useState<Complaint | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    setRecentComplaints(getStoredComplaints().slice(0, 5));
  }, []);

  const handleSearch = () => {
    const all = getStoredComplaints();
    const match = all.find(c => c.id.toLowerCase() === searchId.trim().toLowerCase());
    if (match) {
      setFound(match);
      setNotFound(false);
    } else {
      setFound(null);
      setNotFound(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-xl font-700 text-foreground mb-1 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" /> Track Your Complaint
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Enter your Complaint ID to check real-time status</p>
          <div className="flex gap-3">
            <input
              type="text" placeholder="e.g. FS-2026-1234"
              value={searchId} onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="form-input flex-1"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Search className="h-4 w-4" /> Track
            </button>
          </div>
          {notFound && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/60 text-red-700 text-sm">
              <XCircle className="h-4 w-4" /> No complaint found with ID "{searchId}". Please check and try again.
            </div>
          )}
        </div>
      </div>

      {/* Found complaint */}
      {found && <ComplaintDetail complaint={found} />}

      {/* Recent complaints */}
      {!found && recentComplaints.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-700 text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" /> Your Recent Complaints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentComplaints.map(c => (
              <button
                key={c.id}
                onClick={() => { setFound(c); setNotFound(false); setSearchId(c.id); }}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-primary">{c.id}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1 truncate">{c.establishment}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.submittedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View details <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!found && recentComplaints.length === 0 && !notFound && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">No complaints yet</p>
          <p className="text-sm text-muted-foreground mt-1">Submit a complaint to start tracking its progress</p>
        </div>
      )}
    </div>
  );
}

// ─── Complaint Detail ───────────────────────────────────────────────────────

function ComplaintDetail({ complaint }: { complaint: Complaint }) {
  const currentIndex = ALL_STATUSES.indexOf(complaint.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/60 bg-muted/30 flex items-center justify-between">
          <div>
            <p className="font-mono text-lg font-bold text-primary">{complaint.id}</p>
            <p className="text-sm text-muted-foreground">Submitted on {new Date(complaint.submittedAt).toLocaleString()}</p>
          </div>
          <StatusBadge status={complaint.status} large />
        </div>

        <div className="p-6">
          {/* Progress tracker */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-foreground mb-4">Complaint Progress</h3>
            <div className="flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-primary transition-all duration-500"
                style={{ width: `calc(${(currentIndex / (ALL_STATUSES.length - 1)) * 100}% - 2.5rem)` }}
              />

              {ALL_STATUSES.map((status, i) => {
                const sc = STATUS_CONFIG[status];
                const Icon = sc.icon;
                const done = i <= currentIndex;
                const current = i === currentIndex;
                return (
                  <div key={status} className="flex flex-col items-center relative z-10">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                      done
                        ? current
                          ? 'bg-primary border-primary text-white shadow-glow'
                          : 'bg-primary/20 border-primary text-primary'
                        : 'bg-card border-border text-muted-foreground'
                    )}>
                      {done && !current ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <p className={cn(
                      'text-[10px] font-semibold mt-2 text-center max-w-[80px]',
                      current ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {status}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Category</p><p className="font-semibold">{complaint.category}</p></div>
            <div><p className="text-xs text-muted-foreground">Location</p><p className="font-semibold">{complaint.location}</p></div>
            <div><p className="text-xs text-muted-foreground">Establishment</p><p className="font-semibold">{complaint.establishment}</p></div>
            <div><p className="text-xs text-muted-foreground">Complainant</p><p className="font-semibold">{complaint.name}</p></div>
          </div>

          {/* Description */}
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/60">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground">{complaint.description}</p>
          </div>

          {/* AI Analysis */}
          {complaint.aiCategory && (
            <div className="mt-4 p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" /> AI Analysis
              </h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">AI Category</p>
                  <p className="font-semibold">{complaint.aiCategory}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold',
                    complaint.aiPriority === 'Critical' ? 'bg-red-100 text-red-700' :
                    complaint.aiPriority === 'High' ? 'bg-orange-100 text-orange-700' :
                    complaint.aiPriority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {complaint.aiPriority}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">AI Summary</p>
                  <p className="text-xs">{complaint.aiSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Photos */}
          {complaint.photos.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Evidence Photos</p>
              <div className="flex gap-3">
                {complaint.photos.map((src, i) => (
                  <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border border-border">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h3 className="font-display text-base font-700 text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" /> Activity Timeline
        </h3>
        <div className="space-y-4">
          {complaint.timeline.map((event, i) => {
            const sc = STATUS_CONFIG[event.status];
            const Icon = sc.icon;
            return (
              <div key={i} className="flex gap-3 items-start">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', sc.bg)}>
                  <Icon className={cn('h-4 w-4', sc.color)} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{event.status}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status, large }: { status: ComplaintStatus; large?: boolean }) {
  const sc = STATUS_CONFIG[status];
  const Icon = sc.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-semibold',
      sc.bg, sc.color,
      large ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'
    )}>
      <Icon className={large ? 'h-4 w-4' : 'h-3 w-3'} /> {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: Safety Hotspots
// ═══════════════════════════════════════════════════════════════════════════

function HotspotsTab() {
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const cities = ['All', ...Array.from(new Set(MOCK_HOTSPOTS.map(h => h.city)))];
  const filtered = selectedCity === 'All' ? MOCK_HOTSPOTS : MOCK_HOTSPOTS.filter(h => h.city === selectedCity);

  // Count stored complaint locations to augment
  const storedComplaints = getStoredComplaints();
  const locationCounts: Record<string, number> = {};
  storedComplaints.forEach(c => {
    const loc = c.location.toLowerCase();
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      {/* Info banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="font-display text-lg font-700 text-foreground mb-1">🤖 AI Smart Hotspot Detection</h3>
          <p className="text-sm text-muted-foreground">
            AI analyses complaint patterns to identify areas with frequent food safety issues. Areas with multiple complaints within 7 days are flagged as <strong>Food Safety Risk Zones</strong>.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Hotspots', value: MOCK_HOTSPOTS.length, icon: MapPin, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Critical Zones', value: MOCK_HOTSPOTS.filter(h => h.riskLevel === 'Critical').length, icon: AlertTriangle, color: 'text-red-700', bg: 'bg-red-100' },
          { label: 'Rising Trends', value: MOCK_HOTSPOTS.filter(h => h.trend === 'rising').length, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
          { label: 'Your Complaints', value: storedComplaints.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('h-5 w-5', stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-800 text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* City filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {cities.map(city => (
          <button
            key={city}
            onClick={() => setSelectedCity(city)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all',
              selectedCity === city
                ? 'gradient-primary text-white shadow-glow'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            )}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Hotspot cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(hotspot => (
          <div key={hotspot.area} className={cn(
            'bg-card border rounded-2xl p-5 transition-all hover:shadow-lg',
            hotspot.riskLevel === 'Critical' ? 'border-red-300/60 shadow-red-100/30' :
            hotspot.riskLevel === 'High' ? 'border-orange-300/60 shadow-orange-100/30' :
            'border-border'
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
                hotspot.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                hotspot.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                'bg-amber-100 text-amber-700'
              )}>
                <AlertTriangle className="h-3 w-3" />
                {hotspot.riskLevel} Risk
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold',
                hotspot.trend === 'rising' ? 'text-red-600' :
                hotspot.trend === 'declining' ? 'text-emerald-600' :
                'text-amber-600'
              )}>
                <TrendingUp className={cn('h-3 w-3', hotspot.trend === 'declining' && 'rotate-180')} />
                {hotspot.trend}
              </span>
            </div>

            <h3 className="font-display text-lg font-700 text-foreground">{hotspot.area}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" /> {hotspot.city}
            </p>

            <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complaints (7 days)</span>
                <span className="font-bold text-foreground">{hotspot.complaints}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top Issue</p>
                <p className="text-sm font-semibold text-foreground">{hotspot.topIssue}</p>
              </div>
            </div>

            {/* Risk bar */}
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn(
                  'h-full rounded-full transition-all',
                  hotspot.riskLevel === 'Critical' ? 'bg-red-500 w-[90%]' :
                  hotspot.riskLevel === 'High' ? 'bg-orange-500 w-[65%]' :
                  'bg-amber-500 w-[40%]'
                )} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User complaint locations */}
      {Object.keys(locationCounts).length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display text-base font-700 text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Your Reported Locations
          </h3>
          <div className="space-y-2">
            {Object.entries(locationCounts).sort(([, a], [, b]) => b - a).map(([loc, count]) => (
              <div key={loc} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium text-foreground capitalize">{loc}</span>
                <span className="text-sm font-bold text-primary">{count} complaint{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <FloatingChatBot {...COMPLAINT_BOT_CONFIG} />
    </div>
  );
}
