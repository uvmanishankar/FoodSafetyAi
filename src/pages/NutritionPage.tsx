import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Apple, BarChart3, Clock, ArrowRight, Bot, Send, Loader2,
  User, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Info,
  Zap, Scale, Sun, Moon, Coffee, Star, ArrowUpRight, Flame,
  Activity, Shield, Leaf, Search, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingChatBot from '@/components/FloatingChatBot';

const DAILY_INTAKE = [
  {nutrient:'Calories',      unit:'kcal', man:2500,  woman:2000,  child:1800, icon:'🔥', color:'bg-orange-500', tip:'Varies with activity. These are sedentary baselines. Athletes need 500–1000 more.'},
  {nutrient:'Protein',       unit:'g',    man:56,    woman:46,    child:34,   icon:'💪', color:'bg-blue-500',   tip:'Athletes need 1.2–2g per kg body weight. Essential for muscle repair and immunity.'},
  {nutrient:'Carbohydrates', unit:'g',    man:300,   woman:225,   child:220,  icon:'🌾', color:'bg-amber-500',  tip:'Choose complex carbs (whole grains, legumes) over refined carbs (maida, white rice).'},
  {nutrient:'Dietary Fibre', unit:'g',    man:38,    woman:25,    child:25,   icon:'🥦', color:'bg-emerald-500',tip:'Most Indians get only 15g/day. Fibre prevents diabetes, colon cancer, and constipation.'},
  {nutrient:'Total Fat',     unit:'g',    man:78,    woman:65,    child:60,   icon:'🫙', color:'bg-yellow-500', tip:'Prioritise unsaturated fats (nuts, seeds, olive oil). Limit saturated (ghee, coconut oil).'},
  {nutrient:'Added Sugar',   unit:'g',    man:25,    woman:25,    child:19,   icon:'🍬', color:'bg-pink-500',   tip:'WHO recommends <25g. Average Indian eats 60–80g/day. Major driver of diabetes in India.'},
  {nutrient:'Sodium',        unit:'mg',   man:2300,  woman:2300,  child:1500, icon:'🧂', color:'bg-red-400',    tip:'2300mg = 1 teaspoon of salt. Average Indian eats 2× this. Major hypertension driver.'},
  {nutrient:'Iron',          unit:'mg',   man:8,     woman:18,    child:10,   icon:'🩸', color:'bg-rose-600',   tip:'50%+ Indian women are anaemic. Pair iron with Vitamin C (amla, lemon) for better absorption.'},
  {nutrient:'Calcium',       unit:'mg',   man:1000,  woman:1200,  child:1300, icon:'🦷', color:'bg-sky-500',    tip:'Crucial for bone density. Many Indians are deficient especially after 40. 3 servings dairy/day.'},
  {nutrient:'Vitamin D',     unit:'IU',   man:600,   woman:600,   child:600,  icon:'☀️', color:'bg-yellow-400', tip:'Despite sunny India, 70%+ of Indians are deficient. 15 min midday sun 3×/week is key.'},
  {nutrient:'Vitamin C',     unit:'mg',   man:90,    woman:75,    child:65,   icon:'🍊', color:'bg-orange-400', tip:'One amla (Indian gooseberry) has 600mg — 8× the daily need. Best natural Indian source.'},
  {nutrient:'Water',         unit:'L',    man:3.7,   woman:2.7,   child:2.1,  icon:'💧', color:'bg-blue-400',   tip:'Includes water from food (~20%). Increase significantly in hot Indian summers and exercise.'},
];

