# WordNest ⚡ — Next-Generation AI Study Suite & Quizlet Replica

WordNest is an advanced, ultra-responsive interactive study platform engineered to replicate and evolve beyond modern Quizlet features. Supercharged with **Groq Cloud API (Llama 3.1)** neural synthesis and **Unsplash HD Visuals**, WordNest transforms your study habits into an engaging, high-speed mastery loop.

---

## 🔥 Key Features

1. **Interactive 3D Flashcards**: Hardware-accelerated flip animations, Web Speech API built-in Text-to-Speech (TTS) pronunciation across multiple languages, and keyboard navigation (`Space` to flip, `Arrows` to advance).
2. **AI Magic Notes Studio**: Paste raw lecture syllabi, article drafts, or essay notes. Our FastAPI backend transmits to **Groq Cloud**, which instantly generates executive summary outlines, flashcards, and multiple-choice quizzes.
3. **Socratic AI Tutor**: An interactive conversational AI chatbot trained to quiz you using the Socratic method on your custom decks—helping you grasp core real-world concepts rather than rote definitions.
4. **Adaptive Learn Mode**: Utilizes evidence-based SM-2 spaced repetition algorithms, seamlessly graduating questions from Multiple Choice for new terms to AI-graded written assessments for familiar concepts.
5. **High-Speed Match Arena**: Race against a real-time stopwatch by clicking and matching terms with definitions across a scrambled grid. Includes celebratory confetti animations and personal best highscores.
6. **Unsplash Visual Studio**: Link high-definition educational imagery to any card term with our integrated Unsplash photo search modal, featuring debounced real-time pre-fetch capabilities.
7. **Animated Deck Folders**: Premium React Bits 3D animated folders that match the theme gradients, reacting dynamically to mouse hover and clicked states.
8. **Browser Back/Forward Navigation**: Fully integrated window query parameters (`?tab=`) and URL hashes (`#deck-`) that map to history states, enabling seamless browser Back, Forward, Reload, and deep-linking behaviors.

---

## 🛠️ Tech Stack & Architecture

* **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons, Framer Motion, TypeScript.
* **Backend**: FastAPI Python, Pydantic, Uvicorn, OpenAI SDK (Groq Cloud Integration).
* **Database & Auth**: Supabase PostgreSQL (Row Level Security & JSON schema migrations).

---

## 🚀 Quickstart & Installation

Follow these steps to set up and run WordNest locally:

### 1. Database Setup (Supabase)
1. Go to your [Supabase Console](https://supabase.com).
2. Create a new project and navigate to the **SQL Editor**.
3. Copy and execute the contents of `supabase_schema.sql` (located in the root folder). This initializes all postgres tables, views, and Row Level Security (RLS) policies.

### 2. Backend Setup (FastAPI + Groq)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   * **Windows**: `venv\Scripts\activate`
   * **macOS/Linux**: `source venv/bin/activate`
4. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure your environmental keys in `backend/.env`. (Make sure `GROQ_API_KEY`, `UNSPLASH_ACCESS_KEY`, and `SUPABASE_KEY` are populated).
6. Launch the FastAPI server:
   ```bash
   python run_server.py
   ```
   * The backend will run at `http://localhost:8000`. You can inspect the Swagger documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup (Next.js)
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure your Supabase client endpoints inside `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the local Next.js development server:
   ```bash
   npm run dev
   ```
   * Open `http://localhost:3000` in your web browser.

---

## 🔐 Credentials & Security

* Double check that your `.env` (backend) and `.env.local` (frontend) files are correctly populated.
* These files are ignored by Git (configured in `.gitignore`) to protect your production keys.
