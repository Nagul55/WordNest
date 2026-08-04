# WordNest ⚡ — Next-Generation AI Study Suite & Quizlet Replica

WordNest is an advanced, ultra-responsive interactive study platform engineered to replicate and evolve beyond modern Quizlet features. Supercharged with **DeepSeek V4 Pro** neural synthesis and **Unsplash HD Visuals**, WordNest transforms your study habits into an engaging mastery loop.

---

## 🔥 Key Features

1. **Interactive 3D Flashcards**: Hardware-accelerated flip animations, Web Speech API built-in Text-to-Speech (TTS) pronunciation across multiple languages, and keyboard navigation (`Space` to flip, `Arrows` to advance).
2. **AI Magic Notes Studio**: Paste raw lecture syllabi, article drafts, or essay notes. Our FastAPI backend transmits to **DeepSeek V4 Pro**, which instantly generates executive summary outlines, flashcards, and multiple-choice quizzes.
3. **Socratic AI Tutor**: An interactive conversational AI chatbot trained to quiz you using the Socratic method on your custom decks—helping you grasp core real-world concepts rather than rote definitions.
4. **Adaptive Learn Mode**: Utilizes evidence-based SM-2 spaced repetition algorithms, seamlessly graduating questions from Multiple Choice for new terms to AI-graded written assessments for familiar concepts.
5. **High-Speed Match Arena**: Race against a real-time stopwatch by clicking and matching terms with definitions across a scrambled grid. Includes celebratory confetti animations and personal best highscores.
6. **Unsplash Visual Studio**: Link high-definition educational imagery to any card term with our integrated Unsplash photo search modal.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Next.js 14+ (App Router), Tailwind CSS, Lucide Icons, Framer Motion, TypeScript.
* **Backend**: FastAPI Python, Pydantic, Uvicorn, OpenAI SDK (NVIDIA NVAPI DeepSeek integration).
* **Database & Auth**: Supabase PostgreSQL (Row Level Security & JSON schema migrations).

---

## 🚀 Quickstart & Installation

### 1. Database Setup (Supabase)
1. Navigate to your Supabase SQL Editor.
2. Copy and execute the contents of `supabase/schema.sql`. This initializes all Postgres tables, RLS policies, and inserts starter demo study decks.

### 2. Start Python Backend (FastAPI + DeepSeek V4 Pro)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python run_server.py
```
* The API will be served at `http://localhost:8000`. You can visit `http://localhost:8000/docs` for interactive OpenAPI Swagger docs.

### 3. Start Frontend Web Application (Next.js)
```bash
cd frontend
npm run dev
```
* Access the WordNest web dashboard at `http://localhost:3000`.
* **Note**: Even if your Python server or database isn't running yet, WordNest features intelligent fallbacks and starter mock data so you can preview all interactive study tools immediately!

---

## 🔐 Credentials & Security

* Review `backend/.env` and `frontend/.env.local` to customize your DeepSeek NVAPI keys, Unsplash credentials, and Supabase Project URLs.
* Environment files are automatically excluded via `.gitignore`.
