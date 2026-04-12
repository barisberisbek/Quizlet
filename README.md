# DWP Quiz Platform

A production-ready, static-first quiz platform for practicing **Dynamic Web Programming** past exam questions. Built with React, TypeScript, Vite, and Tailwind CSS. Deployable to GitHub Pages with zero backend dependencies.

🔗 **Live Demo**: [https://barisberisbek.github.io/Dynamic-Web-Programming/](https://barisberisbek.github.io/Dynamic-Web-Programming/)

---

## Features

- 📚 **Browse quizzes** — searchable sidebar with topic filters and difficulty badges
- ✅ **Answer questions** — single choice, multiple choice, and true/false
- 💡 **Reveal explanations** — detailed markdown explanations with code highlighting
- 📊 **Track progress** — per-quiz and per-topic accuracy tracking
- 🔖 **Bookmarks** — save questions for later review
- 🔄 **Wrong-answer practice** — retry only the questions you got wrong
- 🎲 **Shuffle mode** — randomize question order
- 📱 **Responsive** — works on desktop, tablet, and mobile
- 🌙 **Dark theme** — calm, focused study interface
- ⌨️ **Keyboard navigation** — arrow keys to navigate between questions
- 💾 **Offline data** — all quiz content served from local JSON files
- 📦 **Export/Import** — backup and restore your progress as JSON
- 🚀 **GitHub Pages ready** — one-push deployment via GitHub Actions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 (HashRouter) |
| State | Zustand |
| Animations | Framer Motion |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm |
| Syntax Highlighting | react-syntax-highlighter (Prism) |
| Validation | Zod |
| Persistence | localStorage (swappable) |

---

## Folder Structure

```
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions deployment
├── public/
│   ├── data/
│   │   ├── index.json          # Quiz discovery manifest
│   │   └── quizzes/            # Individual quiz JSON files
│   │       ├── dwp-2024-midterm.json
│   │       ├── dwp-2024-final.json
│   │       └── dwp-dom-events-practice.json
│   └── icons/
│       └── favicon.svg
├── src/
│   ├── app/App.tsx             # Root component
│   ├── components/
│   │   ├── layout/             # Layout, Sidebar, TopBar
│   │   └── question/           # QuestionCard, AnswerOption, ExplanationPanel, CodeBlock
│   ├── lib/utils.ts            # Shared utilities
│   ├── pages/                  # HomePage, QuizPage, StatsPage, BookmarksPage
│   ├── router/index.tsx        # Hash router configuration
│   ├── services/
│   │   ├── storage/            # StorageService interface + localStorage impl
│   │   └── quizzes/            # Quiz JSON loader with Zod validation
│   ├── store/                  # Zustand stores (quiz, bookmarks, UI)
│   ├── styles/index.css        # Tailwind + custom design tokens
│   └── types/                  # TypeScript types + Zod schemas
├── index.html
├── vite.config.ts
└── package.json
```

---

## Quiz JSON Schema

Each quiz file follows this structure:

```json
{
  "meta": {
    "id": "unique-quiz-id",
    "title": "Quiz Title",
    "description": "Brief description",
    "source": "2024 Midterm Exam",
    "year": 2024,
    "topic": "Primary Topic",
    "topics": ["Topic1", "Topic2"],
    "questionCount": 15,
    "difficulty": "easy | medium | hard",
    "estimatedMinutes": 30,
    "tags": ["exam", "midterm"],
    "fileName": "quiz-file-name.json"
  },
  "questions": [
    {
      "id": "q1",
      "type": "single_choice | multiple_choice | true_false",
      "topic": "HTTP",
      "subtopic": "Methods",
      "difficulty": "easy | medium | hard",
      "questionMd": "Question text in **markdown**",
      "codeBlock": "optional code snippet",
      "codeLanguage": "javascript",
      "options": [
        { "id": "a", "label": "A", "text": "Option text" }
      ],
      "correctAnswer": ["a"],
      "explanationMd": "Detailed explanation in **markdown**",
      "tags": ["http", "methods"]
    }
  ]
}
```

---

## How to Add a New Quiz

1. Create a new JSON file in `public/data/quizzes/` following the schema above
2. Add a corresponding entry to `public/data/index.json` under the `quizzes` array
3. Make sure `questionCount` in the manifest matches the actual number of questions
4. The quiz will automatically appear in the sidebar on reload

---

## Local Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server (base path: /)
npm run dev

# Open http://localhost:5173/
```

---

## Build for Production

```bash
# TypeScript check + Vite build (base path: /Dynamic-Web-Programming/)
npm run build

# Preview the production build locally
npm run preview
```

---

## Deploy to GitHub Pages

### Automatic (recommended)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys on every push to `main`.

**Setup steps:**
1. Go to your repository Settings → Pages
2. Set **Source** to "GitHub Actions"
3. Push to `main` — the workflow will build and deploy automatically

### Manual

```bash
npm run build
# Upload the contents of dist/ to your hosting
```

### Changing the base path

- **Repository pages** (`username.github.io/repo-name/`): set `base` in `vite.config.ts` to `'/repo-name/'`
- **User site** (`username.github.io`): set `base` to `'/'`
- The config already handles this via `mode === 'production'` check

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `→` or `j` | Next question |
| `←` or `k` | Previous question |

---

## Future Backend Migration

The architecture is designed for easy migration to Firebase or another backend:

### Storage Layer
The `StorageService` interface (`src/services/storage/index.ts`) abstracts all persistence. To migrate:
1. Create `FirebaseStorageService` implementing the same interface
2. Swap the import in stores

### Quiz Data Source
The `QuizLoaderService` (`src/services/quizzes/loader.ts`) can be replaced with Firestore queries. Same interface, different data source.

### Authentication
Add Firebase Auth and gate the storage layer behind user identity. The Zustand stores already support per-user sessions.

### Hosting
Replace GitHub Pages with Firebase Hosting:
```bash
npm install -g firebase-tools
firebase init hosting  # set public dir to "dist"
firebase deploy
```

---

## Data Management

- **Export progress**: Stats page → "Export Progress" button → downloads JSON
- **Import progress**: Stats page → "Import Progress" button → select JSON file
- **Reset all**: Stats page → "Reset All Progress" button

---

## License

MIT