const DIET_PLANS = [
  {
    id:'balanced', name:'Balanced Indian Diet', emoji:'🍱', color:'text-emerald-700', bg:'bg-emerald-50', border:'border-emerald-200',
    tagline:'Traditional wisdom, modern nutrition',
    desc:'Based on traditional Indian dietary patterns. High fibre, moderate protein, complex carbohydrates. Proven for disease prevention.',
    bestFor:['General population','Weight maintenance','Long-term health','Diabetes prevention'],
    plan:{
      earlyMorn:'Warm water with lemon + 4–5 soaked almonds',
      breakfast:'Poha / idli-sambar / upma + 1 fruit + chai (no sugar)',
      midMorn:'1 seasonal fruit or handful of nuts',
      lunch:'2 chapati + dal + sabzi + salad + 1 cup curd',
      evening:'Sprouts chaat / roasted chana + buttermilk',
      dinner:'Khichdi / 1 chapati + dal + light sabzi + salad',
      bedtime:'1 glass warm turmeric milk (haldi doodh)',
    },
    keyNutrients:'High: Fibre, Plant Protein, Iron. Moderate: Complex Carbs. Low: Saturated fat, Sugar',
    avoid:['Refined flour (maida)','Packaged snacks','Sugary drinks','Excessive fried food'],
    nutrients:{calories:1800,protein:65,carbs:260,fibre:35,fat:55,sugar:20},
  },
  {
    id:'diabetic', name:'Diabetic-Friendly Diet', emoji:'🩺', color:'text-blue-700', bg:'bg-blue-50', border:'border-blue-200',
    tagline:'Stable blood sugar, rich nutrition',
    desc:'Low glycaemic index foods that prevent blood sugar spikes. High fibre, controlled carbohydrates, frequent small meals.',
    bestFor:['Type 2 diabetes management','Prediabetes','Insulin resistance','PCOS'],
    plan:{
      earlyMorn:'Methi seeds soaked overnight + warm water',
      breakfast:'Moong dal chilla / besan cheela with mint chutney + black tea',
      midMorn:'1 guava or apple (low GI fruit)',
      lunch:'Brown rice (small portion) + rajma / chana dal + salad + curd',
      evening:'Roasted chana + cucumber slices',
      dinner:'2 jowar/bajra roti + dal palak + sabzi',
      bedtime:'Warm water or chamomile tea (no milk)',
    },
    keyNutrients:'Low GI: Jowar, bajra, methi, bitter gourd. High fibre for slow glucose release.',
    avoid:['White rice (large portions)','Maida/refined flour','Fruit juices','Sweets and desserts','Root vegetables in excess'],
    nutrients:{calories:1600,protein:70,carbs:200,fibre:40,fat:50,sugar:15},
  },
  {
    id:'weightloss', name:'Weight Loss Diet', emoji:'⚖️', color:'text-violet-700', bg:'bg-violet-50', border:'border-violet-200',
    tagline:'Sustainable, not starvation',
    desc:'Calorie deficit through portion control and food quality — not starvation. High protein and fibre to maintain satiety.',
    bestFor:['Weight reduction','Obesity management','Metabolic syndrome','Post-pregnancy weight'],
    plan:{
      earlyMorn:'Warm water with apple cider vinegar (1 tsp)',
      breakfast:'2 boiled eggs / paneer bhurji + 1 slice whole wheat toast + 1 fruit',
      midMorn:'Handful of walnuts + green tea',
      lunch:'1 chapati + grilled fish/chicken or paneer + salad (large) + dal',
      evening:'Sprouts salad + cucumber + lemon',
      dinner:'Soup + vegetable salad with chickpeas + 1 small chapati',
      bedtime:'Warm water or tulsi tea',
    },
    keyNutrients:'High protein (maintains muscle), high fibre (satiety), controlled carbs, adequate fat.',
    avoid:['Processed snacks','Fruit juices','White bread','Fried foods','Late-night meals'],
    nutrients:{calories:1400,protein:80,carbs:160,fibre:38,fat:45,sugar:18},
  },
  {
    id:'vegetarian', name:'Indian Vegetarian Diet', emoji:'🌱', color:'text-green-700', bg:'bg-green-50', border:'border-green-200',
    tagline:'Complete nutrition without meat',
    desc:'Optimised vegetarian diet ensuring complete protein, B12 (via dairy/fortified foods), iron, and omega-3 fatty acids.',
    bestFor:['Vegetarians','Jain diet modifications','Plant-based preference','Heart health'],
    plan:{
      earlyMorn:'Soaked nuts (almonds + walnuts) + amla juice',
      breakfast:'Idli with sambar (protein-rich) + coconut chutney + 1 banana',
      midMorn:'Roasted pumpkin seeds or sunflower seeds',
      lunch:'Brown rice + rajma / chole + palak paneer + curd + salad',
      evening:'Sprouts chaat with tomato, onion, lemon',
      dinner:'2 chapati + moong dal + sabzi + cucumber raita',
      bedtime:'Warm turmeric milk with black pepper',
    },
    keyNutrients:'Complete protein via food combining (dal + rice / dal + chapati). Iron + Vit C together. B12 from dairy.',
    avoid:['Relying only on one protein source','Skipping dairy without B12 supplement','Excess refined carbs to compensate hunger','White rice as main carb source'],
    nutrients:{calories:1900,protein:60,carbs:270,fibre:36,fat:58,sugar:22},
  },
  {
    id:'heart', name:'Heart-Healthy Diet', emoji:'❤️', color:'text-red-700', bg:'bg-red-50', border:'border-red-200',
    tagline:'For a strong heart and clean arteries',
    desc:'Low saturated fat, low sodium, high fibre diet inspired by DASH diet principles adapted for Indian cuisine.',
    bestFor:['Heart disease prevention','High blood pressure','High cholesterol','Post-cardiac event'],
    plan:{
      earlyMorn:'Warm water + flaxseeds (1 tsp) soaked overnight',
      breakfast:'Oats upma with vegetables + black tea (no sugar) + 1 orange',
      midMorn:'A handful of walnuts (omega-3)',
      lunch:'2 chapati + fish curry (grilled) or rajma + salad + curd (low fat)',
      evening:'Green tea + handful of almonds',
      dinner:'Brown rice khichdi with moong dal + stir-fried vegetables',
      bedtime:'Warm skimmed milk or chamomile tea',
    },
    keyNutrients:'Omega-3 (walnuts, flax, fish). Low sodium (avoid pickle, papad). High fibre (oats, beans). Antioxidants (berries, amla).',
    avoid:['Coconut oil in excess','Butter and ghee','Red meat','Full-fat dairy','High-sodium foods (pickles, papad, namkeen)'],
    nutrients:{calories:1750,protein:68,carbs:240,fibre:38,fat:50,sugar:20},
  },
  {
    id:'athlete', name:'Athlete / Active Diet', emoji:'🏃', color:'text-orange-700', bg:'bg-orange-50', border:'border-orange-200',
    tagline:'Fuel performance, accelerate recovery',
    desc:'High calorie, high protein diet for athletes and those with physically demanding activity. Timed nutrition for performance.',
    bestFor:['Athletes and sports persons','Gym training','Manual labour','Endurance sports'],
    plan:{
      earlyMorn:'Banana + black coffee (pre-workout fuel)',
      breakfast:'4 egg whites + 2 whole eggs scrambled + 2 whole wheat toast + milk',
      midMorn:'Protein shake OR 200g chicken + apple',
      lunch:'White rice (larger portion) + chicken/fish curry + dal + 2 chapati',
      preWorkout:'Banana + black coffee (30 min before)',
      postWorkout:'Protein shake + banana (within 30 min)',
      dinner:'3 chapati + paneer / egg curry + dal + vegetables',
      bedtime:'Greek yoghurt or casein protein (for overnight muscle repair)',
    },
    keyNutrients:'1.6–2.0g protein per kg body weight. Pre-workout carbs for energy. Post-workout protein + carbs for recovery.',
    avoid:['Training on an empty stomach','Skipping post-workout nutrition','Excessive fat before training','Alcohol during heavy training'],
    nutrients:{calories:3000,protein:150,carbs:380,fibre:35,fat:80,sugar:30},
  },
];

