from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.deepseek_service import generate_magic_notes, grade_written_answer, chat_socratic_tutor

router = APIRouter(prefix="/api/ai", tags=["AI"])

class MagicNotesRequest(BaseModel):
    content: str
    mode: Optional[str] = "full_suite"

class GradeAnswerRequest(BaseModel):
    term: str
    expected_definition: str
    user_response: str

class TutorChatRequest(BaseModel):
    deck_title: str
    cards: List[Dict[str, str]]
    messages: List[Dict[str, str]]

@router.post("/magic-notes")
async def generate_study_notes(payload: MagicNotesRequest):
    if not payload.content or len(payload.content.strip()) < 10:
        raise HTTPException(status_code=400, detail="Please provide more study material to generate a study set.")
    
    result = await generate_magic_notes(payload.content)
    return {"status": "success", "data": result}

@router.post("/grade")
async def grade_answer(payload: GradeAnswerRequest):
    result = await grade_written_answer(
        term=payload.term,
        expected_definition=payload.expected_definition,
        user_response=payload.user_response
    )
    return {"status": "success", "data": result}

@router.post("/tutor")
async def tutor_chat(payload: TutorChatRequest):
    response = await chat_socratic_tutor(
        deck_title=payload.deck_title,
        cards=payload.cards,
        conversation_history=payload.messages
    )
    return {"status": "success", "response": response}

class WordDefinitionRequest(BaseModel):
    word: str

@router.post("/definition")
async def get_word_definition(payload: WordDefinitionRequest):
    if not payload.word or len(payload.word.strip()) == 0:
        raise HTTPException(status_code=400, detail="Please provide a vocabulary term.")
    
    from app.services.deepseek_service import generate_word_definition
    try:
        definition = await generate_word_definition(payload.word)
        return {"status": "success", "definition": definition}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
