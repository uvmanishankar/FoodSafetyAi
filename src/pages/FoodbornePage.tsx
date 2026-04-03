import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Thermometer, Clock, Shield, ChevronDown, ChevronUp,
  ArrowRight, Bot, Send, Loader2, User, Sparkles, Activity, Zap,
  CheckCircle2, XCircle, Info, Heart, Package, Microscope, Search,
  Home, Building2, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingChatBot from '@/components/FloatingChatBot';

const DISEASES = [
  {
    id:'salmonellosis', name:'Salmonellosis', pathogen:'Salmonella bacteria', severity:'high', emoji:'🥚',
    color:'text-red-700', bg:'bg-red-50', border:'border-red-200',
    foods:['Raw/undercooked eggs','Undercooked poultry','Unpasteurised milk','Raw sprouts','Contaminated water'],
    onset:'6–72 hours', duration:'4–7 days',
    symptoms:['Diarrhoea (may be bloody)','Fever (38–40°C)','Stomach cramps and nausea','Vomiting','Headache and muscle pain'],
    prevention:['Cook poultry to 74°C internal temperature','Refrigerate within 2 hours of cooking','Wash hands after handling raw eggs','Avoid cross-contamination with raw poultry','Never eat raw batter or dough'],
    treatment:'Usually self-limiting. Oral rehydration. Antibiotics only for severe cases. Seek hospital if fever &gt;39°C or bloody diarrhoea.',
    atRisk:'Children under 5, elderly, pregnant women, immunocompromised individuals',
    india:'One of the most common food poisoning causes in India. Estimated 2–4 million cases annually. Peaks in monsoon.',
  },
  {
    id:'ecoli', name:'E. coli Infection', pathogen:'Escherichia coli O157:H7', severity:'critical', emoji:'🥩',
    color:'text-rose-700', bg:'bg-rose-50', border:'border-rose-200',
    foods:['Undercooked ground beef','Raw leafy greens','Unpasteurised juice/milk','Contaminated water','Unwashed fruits/vegetables'],
    onset:'1–10 days (usually 3–4)', duration:'5–10 days',
    symptoms:['Severe stomach cramps','Watery then bloody diarrhoea','Vomiting','Low or no fever','HUS (kidney failure) in severe cases'],
    prevention:['Cook beef to 71°C — no pink inside','Wash all produce thoroughly','Drink only pasteurised juice and milk','Wash hands after toilet','Separate raw meat from other foods'],
    treatment:'AVOID antibiotics (can worsen HUS). Oral rehydration only. Emergency care if bloody diarrhoea, no urination, or extreme paleness.',
    atRisk:'Children under 5 at highest risk of HUS — a potentially fatal kidney complication',
    india:'Contaminated water is the primary route. Responsible for significant child mortality.',
  },
  {
    id:'typhoid', name:'Typhoid Fever', pathogen:'Salmonella Typhi', severity:'critical', emoji:'💧',
    color:'text-orange-700', bg:'bg-orange-50', border:'border-orange-200',
    foods:['Contaminated water','Street food','Unwashed raw fruits/vegetables','Food handled by infected persons','Ice made from contaminated water'],
    onset:'1–3 weeks', duration:'2–4 weeks without treatment',
    symptoms:['Gradually increasing fever (can reach 40°C)','Headache and fatigue','Abdominal pain and constipation (early) then diarrhoea','Rose-coloured spots on chest','Enlarged spleen/liver'],
    prevention:['Drink only boiled or bottled water','Eat only cooked food, freshly served','Avoid street food in high-risk areas','Typhoid vaccine (recommended in India)','Strict hand hygiene'],
    treatment:'Antibiotics (azithromycin or cefixime). Must complete full course. Hospitalisation for severe cases. Paracetamol for fever.',
    atRisk:'Travellers, children, and adults in areas without clean water infrastructure',
    india:'India has the highest typhoid burden globally — approximately 4.5 million cases annually. Highest in UP, Bihar, and West Bengal.',
  },
  {
    id:'hepatitisA', name:'Hepatitis A', pathogen:'Hepatitis A Virus (HAV)', severity:'high', emoji:'🫙',
    color:'text-yellow-700', bg:'bg-yellow-50', border:'border-yellow-200',
    foods:['Contaminated water or ice','Raw shellfish (oysters, clams)','Salads and sandwiches handled by infected persons','Unpeeled fruits and vegetables','Undercooked food'],
    onset:'2–6 weeks', duration:'2 weeks to 3 months',
    symptoms:['Jaundice (yellowing of skin and eyes)','Fatigue and weakness','Nausea and vomiting','Abdominal pain (right side, near liver)','Dark urine and pale stools'],
    prevention:['Hepatitis A vaccine (2 doses, lifelong protection)','Wash hands thoroughly especially after toilet','Boil water if in doubt','Avoid raw shellfish','Peel all fruits yourself'],
    treatment:'No specific treatment. Rest, fluids, and avoid alcohol. Liver function tests needed. Recovery usually complete. No chronic infection.',
    atRisk:'Travellers, children in low-sanitation areas, people with chronic liver disease',
    india:'India is hyper-endemic for Hepatitis A. Outbreaks common in schools. Vaccine not yet in national immunisation schedule but recommended.',
  },
  {
    id:'listeriosis', name:'Listeriosis', pathogen:'Listeria monocytogenes', severity:'critical', emoji:'🥗',
    color:'text-purple-700', bg:'bg-purple-50', border:'border-purple-200',
    foods:['Soft cheeses (brie, camembert)','Deli meats and sausages','Smoked fish','Pre-packed salads','Unpasteurised dairy products'],
    onset:'1–4 weeks', duration:'Days to weeks',
    symptoms:['Fever and muscle aches','Nausea or diarrhoea','Headache and stiff neck (meningitis form)','Confusion and loss of balance','Convulsions (severe cases)'],
    prevention:['Avoid soft cheeses during pregnancy','Refrigerate within 2 hours','Keep fridge at 4°C or below','Cook deli meats until steaming hot','Avoid unpasteurised dairy'],
    treatment:'Hospitalisation required for high-risk groups. IV antibiotics (ampicillin). High mortality rate in pregnant women — can cause miscarriage or stillbirth.',
    atRisk:'CRITICAL for pregnant women, newborns, elderly, immunocompromised. 20–30% mortality in vulnerable groups.',
    india:'Under-reported but increasing with rise of deli/ready-to-eat food culture in urban India.',
  },
  {
    id:'norovirus', name:'Norovirus (Stomach Flu)', pathogen:'Norovirus', severity:'medium', emoji:'🦠',
    color:'text-blue-700', bg:'bg-blue-50', border:'border-blue-200',
    foods:['Contaminated raw shellfish','Unwashed produce','Ready-to-eat foods handled by infected persons','Contaminated water','Buffet food'],
    onset:'12–48 hours', duration:'1–3 days',
    symptoms:['Sudden onset nausea','Projectile vomiting','Watery diarrhoea','Stomach cramps','Low-grade fever'],
    prevention:['Thorough hand washing for 20 seconds','Stay home when sick for 48 hours after recovery','Cook shellfish thoroughly','Clean and disinfect contaminated surfaces','Do not handle food when ill'],
    treatment:'Usually self-limiting. ORS (Oral Rehydration Salts) to prevent dehydration. Rest. Seek care if dehydration signs appear.',
    atRisk:'All ages. Extremely contagious — one infected food handler can infect hundreds.',
    india:'Major cause of outbreaks in schools, offices, and social gatherings. Spreads rapidly in close quarters.',
  },
  {
    id:'cholera', name:'Cholera', pathogen:'Vibrio cholerae', severity:'critical', emoji:'💦',
    color:'text-cyan-700', bg:'bg-cyan-50', border:'border-cyan-200',
    foods:['Contaminated water','Raw/undercooked shellfish','Raw fruits and vegetables washed in contaminated water','Street food in endemic areas','Rice and grains cooked in contaminated water'],
    onset:'Hours to 5 days', duration:'Days (severe cases)',
    symptoms:['Profuse watery diarrhoea (rice-water stools)','Rapid severe dehydration','Vomiting','Muscle cramps','Sunken eyes and skin turgor loss'],
    prevention:['Drink only boiled or bottled water','Eat only cooked food, freshly served','Oral cholera vaccine for endemic areas','Strict hand hygiene','Never use untreated water for cooking'],
    treatment:'MEDICAL EMERGENCY. Immediate aggressive oral or IV rehydration. Can lose 1L fluid/hour. Antibiotics shorten course. Without treatment, 25–50% mortality.',
    atRisk:'Anyone without access to clean water and sanitation. Rapid death can occur within hours in severe cases.',
    india:'Endemic in parts of Bengal, Odisha, Bihar. Monsoon outbreaks common. Notifiable disease under national surveillance.',
  },
  {
    id:'aflatoxin', name:'Aflatoxin Poisoning', pathogen:'Aspergillus fungi toxin', severity:'high', emoji:'🌽',
    color:'text-amber-700', bg:'bg-amber-50', border:'border-amber-200',
    foods:['Improperly stored groundnuts/peanuts','Maize/corn stored in humid conditions','Dried chillies','Stored grains (wheat, rice)','Dried fruit'],
    onset:'Acute: hours. Chronic: months/years', duration:'Variable',
    symptoms:['Acute: nausea, vomiting, abdominal pain, liver failure','Chronic: jaundice, weight loss, stunted growth in children','Long-term: liver cancer (aflatoxin is IARC Group 1 carcinogen)','Immune suppression','Stunted development in children'],
    prevention:['Never eat mouldy nuts or grains — the toxin persists even after cooking','Buy peanuts/groundnuts in sealed packs from reputable brands','Store grains in cool, dry, airtight conditions','Check for visible mould before cooking','India imports regulations: FSSAI limit 10 ppb'],
    treatment:'No antidote. Supportive treatment for acute poisoning. Liver transplant for acute liver failure. Ongoing monitoring.',
    atRisk:'Children most at risk for growth effects. Those with regular exposure to stored/mouldy nuts or grain.',
    india:'Major concern in stored groundnuts and maize. FSSAI sets maximum aflatoxin limits. Monitoring is inconsistent in rural markets.',
  },
];