const MEAL_TIMING = [
  {time:'6:00–7:00 AM', icon:Sun,   label:'Early Morning',   tip:'Empty stomach: soaked nuts, warm water with lemon or amla. Activates digestion.'},
  {time:'7:30–9:00 AM', icon:Coffee,label:'Breakfast',        tip:'Most important meal. High protein + complex carbs. Idli, poha, eggs, upma, daliya.'},
  {time:'11:00–11:30AM',icon:Apple, label:'Mid-Morning',      tip:'A piece of fruit or small handful of nuts. Prevents blood sugar crash before lunch.'},
  {time:'1:00–2:00 PM', icon:Sun,   label:'Lunch',            tip:'Largest meal. Dal + sabzi + roti/rice + salad + curd. Eat slowly.'},
  {time:'4:00–5:00 PM', icon:Coffee,label:'Evening Snack',    tip:'Light protein-based snack. Sprouts, roasted chana, buttermilk, or 2–3 walnuts.'},
  {time:'7:00–8:00 PM', icon:Moon,  label:'Dinner',           tip:'Lighter than lunch. Finish 2–3 hours before sleep. Avoid heavy starches.'},
  {time:'9:00–10:00 PM',icon:Moon,  label:'Bedtime (optional)',tip:'Warm turmeric milk or herbal tea if hungry. Avoid sugar or heavy food.'},
];

