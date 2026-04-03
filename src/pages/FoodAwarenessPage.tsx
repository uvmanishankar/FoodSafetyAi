import { useState, useRef, useEffect } from 'react';
import {
  Eye, AlertTriangle, ShieldOff, Package, Tag, BarChart3,
  XCircle, ShoppingCart, Megaphone, Star,
  ChevronDown, Bot,
  CheckCircle2, BookOpen, Zap, Globe, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingChatBot from '@/components/FloatingChatBot';

const TACTICS = [
  {
    id:'shrinkflation', icon:Package, color:'text-red-600', bg:'bg-red-50', border:'border-red-200',
    title:'Shrinkflation', subtitle:'Less product, same price, same packaging', severity:'High',
    image:'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600&h=340&fit=crop&q=80',
    description:'Companies silently reduce product quantity by 10–25% while keeping the same package size and price. The bag looks identical on the shelf — only the net weight tells the truth.',
    examples:['Lays/Kurkure bags: same size bag, 10–15g less chips','Chocolate bars: same wrapper, thinner bar or one fewer square','Biscuit packs: one fewer biscuit per row','Fruit juice: 1L quietly became 950ml or 900ml','Soap bars: rounder shape conceals 10–15g reduction'],
    howToSpot:'Always check the net weight printed on the back or bottom of packaging. Compare to older receipts. Price per 100g is more honest than per pack.',
    impact:'Consumers pay ₹15–₹40 more per 100g without realising. Aggregate annual cost to an Indian household: ₹3,000–₹8,000.',
    legal:'Legal in India. FSSAI requires net weight disclosure but doesn\'t restrict reductions.',
    avoid:'Use price-per-100g. Compare before buying. Screenshot packaging periodically.',
  },
  {
    id:'naturewashing', icon:Tag, color:'text-green-700', bg:'bg-green-50', border:'border-green-200',
    title:'Nature-Washing', subtitle:'"Natural", "Pure", "Farm-fresh" — legally meaningless', severity:'High',
    image:'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=340&fit=crop&q=80',
    description:'Words like "natural", "pure", "wholesome", "farm-fresh" have no legal definition under FSSAI. Any product can print them freely regardless of what\'s actually inside.',
    examples:['"Natural flavours" can be 100% lab-synthesised chemicals','"Farm fresh" juice may be 6-month-old concentrate','"Pure ghee" may be 95% palm oil if % isn\'t specified','"Whole grain" bread where whole grains are 4th after maida','"Made with real fruit" with 2% actual fruit juice'],
    howToSpot:'Ignore all front-of-pack text. Flip to the ingredients list. Ingredients listed first = most abundant by weight.',
    impact:'Consumers pay 30–80% premium for claims that have zero regulatory backing.',
    legal:'Currently unregulated in India. FSSAI is drafting guidelines but they are not enforced.',
    avoid:'Trust only FSSAI-certified claims, organic marks, and the actual ingredients list.',
  },
  {
    id:'healthwashing', icon:BarChart3, color:'text-blue-600', bg:'bg-blue-50', border:'border-blue-200',
    title:'Health-Washing', subtitle:'Hiding junk food behind selective nutrition claims', severity:'High',
    image:'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=600&h=340&fit=crop&q=80',
    description:'Products use one positive nutrition fact to seem healthy while burying the full picture. A product can be "high in protein" while being 35% saturated fat and containing 40g of sugar.',
    examples:['"High protein" bars with 40g sugar and 300+ calories','"No added sugar" products loaded with maltodextrin or fruit concentrate','"Multigrain" crackers where all 5 grains are refined','"Baked not fried" chips with identical calorie count','"Zero trans fat" made with partially hydrogenated oils under disclosure threshold'],
    howToSpot:'Look at total sugar, saturated fat, and sodium per 100g — not per "serving size". Sugar >10g/100g = high sugar product.',
    impact:'Health-washed products account for ₹45,000 crore of India\'s packaged food market.',
    legal:'Partially regulated. FSSAI Regulations 2011 restrict some claims but enforcement is weak.',
    avoid:'Read per 100g figures. Check total sugar. Look up Nutri-Score on our platform.',
  },
  {
    id:'servingsize', icon:ShoppingCart, color:'text-orange-600', bg:'bg-orange-50', border:'border-orange-200',
    title:'Serving Size Manipulation', subtitle:'Making calories look smaller by splitting into unrealistic servings', severity:'Medium',
    image:'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&h=340&fit=crop&q=80',
    description:'Nutritional information is shown per "serving" which companies define themselves. A 750ml cola bottle shows nutrition "per 250ml". A single-person crisp packet becomes "2 servings".',
    examples:['Pepsi 750ml: nutrition shown per 250ml — nobody drinks 250ml','Ben & Jerry\'s: serving = ½ cup — nobody eats ½ cup','Protein powder: serving = 1 scoop but dose = 3 scoops','Chips 150g pack: declared as 3 servings','Energy drink 355ml can: "2 servings per can"'],
    howToSpot:'Always convert to per 100g or per 100ml. These are mandatory on Indian packs and are standardised for fair comparison.',
    impact:'Consumers underestimate calorie intake by 50–100% when reading per-serving data.',
    legal:'FSSAI requires per 100g data alongside per-serving. Many companies bury it in small print.',
    avoid:'Only use per 100g / per 100ml figures. Our product analyzer automatically converts everything.',
  },
  {
    id:'frontlabels', icon:Eye, color:'text-violet-600', bg:'bg-violet-50', border:'border-violet-200',
    title:'Front-of-Pack Illusions', subtitle:'Strategic colours and symbols that falsely signal health', severity:'Medium',
    image:'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&h=340&fit=crop&q=80',
    description:'Front-of-pack design is psychological manipulation. Green packaging, leaf imagery, and health stars are chosen by marketing teams — not nutritionists. Products with 5-star imagery may have FSSAI nutrition ratings of 1.5.',
    examples:['Green packaging for products with no environmental benefit','Leaves and nature imagery on ultra-processed cereals','"Doctor recommended" with no verification','"0g Trans Fat" stamp next to hidden saturated fat','Children\'s cereals with cartoon characters suggesting fun/health'],
    howToSpot:'Treat all front-of-pack imagery as advertising. The legally required information is on the back: ingredients list and nutrition table.',
    impact:'Front-of-pack health imagery increases purchase intent by 35–60% regardless of actual nutrition.',
    legal:'FSSAI has proposed traffic-light labelling but industry lobbying has delayed mandatory implementation.',
    avoid:'Cover the front of the pack while shopping. Only read the back. Use our platform to decode instantly.',
  },
  {
    id:'sugar', icon:AlertTriangle, color:'text-pink-600', bg:'bg-pink-50', border:'border-pink-200',
    title:'Sugar\'s 56 Aliases', subtitle:'Sugar appearing 8 times on one label under different names', severity:'High',
    image:'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=340&fit=crop&q=80',
    description:'Sugar has 56+ documented alternative names. By using multiple aliases, companies list each one separately further down the ingredients list — making the product appear lower in sugar than it really is.',
    examples:['Dextrose, fructose, sucrose, maltose, corn syrup — all sugar','Fruit juice concentrate, cane juice, molasses, honey — still sugar','Evaporated cane juice sounds like plant product — it is just sugar','Barley malt extract, brown rice syrup — different names, same metabolic impact','"No refined sugar" products full of agave syrup (76% fructose)'],
    howToSpot:'Look for "-ose" suffix and "syrup", "concentrate", "malt", "juice" in ingredients. Look at total sugars in the nutrition table per 100g.',
    impact:'Average urban Indian consumes 65g sugar/day. WHO recommends <25g. Hidden sugars account for 60% of the excess.',
    legal:'FSSAI requires total sugar disclosure in nutrition table but allows any ingredient name in ingredients list.',
    avoid:'Always check "Total Sugars" per 100g in the nutrition table. >10g per 100g = high sugar product.',
  },
  {
    id:'fortification', icon:Zap, color:'text-amber-600', bg:'bg-amber-50', border:'border-amber-200',
    title:'"Fortified & Enriched" Trap', subtitle:'Stripping nutrients then adding back synthetics as a selling point', severity:'Medium',
    image:'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&h=340&fit=crop&q=80',
    description:'Refined flour has bran and germ stripped away, removing 20+ nutrients. Manufacturers add back 4–5 synthetic vitamins and sell it as "fortified" at premium. You pay extra for an inferior version of what the original food already contained.',
    examples:['Fortified white bread — refined flour with synthetic B vitamins added back','"Iron fortified" cereal — iron added after natural iron was processed away','Fortified juice — vitamins added to compensate for pasteurisation destruction','"Added calcium" milk — added to watered-down product','Vitamin D enriched oil — marketing a basic nutrition requirement'],
    howToSpot:'Check if the base ingredient is whole or refined. "Wheat flour" = whole wheat. "Refined wheat flour" / "maida" = refined. Fortification doesn\'t equal whole grain nutrition.',
    impact:'Synthetic vitamins have lower bioavailability than natural food-matrix vitamins. You absorb less.',
    legal:'FSSAI has mandatory fortification for some products (salt, oil, flour) to address national deficiency. Voluntary claims are often misleading.',
    avoid:'Choose whole foods. If a product needs to advertise added vitamins, it probably removed them first.',
  },
  {
    id:'enumeration', icon:ShieldOff, color:'text-teal-600', bg:'bg-teal-50', border:'border-teal-200',
    title:'E-Number Concealment', subtitle:'Using codes instead of chemical names to obscure additives', severity:'Medium',
    image:'https://images.unsplash.com/photo-1584949091598-c31daaaa4aa9?w=600&h=340&fit=crop&q=80',
    description:'E-numbers are official additive codes. Companies use them instead of common names precisely because consumers don\'t recognise them. E211 looks benign. "Sodium Benzoate (forms benzene with Vitamin C)" would not.',
    examples:['E211 = Sodium Benzoate — forms benzene, linked to ADHD','E320 = BHA — possibly carcinogenic, banned in UK and EU','E102 = Tartrazine (Yellow 5) — ADHD warning label in EU','E621 = MSG — safe but feared due to poor labelling context','E150d = Caramel colour IV — contains 4-MEI, possible carcinogen'],
    howToSpot:'Whenever you see "E" followed by a number in ingredients, search it in our Ingredient Explorer. Know what you\'re consuming.',
    impact:'73% of Indian consumers don\'t know what E-numbers mean and assume they\'re safe because of the "official" coding system.',
    legal:'FSSAI permits E-number labelling. EU requires common names alongside E-numbers for many additives — India does not.',
    avoid:'Use our Ingredient Explorer to decode every E-number instantly.',
  },
  {
    id:'childmarketing', icon:Megaphone, color:'text-rose-600', bg:'bg-rose-50', border:'border-rose-200',
    title:'Child-Directed Marketing', subtitle:'Targeting children with junk food disguised as fun and health', severity:'High',
    image:'https://images.unsplash.com/photo-1599785209796-786432b22906?w=600&h=340&fit=crop&q=80',
    description:'Breakfast cereals, biscuits, and snacks use cartoon characters, bright colours, and playground sponsorships to target children. The same products often contain 30–50% sugar.',
    examples:['Kellogg\'s Froot Loops: 43% sugar — marketed to children with a toucan mascot','Maggi "healthy" variant: still high sodium, marketed to school kids','Appy Fizz "fruit drink": 3% juice, 95% carbonated sugar water with cartoon design','Cadbury Gems: no nutritional value, child-specific small packaging','Sports drinks endorsed by cricketers — targeting 8–14 year olds with 25g sugar/bottle'],
    howToSpot:'Any product with a cartoon character, toy tie-in, or school/sport sponsorship — check the sugar content per 100g immediately.',
    impact:'India has 27 million projected obese children by 2030. Second-largest childhood obesity rate globally.',
    legal:'WHO recommends restricting child-directed marketing of HFSS foods. India has voluntary guidelines only — not enforced.',
    avoid:'Teach children to read labels. Never buy purely on cartoon packaging. Make label reading a family habit.',
  },
  {
    id:'superfood', icon:Star, color:'text-indigo-600', bg:'bg-indigo-50', border:'border-indigo-200',
    title:'"Superfood" Premium Scam', subtitle:'Marketing ordinary foods at 10× price with unsubstantiated claims', severity:'Low',
    image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=340&fit=crop&q=80',
    description:'"Superfood" is not a scientific or legal term. It was coined by a banana company in 1904 as a marketing term. Many expensive "superfoods" have properties equivalent to common affordable Indian foods.',
    examples:['Quinoa (₹800/kg) vs Rajma (₹120/kg) — nearly identical protein and fibre','Acai berry powder (₹2,000) vs fresh amla (₹40/kg) — amla has 20× more Vitamin C','Kale chips (₹400) vs palak saag (₹30) — same nutrient profile','Himalayan pink salt (₹300/kg) vs iodised salt (₹20/kg) — no proven health benefit','Activated charcoal drinks — no evidence of detox benefit in healthy individuals'],
    howToSpot:'For every exotic superfood, a traditional Indian equivalent exists at 5–10% of the cost with equal or better nutrition.',
    impact:'India\'s superfood market: ₹12,000 crore. Most benefits attributable to ordinary diet changes.',
    legal:'"Superfood" claims are not regulated by FSSAI. Companies can use the term without any evidence.',
    avoid:'Amla, haldi, rajma, dalchini, methi, moong — your dadi\'s kitchen had it right. Traditional Indian foods are the original superfoods.',
  },
];

const LABEL_STEPS = [
  {step:1,icon:'❌',title:'Ignore the front completely',tip:'All front-of-pack claims are marketing, not science.'},
  {step:2,icon:'📋',title:'Find the ingredients list',tip:'First ingredient = most abundant. If sugar is in top 3, it\'s a sugar product.'},
  {step:3,icon:'🍬',title:'Count sugar aliases',tip:'Look for: dextrose, fructose, maltose, syrup, concentrate, malt, cane juice. Add them all up.'},
  {step:4,icon:'📊',title:'Check nutrition per 100g',tip:'Ignore per-serving. Sugar >10g/100g = high. Sodium >600mg/100g = high. Fat >20g/100g = high.'},
  {step:5,icon:'🔢',title:'Identify E-numbers',tip:'Every "E" followed by a number — search it. Use our Ingredient Explorer for instant risk rating.'},
  {step:6,icon:'⚠️',title:'Check allergen declaration',tip:'Mandatory in India: milk, eggs, fish, nuts, wheat, soy. "May contain" = shared facility.'},
  {step:7,icon:'🏛️',title:'Read the FSSAI licence number',tip:'14-digit FSSAI number is mandatory. Missing = illegal product. Verify at fssai.gov.in.'},
];

const AWARENESS_BOT_CONFIG = {
  botName: 'Food Awareness AI',
  subtitle: 'Decode any label claim, tactic, or ingredient',
  systemPrompt: `You are a food industry watchdog and consumer rights expert. Help people understand: corporate food marketing manipulation (shrinkflation, health-washing, nature-washing, serving size tricks, sugar aliases, E-number concealment, child marketing), how to read food labels correctly, what ingredients/E-numbers actually are, Indian FSSAI regulations, and how to compare products honestly. Be direct, factual, use specific examples, bullet points, and clear structure. Include FSSAI regulatory context where relevant.`,
  welcomeMessage: `👋 Hi! I'm your Food Awareness AI. I can help you:

- **Identify corporate manipulation tactics** on your products
- **Decode suspicious label claims** ("natural", "no added sugar", etc.)
- **Explain what any E-number or additive** really is
- **Guide you through reading** any food label correctly
- **Tell you which traditional Indian foods** beat expensive "superfoods"

**What would you like to expose today?**`,
  quickReplies: [
    'How do I spot shrinkflation?',
    'What does "no added sugar" really mean?',
    'Explain E211',
    'How do I read an Indian food label?',
  ],
  accentColor: 'text-violet-600',
  accentBg: 'bg-violet-50',
  iconGradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
  botIconColor: 'text-violet-600',
  botIconBg: 'bg-violet-100',
};

function TacticCard({t}:{t:typeof TACTICS[0]}){
  const[open,setOpen]=useState(false);
  const contentRef=useRef<HTMLDivElement>(null);
  const[contentHeight,setContentHeight]=useState(0);
  const Icon=t.icon;
  const iconBg=t.bg.replace('bg-','bg-').replace('-50','-100');

  useEffect(()=>{
    if(contentRef.current){
      setContentHeight(open?contentRef.current.scrollHeight:0);
    }
  },[open]);

  return(
    <div className={cn('rounded-2xl border overflow-hidden transition-all duration-300',t.border,open&&'shadow-lg ring-1 ring-black/5')}>
      <button onClick={()=>setOpen(o=>!o)} className={cn('w-full flex items-start gap-4 p-5 text-left transition-colors duration-200 hover:brightness-[0.97]',t.bg)}>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm',iconBg)}>
          <Icon className={cn('h-6 w-6',t.color)}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h3 className={cn('font-display font-700 text-lg text-foreground transition-colors duration-200',open&&t.color)}>{t.title}</h3>
                <span className={cn('text-[10px] font-700 px-2.5 py-0.5 rounded-full border uppercase tracking-wide',
                  t.severity==='High'?'bg-red-100 text-red-700 border-red-200':t.severity==='Medium'?'bg-amber-100 text-amber-700 border-amber-200':'bg-blue-100 text-blue-700 border-blue-200')}>
                  {t.severity} impact
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 transition-all duration-300 border',
              open?`${t.bg} ${t.border} rotate-180`:'bg-muted/50 border-border')}>
              <ChevronDown className={cn('h-4 w-4 transition-colors',open?t.color:'text-muted-foreground')}/>
            </div>
          </div>
        </div>
      </button>
      <div
        style={{height:contentHeight,opacity:open?1:0}}
        className="transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
      >
        <div ref={contentRef} className="px-5 pb-6 pt-4 border-t border-border/40 bg-card space-y-5">
          {/* Tactic Image */}
          <div className="relative rounded-xl overflow-hidden h-48 sm:h-56">
            <img src={t.image} alt={t.title} className="w-full h-full object-cover" loading="lazy"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"/>
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-white text-sm font-semibold leading-snug drop-shadow-md">{t.description.slice(0,100)}…</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><BookOpen className="h-3.5 w-3.5"/>Real examples in India</h4>
            <ul className="space-y-2">{t.examples.map((e,i)=><li key={i} className="flex items-start gap-2.5 text-sm p-2 rounded-lg hover:bg-muted/40 transition-colors"><XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5"/><span className="text-foreground/80">{e}</span></li>)}</ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
              <p className="text-xs font-700 text-amber-800 mb-1.5 flex items-center gap-1.5"><Eye className="h-3.5 w-3.5"/>How to spot it</p>
              <p className="text-xs text-amber-700 leading-relaxed">{t.howToSpot}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
              <p className="text-xs font-700 text-emerald-800 mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5"/>How to avoid it</p>
              <p className="text-xs text-emerald-700 leading-relaxed">{t.avoid}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 shadow-sm"><p className="text-xs font-700 text-red-700 mb-1">💸 Impact</p><p className="text-xs text-red-600">{t.impact}</p></div>
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 shadow-sm"><p className="text-xs font-700 text-sky-700 mb-1">⚖️ FSSAI / Legal status</p><p className="text-xs text-sky-600">{t.legal}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FoodAwarenessPage(){
  const[search,setSearch]=useState('');
  const[sev,setSev]=useState<string|null>(null);
  const filtered=TACTICS.filter(t=>(!sev||t.severity===sev)&&(t.title.toLowerCase().includes(search.toLowerCase())||t.description.toLowerCase().includes(search.toLowerCase())));
  return(
    <div className="page-wrapper pt-20">
      <section className="relative gradient-hero border-b border-border/60 overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-red-500/6 top-[-100px] right-[-100px]"/>
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-full border border-red-300/60 bg-red-50/80 text-red-700 text-xs font-semibold">
                <Eye className="h-3.5 w-3.5"/>Consumer Awareness
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-800 text-foreground mb-4 leading-[1.1]">
                How food companies
                <span className="block bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">manipulate you</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                From shrinkflation to health-washing, sugar aliases to E-number concealment — expose 10 tactics hidden on every supermarket shelf. Plus: how to read any label correctly.
              </p>
              <div className="flex flex-wrap gap-4">
                {[{icon:Package,label:`${TACTICS.length} corporate tactics`},{icon:BookOpen,label:'Label reading guide'},{icon:Bot,label:'AI awareness assistant'},{icon:Globe,label:'FSSAI legal context'}].map(({icon:Icon,label})=>(
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
                  src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=700&h=500&fit=crop&q=80"
                  alt="Food labels and consumer awareness"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-2 z-10">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">{TACTICS.length} Tactics Exposed</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">With FSSAI legal context</p>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Expose tactics
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Label reading guide
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Floating AI Awareness Assistant */}
        <FloatingChatBot {...AWARENESS_BOT_CONFIG} />
        {/* Label Reading Guide */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><BookOpen className="h-5 w-5 text-emerald-700"/></div>
            <div>
              <h2 className="font-display text-2xl font-800 text-foreground">How to Read Any Food Label</h2>
              <p className="text-xs text-muted-foreground">7 steps every Indian consumer should follow — every time</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LABEL_STEPS.map(({step,title,icon,tip})=>(
              <div key={step} className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center shadow-glow"><span className="text-white text-[11px] font-800">{step}</span></div>
                  <span className="text-2xl">{icon}</span>
                </div>
                <h3 className="font-display font-700 text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Tactics */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-800 text-foreground">Corporate Food Tactics — Exposed</h2>
              <p className="text-sm text-muted-foreground mt-1">Click any tactic to see real examples, how to spot it, and how to avoid it</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-40"/></div>
              {['High','Medium','Low'].map(s=><button key={s} onClick={()=>setSev(f=>f===s?null:s)} className={cn('text-xs font-semibold px-3 py-2 rounded-xl border transition-all',sev===s?'bg-primary text-white border-primary':'bg-card border-border text-muted-foreground hover:border-primary/40')}>{s} impact</button>)}
            </div>
          </div>
          <div className="space-y-3">{filtered.map(t=><TacticCard key={t.id} t={t}/>)}</div>
        </div>
      </div>
    </div>
  );
}