const PREVENTION_TIPS = [
  {icon:'🧼', title:'Clean', desc:'Wash hands for 20 seconds. Wash all surfaces, utensils, and produce before use.'},
  {icon:'🔀', title:'Separate', desc:'Use separate cutting boards for raw meat and vegetables. Never cross-contaminate.'},
  {icon:'🌡️', title:'Cook', desc:'Cook to safe internal temperatures: Poultry 74°C, Beef/Pork 71°C, Fish 63°C.'},
  {icon:'❄️', title:'Chill', desc:'Refrigerate perishables within 2 hours. Keep fridge at 4°C. Freezer at -18°C.'},
];

const SYMPTOM_BOT_CONFIG = {
  botName: 'Symptom Checker AI',
  subtitle: 'Describe symptoms to identify possible foodborne illness',
  systemPrompt: `You are a food safety and public health expert helping identify possible foodborne illnesses. When someone describes symptoms:
1. Ask about onset timing, specific symptoms, foods eaten in last 1–7 days, and number of people affected
2. Identify the most likely pathogen(s) based on symptom pattern and incubation period
3. Assess severity: mild (home management), moderate (see doctor within 24h), or severe (emergency - go now)
4. Give clear EMERGENCY SIGNS: bloody diarrhoea, inability to keep fluids down 24h+, high fever >39°C, signs of dehydration, stiff neck, confusion, jaundice
5. Explain the likely disease, its source, and specific home care if appropriate
6. Give clear prevention advice for the future

ALWAYS include: This is educational guidance, not a medical diagnosis. For severe symptoms go to hospital immediately. In India: 1800-11-4477 is Poison Control.

Be warm but direct. Use clear sections. Emergency symptoms in RED language. Keep responses concise.`,
  welcomeMessage: `🩺 I'm your Foodborne Disease AI. I can help you:

- **Identify possible causes** based on your symptoms, foods eaten, and timing
- **Assess severity** — whether to manage at home or seek immediate care
- **Understand the disease** — pathogen, incubation period, what to avoid
- **Prevention guidance** — how to prevent recurrence

⚠️ *This is for educational guidance only, not a medical diagnosis. For severe symptoms, please consult a doctor or go to a hospital immediately.*

**Describe your symptoms, when they started, and what you ate recently:**`,
  quickReplies: [
    'I have diarrhoea and vomiting since morning',
    'I have fever and stomach pain after eating street food',
    'Multiple people got sick after the same meal',
    'My child has watery diarrhoea — is it serious?',
  ],
  accentColor: 'text-red-600',
  accentBg: 'bg-red-50',
  iconGradient: 'bg-gradient-to-br from-red-500 to-rose-600',
  botIconColor: 'text-red-600',
  botIconBg: 'bg-red-100',
};