const NUTRITION_BOT_CONFIG = {
  botName: 'Nutrition AI',
  subtitle: 'Personalised Indian diet plans & nutrition advice',
  systemPrompt: `You are an expert nutritionist and dietitian specialising in Indian food and nutrition. Help users with:
1. Personalised diet plans using Indian foods (dals, sabzis, rotis, rice, dahi, etc.)
2. Daily nutrient requirement calculations based on age, gender, weight, activity level
3. Specific nutrient deficiency solutions using affordable Indian food sources
4. Meal timing guidance for Indian lifestyle
5. Evidence-based nutrition advice for Indian conditions (diabetes, anaemia, obesity, hypertension)

Always give practical, affordable, India-specific advice. Reference traditional Indian foods first before supplements. Include specific quantities when giving meal plans. Mention ICMR (Indian Council of Medical Research) dietary guidelines where relevant.

Format with clear sections, specific food examples with portions, and practical tips. Keep responses focused and actionable.`,
  welcomeMessage: `🥗 Hi! I'm your personal Nutrition AI assistant. I can help you:

- **Create a personalised diet plan** based on your age, weight, health goals, and Indian food preferences
- **Calculate your daily nutrient needs** (calories, protein, iron, etc.)
- **Suggest Indian foods** to fix specific deficiencies
- **Plan a week of meals** that are practical, affordable, and nutritious

**Tell me about yourself** (age, weight, health goal, any dietary restrictions, food preferences) and I'll build a plan just for you!`,
  quickReplies: [
    'Create a diet plan for a 30-year-old Indian woman with anaemia',
    'What should a diabetic Indian eat in a day?',
    'How do I get enough protein as a vegetarian?',
    'What Indian foods are high in Vitamin D?',
  ],
  accentColor: 'text-emerald-600',
  accentBg: 'bg-emerald-50',
  iconGradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  botIconColor: 'text-emerald-600',
  botIconBg: 'bg-emerald-100',
};

