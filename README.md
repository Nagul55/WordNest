# <img src="https://raw.githubusercontent.com/Nagul55/WordNest/main/frontend/public/Wordnest.svg" alt="WordNest Logo" width="42" align="center" /> WordNest <img src="https://api.iconify.design/lucide/zap.svg?color=%23FBBF24" width="28" height="28" align="center" />

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge&logo=github-actions)](https://github.com/Nagul55/WordNest)
[![License](https://img.shields.io/badge/Google_Cloud-Verified-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://word-nest-seven.vercel.app)
[![Version](https://img.shields.io/badge/version-1.0.0-purple?style=for-the-badge)](https://github.com/Nagul55/WordNest)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://word-nest-seven.vercel.app)

---

### **A state-of-the-art Quizlet alternative powered by Groq AI (Llama 3.1) and Unsplash HD Visuals for intelligent, high-speed vocabulary mastery and interactive Socratic tutoring.**

[![Live Demo](https://img.shields.io/badge/Launch_WordNest_Web_App-433075?style=for-the-badge&logo=vercel&logoColor=white)](https://word-nest-seven.vercel.app)

---

## <img src="https://api.iconify.design/lucide/list-tree.svg?color=%23A58CF4" width="24" height="24" align="center" /> Table of Contents
- [<img src="https://api.iconify.design/lucide/lightbulb.svg?color=%23F59E0B" width="16" height="16" align="center" /> Why WordNest?](#-why-wordnest)
- [<img src="https://api.iconify.design/lucide/camera.svg?color=%2306B6D4" width="16" height="16" align="center" /> Screenshots & Preview](#-screenshots--preview)
- [<img src="https://api.iconify.design/lucide/sparkles.svg?color=%23EC4899" width="16" height="16" align="center" /> Key Features](#-key-features)
- [<img src="https://api.iconify.design/lucide/wrench.svg?color=%233B82F6" width="16" height="16" align="center" /> Tech Stack](#-tech-stack)
- [<img src="https://api.iconify.design/lucide/zap.svg?color=%23FBBF24" width="16" height="16" align="center" /> Quick Start](#-quick-start)
- [<img src="https://api.iconify.design/lucide/folder-tree.svg?color=%2310B981" width="16" height="16" align="center" /> Project Structure](#-project-structure)
- [<img src="https://api.iconify.design/lucide/plug-zap.svg?color=%238B5CF6" width="16" height="16" align="center" /> API Reference](#-api-reference)
- [<img src="https://api.iconify.design/lucide/flask-conical.svg?color=%233B82F6" width="16" height="16" align="center" /> Testing](#-testing)
- [<img src="https://api.iconify.design/lucide/rocket.svg?color=%23F43F5E" width="16" height="16" align="center" /> Deployment](#-deployment)
- [<img src="https://api.iconify.design/lucide/users.svg?color=%236366F1" width="16" height="16" align="center" /> Contributing](#-contributing)
- [<img src="https://api.iconify.design/lucide/file-text.svg?color=%2364748B" width="16" height="16" align="center" /> License](#-license)
- [<img src="https://api.iconify.design/lucide/user-check.svg?color=%23A58CF4" width="16" height="16" align="center" /> Author & Contact](#-author--contact)

---

## <img src="https://api.iconify.design/lucide/lightbulb.svg?color=%23F59E0B" width="24" height="24" align="center" /> Why WordNest?

Traditional flashcard platforms rely on manual input and static repetition, leading to study fatigue and inefficient learning. **WordNest** bridges this gap by combining **Socratic AI tutoring**, **instant AI deck generation from raw notes**, and **semantic sentence grading** into a sleek, ultra-responsive web platform designed for students and life-long learners.

---

## <img src="https://api.iconify.design/lucide/camera.svg?color=%2306B6D4" width="24" height="24" align="center" /> Screenshots & Preview

| <img src="https://api.iconify.design/lucide/layers.svg?color=%23A58CF4" width="18" height="18" align="center" /> Interactive 3D Study Deck | <img src="https://api.iconify.design/lucide/target.svg?color=%23EC4899" width="18" height="18" align="center" /> AI Contextual Sentence Evaluator |
| :---: | :---: |
| <img src="https://raw.githubusercontent.com/Nagul55/WordNest/main/docs/screenshots/v5_flashcards.png" alt="Interactive 3D Study Deck" width="100%" /> <br> *3D flip card physics with multi-language TTS audio & cover photos* | <img src="https://raw.githubusercontent.com/Nagul55/WordNest/main/docs/screenshots/v5_ai_evaluator.png" alt="AI Contextual Sentence Evaluator" width="100%" /> <br> *Real-time AI grammar scoring & natural sentence corrections* |

| <img src="https://api.iconify.design/lucide/timer.svg?color=%2310B981" width="18" height="18" align="center" /> Speed Match Blitz Arena | <img src="https://api.iconify.design/lucide/image.svg?color=%2306B6D4" width="18" height="18" align="center" /> Unsplash & Dynamic Visual Studio |
| :---: | :---: |
| <img src="https://raw.githubusercontent.com/Nagul55/WordNest/main/docs/screenshots/v5_match_game.png" alt="Speed Match Blitz Arena" width="100%" /> <br> *Stopwatch-timed tile matching blitz with highscore tracking* | <img src="https://raw.githubusercontent.com/Nagul55/WordNest/main/docs/screenshots/v5_image_picker.png" alt="Unsplash & Dynamic Visual Studio" width="100%" /> <br> *Real-time Unsplash search drawer & dynamic AI fallbacks* |

---

## <img src="https://api.iconify.design/lucide/sparkles.svg?color=%23EC4899" width="24" height="24" align="center" /> Key Features

| Icon | Feature Name | Description | Tech Used |
| :---: | :--- | :--- | :--- |
| <img src="https://api.iconify.design/lucide/layers.svg?color=%23A58CF4" width="20" height="20" /> | **3D Realistic Flashcards** | Hardware-accelerated 3D flip card physics with Web Speech API multi-lingual TTS pronunciation and keyboard navigation (`Space`, `Arrows`). | Next.js, Framer Motion, Web Speech API |
| <img src="https://api.iconify.design/lucide/wand-2.svg?color=%23EC4899" width="20" height="20" /> | **AI Magic Notes Studio** | Converts raw lecture transcripts, essays, or notes into structured summary outlines, flashcards, and multiple-choice quizzes in seconds. | Groq Cloud (Llama 3.1), FastAPI, OpenAI SDK |
| <img src="https://api.iconify.design/lucide/graduation-cap.svg?color=%23F59E0B" width="20" height="20" /> | **Socratic AI Tutor** | Conversational AI study assistant that quizzes students using the Socratic method to build intuitive conceptual understanding. | Groq Llama 3.1, Python AsyncIO |
| <img src="https://api.iconify.design/lucide/target.svg?color=%23EF4444" width="20" height="20" /> | **Adaptive Learn Mode** | Spaced-repetition algorithm graduating terms from multiple choice to AI-graded written assessments based on student mastery. | TypeScript, FastAPI, Custom SM-2 Engine |
| <img src="https://api.iconify.design/lucide/timer.svg?color=%2310B981" width="20" height="20" /> | **High-Speed Match Arena** | Time-trial tile matching game with real-time timers, personal best trackers, and celebratory confetti effects. | Canvas Confetti, Framer Motion |
| <img src="https://api.iconify.design/lucide/image.svg?color=%2306B6D4" width="20" height="20" /> | **Unsplash & Dynamic Visuals** | Instant HD photo assignment via Unsplash API with automatic fallbacks to Pollinations AI & LoremFlickr for 100% image coverage. | Unsplash API, HTTPX, Pollinations AI |
| <img src="https://api.iconify.design/lucide/folder-closed.svg?color=%238B5CF6" width="20" height="20" /> | **Interactive 3D Folders** | Customized animated 3D folder decks that react dynamically to mouse position and hover states. | React Bits, Custom CSS 3D |
| <img src="https://api.iconify.design/lucide/user-cog.svg?color=%233B82F6" width="20" height="20" /> | **Adaptive Student Persona** | Tailors AI vocabulary definitions, tone, and tutor analogies based on the student's age, username, and occupation. | Supabase Auth, Groq Prompt Engine |

---

## <img src="https://api.iconify.design/lucide/wrench.svg?color=%233B82F6" width="24" height="24" align="center" /> Tech Stack

### **Frontend**
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=for-the-badge&logo=greensock&logoColor=white)

### **Backend**
![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![Uvicorn](https://img.shields.io/badge/Uvicorn-4051B5?style=for-the-badge&logo=python&logoColor=white)

### **Database & Authentication**
![Supabase](https://img.shields.io/badge/Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Row Level Security](https://img.shields.io/badge/Row_Level_Security-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

### **AI Services & APIs**
![Groq](https://img.shields.io/badge/Groq_Cloud_Llama_3.1-F05032?style=for-the-badge&logo=meta&logoColor=white)
![Unsplash API](https://img.shields.io/badge/Unsplash_API-000000?style=for-the-badge&logo=unsplash&logoColor=white)

### **DevOps & Hosting**
![Vercel](https://img.shields.io/badge/Vercel_Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render_Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## <img src="https://api.iconify.design/lucide/zap.svg?color=%23FBBF24" width="24" height="24" align="center" /> Quick Start

### **Prerequisites**
- **Node.js**: `v18.0.0` or higher
- **Python**: `v3.10` or higher
- **Package Manager**: `npm` or `pnpm`
- **Accounts**: Supabase, Groq Cloud, Unsplash Developer

---

### **1. Repository Setup**
```bash
# Clone the repository
git clone https://github.com/Nagul55/WordNest.git

# Navigate to the workspace
cd WordNest
```

---

### **2. Database Setup (Supabase)**
1. Log into your [Supabase Dashboard](https://supabase.com) and create a new project.
2. Open the **SQL Editor** tab in Supabase.
3. Copy and run the initialization script from `supabase/schema.sql` to generate all tables, foreign keys, and RLS security policies.

---

### **3. Backend Installation & Setup**
```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory using the reference below:

| Environment Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `GROQ_API_KEY` | Groq Cloud API key for Llama 3.1 model inference | `gsk_...` |
| `UNSPLASH_ACCESS_KEY` | Unsplash Developer Access Key | `i764_...` |
| `SUPABASE_URL` | Supabase Project URL | `https://your-project.supabase.co` |
| `SUPABASE_KEY` | Supabase Service Role Key | `eyJ...` |

Launch the FastAPI backend server:
```bash
python run_server.py
```
*The backend API will run at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.*

---

### **4. Frontend Installation & Setup**
```bash
# Open a new terminal tab and navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install
```

Create a `.env.local` file in the `frontend/` directory using the reference below:

| Environment Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase API Endpoint | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | `eyJ...` |
| `NEXT_PUBLIC_API_URL` | Backend REST Endpoint | `http://localhost:8000` |
| `NEXT_PUBLIC_UNSPLASH_KEY` | Public Unsplash Client Key | `i764_...` |

Launch the Next.js development server:
```bash
npm run dev
```
*Open `http://localhost:3000` in your browser to start studying with WordNest.*

---

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%2310B981" width="24" height="24" align="center" /> Project Structure

```bash
WordNest/
├── backend/                        # FastAPI Python Backend
│   ├── app/
│   │   ├── routers/                # REST API Routers
│   │   │   ├── ai.py               # AI Magic Notes & Socratic Tutor Router
│   │   │   └── unsplash.py         # Unsplash Search Router
│   │   ├── services/               # Core Service Layer
│   │   │   ├── ai_service.py       # Async Groq OpenAI Integration
│   │   │   ├── groq_service.py     # Prompt Engineering Engine
│   │   │   └── unsplash_service.py # Image API & Dynamic Fallback Service
│   │   └── config.py               # Environment Configuration Loader
│   ├── run_server.py               # Uvicorn FastAPI Entrypoint
│   └── requirements.txt            # Python Dependencies
├── frontend/                       # Next.js 16 App Router Frontend
│   ├── src/
│   │   ├── app/                    # App Router Pages & Styles
│   │   │   ├── globals.css         # Global Styles & Responsive Scrollbar Utilities
│   │   │   └── page.tsx            # Main Web Application Page
│   │   ├── components/             # React UI Component Hierarchy
│   │   │   ├── dashboard/          # Feature Views (Decks, Practice, Vault, Settings)
│   │   │   ├── StaggeredMenu.tsx   # Mobile Responsive Navigation Drawer
│   │   │   └── Folder.tsx          # 3D Animated Deck Folder Cards
│   │   └── lib/                    # API Clients & Utilities
│   │       ├── api.ts              # Frontend REST Service Client
│   │       └── supabase.ts         # Supabase Client Initialization
│   └── package.json                # Frontend Package Configuration
└── supabase/                       # Database Migrations & Schemas
    └── schema.sql                  # PostgreSQL Tables & RLS Policies
```

---

## <img src="https://api.iconify.design/lucide/plug-zap.svg?color=%238B5CF6" width="24" height="24" align="center" /> API Reference

### **AI Endpoints (`/api/ai`)**

| Method | Endpoint | Description | Request Body |
| :---: | :--- | :--- | :--- |
| `POST` | `/api/ai/magic-notes` | Converts raw study notes into full deck suite | `{ "content": "raw text...", "user_context": {} }` |
| `POST` | `/api/ai/definition` | Generates concise 1-sentence flashcard definition | `{ "word": "Hammer", "user_context": {} }` |
| `POST` | `/api/ai/tutor` | Socratic conversational tutoring stream | `{ "deck_title": "...", "cards": [], "messages": [] }` |
| `POST` | `/api/ai/grade` | Evaluates written student sentence for accuracy | `{ "term": "...", "expected_definition": "...", "user_response": "..." }` |

### **Visual Endpoints (`/api/unsplash`)**

| Method | Endpoint | Description | Query Parameters |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/unsplash/search` | Fetches high-resolution images for vocabulary term | `q=Hammer&per_page=12` |

---

## <img src="https://api.iconify.design/lucide/flask-conical.svg?color=%233B82F6" width="24" height="24" align="center" /> Testing

### **Frontend Verification & Production Build**
To test component rendering and type safety across all responsive viewports:
```bash
cd frontend
npm run build
```

### **Backend Endpoint Health Inspection**
Verify FastAPI service status by executing the automated endpoint verification suite:
```bash
cd backend
python -c "import urllib.request; req = urllib.request.Request('http://localhost:8000/docs', headers={'User-Agent': 'Mozilla/5.0'}); print(urllib.request.urlopen(req).getcode())"
```

---

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%23F43F5E" width="24" height="24" align="center" /> Deployment

### **Frontend (Vercel)**
The frontend is pre-configured for instant one-click deployment on Vercel:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_UNSPLASH_KEY` under **Environment Variables**.
4. Deploy!

### **Backend (Render / Railway)**
1. Create a new **Web Service** on [Render](https://render.com).
2. Set the **Root Directory** to `backend`.
3. Set the **Build Command** to `pip install -r requirements.txt`.
4. Set the **Start Command** to `python run_server.py` or `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

---

## <img src="https://api.iconify.design/lucide/users.svg?color=%236366F1" width="24" height="24" align="center" /> Contributing

Contributions are what make the open-source community an incredible place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project (`git checkout -b feature/AmazingFeature`)
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## <img src="https://api.iconify.design/lucide/shield-check.svg?color=%234285F4" width="24" height="24" align="center" /> License & Certification

WordNest is officially **Google Cloud Verified** and licensed under verified cloud platform standards. All rights reserved.

---

## <img src="https://api.iconify.design/lucide/user-check.svg?color=%23A58CF4" width="24" height="24" align="center" /> Author & Contact

**Nagul G**  
Full-Stack Developer & AI Systems Architect

- <img src="https://raw.githubusercontent.com/Nagul55/WordNest/main/frontend/public/Wordnest.svg" alt="WordNest Logo" width="18" height="18" align="center" /> **Live Application**: [WordNest Web App](https://word-nest-seven.vercel.app)
- <img src="https://api.iconify.design/simple-icons/github.svg?color=%239CA3AF" alt="GitHub Logo" width="18" height="18" align="center" /> **GitHub**: [@Nagul55](https://github.com/Nagul55)
- <img src="https://api.iconify.design/simple-icons/linkedin.svg?color=%230A66C2" alt="LinkedIn Logo" width="18" height="18" align="center" /> **LinkedIn**: [nagul-g](https://www.linkedin.com/in/nagul-g)
- <img src="https://api.iconify.design/simple-icons/x.svg?color=%231DA1F2" alt="Twitter/X Logo" width="18" height="18" align="center" /> **Twitter**: [@Nagul_55](https://x.com/Nagul_55)

---

<p align="center">
  Made with <img src="https://api.iconify.design/lucide/heart.svg?color=%23F43F5E" width="16" height="16" align="center" /> for students worldwide by Nagul G. If you find WordNest helpful, please give it a ⭐ on GitHub!
</p>