function DiseaseCard({d}:{d:typeof DISEASES[0]}){
  const[open,setOpen]=useState(false);
  const severityConfig={
    critical:{label:'CRITICAL',bg:'bg-red-100',text:'text-red-800',border:'border-red-300'},
    high:{label:'HIGH RISK',bg:'bg-orange-100',text:'text-orange-800',border:'border-orange-300'},
    medium:{label:'MODERATE',bg:'bg-amber-100',text:'text-amber-800',border:'border-amber-300'},
  };
  const sc=severityConfig[d.severity as keyof typeof severityConfig];
  return(
    <div className={cn('rounded-2xl border overflow-hidden transition-all',d.border,open&&'shadow-md')}>
      <button onClick={()=>setOpen(o=>!o)} className={cn('w-full flex items-start gap-4 p-5 text-left transition-colors hover:bg-foreground/3',d.bg)}>
        <span className="text-3xl shrink-0 mt-0.5">{d.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className={cn('font-display font-700 text-foreground',open&&d.color)}>{d.name}</h3>
                <span className={cn('text-[10px] font-700 px-2 py-0.5 rounded border uppercase tracking-wide',sc.bg,sc.text,sc.border)}>{sc.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">Caused by: {d.pathogen}</p>
              <div className="flex gap-3 mt-1">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/>Onset: {d.onset}</span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Activity className="h-3 w-3"/>Duration: {d.duration}</span>
              </div>
            </div>
            {open?<ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1"/>:<ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1"/>}
          </div>
        </div>
      </button>
      {open&&(
        <div className="px-5 pb-6 pt-4 border-t border-border/40 bg-card grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><Package className="h-3.5 w-3.5"/>Common food sources</h4>
            <ul className="space-y-1">{d.foods.map((f,i)=><li key={i} className="flex items-start gap-2 text-sm"><XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5"/><span className="text-muted-foreground">{f}</span></li>)}</ul>
          </div>
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><Thermometer className="h-3.5 w-3.5"/>Symptoms</h4>
            <ul className="space-y-1">{d.symptoms.map((s,i)=><li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5"/><span className="text-muted-foreground">{s}</span></li>)}</ul>
          </div>
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><Shield className="h-3.5 w-3.5"/>Prevention</h4>
            <ul className="space-y-1">{d.prevention.map((p,i)=><li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5"/><span className="text-muted-foreground">{p}</span></li>)}</ul>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-700 text-blue-700 mb-1 flex items-center gap-1.5"><Heart className="h-3 w-3"/>Treatment</p>
              <p className="text-xs text-blue-700 leading-relaxed">{d.treatment}</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-700 text-amber-700 mb-1">⚠️ At risk groups</p>
              <p className="text-xs text-amber-700">{d.atRisk}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
              <p className="text-xs font-700 text-orange-700 mb-1">🇮🇳 India context</p>
              <p className="text-xs text-orange-700">{d.india}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FoodbornePage(){
  const[search,setSearch]=useState('');
  const[sev,setSev]=useState<string|null>(null);
  const filtered=DISEASES.filter(d=>(!sev||d.severity===sev)&&(d.name.toLowerCase().includes(search.toLowerCase())||d.pathogen.toLowerCase().includes(search.toLowerCase())||d.foods.some(f=>f.toLowerCase().includes(search.toLowerCase()))));
  return(
    <div className="page-wrapper pt-20">
      <section className="relative gradient-hero border-b border-border/60 overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-red-500/6 top-[-100px] left-[-100px]"/>
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-full border border-red-300/60 bg-red-50/80 text-red-700 text-xs font-semibold">
                <Activity className="h-3.5 w-3.5"/>Foodborne Disease Guide
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-800 text-foreground mb-4 leading-[1.1]">
                Foodborne
                <span className="block bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">Diseases</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Identify, understand, and prevent the most dangerous food-related illnesses. AI symptom checker, disease database with India-specific context, and treatment guidance.
              </p>
              <div className="flex flex-wrap gap-4">
                {[{icon:Activity,label:`${DISEASES.length} diseases covered`},{icon:Bot,label:'AI symptom checker'},{icon:Shield,label:'Prevention guides'},{icon:Info,label:'India-specific data'}].map(({icon:Icon,label})=>(
                  <span key={label} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium shadow-sm">
                    <Icon className="h-4 w-4 text-red-600"/>{label}
                  </span>
                ))}
              </div>
            </div>
            {/* Hero Image */}
            <div className="hidden lg:block relative pb-6 pl-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                <img
                  src="https://images.unsplash.com/photo-1584362917165-526a968579e8?w=700&h=500&fit=crop&q=80"
                  alt="Food safety and disease prevention"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-2 z-10">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">{DISEASES.length} Diseases Covered</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">India-specific data</p>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" /> AI symptom checker
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" /> Prevention guides
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Emergency banner */}
        <div className="p-5 rounded-2xl bg-red-600 text-white flex items-center gap-4">
          <AlertTriangle className="h-8 w-8 shrink-0"/>
          <div>
            <p className="font-700 text-lg">When to seek emergency care immediately</p>
            <p className="text-white/85 text-sm mt-1">Bloody diarrhoea · Fever above 39°C · Unable to keep fluids down for 24h · No urination · Stiff neck or confusion · Jaundice · Severe abdominal pain · Signs of dehydration in children</p>
          </div>
          <div className="shrink-0 text-right ml-auto">
            <p className="text-[11px] text-white/70">India Poison Control</p>
            <p className="font-800 text-xl">1800-11-4477</p>
            <p className="font-700">Emergency: 112</p>
          </div>
        </div>
        {/* 4-step prevention */}
        <div>
          <h2 className="font-display text-2xl font-800 text-foreground mb-2">4 Core Prevention Principles</h2>
          <p className="text-muted-foreground text-sm mb-6">90% of foodborne illnesses are preventable with these four practices</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PREVENTION_TIPS.map(({icon,title,desc})=>(
              <div key={title} className="p-5 rounded-2xl bg-card border border-border text-center hover:border-primary/30 hover:shadow-md transition-all">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-display font-700 text-foreground mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Floating AI Symptom Checker */}
        <FloatingChatBot {...SYMPTOM_BOT_CONFIG} />
        {/* Disease database */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-800 text-foreground">Disease Database</h2>
              <p className="text-sm text-muted-foreground mt-1">Click any disease for symptoms, prevention, treatment and India context</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search disease or food…" className="pl-8 pr-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"/></div>
              {['critical','high','medium'].map(s=><button key={s} onClick={()=>setSev(f=>f===s?null:s)} className={cn('text-xs font-semibold px-3 py-2 rounded-xl border transition-all capitalize',sev===s?'bg-primary text-white border-primary':'bg-card border-border text-muted-foreground hover:border-primary/40')}>{s}</button>)}
            </div>
          </div>
          <div className="space-y-3">{filtered.map(d=><DiseaseCard key={d.id} d={d}/>)}</div>
        </div>
        {/* Related CTAs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{icon:Home,title:'Test Your Food at Home',desc:'Detect adulterants before illness strikes',href:'/testing-guide',color:'text-emerald-600'},{icon:Building2,title:'Find FSSAI Labs',desc:'Professional food safety testing near you',href:'/labs',color:'text-sky-600'},{icon:Bell,title:'Safety Alerts',desc:'Real-time food recalls and contamination alerts',href:'/alerts',color:'text-amber-600'}].map(({icon:Icon,title,desc,href,color})=>(
            <Link key={href} to={href} className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><Icon className={cn('h-5 w-5',color)}/></div>
              <div className="flex-1"><p className="font-display font-700 text-foreground text-sm mb-1">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
              <ArrowRight className={cn('h-4 w-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1',color)}/>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
