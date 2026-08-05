import json
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.config import GROQ_API_KEY, GROQ_MODEL_NAME

# Initialize AsyncOpenAI SDK pointing to Groq Cloud endpoint
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_API_KEY
)

async def _call_deepseek(messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 4096) -> str:
    """Helper to communicate with Groq Cloud API asynchronously."""
    try:
        completion = await client.chat.completions.create(
            model=GROQ_MODEL_NAME,
            messages=messages,
            temperature=temperature,
            top_p=0.95,
            max_tokens=max_tokens,
            stream=False
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"[Groq Service Error]: {str(e)}")
        raise e

async def generate_magic_notes(raw_content: str) -> Dict[str, Any]:
    """
    Analyzes notes, textbook snippets, or articles and transforms them into a full study suite:
    Title, description, summary outline, flashcards deck, and multiple-choice practice test.
    """
    system_prompt = """You are an expert curriculum architect and AI tutor for WordNest (a state-of-the-art Quizlet replica). 
Your goal is to transform whatever study material or notes the user provides into a structured learning deck.
You MUST respond strictly with valid JSON matching this exact schema:
{
  "title": "A crisp, engaging title for the study set",
  "category": "Science / Technology / Languages / History / Business / General",
  "description": "2-sentence overview of what this deck covers",
  "study_notes": "A well-structured markdown summary of the key concepts with bullet points and bold headers",
  "flashcards": [
    {"term": "Key term or vocabulary word", "definition": "Clear, concise definition or explanation"}
  ],
  "practice_quiz": [
    {
      "question": "Clear multiple choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}
Generate between 5 to 15 high-quality flashcards and at least 4 practice quiz questions based on the depth of text. Do NOT wrap in markdown code blocks or add introductory text, just return the raw JSON object."""

    user_prompt = f"Please convert the following content into a complete WordNest study deck:\n\n{raw_content}"
    
    raw_response = await _call_deepseek(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.5,
        max_tokens=4096
    )

    # Clean potential markdown block wrappers if model adds them
    clean_json = raw_response.strip()
    if clean_json.startswith("```json"):
        clean_json = clean_json[7:]
    if clean_json.startswith("```"):
        clean_json = clean_json[3:]
    if clean_json.endswith("```"):
        clean_json = clean_json[:-3]
    
    try:
        return json.loads(clean_json.strip())
    except Exception as e:
        print(f"[JSON Parse Error]: {str(e)} -> Content: {clean_json[:200]}")
        # Fallback basic structure if JSON fails
        return {
            "title": "AI Generated Study Set",
            "category": "General",
            "description": "Automatically summarized notes.",
            "study_notes": raw_response,
            "flashcards": [{"term": "Summary", "definition": "Review the notes section for details."}],
            "practice_quiz": []
        }

async def grade_written_answer(term: str, expected_definition: str, user_response: str) -> Dict[str, Any]:
    """
    Semantic AI grading: Evaluates if a student's written response conceptually matches the answer,
    rather than strict rigid character matching.
    """
    system_prompt = """You are a benevolent yet accurate academic professor grading student flashcard responses.
Analyze the student's answer against the expected definition for the given term.
Determine if the student understands the core concept. Minor spelling or phrasing differences should be accepted.
Respond STRICTLY with valid JSON matching this schema:
{
  "is_correct": true or false,
  "score": 0 to 100 (integer percentage of correctness),
  "feedback": "Encouraging 1-sentence feedback explaining why it is correct, almost correct, or what was missed."
}
Return ONLY valid JSON without markdown wrapping."""

    user_prompt = f"Term: {term}\nExpected Definition: {expected_definition}\nStudent's Answer: {user_response}"

    raw_response = await _call_deepseek(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=500
    )

    clean_json = raw_response.strip().replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(clean_json)
    except Exception:
        # Fallback string comparison
        is_close = user_response.lower() in expected_definition.lower() or expected_definition.lower() in user_response.lower()
        return {
            "is_correct": is_close,
            "score": 100 if is_close else 0,
            "feedback": "Graded via heuristic fallback."
        }

async def chat_socratic_tutor(deck_title: str, cards: List[Dict[str, str]], conversation_history: List[Dict[str, str]]) -> str:
    """
    An interactive conversational AI tutor powered by Groq Llama that quizzes the student 
    using the Socratic method based on their specific flashcard deck.
    """
    cards_context = "\n".join([f"- {c.get('term', '')}: {c.get('definition', '')}" for c in cards[:25]])
    
    system_prompt = f"""You are WordNest's friendly, brilliantly witty Socratic AI Tutor powered by Groq Llama.
You are currently helping a student study the deck titled: '{deck_title}'.
Here are the cards in this study set:
{cards_context}

YOUR TUTORING RULES:
1. Do NOT just dump definitions. Use the Socratic method: ask engaging, intuitive thought-provoking questions one at a time to test their understanding.
2. When they answer, affirm what they got right, gently correct any misunderstanding, and present the next challenge or real-world example.
3. Keep responses conversational, enthusiastic, and concise (under 3 paragraphs). Use markdown formatting and emojis appropriately to make studying fun!"""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)

    return await _call_deepseek(messages=messages, temperature=0.7, max_tokens=1024)

async def generate_word_definition(word: str) -> str:
    """Generates a simple, clear dictionary definition using Groq Llama model."""
    system_prompt = (
        "You are a friendly lexicographer. Provide a simple, clear, child-friendly dictionary definition "
        "for the given word. Keep the response under 15 words and simple to understand.\n"
        "Example:\n"
        "- 'udder' -> 'the part of a female cow, etc. that hangs under its body and produces milk.'\n"
        "- 'machete' -> 'a broad heavy knife used as a cutting tool and as a weapon.'\n"
        "Output ONLY the raw definition. Do not write the word. Do not use quotes or intro phrases."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Word: {word}"}
    ]
    try:
        response = await _call_deepseek(messages=messages, temperature=0.1, max_tokens=35)
        # Clean any quotes or leading dashes
        clean_resp = response.strip().strip('"').strip("'").strip("-").strip()
        return clean_resp
    except Exception as e:
        print(f"[Generate Word Definition Error]: {str(e)}")
        raise e
