# HS Assessment Creator

A browser-based tool for generating AI-powered high school assessments. Create quizzes, tests, and worksheets using customizable templates and AI formatting.

## Features

- 🎯 **Multiple Assessment Types** - Multiple choice, free response, mixed format unit tests
- 📝 **Template System** - Create and customize reusable assessment templates
- 🤖 **AI-Powered** - Uses OpenAI-compatible APIs (OpenAI, Groq, Ollama, etc.)
- 📁 **File Upload** - Generate assessments from source materials
- 📜 **History** - Keep track of all generated assessments with search & filtering
- ☁️ **Cloud Storage** - Optional Supabase integration for cross-device sync
- 🔒 **Privacy-First** - API keys stored only in sessionStorage (cleared on tab close)
- 📄 **PDF Export** - Export assessments as professionally formatted PDFs
- ✏️ **Edit Assessments** - Edit generated assessments before saving
- 🔍 **Search & Filter** - Quickly find assessments by content, template, or date
- 📤 **Template Import/Export** - Share templates with colleagues as JSON files
- 🌙 **Dark Mode** - Easy on the eyes with automatic theme switching

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### 3. Configure API Key

1. Click the **Settings** tab
2. Enter your OpenAI API key (get one at https://platform.openai.com)
3. (Optional) Change the API base URL for other providers
4. Click **Save Settings**

### 4. Create an Assessment

1. Go to the **Create** tab
2. Select a template (Multiple Choice Quiz, Free Response, etc.)
3. Enter your prompt (e.g., "10 questions on the American Revolution for 10th grade")
4. (Optional) Upload a document as source material
5. Click **Generate Assessment**
6. View, edit, copy, or export your assessment as PDF or TXT

## New Features Guide

### PDF Export
Click the **📄 PDF** button on any generated assessment to download it as a professionally formatted PDF document. Perfect for printing or sharing with students.

### Edit Assessments
1. Generate an assessment
2. Click **✏️ Edit** to make changes
3. Modify the content as needed
4. Click **💾 Save** to update

### Search & Filter History
In the **History** tab:
- Use the search bar to find assessments by content, template name, or prompt
- Sort by newest or oldest first
- Click on any assessment to view details

### Template Import/Export
Share templates with colleagues:
- **Export Single**: Click **📤** button next to any template
- **Export All**: Click **📤 Export All** in Templates tab
- **Import**: Click **📥 Import** and select a JSON file

### Dark Mode
1. Go to **Settings** tab
2. Under **Appearance**, select **🌙 Dark Mode**
3. Theme preference is saved automatically


## Cloud Storage Setup (Optional)

Enable Supabase to sync your templates and assessments across devices.

### Step 1: Create Supabase Project

1. Go to https://supabase.com and create a free account
2. Click **New Project**
3. Choose a name and set a database password
4. Wait ~2 minutes for provisioning

### Step 2: Create Database Tables

In your Supabase dashboard:
1. Go to **SQL Editor** → **New query**
2. Paste and run the following:

```sql
-- Templates table
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  format_example TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessment history table
CREATE TABLE assessments (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Public access policies (single-user mode)
CREATE POLICY "Public can do everything on templates"
  ON templates FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can do everything on assessments"
  ON assessments FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Step 3: Get Credentials

1. In Supabase dashboard → **Settings** → **API**
2. Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)

### Step 4: Configure in App

1. Open the app and go to **Settings**
2. Check **Use Cloud Storage (Supabase)**
3. Paste your Supabase URL and Key
4. Click **Save Settings**
5. (Optional) Click **Migrate Local Data to Cloud** to upload existing data

## Deployment

### Deploy to Vercel (Recommended)

#### Option 1: Via GitHub (No Installation Required)

1. Push your code to GitHub
2. Go to https://vercel.com and log in with GitHub
3. Click **Add New...** → **Project**
4. Select your repository
5. Click **Deploy** (Vercel auto-detects Vite settings)

#### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# For production
vercel --prod
```

## Tech Stack

- **Frontend**: React 18, TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Plain CSS with CSS variables
- **Storage**: localStorage (default) or Supabase (optional)
- **AI**: OpenAI-compatible APIs

## Project Structure

```
src/
├── components/       # React components
│   ├── AssessmentCreator.tsx
│   ├── AssessmentOutput.tsx
│   ├── TemplateManager.tsx
│   ├── SettingsPanel.tsx
│   └── ...
├── services/         # External services
│   ├── aiService.ts
│   └── supabaseClient.ts
├── utils/            # Utilities
│   ├── storage.ts
│   ├── migration.ts
│   └── defaultTemplates.ts
├── types/            # TypeScript types
│   └── index.ts
├── App.tsx           # Main app component
└── main.tsx          # Entry point
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Data Storage

### localStorage (Default)
- Templates and assessment history stored in browser
- Persists across sessions but not across devices
- No setup required

### Supabase (Optional)
- Cloud storage for cross-device access
- Requires free Supabase account
- Credentials stored in sessionStorage only

## Security

- API keys stored in `sessionStorage` (cleared when browser tab closes)
- Settings (URLs, model names) stored in `localStorage`
- Supabase credentials also stored in `sessionStorage`
- All sensitive data stays in your browser
- No backend server required

## Contributing

This is a personal project, but suggestions are welcome! Open an issue or PR.

## License

MIT
