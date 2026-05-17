import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Apple, BarChart3, Clock, ArrowRight, Bot, Send, Loader2,
  User, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Info,
  Zap, Scale, Sun, Moon, Coffee, Star, ArrowUpRight, Flame,
  Activity, Shield, Leaf, Search, RefreshCw, Eye, AlertTriangle, ShieldOff,
  Package, Tag, XCircle, ShoppingCart, Megaphone, BookOpen, Globe, Home, 
  Building2, Bell, Thermometer, Microscope,
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

// ========== AWARENESS DATA ==========
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
  systemPrompt: `You are a food industry watchdog and consumer rights expert. Help people understand: corporate food marketing manipulation (shrinkflation, health-washing, nature-washing, serving size tricks), how to read food labels correctly, and what ingredients actually are. Be direct, factual, use specific examples, bullet points, and clear structure.`,
  welcomeMessage: `👋 Hi! I'm your Food Awareness AI. I can help you:

- **Identify corporate manipulation tactics** on your products
- **Decode suspicious label claims**
- **Guide you through reading** any food label correctly

**What would you like to expose today?**`,
  quickReplies: [
    'How do I spot shrinkflation?',
    'What does "no added sugar" really mean?',
    'How do I read an Indian food label?',
  ],
  accentColor: 'text-violet-600',
  accentBg: 'bg-violet-50',
  iconGradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
  botIconColor: 'text-violet-600',
  botIconBg: 'bg-violet-100',
};

