# 🥗 Food Safety Hub India

> A comprehensive food safety awareness platform for Indian consumers — powered by AI, live news, and actionable health guidance.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Pages & Routes](#-pages--routes)
- [AI Integration](#-ai-integration)
- [Live News Pipeline](#-live-news-pipeline)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

**Food Safety Hub India** is a React + TypeScript SPA that educates Indian consumers about food safety, adulteration, nutrition, foodborne diseases, and FSSAI regulations. It integrates Google Gemini AI across every page for real-time, contextual assistance and pulls fully live news from multiple sources — no static data.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Food Label Analyzer** | Upload or paste a photo of any food label — OCR extracts the ingredient list and Gemini AI analyzes safety, additives, and red flags |
| 🧪 **Home Adulteration Testing Guide** | Step-by-step guides for 10+ home tests for common adulterants in milk, turmeric, honey, oils, and more |
| 🛡️ **Food Safety Awareness** | Tactics to avoid adulteration, label reading steps, and common myths vs facts |
| 🦠 **Foodborne Disease Encyclopedia** | Detailed profiles of 10+ foodborne diseases — pathogens, symptoms, onset times, prevention, and treatment |
| 🥦 **Nutrition Guide** | Food group breakdowns, macro/micronutrients, Indian dietary guidelines, daily needs calculator |
| 🚨 **Live Safety Alerts & Regulations** | Real-time food recall alerts, contamination news, and FSSAI regulation updates — fetched live from NewsAPI, GDELT, and RSS feeds |
| 📢 **File a Complaint** | Guidance on how to file food safety complaints with FSSAI, state authorities, and consumer courts |
| 🤖 **Floating AI Assistant** | Every page has a context-aware AI chatbot (Google Gemini) pre-configured for that page's topic |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, React Router v6
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3, shadcn/ui (Radix UI primitives)
- **AI**: Google Gemini 2.0 Flash (`gemini-2.0-flash`)
- **OCR**: Tesseract.js (client-side label scanning)
- **Live News**: NewsAPI (primary), GDELT Project v2 (fallback), Food Safety News RSS + EFSA RSS (fallback)
- **Icons**: Lucide React
- **State Management**: React hooks (no external state library)
- **Testing**: Vitest + React Testing Library

---

## 📁 Project Structure

```
food-safety-hub/
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Navigation bar
│   │   │   ├── Footer.tsx          # Site footer
│   │   │   └── Layout.tsx          # Page wrapper
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── FloatingChatBot.tsx     # Shared AI chat widget (all pages)
│   │   ├── FoodTestingAIAssistant.tsx
│   │   └── ScrollToTop.tsx
│   ├── pages/
│   │   ├── HomePage.tsx            # Landing page, safety tips ticker, stats
│   │   ├── AnalyzePage.tsx         # Food label scanner + AI analysis
│   │   ├── FoodTestingPage.tsx     # Home adulteration test guides
│   │   ├── FoodAwarenessPage.tsx   # Awareness tactics & label reading
│   │   ├── FoodbornePage.tsx       # Foodborne disease encyclopedia
│   │   ├── NutritionPage.tsx       # Nutrition guide & daily needs
│   │   ├── AlertsPage.tsx          # Live news alerts & regulations
│   │   ├── ComplaintPage.tsx       # FSSAI complaint guidance
│   │   └── NotFound.tsx
│   ├── lib/
│   │   ├── gemini.ts               # Gemini API helper with retry/backoff
│   │   └── utils.ts                # cn() utility
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                   # Global styles & CSS variables
├── .env.example                    # Environment variable template
├── vite.config.ts                  # Vite config + NewsAPI dev proxy
├── tailwind.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/food-safety-hub.git
cd food-safety-hub

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Then edit .env.local with your API keys (see below)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Other Scripts

```bash
npm run build       # Production build → dist/
npm run preview     # Preview the production build locally
npm run lint        # Run ESLint
npm run test        # Run unit tests (Vitest)
npm run test:watch  # Run tests in watch mode
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root (it is git-ignored):

```env
# Required — Google Gemini AI (all AI features)
# Get your key at: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional — NewsAPI for live alerts (free tier at newsapi.org)
# Used server-side by the Vite dev proxy. Falls back to GDELT + RSS if absent.
NEWS_API_KEY=your_news_api_key_here
```

> **Note on Alerts Page**: If `NEWS_API_KEY` is not provided, the Alerts page automatically falls back to GDELT Project and Food Safety News RSS feeds — both free and key-free. All news is always live; no static data is used.

---

## 🗺️ Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Landing page with safety tips, food facts ticker, and navigation |
| `/analyze` | Food Label Analyzer | OCR + Gemini AI-powered ingredient safety checker |
| `/testing-guide` | Home Testing Guide | Home adulteration tests for 10+ food categories |
| `/awareness` | Food Safety Awareness | FSSAI tips, label tactics, adulteration awareness |
| `/foodborne` | Foodborne Diseases | Disease encyclopedia with pathogens and treatment info |
| `/nutrition` | Nutrition Guide | Macros, micronutrients, food groups, daily needs |
| `/alerts` | Live Alerts | Real-time food safety news, recalls, and FSSAI updates |
| `/complaint` | File a Complaint | How to report unsafe food to FSSAI and authorities |

---

## 🤖 AI Integration

All AI features use **Google Gemini 2.0 Flash** via a shared helper at `src/lib/gemini.ts`.

Key characteristics:
- **Automatic retry with exponential backoff** for 429 (rate-limit) errors
- Each page configures its own `systemPrompt`, `welcomeMessage`, and `quickReplies` — the AI is always contextually focused on the page topic
- **Food Label Analyzer** sends OCR-extracted text to Gemini for ingredient safety scoring, additive identification, and FSSAI compliance notes
- **Floating chatbot** renders via `React.createPortal` so it stays `position: fixed` on all pages regardless of parent CSS transforms

---

## 📡 Live News Pipeline

The Alerts page uses a three-tier live news pipeline — no static data, no hard-coded articles:

```
1. NewsAPI (primary)
   └─ Vite dev proxy at /api/news → newsapi.org
   └─ API key injected server-side via X-Api-Key header

2. GDELT Project v2 (free, no key)
   └─ api.gdeltproject.org/api/v2/doc/doc
   └─ Parallel: category-specific query + broad fallback query

3. RSS Feeds via rss2json.com + allorigins.win (free, no key)
   └─ foodsafetynews.com/feed/
   └─ EFSA European Food Safety Authority RSS

All results merged → deduplication → relevance scoring → date sort
```

---

## 📦 Deployment

### Build for Production

```bash
npm run build
```

The output is in `dist/`. It's a standard static SPA — deploy to any static host.

### Recommended Platforms

| Platform | Notes |
|---|---|
| **Vercel** | Zero-config, auto-detects Vite |
| **Netlify** | Add `_redirects` file: `/* /index.html 200` |
| **GitHub Pages** | Set `base` in `vite.config.ts` to your repo name |

### Environment Variables in Production

Set `VITE_GEMINI_API_KEY` in your hosting platform's environment variable settings. `NEWS_API_KEY` is only used by the Vite dev proxy — in production, the Alerts page falls back to GDELT and RSS automatically.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [FSSAI](https://fssai.gov.in) — Food Safety and Standards Authority of India
- [Food Safety News](https://www.foodsafetynews.com) — RSS news feed
- [GDELT Project](https://www.gdeltproject.org) — Free global news database
- [Google Gemini](https://ai.google.dev) — AI language model
- [shadcn/ui](https://ui.shadcn.com) — Component library
- [Lucide React](https://lucide.dev) — Icon library
