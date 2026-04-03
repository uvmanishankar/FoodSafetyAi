import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Building2, ChevronRight, ChevronDown, CheckCircle2,
  AlertTriangle, FlaskConical, Clock, Package, Droplets,
  Egg, Wheat, Leaf, Fish, Apple, Coffee, ArrowRight,
  Star, Info, ShieldCheck, Microscope, ThumbsUp, ThumbsDown, Search, Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FoodTestingAIAssistant from '@/components/FoodTestingAIAssistant';
import FloatingChatBot from '@/components/FloatingChatBot';

const TESTING_BOT_CONFIG = {
  botName: 'Food Testing AI',
  subtitle: 'Guide for home adulteration tests',
  systemPrompt: `You are a food quality and home testing expert for India. Help users with: how to perform home tests for common food adulterants, what household items and chemicals detect adulteration, interpreting home test results step-by-step, which Indian foods are most commonly adulterated and why, when to send samples to a professional NABL/FSSAI-approved lab, how to locate approved labs near them, the science behind adulteration detection, and how to stay safe from food adulteration. Be practical, step-by-step, and use simple language suitable for Indian consumers.`,
  welcomeMessage: `👋 Hi! I'm Food Testing AI.\n\nI can help you:\n- **Perform home tests** for food adulteration\n- **Interpret test results** accurately\n- **Identify adulterated** spices, oils & dairy\n- **Know when to visit** a professional lab\n- **Understand FSSAI** testing standards\n\n**Which food do you want to test for adulteration?**`,
  quickReplies: [
    'How to test milk for adulteration?',
    'How to check if turmeric is pure?',
    'Test cooking oil at home',
    'Is my honey real or fake?',
  ],
  accentColor: 'text-teal-600',
  accentBg: 'bg-teal-50',
  iconGradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
  botIconColor: 'text-teal-600',
  botIconBg: 'bg-teal-100',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestStep {
  step: number;
  title: string;
  desc: string;
  tip?: string;
  result?: { pass: string; fail: string };
}

interface TestMethod {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  time: string;
  accuracy: 'High' | 'Medium' | 'Low';
  what: string; // what it detects
  materials: string[];
  steps: TestStep[];
}

interface FoodItem {
  id: string;
  name: string;
  emoji: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  tagline: string;
  commonAdulterants: string[];
  homeMethods: TestMethod[];
  labMethods: TestMethod[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FOOD_ITEMS: FoodItem[] = [
  {
    id: 'milk',
    name: 'Milk',
    emoji: '🥛',
    icon: Droplets,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    tagline: 'Detect water, starch, detergent & urea',
    commonAdulterants: ['Water dilution', 'Starch', 'Detergent', 'Urea', 'Formalin', 'Synthetic milk'],
    homeMethods: [
      {
        id: 'milk-water-home',
        name: 'Water Dilution Test',
        difficulty: 'Easy',
        time: '2 min',
        accuracy: 'Medium',
        what: 'Detects added water in milk',
        materials: ['A flat surface or polished tile', 'Sample milk drop'],
        steps: [
          { step: 1, title: 'Prepare surface', desc: 'Take a polished tile or any flat non-porous surface and hold it at a 45° angle.' },
          { step: 2, title: 'Drop the milk', desc: 'Put a single drop of the milk sample on the slanted surface.', tip: 'Use a clean dropper or spoon for accuracy.' },
          { step: 3, title: 'Observe flow', desc: 'Let the milk drop slide down the surface naturally without any interference.' },
          {
            step: 4, title: 'Read the result', desc: 'Observe the path left behind by the milk drop.',
            result: { pass: 'Pure milk leaves a white trail and moves slowly.', fail: 'Watered milk flows quickly and leaves no visible trail.' },
          },
        ],
      },
      {
        id: 'milk-starch-home',
        name: 'Starch Adulteration Test',
        difficulty: 'Easy',
        time: '5 min',
        accuracy: 'High',
        what: 'Detects starch/arrowroot added to thicken milk',
        materials: ['Iodine solution (tincture iodine from pharmacy)', 'Small glass/cup', 'Sample milk (5 ml)'],
        steps: [
          { step: 1, title: 'Pour milk sample', desc: 'Take about 5 ml of the milk sample in a small clear glass or test tube.' },
          { step: 2, title: 'Boil briefly', desc: 'Boil the milk for 2 minutes and let it cool to room temperature.', tip: 'Boiling helps break down starch molecules for better detection.' },
          { step: 3, title: 'Add iodine', desc: 'Add 2–3 drops of iodine tincture solution to the cooled milk.' },
          {
            step: 4, title: 'Observe colour change', desc: 'Watch the colour of the milk after adding iodine.',
            result: { pass: 'Milk stays yellow/orange — no starch present.', fail: 'Milk turns blue/dark purple — starch is present.' },
          },
        ],
      },
      {
        id: 'milk-detergent-home',
        name: 'Detergent Test',
        difficulty: 'Easy',
        time: '3 min',
        accuracy: 'Medium',
        what: 'Detects synthetic detergent used to create froth',
        materials: ['5 ml milk', 'Small bottle with lid', 'Water (5 ml)'],
        steps: [
          { step: 1, title: 'Mix milk and water', desc: 'Take 5 ml of milk and add 5 ml of water in a small bottle.' },
          { step: 2, title: 'Shake vigorously', desc: 'Close the bottle and shake it hard for 30 seconds.', tip: 'Shake as hard as possible to generate maximum foam.' },
          { step: 3, title: 'Wait and observe', desc: 'Let the bottle rest undisturbed for 5 minutes.' },
          {
            step: 4, title: 'Check foam', desc: 'Observe the amount and persistence of foam at the top.',
            result: { pass: 'Minimal, thin foam that disappears quickly — pure milk.', fail: 'Dense, persistent lather that stays — detergent is present.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'milk-snf-lab',
        name: 'SNF & Fat Content Analysis',
        difficulty: 'Advanced',
        time: '30 min',
        accuracy: 'High',
        what: 'Measures Solid Not Fat (SNF) and fat % precisely',
        materials: ['Lactometer', 'Gerber centrifuge', 'Gerber butyrometer', 'Sulphuric acid (H₂SO₄)', 'Amyl alcohol', 'Water bath at 65°C'],
        steps: [
          { step: 1, title: 'Lactometer reading', desc: 'Pour milk into the lactometer jar and gently lower the lactometer. Read the value at the meniscus at 27°C.', tip: 'Correct reading: pure milk reads 26–32°L (lactometer degrees).' },
          { step: 2, title: 'Prepare butyrometer', desc: 'Add 10 ml concentrated H₂SO₄ to the Gerber butyrometer, then carefully add 11 ml milk, then 1 ml amyl alcohol.', tip: 'Always add acid before milk to prevent violent reactions.' },
          { step: 3, title: 'Mix and centrifuge', desc: 'Seal and invert the butyrometer gently to mix. Centrifuge at 1100–1200 rpm for 5 minutes.' },
          { step: 4, title: 'Water bath', desc: 'Place butyrometer in water bath at 65°C for 5 minutes to stabilize the fat column.' },
          {
            step: 5, title: 'Read fat %', desc: 'Read the fat percentage directly from the graduated scale of the butyrometer.',
            result: { pass: 'Cow milk: fat ≥3.5%, SNF ≥8.5% per FSSAI standards.', fail: 'Below FSSAI minimum indicates dilution or skimming.' },
          },
        ],
      },
      {
        id: 'milk-formalin-lab',
        name: 'Formalin Detection Test',
        difficulty: 'Medium',
        time: '15 min',
        accuracy: 'High',
        what: 'Detects formalin (formaldehyde) used as preservative',
        materials: ['10 ml milk', 'Sulphuric acid (H₂SO₄)', 'Ferric chloride solution (0.5%)', 'Test tubes', 'Test tube stand'],
        steps: [
          { step: 1, title: 'Take milk sample', desc: 'Pour 10 ml of milk into a clean test tube.' },
          { step: 2, title: 'Add ferric chloride', desc: 'Add 2–3 drops of 0.5% ferric chloride solution to the milk.' },
          { step: 3, title: 'Layer with acid', desc: 'Carefully pour concentrated sulphuric acid along the side of the test tube to form a separate layer. Do NOT mix.', tip: 'Wear gloves and safety glasses. H₂SO₄ is highly corrosive.' },
          {
            step: 4, title: 'Observe interface', desc: 'Observe the colour at the junction between the acid and milk layers.',
            result: { pass: 'No colour at the interface — formalin absent.', fail: 'Violet or purple ring at the interface — formalin is present.' },
          },
        ],
      },
    ],
  },
  {
    id: 'honey',
    name: 'Honey',
    emoji: '🍯',
    icon: Leaf,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    tagline: 'Detect sugar syrup, water & artificial sweeteners',
    commonAdulterants: ['Sugar syrup', 'Jaggery solution', 'High fructose corn syrup', 'Artificial flavour', 'Added water'],
    homeMethods: [
      {
        id: 'honey-water-home',
        name: 'Water Dissolution Test',
        difficulty: 'Easy',
        time: '2 min',
        accuracy: 'Medium',
        what: 'Detects added water and sugar syrup',
        materials: ['Glass of water', '1 teaspoon honey'],
        steps: [
          { step: 1, title: 'Fill a glass', desc: 'Fill a clear glass with room-temperature water — about 200 ml.' },
          { step: 2, title: 'Drop honey', desc: 'Take 1 teaspoon of honey and drop it gently into the centre of the glass.' },
          { step: 3, title: 'Do NOT stir', desc: 'Leave the glass completely undisturbed and observe the honey sinking.', tip: 'Any stirring will invalidate the test.' },
          {
            step: 4, title: 'Observe behaviour', desc: 'Watch how the honey behaves as it reaches the bottom.',
            result: { pass: 'Pure honey sinks to the bottom and settles as a solid lump without dissolving.', fail: 'Adulterated honey dissolves quickly and clouds the water.' },
          },
        ],
      },
      {
        id: 'honey-thumb-home',
        name: 'Thumb Stick Test',
        difficulty: 'Easy',
        time: '1 min',
        accuracy: 'Low',
        what: 'Basic purity check — viscosity and stickiness',
        materials: ['A drop of honey', 'Your thumb'],
        steps: [
          { step: 1, title: 'Put drop on thumb', desc: 'Place a small drop of honey on your thumb.' },
          { step: 2, title: 'Check spread', desc: 'Tilt your thumb and observe whether the honey stays or spreads.' },
          { step: 3, title: 'Check stickiness', desc: 'Feel the texture — pure honey is thick and very sticky.' },
          {
            step: 4, title: 'Result', desc: 'Observe whether it spills or stays.',
            result: { pass: 'Pure honey stays on the thumb, does not drip, and is very sticky.', fail: 'Adulterated honey spills easily and feels thin/watery.' },
          },
        ],
      },
      {
        id: 'honey-flame-home',
        name: 'Flame Test',
        difficulty: 'Medium',
        time: '3 min',
        accuracy: 'Medium',
        what: 'Detects added moisture (water/syrup)',
        materials: ['Cotton wick or matchstick', 'Small amount of honey'],
        steps: [
          { step: 1, title: 'Prepare wick', desc: 'Dip a cotton wick or the head of a matchstick in the honey sample.' },
          { step: 2, title: 'Light carefully', desc: 'Try to light the honey-coated wick using a match or lighter.', tip: 'Keep away from flammable materials. Adult supervision required.' },
          { step: 3, title: 'Observe flame', desc: 'Watch if the wick ignites and sustains a flame.' },
          {
            step: 4, title: 'Read result', desc: 'Note whether the honey burns.',
            result: { pass: 'Pure honey burns — the wick lights and sustains a flame.', fail: 'Added water prevents ignition — the wick will not burn.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'honey-brix-lab',
        name: 'Brix Refractometer Test',
        difficulty: 'Medium',
        time: '10 min',
        accuracy: 'High',
        what: 'Measures sugar concentration and water content precisely',
        materials: ['Brix refractometer (0–90% range)', 'Distilled water', 'Sample honey (2 g)', 'Soft cloth'],
        steps: [
          { step: 1, title: 'Calibrate', desc: 'Place 2–3 drops of distilled water on the prism of the refractometer and adjust zero to 0% Brix using the calibration screw.' },
          { step: 2, title: 'Clean prism', desc: 'Wipe the prism dry with a soft lint-free cloth.' },
          { step: 3, title: 'Apply honey', desc: 'Place 2–3 drops of honey on the prism and close the daylight plate.' },
          { step: 4, title: 'Read value', desc: 'Hold up to light and look through the eyepiece. Read the Brix value at the sharp boundary line.' },
          {
            step: 5, title: 'Interpret result', desc: 'Calculate water content: Water % = 100 − Brix reading.',
            result: { pass: 'Genuine honey: Brix 78–85%, water content ≤20%. FSSAI compliant.', fail: 'Brix <78% means excess water or sugar syrup added.' },
          },
        ],
      },
      {
        id: 'honey-hmt-lab',
        name: 'HMF (Hydroxymethylfurfural) Test',
        difficulty: 'Advanced',
        time: '45 min',
        accuracy: 'High',
        what: 'Detects overheating and age of honey (quality marker)',
        materials: ['Spectrophotometer', 'Carrez I & II solutions', '0.5 M sodium bisulphite', 'Distilled water', 'Volumetric flasks'],
        steps: [
          { step: 1, title: 'Prepare solution', desc: 'Dissolve 5 g honey in 25 ml distilled water in a 50 ml volumetric flask.' },
          { step: 2, title: 'Clarify', desc: 'Add 0.5 ml Carrez I and 0.5 ml Carrez II solution. Mix and make up to 50 ml with water. Filter.' },
          { step: 3, title: 'Prepare reference', desc: 'Prepare a reference cuvette with the same solution but replace 5 ml with 5 ml sodium bisulphite.' },
          { step: 4, title: 'Measure absorbance', desc: 'Measure absorbance at 284 nm and 336 nm using spectrophotometer.' },
          {
            step: 5, title: 'Calculate HMF', desc: 'HMF (mg/kg) = [(A284 − A336) × 14.97 × dilution] / sample weight.',
            result: { pass: 'HMF ≤ 40 mg/kg — fresh, properly stored honey (FSSAI/Codex standard).', fail: 'HMF > 80 mg/kg — overheated, old, or adulterated with invert sugar.' },
          },
        ],
      },
    ],
  },
  {
    id: 'oil',
    name: 'Cooking Oil',
    emoji: '🫙',
    icon: Droplets,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    tagline: 'Detect mineral oil, argemone & rancidity',
    commonAdulterants: ['Mineral oil', 'Argemone oil', 'Rancid oil blending', 'Cheaper seed oils', 'Rice bran oil'],
    homeMethods: [
      {
        id: 'oil-argemone-home',
        name: 'Argemone Oil Detection',
        difficulty: 'Easy',
        time: '5 min',
        accuracy: 'High',
        what: 'Detects toxic argemone oil (poppy weed) in mustard oil',
        materials: ['5 ml oil sample', 'Concentrated nitric acid (HNO₃) — dilute 50:50 with water', 'Test tube'],
        steps: [
          { step: 1, title: 'Take oil sample', desc: 'Pour 5 ml of oil into a clean glass test tube.' },
          { step: 2, title: 'Add dilute acid', desc: 'Add 5 ml of diluted nitric acid (50% concentration) to the oil.', tip: 'Handle dilute acid carefully. Wear gloves.' },
          { step: 3, title: 'Shake gently', desc: 'Gently shake the test tube and let it stand for 2 minutes.' },
          {
            step: 4, title: 'Observe colour', desc: 'Observe the colour of the lower acid layer.',
            result: { pass: 'Lower layer stays colourless or pale yellow — no argemone oil.', fail: 'Lower layer turns orange-red — argemone oil is present (toxic!).' },
          },
        ],
      },
      {
        id: 'oil-rancidity-home',
        name: 'Rancidity Check',
        difficulty: 'Easy',
        time: '2 min',
        accuracy: 'Medium',
        what: 'Detects oxidised / rancid oil',
        materials: ['Oil sample', 'Your senses'],
        steps: [
          { step: 1, title: 'Smell test', desc: 'Open the oil bottle and smell it deeply. Fresh oil has a mild, pleasant aroma.' },
          { step: 2, title: 'Colour check', desc: 'Hold a small amount of oil in a clear glass against light — check for darkening.' },
          { step: 3, title: 'Taste test (tiny amount)', desc: 'Touch a tiny drop to the tip of your tongue. Rancid oil has a sharp, bitter, or soapy taste.', tip: 'Do NOT consume large amounts of potentially rancid oil.' },
          {
            step: 4, title: 'Conclusion', desc: 'Combine all sensory observations.',
            result: { pass: 'Clear colour, pleasant smell, neutral taste — oil is fresh.', fail: 'Dark colour, sharp/sour smell, bitter taste — oil is rancid.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'oil-acid-lab',
        name: 'Free Fatty Acid (Acid Value) Test',
        difficulty: 'Advanced',
        time: '30 min',
        accuracy: 'High',
        what: 'Measures oil rancidity and quality degradation',
        materials: ['5 g oil', 'Ethanol (neutralised)', '0.1N KOH solution', 'Phenolphthalein indicator', 'Conical flask', 'Burette'],
        steps: [
          { step: 1, title: 'Dissolve oil', desc: 'Dissolve 5 g of oil in 50 ml of freshly neutralised ethanol in a 250 ml conical flask.' },
          { step: 2, title: 'Add indicator', desc: 'Add 3–4 drops of phenolphthalein indicator solution.' },
          { step: 3, title: 'Titrate', desc: 'Titrate with 0.1N KOH solution from a burette, swirling continuously.' },
          { step: 4, title: 'End point', desc: 'Stop when the solution turns faint pink and the colour persists for 30 seconds.' },
          {
            step: 5, title: 'Calculate', desc: 'Acid value = (V × N × 56.1) / W  where V=volume KOH, N=normality, W=weight of oil.',
            result: { pass: 'Acid value ≤ 6 mg KOH/g for edible oils (FSSAI standard).', fail: 'Acid value > 6 indicates rancidity, poor quality or adulteration.' },
          },
        ],
      },
    ],
  },
  {
    id: 'spices',
    name: 'Spices & Powders',
    emoji: '🌶️',
    icon: Leaf,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    tagline: 'Detect brick powder, artificial colour & chalk',
    commonAdulterants: ['Brick powder (chilli)', 'Chalk powder (turmeric)', 'Artificial dye (Sudan Red)', 'Rice flour', 'Lead chromate in turmeric'],
    homeMethods: [
      {
        id: 'turmeric-chalk-home',
        name: 'Chalk in Turmeric Test',
        difficulty: 'Easy',
        time: '3 min',
        accuracy: 'High',
        what: 'Detects chalk powder or calcium carbonate in turmeric',
        materials: ['1 teaspoon turmeric powder', 'Glass of water', 'Drops of vinegar or lemon juice'],
        steps: [
          { step: 1, title: 'Add turmeric to water', desc: 'Add 1 teaspoon of turmeric powder to a glass of water and stir.' },
          { step: 2, title: 'Add acid', desc: 'Add a few drops of vinegar or lemon juice to the mixture.' },
          { step: 3, title: 'Observe', desc: 'Watch for any bubbling or fizzing in the mixture.' },
          {
            step: 4, title: 'Result', desc: 'Observe the reaction.',
            result: { pass: 'No bubbles — pure turmeric, no chalk present.', fail: 'Effervescence/bubbles — chalk (CaCO₃) reacts with the acid.' },
          },
        ],
      },
      {
        id: 'chilli-brick-home',
        name: 'Brick Powder in Chilli Test',
        difficulty: 'Easy',
        time: '5 min',
        accuracy: 'High',
        what: 'Detects brick powder or sand in chilli powder',
        materials: ['1 teaspoon chilli powder', 'Glass of water'],
        steps: [
          { step: 1, title: 'Add to water', desc: 'Add 1 teaspoon of chilli powder to a glass of water. Stir well.' },
          { step: 2, title: 'Let it settle', desc: 'Allow the mixture to stand undisturbed for 5 minutes.' },
          { step: 3, title: 'Observe', desc: 'Look at the bottom of the glass carefully.' },
          {
            step: 4, title: 'Result', desc: 'Check for sediment at the bottom.',
            result: { pass: 'Fine, uniform settling — pure chilli powder.', fail: 'Gritty, heavy sediment at the bottom — brick dust or sand present.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'turmeric-lead-lab',
        name: 'Lead Chromate in Turmeric',
        difficulty: 'Advanced',
        time: '20 min',
        accuracy: 'High',
        what: 'Detects toxic lead chromate used for artificial brightening',
        materials: ['Turmeric sample (5g)', 'Concentrated HCl', 'Diethyl ether', 'Lead acetate paper', 'Test tubes', 'Water bath'],
        steps: [
          { step: 1, title: 'Extract colour', desc: 'Add 5 g turmeric to 25 ml diethyl ether in a flask. Shake for 5 minutes, then filter.' },
          { step: 2, title: 'Evaporate', desc: 'Evaporate the ether extract gently in a water bath at 40°C until a residue remains.' },
          { step: 3, title: 'Add HCl', desc: 'Dissolve the residue in 5 ml dilute HCl. Divide into two test tubes.' },
          { step: 4, title: 'Lead acetate test', desc: 'Dip lead acetate paper in one test tube and potassium iodide in the other.' },
          {
            step: 5, title: 'Observe', desc: 'Check colour changes on the paper strips.',
            result: { pass: 'No colour change on either strip — no lead chromate detected.', fail: 'Black/brown stain on lead acetate paper + yellow on KI strip = lead chromate present.' },
          },
        ],
      },
    ],
  },
  {
    id: 'eggs',
    name: 'Eggs',
    emoji: '🥚',
    icon: Egg,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    tagline: 'Check freshness, detect artificial colour & fake eggs',
    commonAdulterants: ['Artificial colour injection', 'Old/expired eggs', 'Fake plastic eggs (rare)', 'Washed eggs (stripped coating)'],
    homeMethods: [
      {
        id: 'egg-float-home',
        name: 'Float Test (Freshness)',
        difficulty: 'Easy',
        time: '2 min',
        accuracy: 'High',
        what: 'Determines freshness of eggs using air cell size',
        materials: ['Bowl of cold water (enough to submerge egg)', 'Egg sample'],
        steps: [
          { step: 1, title: 'Fill bowl with water', desc: 'Fill a bowl or deep container with cold water — at least 15 cm deep.' },
          { step: 2, title: 'Gently lower egg', desc: 'Gently place the egg into the water without dropping it.' },
          { step: 3, title: 'Observe position', desc: 'Watch the egg carefully — note whether it sinks, tilts, or floats.' },
          {
            step: 4, title: 'Read result', desc: 'The egg\'s position tells you its age.',
            result: { pass: 'Sinks and lies flat = very fresh (< 1 week). Sinks but stands upright = 2–3 weeks old but still safe.', fail: 'Floats to the surface = spoiled, do NOT eat.' },
          },
        ],
      },
      {
        id: 'egg-shake-home',
        name: 'Shake Test',
        difficulty: 'Easy',
        time: '1 min',
        accuracy: 'Medium',
        what: 'Checks internal condition of egg without breaking it',
        materials: ['Egg sample'],
        steps: [
          { step: 1, title: 'Hold egg near ear', desc: 'Hold the egg close to your ear in a quiet room.' },
          { step: 2, title: 'Shake gently', desc: 'Shake the egg gently from side to side.' },
          { step: 3, title: 'Listen carefully', desc: 'Listen for any sloshing or movement sound inside the egg.' },
          {
            step: 4, title: 'Result', desc: 'Interpret the sound.',
            result: { pass: 'No sound or movement — fresh egg with intact air cell.', fail: 'Sloshing/movement sound — old egg with broken yolk or excessive air cell.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'egg-yolk-lab',
        name: 'Yolk Index & Haugh Unit Test',
        difficulty: 'Advanced',
        time: '20 min',
        accuracy: 'High',
        what: 'Measures egg quality and freshness scientifically',
        materials: ['Micrometer or vernier caliper', 'Weighing balance', 'Petri dish', 'Ruler'],
        steps: [
          { step: 1, title: 'Weigh egg', desc: 'Weigh the whole egg on a precision balance. Record the weight in grams.' },
          { step: 2, title: 'Break onto petri dish', desc: 'Carefully break the egg onto a flat petri dish without breaking the yolk.' },
          { step: 3, title: 'Measure albumen height', desc: 'Use a micrometer to measure the height of the thick albumen (egg white) at a point equidistant between yolk and outer edge.' },
          { step: 4, title: 'Calculate Haugh Units', desc: 'HU = 100 × log(H − 1.7W⁰·³⁷ + 7.57) where H = albumen height (mm), W = egg weight (g).' },
          {
            step: 5, title: 'Grade egg', desc: 'Use Haugh Unit value to grade the egg.',
            result: { pass: 'HU ≥ 72 = Grade AA (excellent quality). HU 60–71 = Grade A. These are fresh, safe eggs.', fail: 'HU < 60 = Grade B or below. Significant quality loss.' },
          },
        ],
      },
    ],
  },
  {
    id: 'wheat',
    name: 'Wheat & Flour',
    emoji: '🌾',
    icon: Wheat,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-700',
    tagline: 'Detect chalk, talc, stone powder & artificial whitening',
    commonAdulterants: ['Chalk powder', 'Talc powder', 'Plaster of Paris', 'Starch from cheaper grains', 'Artificial whitening agents'],
    homeMethods: [
      {
        id: 'flour-hcl-home',
        name: 'HCl Acid Test for Chalk',
        difficulty: 'Easy',
        time: '3 min',
        accuracy: 'High',
        what: 'Detects chalk (calcium carbonate) in flour',
        materials: ['1 teaspoon flour', 'Vinegar or lemon juice', 'Small bowl'],
        steps: [
          { step: 1, title: 'Take flour', desc: 'Place 1 teaspoon of flour in a small bowl or saucer.' },
          { step: 2, title: 'Add acid', desc: 'Add a few drops of vinegar or lemon juice directly onto the flour.' },
          { step: 3, title: 'Watch reaction', desc: 'Observe the flour for 30 seconds immediately after adding the acid.' },
          {
            step: 4, title: 'Interpret', desc: 'Note any fizzing.',
            result: { pass: 'No reaction — pure flour without chalk.', fail: 'Fizzing and bubbles — chalk/calcium carbonate present (reacts with acid).' },
          },
        ],
      },
      {
        id: 'flour-water-home',
        name: 'Water Sedimentation Test',
        difficulty: 'Easy',
        time: '10 min',
        accuracy: 'Medium',
        what: 'Detects stone powder or sand in flour',
        materials: ['2 tablespoons flour', 'Glass of water'],
        steps: [
          { step: 1, title: 'Add flour to water', desc: 'Add 2 tablespoons of flour to a glass of water. Stir vigorously.' },
          { step: 2, title: 'Let settle', desc: 'Allow to stand for 5–10 minutes without disturbing.' },
          { step: 3, title: 'Observe sediment', desc: 'Carefully look at the bottom of the glass.' },
          {
            step: 4, title: 'Result', desc: 'Evaluate sediment.',
            result: { pass: 'Soft, uniform settling with no hard particles.', fail: 'Gritty/sandy hard sediment = stone powder or talc present.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'flour-moisture-lab',
        name: 'Moisture Content Test',
        difficulty: 'Medium',
        time: '2 hours',
        accuracy: 'High',
        what: 'Measures water content to check for storage quality and cheating by weight',
        materials: ['Hot air oven (105°C)', 'Analytical balance', 'Aluminium moisture dish', '5 g flour sample', 'Desiccator'],
        steps: [
          { step: 1, title: 'Pre-dry dish', desc: 'Pre-dry the aluminium dish in oven at 105°C for 30 minutes. Cool in desiccator and weigh (W1).' },
          { step: 2, title: 'Add sample', desc: 'Accurately weigh 5 g of flour into the dish (W2).' },
          { step: 3, title: 'Dry in oven', desc: 'Place the dish with sample in oven at 105°C for 2 hours.' },
          { step: 4, title: 'Cool and weigh', desc: 'Remove, cool in desiccator for 30 minutes, then weigh (W3).' },
          {
            step: 5, title: 'Calculate', desc: 'Moisture % = [(W2 − W3) / (W2 − W1)] × 100',
            result: { pass: 'Moisture ≤ 14% — FSSAI standard for wheat flour.', fail: 'Moisture > 14% — high water content, risk of mould, weight fraud.' },
          },
        ],
      },
    ],
  },
  {
    id: 'tea',
    name: 'Tea & Coffee',
    emoji: '🍵',
    icon: Coffee,
    iconBg: 'bg-brown-50 bg-amber-900/10',
    iconColor: 'text-amber-900',
    tagline: 'Detect artificial colour, sawdust & exhausted leaves',
    commonAdulterants: ['Artificial colouring agents', 'Sawdust / wood dust', 'Used/exhausted tea leaves', 'Iron filings', 'Coal tar dyes'],
    homeMethods: [
      {
        id: 'tea-colour-home',
        name: 'Colour Bleed Test',
        difficulty: 'Easy',
        time: '5 min',
        accuracy: 'High',
        what: 'Detects artificial colouring agents in tea',
        materials: ['1 teaspoon tea leaves', 'Blotting paper or white tissue', 'Warm water'],
        steps: [
          { step: 1, title: 'Dampen the paper', desc: 'Take a piece of blotting paper or white tissue paper and dampen it with water.' },
          { step: 2, title: 'Place tea on paper', desc: 'Spread 1 teaspoon of tea leaves on the damp paper and press gently.' },
          { step: 3, title: 'Wait 5 minutes', desc: 'Leave the tea on the damp paper for 5 minutes without disturbing.' },
          {
            step: 4, title: 'Check staining', desc: 'Lift the tea leaves and inspect the paper.',
            result: { pass: 'Paper shows a light natural brown — no artificial colour added.', fail: 'Intense colour staining on paper — artificial dye present.' },
          },
        ],
      },
      {
        id: 'tea-iron-home',
        name: 'Iron Filings Test',
        difficulty: 'Easy',
        time: '3 min',
        accuracy: 'High',
        what: 'Detects iron filings added to increase weight',
        materials: ['Tea sample spread on paper', 'A magnet (from a toy or fridge)'],
        steps: [
          { step: 1, title: 'Spread tea', desc: 'Spread the tea leaves in a thin layer on a plain white paper.' },
          { step: 2, title: 'Run magnet over', desc: 'Pass a magnet slowly over the tea leaves, about 1 cm above.' },
          { step: 3, title: 'Inspect magnet', desc: 'Carefully examine the magnet for any particles that cling to it.' },
          {
            step: 4, title: 'Result', desc: 'Check for metallic particles.',
            result: { pass: 'No particles on magnet — no iron filings present.', fail: 'Dark metallic particles on magnet — iron filings detected.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'tea-total-ash-lab',
        name: 'Total Ash & Water Soluble Ash',
        difficulty: 'Advanced',
        time: '4 hours',
        accuracy: 'High',
        what: 'Detects mineral adulterants, spent leaves, and soil',
        materials: ['Muffle furnace (550°C)', 'Crucible (porcelain)', 'Analytical balance', 'Desiccator', '3 g tea sample'],
        steps: [
          { step: 1, title: 'Pre-weigh crucible', desc: 'Heat crucible in muffle furnace at 550°C for 1 hour. Cool in desiccator. Weigh (W1).' },
          { step: 2, title: 'Add tea', desc: 'Add 3 g of finely ground tea to the crucible. Weigh (W2).' },
          { step: 3, title: 'Incinerate', desc: 'Place in muffle furnace at 550°C for 4 hours until grey/white ash remains.' },
          { step: 4, title: 'Cool and weigh', desc: 'Cool in desiccator and weigh (W3).' },
          {
            step: 5, title: 'Calculate', desc: 'Total ash % = [(W3 − W1) / (W2 − W1)] × 100',
            result: { pass: 'Total ash ≤ 8%, water-soluble ash ≥ 45% of total ash (FSSAI standard).', fail: 'Higher ash = mineral adulteration or spent leaves.' },
          },
        ],
      },
    ],
  },
  {
    id: 'fruits',
    name: 'Fruits & Vegetables',
    emoji: '🍎',
    icon: Apple,
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    tagline: 'Detect artificial ripening, wax coating & pesticides',
    commonAdulterants: ['Calcium carbide (artificial ripening)', 'Wax coating', 'Pesticide residues', 'Artificial colour injection (watermelon)', 'Formalin spray'],
    homeMethods: [
      {
        id: 'fruit-carbide-home',
        name: 'Calcium Carbide Test (Mango/Banana)',
        difficulty: 'Easy',
        time: '5 min',
        accuracy: 'Medium',
        what: 'Detects calcium carbide used for artificial ripening',
        materials: ['Permanganate solution (pink colour) OR just observe skin', 'Suspected fruit'],
        steps: [
          { step: 1, title: 'Visual inspection', desc: 'Examine the fruit skin for uneven colour — naturally ripened fruits have uniform colour while artificially ripened ones show uneven patches.' },
          { step: 2, title: 'Smell test', desc: 'Smell the fruit. Carbide-ripened fruits often have a chemical or pungent odour near the stem.' },
          { step: 3, title: 'Feel the texture', desc: 'Press the fruit gently. Carbide-ripened fruit is often hard inside despite yellow outside.' },
          { step: 4, title: 'Cut and observe', desc: 'Cut open — naturally ripened fruit has uniform colour and sweetness inside.' },
          {
            step: 5, title: 'Result', desc: 'Combine all observations.',
            result: { pass: 'Uniform colour, sweet smell, soft inside — naturally ripened.', fail: 'Patchy colour, chemical smell, hard/raw inside — likely carbide-ripened.' },
          },
        ],
      },
      {
        id: 'fruit-wax-home',
        name: 'Wax Coating Detection',
        difficulty: 'Easy',
        time: '3 min',
        accuracy: 'Medium',
        what: 'Detects artificial wax coating on fruits',
        materials: ['Apple or any waxed fruit', 'Warm water', 'White cloth'],
        steps: [
          { step: 1, title: 'Scratch surface', desc: 'Use your fingernail to scratch the surface of the fruit. Observe what comes off.' },
          { step: 2, title: 'Rub with cloth', desc: 'Rub the fruit skin vigorously with a damp white cloth.' },
          { step: 3, title: 'Check cloth', desc: 'Examine the cloth for any waxy residue.' },
          {
            step: 4, title: 'Result', desc: 'Assess wax presence.',
            result: { pass: 'No white/waxy residue on cloth or fingernail — no artificial wax.', fail: 'White waxy film on cloth or fingernail — artificial wax coating present.' },
          },
        ],
      },
    ],
    labMethods: [
      {
        id: 'fruit-pesticide-lab',
        name: 'Pesticide Residue Test (HPLC)',
        difficulty: 'Advanced',
        time: '2–3 hours',
        accuracy: 'High',
        what: 'Quantifies pesticide residues using High Performance Liquid Chromatography',
        materials: ['HPLC instrument', 'Acetonitrile (HPLC grade)', 'SPE (Solid Phase Extraction) cartridges', 'Rotary evaporator', '25 g fruit sample', 'Pesticide reference standards'],
        steps: [
          { step: 1, title: 'Sample preparation', desc: 'Homogenise 25 g of fruit sample and extract with 50 ml acetonitrile. Shake for 1 minute.' },
          { step: 2, title: 'SPE cleanup', desc: 'Pass extract through SPE cartridge to remove matrix interferences. Collect eluent.' },
          { step: 3, title: 'Concentrate', desc: 'Evaporate eluent to near-dryness under nitrogen stream or rotary evaporator. Reconstitute in 1 ml HPLC mobile phase.' },
          { step: 4, title: 'HPLC analysis', desc: 'Inject 20 µl into HPLC. Use C18 reverse phase column, detect at appropriate UV wavelength.' },
          {
            step: 5, title: 'Compare to standards', desc: 'Identify peaks by comparing retention time to reference standards. Quantify using calibration curve.',
            result: { pass: 'Residues below MRL (Maximum Residue Limit) set by FSSAI — safe to consume.', fail: 'Residues above MRL — unsafe, notify FSSAI. Do not consume.' },
          },
        ],
      },
    ],
  },
];

// ─── Difficulty & Accuracy badge styles ──────────────────────────────────────
const DIFF_STYLE = {
  Easy:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium:   'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-red-50 text-red-700 border-red-200',
};
const ACC_STYLE = {
  High:   'bg-primary/8 text-primary border-primary/20',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low:    'bg-muted text-muted-foreground border-border',
};

// ─── Step Card ────────────────────────────────────────────────────────────────
function StepCard({ step, isLast }: { step: TestStep; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shrink-0 shadow-glow">
          <span className="font-display font-800 text-white text-xs">{step.step}</span>
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
      </div>
      <div className={cn('pb-6 flex-1', isLast && 'pb-0')}>
        <h4 className="font-display font-700 text-foreground text-sm mb-1">{step.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
        {step.tip && (
          <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
            <Star className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800"><span className="font-semibold">Tip: </span>{step.tip}</p>
          </div>
        )}
        {step.result && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <ThumbsUp className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800"><span className="font-semibold">Pass: </span>{step.result.pass}</p>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
              <ThumbsDown className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800"><span className="font-semibold">Fail: </span>{step.result.fail}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Method Card ──────────────────────────────────────────────────────────────
function MethodCard({
  method, type, food,
}: {
  method: TestMethod;
  type: 'home' | 'lab';
  food: FoodItem;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden transition-all duration-200',
      type === 'home' ? 'border-emerald-200 bg-emerald-50/30' : 'border-blue-200 bg-blue-50/20',
      open && (type === 'home' ? 'shadow-md' : 'shadow-md')
    )}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-foreground/3 transition-colors"
      >
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
          type === 'home' ? 'bg-emerald-100' : 'bg-blue-100'
        )}>
          {type === 'home'
            ? <Home className="h-4.5 w-4.5 text-emerald-700" />
            : <Microscope className="h-4.5 w-4.5 text-blue-700" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display font-700 text-foreground leading-tight">{method.name}</h3>
            {open
              ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
            }
          </div>
          <p className="text-xs text-muted-foreground mt-1">{method.what}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={cn('text-[10px] font-700 px-2 py-0.5 rounded border uppercase tracking-wide', DIFF_STYLE[method.difficulty])}>
              {method.difficulty}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-muted text-muted-foreground border-border flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> {method.time}
            </span>
            <span className={cn('text-[10px] font-700 px-2 py-0.5 rounded border uppercase tracking-wide', ACC_STYLE[method.accuracy])}>
              {method.accuracy} accuracy
            </span>
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-6 border-t border-border/50 pt-5 animate-fade-in">
          {/* Materials */}
          <div className="mb-6">
            <h4 className="font-display font-700 text-foreground text-sm mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Materials Needed
            </h4>
            <div className="flex flex-wrap gap-2">
              {method.materials.map((m, i) => (
                <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-card border border-border text-foreground">
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <h4 className="font-display font-700 text-foreground text-sm mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Step-by-Step Process
            </h4>
            <div>
              {method.steps.map((step, i) => (
                <StepCard key={step.step} step={step} isLast={i === method.steps.length - 1} />
              ))}
            </div>
          </div>

          {/* AI Assistant + Ingredient Insights */}
          <FoodTestingAIAssistant
            foodName={food.name}
            foodEmoji={food.emoji}
            methodName={method.name}
            methodType={type}
            whatItDetects={method.what}
            adulterants={food.commonAdulterants}
            steps={method.steps}
            materials={method.materials}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FoodTestingPage() {
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [activeMethod, setActiveMethod] = useState<'home' | 'lab'>('home');
  const [search, setSearch] = useState('');

  const filtered = FOOD_ITEMS.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.tagline.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper pt-20">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative gradient-hero border-b border-border/60 overflow-hidden">
        <div className="hero-orb w-[500px] h-[500px] bg-primary/8 top-[-100px] right-[-100px]" />
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-full
                              border border-primary/25 bg-primary/7 text-primary text-xs font-semibold">
                <FlaskConical className="h-3.5 w-3.5" />
                Food Testing Guide
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-800 text-foreground mb-4 text-balance leading-[1.1]">
                How to Test
                <span className="block bg-gradient-to-r from-primary via-emerald-500 to-teal-400 bg-clip-text text-transparent">
                  Your Food
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Step-by-step guides to test food quality and detect adulterants — both at home with everyday items and in a certified laboratory. Covers milk, honey, oil, spices, eggs, flour and more.
              </p>
              {/* Stats row */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Apple,       label: `${FOOD_ITEMS.length} food categories` },
                  { icon: Home,        label: `${FOOD_ITEMS.reduce((a,f)=>a+f.homeMethods.length,0)} home tests` },
                  { icon: Microscope,  label: `${FOOD_ITEMS.reduce((a,f)=>a+f.labMethods.length,0)} lab tests` },
                  { icon: ShieldCheck, label: 'FSSAI standard references' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-sm font-medium text-foreground shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block relative pb-6 pl-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                <img
                  src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=700&h=500&fit=crop&q=80"
                  alt="Food safety testing in a laboratory"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-xl bg-card/95 border border-border shadow-lg flex items-center gap-2 z-10">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">28 Tests Available</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Home &amp; Lab methods</p>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex gap-3">
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <FlaskConical className="h-3.5 w-3.5" /> Lab-grade accuracy
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> FSSAI compliant
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Food selector ─────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="font-display font-700 text-foreground text-lg mb-3">Choose a Food</h2>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search food items…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                {filtered.map(food => (
                  <button
                    key={food.id}
                    onClick={() => { setSelectedFood(food); setActiveMethod('home'); }}
                    className={cn(
                      'w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200',
                      selectedFood?.id === food.id
                        ? 'border-primary/40 bg-primary/6 shadow-glow'
                        : 'border-border bg-card hover:border-primary/30 hover:bg-primary/4'
                    )}
                  >
                    <span className="text-2xl">{food.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('font-display font-700 text-sm', selectedFood?.id === food.id ? 'text-primary' : 'text-foreground')}>
                        {food.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{food.tagline}</p>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0 text-right">
                      <span className="text-[10px] font-semibold text-emerald-600">{food.homeMethods.length} home</span>
                      <span className="text-[10px] font-semibold text-blue-600">{food.labMethods.length} lab</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-5 p-4 rounded-2xl bg-primary/6 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-sm text-foreground">Need a certified test?</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Find FSSAI-certified labs near you using Ola Maps GPS.</p>
                <Link to="/labs"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                  Find nearest labs <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Test methods ─────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {!selectedFood ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center mb-6 text-4xl">
                  🔬
                </div>
                <h3 className="font-display font-700 text-xl text-foreground mb-2">Select a food to begin</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Choose any food item from the left panel to see home and lab testing methods with step-by-step instructions.
                </p>
              </div>
            ) : (
              <div className="animate-fade-up">
                {/* Food header */}
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm mb-6">
                  <div className="text-5xl">{selectedFood.emoji}</div>
                  <div className="flex-1">
                    <h2 className="font-display text-3xl font-800 text-foreground mb-1">
                      Testing {selectedFood.name}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-3">{selectedFood.tagline}</p>
                    <div>
                      <p className="text-[10px] font-800 uppercase tracking-widest text-muted-foreground mb-2">Common adulterants</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedFood.commonAdulterants.map(a => (
                          <span key={a} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Method type switcher */}
                <div className="flex gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border/60 mb-6">
                  {([
                    { id: 'home', label: 'Home Testing', icon: Home         },
                    { id: 'lab',  label: 'Lab Testing',  icon: Microscope   },
                  ] as const).map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveMethod(t.id)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200',
                        activeMethod === t.id
                          ? 'bg-card shadow-sm text-foreground border border-border/60'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <t.icon className={cn('h-4 w-4', activeMethod === t.id ? 'text-primary' : '')} />
                      <span className="hidden sm:inline">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* Home methods */}
                {activeMethod === 'home' && selectedFood.homeMethods.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Home className="h-4.5 w-4.5 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="font-display font-700 text-foreground">Home Testing Methods</h3>
                        <p className="text-xs text-muted-foreground">Simple tests you can do with everyday household items</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {selectedFood.homeMethods.map(m => (
                        <MethodCard key={m.id} method={m} type="home" food={selectedFood} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Lab methods */}
                {activeMethod === 'lab' && selectedFood.labMethods.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Microscope className="h-4.5 w-4.5 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-display font-700 text-foreground">Laboratory Testing Methods</h3>
                        <p className="text-xs text-muted-foreground">Professional-grade tests performed in certified FSSAI labs</p>
                      </div>
                    </div>

                    {/* Lab disclaimer */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Professional use only</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Lab methods require trained personnel, certified equipment, and hazardous chemicals. Always follow safety protocols. Use a certified FSSAI-approved laboratory for official results.
                          {' '}<Link to="/labs" className="underline font-semibold">Find one near you →</Link>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedFood.labMethods.map(m => (
                        <MethodCard key={m.id} method={m} type="lab" food={selectedFood} />
                      ))}
                    </div>
                  </div>
                )}

                {/* What to do if you find adulteration */}
                <div className="p-6 rounded-2xl bg-foreground text-background border-0">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                      <Info className="h-4.5 w-4.5 text-white" />
                    </div>
                    <h3 className="font-display font-700">What to do if you detect adulteration?</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { step: '01', text: 'Stop consuming the product immediately and store the sample as evidence.' },
                      { step: '02', text: 'File a complaint with FSSAI at fssai.gov.in or call the helpline 1800-11-2100.' },
                      { step: '03', text: 'Report to the local food safety officer or consumer court.' },
                      { step: '04', text: 'Inform other consumers — post on social media or file with consumer forums.' },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg bg-primary/20 text-primary text-[11px] font-800 flex items-center justify-center shrink-0 mt-0.5">
                          {step}
                        </span>
                        <p className="text-sm text-background/80 leading-relaxed">{text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-5">
                    <Link to="/testing-guide"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all">
                      <FlaskConical className="h-4 w-4" /> Testing Guide
                    </Link>
                    <Link to="/alerts"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/10 text-background text-sm font-semibold border border-background/20 hover:bg-background/20 transition-all">
                      <Bell className="h-4 w-4" /> View Active Alerts
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <FloatingChatBot {...TESTING_BOT_CONFIG} />
    </div>
  );
}

// end of file