// ========== DISEASE DATA ==========
const DISEASES = [
  {
    id:'salmonellosis', name:'Salmonellosis', pathogen:'Salmonella bacteria', severity:'high', emoji:'🥚',
    color:'text-red-700', bg:'bg-red-50', border:'border-red-200',
    foods:['Raw/undercooked eggs','Undercooked poultry','Unpasteurised milk','Raw sprouts','Contaminated water'],
    onset:'6–72 hours', duration:'4–7 days',
    symptoms:['Diarrhoea (may be bloody)','Fever (38–40°C)','Stomach cramps and nausea','Vomiting','Headache and muscle pain'],
    prevention:['Cook poultry to 74°C internal temperature','Refrigerate within 2 hours of cooking','Wash hands after handling raw eggs','Avoid cross-contamination with raw poultry','Never eat raw batter or dough'],
    treatment:'Usually self-limiting. Oral rehydration. Antibiotics only for severe cases. Seek hospital if fever >39°C or bloody diarrhoea.',
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
];

const PREVENTION_TIPS = [
  {icon:'🧼', title:'Clean', desc:'Wash hands for 20 seconds. Wash all surfaces, utensils, and produce before use.'},
  {icon:'🔀', title:'Separate', desc:'Use separate cutting boards for raw meat and vegetables. Never cross-contaminate.'},
  {icon:'🌡️', title:'Cook', desc:'Cook to safe internal temperatures: Poultry 74°C, Beef/Pork 71°C, Fish 63°C.'},
  {icon:'❄️', title:'Chill', desc:'Refrigerate perishables within 2 hours. Keep fridge at 4°C. Freezer at -18°C.'},
];

const DISEASE_BOT_CONFIG = {
  botName: 'Symptom Checker AI',
  subtitle: 'Describe symptoms to identify possible foodborne illness',
  systemPrompt: `You are a food safety expert. Help identify possible foodborne illnesses based on symptoms. Ask about onset timing, symptoms, foods eaten in last 1–7 days. Assess severity and give clear emergency signs.`,
  welcomeMessage: `🩺 I'm your Foodborne Disease AI. I can help you identify causes based on your symptoms, foods eaten, and timing.

⚠️ *This is for educational guidance only, not a medical diagnosis. For severe symptoms, go to a hospital.*

**Describe your symptoms and what you ate recently:**`,
  quickReplies: [
    'I have diarrhoea and vomiting since morning',
    'I have fever and stomach pain after eating street food',
    'My child has watery diarrhoea — is it serious?',
  ],
  accentColor: 'text-red-600',
  accentBg: 'bg-red-50',
  iconGradient: 'bg-gradient-to-br from-red-500 to-rose-600',
  botIconColor: 'text-red-600',
  botIconBg: 'bg-red-100',
};

function TacticCard({t}:{t:typeof TACTICS[0]}){
  const[open,setOpen]=useState(false);
  const Icon=t.icon;
  return(
    <div className={cn('rounded-2xl border overflow-hidden transition-all',t.border,open&&'shadow-lg')}>
      <button onClick={()=>setOpen(o=>!o)} className={cn('w-full flex items-start gap-4 p-5 text-left transition-colors hover:brightness-[0.97]',t.bg)}>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm',t.bg.replace('-50','-100'))}>
          <Icon className={cn('h-6 w-6',t.color)}/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={cn('font-display font-700 text-lg text-foreground',open&&t.color)}>{t.title}</h3>
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform',open&&'rotate-180')}/>
          </div>
        </div>
      </button>
      {open&&(
        <div className="px-5 pb-6 pt-4 border-t border-border/40 bg-card space-y-5">
          <p className="text-sm text-muted-foreground">{t.description}</p>
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3">Real examples in India</h4>
            <ul className="space-y-2">{t.examples.map((e,i)=><li key={i} className="flex items-start gap-2.5 text-sm"><XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5"/><span>{e}</span></li>)}</ul>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200"><p className="text-xs font-700 text-amber-800 mb-1.5 flex items-center gap-1.5"><Eye className="h-3.5 w-3.5"/>How to spot it</p><p className="text-xs text-amber-700">{t.howToSpot}</p></div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"><p className="text-xs font-700 text-emerald-800 mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5"/>How to avoid it</p><p className="text-xs text-emerald-700">{t.avoid}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiseaseCard({d}:{d:typeof DISEASES[0]}){
  const[open,setOpen]=useState(false);
  return(
    <div className={cn('rounded-2xl border overflow-hidden transition-all',d.border,open&&'shadow-md')}>
      <button onClick={()=>setOpen(o=>!o)} className={cn('w-full flex items-start gap-4 p-5 text-left transition-colors hover:bg-foreground/3',d.bg)}>
        <span className="text-3xl shrink-0">{d.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={cn('font-display font-700 text-foreground',open&&d.color)}>{d.name}</h3>
              <p className="text-xs text-muted-foreground">By: {d.pathogen}</p>
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
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5"/>Symptoms</h4>
            <ul className="space-y-1">{d.symptoms.map((s,i)=><li key={i} className="flex items-start gap-2 text-sm"><AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5"/><span className="text-muted-foreground">{s}</span></li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}

// DietPlanCard component
function DietPlanCard({plan}: {plan: any}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={cn('rounded-2xl border p-5 transition-all hover:shadow-md', plan.bg, plan.border)}>
      <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{plan.emoji}</span>
            <h3 className={cn('font-display font-800 text-lg', plan.color)}>{plan.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{plan.tagline}</p>
          <p className="text-sm text-muted-foreground">{plan.desc}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {plan.bestFor.map((b: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-foreground/5 text-xs font-medium text-muted-foreground">{b}</span>
            ))}
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground shrink-0 transition-transform', expanded && 'rotate-180')} />
      </div>
      
      {expanded && (
        <div className="mt-5 space-y-4 pt-5 border-t border-foreground/10">
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-2">Sample Daily Plan</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {Object.entries(plan.plan).map(([time, meal]) => (
                <div key={time} className="flex gap-2">
                  <span className="font-medium capitalize text-foreground">{time.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span>{meal as string}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-2">Key Nutrients</h4>
            <p className="text-sm text-muted-foreground">{plan.keyNutrients}</p>
          </div>
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest text-muted-foreground mb-2">Foods to Avoid</h4>
            <div className="flex flex-wrap gap-1.5">
              {plan.avoid.map((a: string, i: number) => (
                <span key={i} className="px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">{a}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NutritionPage(){
  const[person,setPerson]=useState<'man'|'woman'|'child'>('woman');
  const[activeTab,setActiveTab]=useState<'nutrition'|'awareness'|'diseases'>('nutrition');
  const[activeNutrient,setActiveNutrient]=useState<string|null>(null);

  const tabs=[
    {id:'nutrition', label:'🥗 Nutrition & Diet', icon:Apple},
    {id:'awareness', label:'👁️ Food Awareness', icon:Eye},
    {id:'diseases', label:'🩺 Foodborne Diseases', icon:AlertTriangle},
  ];

  return(
    <div className="page-wrapper pt-20">
      <section className="relative gradient-hero border-b border-border/60 overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-emerald-500/6 top-[-100px] right-[-100px]"/>
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none"/>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-full border border-emerald-300/60 bg-emerald-50/80 text-emerald-700 text-xs font-semibold">
                <Heart className="h-3.5 w-3.5"/>Complete Nutrition Module
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-800 text-foreground mb-4 leading-[1.1]">
                Nutrition,
                <span className="block bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Awareness & Safety</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Complete guide to eating smart: personalized nutrition plans, food awareness tactics, and foodborne disease prevention. Everything you need for better health.
              </p>
            </div>
            <div className="hidden lg:block relative pb-6 pl-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                <img
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&h=500&fit=crop&q=80"
                  alt="Healthy nutrition"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-12 flex-wrap">
          {tabs.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id as any)} className={cn('px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border',
              activeTab===tab.id?'bg-primary text-white border-primary':'bg-card border-border text-foreground hover:border-primary/40')}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* NUTRITION TAB */}
        {activeTab==='nutrition'&&(
          <div className="space-y-14">
            <FloatingChatBot {...NUTRITION_BOT_CONFIG}/>
            <div>
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                  <h2 className="font-display text-2xl font-800 text-foreground">Daily Nutrient Requirements</h2>
                  <p className="text-sm text-muted-foreground mt-1">Based on ICMR dietary reference values</p>
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
                      {activeNutrient===n.nutrient&&(
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{n.tip}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-800 text-foreground mb-6">6 Indian Diet Plans</h2>
              <div className="space-y-3">{DIET_PLANS.map(p=><DietPlanCard key={p.id} plan={p}/>)}</div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-800 text-foreground mb-2">Optimal Meal Timing</h2>
              <p className="text-sm text-muted-foreground mb-6">When you eat is as important as what you eat.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {MEAL_TIMING.map(({time,icon:Icon,label,tip})=>(
                  <div key={label} className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-emerald-600"/>
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
          </div>
        )}

        {/* AWARENESS TAB */}
        {activeTab==='awareness'&&(
          <div className="space-y-12">
            <FloatingChatBot {...AWARENESS_BOT_CONFIG}/>
            
            <div>
              <h2 className="font-display text-2xl font-800 text-foreground mb-6">How to Read Any Food Label</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {LABEL_STEPS.map(({step,title,icon,tip})=>(
                  <div key={step} className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-glow"><span className="text-white text-[11px] font-800">{step}</span></div>
                      <span className="text-2xl">{icon}</span>
                    </div>
                    <h3 className="font-display font-700 text-foreground text-sm mb-1">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-800 text-foreground mb-6">Corporate Food Tactics — Exposed</h2>
              <div className="space-y-3">{TACTICS.map(t=><TacticCard key={t.id} t={t}/>)}</div>
            </div>
          </div>
        )}

        {/* DISEASE TAB */}
        {activeTab==='diseases'&&(
          <div className="space-y-12">
            <div className="p-5 rounded-2xl bg-red-600 text-white flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 shrink-0"/>
              <div>
                <p className="font-700 text-lg">When to seek emergency care immediately</p>
                <p className="text-white/85 text-sm mt-1">Bloody diarrhoea · Fever above 39°C · Unable to keep fluids down · Stiff neck or confusion · Jaundice</p>
              </div>
              <div className="shrink-0 text-right ml-auto">
                <p className="text-[11px] text-white/70">Emergency</p>
                <p className="font-800 text-xl">112</p>
              </div>
            </div>

            <FloatingChatBot {...DISEASE_BOT_CONFIG}/>

            <div>
              <h2 className="font-display text-2xl font-800 text-foreground mb-6">4 Core Prevention Principles</h2>
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

            <div>
              <h2 className="font-display text-2xl font-800 text-foreground mb-6">Foodborne Disease Database</h2>
              <div className="space-y-3">{DISEASES.map(d=><DiseaseCard key={d.id} d={d}/>)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