function DietPlanCard({plan}:{plan:typeof DIET_PLANS[0]}){
  const[open,setOpen]=useState(false);
  const mealTimes=[
    {key:'earlyMorn',label:'Early Morning',icon:'🌅'},
    {key:'breakfast',label:'Breakfast',icon:'☀️'},
    {key:'midMorn',label:'Mid-Morning',icon:'🍎'},
    {key:'lunch',label:'Lunch',icon:'🍽️'},
    {key:'preWorkout',label:'Pre-Workout',icon:'⚡'},
    {key:'postWorkout',label:'Post-Workout',icon:'💪'},
    {key:'evening',label:'Evening Snack',icon:'🌆'},
    {key:'dinner',label:'Dinner',icon:'🌙'},
    {key:'bedtime',label:'Bedtime',icon:'🌛'},
  ].filter(m=>plan.plan[m.key as keyof typeof plan.plan]);
  return(
    <div className={cn('rounded-2xl border overflow-hidden transition-all',plan.border,open&&'shadow-md')}>
      <button onClick={()=>setOpen(o=>!o)} className={cn('w-full flex items-start gap-4 p-5 text-left transition-colors hover:bg-foreground/3',plan.bg)}>
        <span className="text-3xl shrink-0">{plan.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={cn('font-display font-700 text-foreground mb-0.5',open&&plan.color)}>{plan.name}</h3>
              <p className="text-xs text-muted-foreground italic mb-2">{plan.tagline}</p>
              <div className="flex flex-wrap gap-1">
                {plan.bestFor.map(b=><span key={b} className={cn('text-[10px] font-medium px-2 py-0.5 rounded-lg border',plan.bg,plan.border,plan.color)}>{b}</span>)}
              </div>
            </div>
            {open?<ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1"/>:<ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1"/>}
          </div>
        </div>
      </button>
      {open&&(
        <div className="px-5 pb-6 pt-4 border-t border-border/40 bg-card space-y-6">
          <p className="text-sm text-muted-foreground">{plan.desc}</p>
          {/* Nutrition overview */}
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3">Daily Nutrition Profile</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(plan.nutrients).map(([k,v])=>(
                <div key={k} className={cn('p-3 rounded-xl border text-center',plan.bg,plan.border)}>
                  <p className={cn('font-display font-800 text-lg',plan.color)}>{v}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{k==='calories'?'kcal':k==='fat'?'g fat':k==='carbs'?'g carbs':k==='protein'?'g protein':k==='fibre'?'g fibre':'g sugar'}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Full day meal plan */}
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><Clock className="h-3.5 w-3.5"/>Full Day Meal Plan</h4>
            <div className="space-y-2">
              {mealTimes.map(({key,label,icon})=>(
                <div key={key} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                  <span className="text-lg shrink-0">{icon}</span>
                  <div>
                    <p className="text-[11px] font-700 uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="text-sm text-foreground">{plan.plan[key as keyof typeof plan.plan]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-700 text-emerald-800 mb-2 flex items-center gap-1.5"><Star className="h-3.5 w-3.5"/>Key nutrients</p>
              <p className="text-xs text-emerald-700">{plan.keyNutrients}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs font-700 text-red-700 mb-2">🚫 Foods to avoid</p>
              <ul className="space-y-0.5">{plan.avoid.map(a=><li key={a} className="text-xs text-red-600 flex items-center gap-1.5"><span>·</span>{a}</li>)}</ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NutritionPage(){
  const[person,setPerson]=useState<'man'|'woman'|'child'>('woman');
  const[activeNutrient,setActiveNutrient]=useState<string|null>(null);
  return(
    <div className="page-wrapper pt-20">
      <section className="relative gradient-hero border-b border-border/60 overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-emerald-500/6 top-[-100px] right-[-100px]"/>
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-full border border-emerald-300/60 bg-emerald-50/80 text-emerald-700 text-xs font-semibold">
                <Heart className="h-3.5 w-3.5"/>Diet & Nutrition
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-800 text-foreground mb-4 leading-[1.1]">
                Eat smarter.
                <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Live better.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Daily nutrient intake guides, 6 Indian diet plans, meal timing charts, and an AI nutrition assistant that creates personalised plans based on your age, health goals, and Indian food preferences.
              </p>
              <div className="flex flex-wrap gap-4">
                {[{icon:BarChart3,label:'Daily intake charts'},{icon:Apple,label:'6 Indian diet plans'},{icon:Clock,label:'Meal timing guide'},{icon:Bot,label:'AI nutrition planner'}].map(({icon:Icon,label})=>(
                  <span key={label} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium shadow-sm">
                    <Icon className="h-4 w-4 text-emerald-600"/>{label}
                  </span>
                ))}
              </div>
            </div>
            {/* Hero Image */}
            <div className="hidden lg:block relative pb-6 pl-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                <img
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&h=500&fit=crop&q=80"
                  alt="Healthy nutritious Indian food"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-2 z-10">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Apple className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">6 Diet Plans</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Indian food focused</p>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5" /> Personalised plans
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" /> ICMR guidelines
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {/* Floating AI Nutrition Assistant */}
        <FloatingChatBot {...NUTRITION_BOT_CONFIG} />

        {/* Daily Intake Guide */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl font-800 text-foreground">Daily Nutrient Requirements</h2>
              <p className="text-sm text-muted-foreground mt-1">Based on ICMR dietary reference values for Indians. Tap any nutrient for details.</p>
            </div>
            <div className="flex gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/60">
              {([['woman','👩 Woman'],['man','👨 Man'],['child','👧 Child']] as const).map(([k,label])=>(
                <button key={k} onClick={()=>setPerson(k)} className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all',person===k?'bg-card shadow text-foreground border border-border/60':'text-muted-foreground')}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAILY_INTAKE.map(n=>{
              const val=n[person];
              const pct=Math.min((val/n.man)*100,100);
              return(
                <button key={n.nutrient} onClick={()=>setActiveNutrient(a=>a===n.nutrient?null:n.nutrient)}
                  className={cn('text-left p-4 rounded-2xl border transition-all',
                    activeNutrient===n.nutrient?'border-primary/40 bg-primary/5 shadow-glow':'border-border bg-card hover:border-primary/30 hover:shadow-md')}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{n.icon}</span>
                    <span className={cn('font-display font-800 text-lg',activeNutrient===n.nutrient?'text-primary':'text-foreground')}>
                      {val.toLocaleString()}<span className="text-xs font-medium text-muted-foreground ml-0.5">{n.unit}</span>
                    </span>
                  </div>
                  <p className="font-display font-700 text-sm text-foreground mb-2">{n.nutrient}</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all',n.color)} style={{width:`${pct}%`}}/>
                  </div>
                  {activeNutrient===n.nutrient&&(
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{n.tip}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Meal Timing */}
        <div>
          <h2 className="font-display text-2xl font-800 text-foreground mb-2">Optimal Meal Timing</h2>
          <p className="text-sm text-muted-foreground mb-6">When you eat is as important as what you eat. Here's the ideal Indian meal schedule.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MEAL_TIMING.map(({time,icon:Icon,label,tip})=>(
              <div key={label} className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                    <Icon className="h-4 w-4 text-white"/>
                  </div>
                  <div>
                    <p className="font-700 text-foreground text-sm">{label}</p>
                    <p className="text-[11px] text-muted-foreground">{time}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Diet Plans */}
        <div>
          <h2 className="font-display text-2xl font-800 text-foreground mb-2">6 Indian Diet Plans</h2>
          <p className="text-sm text-muted-foreground mb-6">Click any plan to see the full day-by-day meal schedule, nutrition breakdown, and food to avoid.</p>
          <div className="space-y-3">{DIET_PLANS.map(p=><DietPlanCard key={p.id} plan={p}/>)}</div>
        </div>

        {/* India nutrition facts */}
        <div className="p-6 rounded-2xl bg-foreground text-background">
          <h2 className="font-display text-xl font-800 mb-4">India's Nutrition Reality</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {stat:'50%+',label:'Indian women anaemic',color:'text-rose-400'},
              {stat:'70%+',label:'Indians Vitamin D deficient',color:'text-yellow-400'},
              {stat:'77M',label:'Indians with diabetes (2023)',color:'text-red-400'},
              {stat:'15g',label:'Average daily fibre intake (target: 25–38g)',color:'text-amber-400'},
            ].map(({stat,label,color})=>(
              <div key={label} className="text-center p-4 rounded-xl bg-background/8 border border-background/15">
                <p className={cn('font-display text-2xl font-800 mb-1',color)}>{stat}</p>
                <p className="text-xs text-background/70 leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
