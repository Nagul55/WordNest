from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS
from app.routers import ai, unsplash

app = FastAPI(
    title="WordNest Backend API",
    description="Next-Generation AI Study Suite & Quizlet Replica Backend Powered by Groq Cloud and FastAPI",
    version="1.0.0"
)

# Set up CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(ai.router)
app.include_router(unsplash.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "WordNest Backend API",
        "ai_engine": "Groq Cloud Llama 3.1",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {"message": "Welcome to WordNest API. Visit /docs for OpenAPI documentation."}
