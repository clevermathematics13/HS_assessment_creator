# HS Assessment Creator

FDR-style Key Assessment builder for **Math 9 Extended** and **Math 9 Standard** at Colegio Franklin Delano Roosevelt.

## Features

- **Build tab** — wizard form: course, block, date, GDC policy, then questions with sub-questions, action words, TikZ diagram hints, cognitive levels, and mark values
- **Generate tab** — streams Overleaf-ready LaTeX via Claude, FDR template conventions baked in
- **Preview tab** — in-browser PDF rendering via PDF.js (compile on Overleaf, paste URL or upload)
- **Library tab** — save/load assessments via Vercel KV

## Stack

Next.js 14 · TypeScript · Tailwind CSS · Anthropic SDK · Vercel KV · PDF.js

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY
npm run dev
```

## Deploy

1. Push to GitHub
2. Import into Vercel
3. Add a **KV Database** in your Vercel project (Storage → Create → KV)
4. Set `ANTHROPIC_API_KEY` in environment variables
5. Deploy
