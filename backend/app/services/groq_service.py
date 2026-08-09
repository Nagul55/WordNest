import json
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.config import GROQ_API_KEY, GROQ_MODEL_NAME

# Initialize AsyncOpenAI SDK pointing to Groq Cloud endpoint
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_API_KEY
)

def build_user_persona_prompt(user_context: Optional[Dict[str, Any]] = None) -> str:
    """
    Builds adaptive AI instructions based on the student's username, age, and occupation.
    Guarantees personalized tone, age-appropriate language, and role-relevant domain depth.
    """
    if not user_context:
        return ""
    
    username = user_context.get("username") or "Student"
    age = str(user_context.get("age") or "").strip()
    occupation = user_context.get("occupation") or "Learner"
    
    age_num = None
    try:
        if age and age.isdigit():
            age_num = int(age)
    except Exception:
        pass
    
    tone_instruction = "Use clear, engaging, structured educational guidance."
    if age_num is not None:
        if age_num <= 13:
            tone_instruction = "Use highly intuitive, fun, encouraging language with simple metaphors suitable for a young student."
        elif age_num <= 18:
            tone_instruction = "Use energetic, clear explanations with practical examples suitable for high school / college students."
        elif age_num <= 25:
            tone_instruction = "Use crisp, academic and career-focused depth suitable for university students and young professionals."
        else:
            tone_instruction = "Use professional, efficient, domain-relevant terminology tailored for adult professionals and domain experts."
    
    return f"""
=== STUDENT PROFILE & ADAPTIVE LEARNING PERSONA ===
- Student Name / Username: {username}
- Age: {age if age else 'Not specified'}
- Current Occupation / Role: {occupation}

INSTRUCTIONS FOR AI RESPONSE ADAPTATION:
1. Always address the student naturally as '{username}'.
2. Adapt all explanations, vocabulary level, question difficulty, and analogies specifically to a {age if age else 'student'}-year-old working/studying as a '{occupation}'.
3. {tone_instruction}
===================================================
"""

async def _call_groq(messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 4096) -> str:
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

async def generate_magic_notes(raw_content: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Analyzes notes, textbook snippets, or articles and transforms them into a full study suite:
    Title, description, summary outline, flashcards deck, and multiple-choice practice test.
    Optimized for student's age, username, and occupation.
    """
    persona_prompt = build_user_persona_prompt(user_context)

    system_prompt = f"""You are an expert curriculum architect and AI tutor for WordNest (a state-of-the-art Quizlet replica).
{persona_prompt}
Your goal is to transform whatever study material or notes the user provides into a structured learning deck tailored to their background.
You MUST respond strictly with valid JSON matching this exact schema:
{{
  "title": "A crisp, engaging title for the study set",
  "category": "Science / Technology / Languages / History / Business / General",
  "description": "2-sentence overview of what this deck covers",
  "study_notes": "A well-structured markdown summary of the key concepts with bullet points and bold headers",
  "flashcards": [
    {{"term": "Key term or vocabulary word", "definition": "Clear, concise definition or explanation"}}
  ],
  "practice_quiz": [
    {{
      "question": "Clear multiple choice question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_index": 0,
      "explanation": "Why this answer is correct"
    }}
  ]
}}
Generate between 5 to 15 high-quality flashcards and at least 4 practice quiz questions based on the depth of text. Do NOT wrap in markdown code blocks or add introductory text, just return the raw JSON object."""

    user_prompt = f"Please convert the following content into a complete WordNest study deck:\n\n{raw_content}"
    
    raw_response = await _call_groq(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.5,
        max_tokens=4096
    )

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
        return {
            "title": "AI Generated Study Set",
            "category": "General",
            "description": "Automatically summarized notes.",
            "study_notes": raw_response,
            "flashcards": [{"term": "Summary", "definition": "Review the notes section for details."}],
            "practice_quiz": []
        }

async def grade_written_answer(term: str, expected_definition: str, user_response: str, user_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Semantic AI grading: Evaluates if a student's written response conceptually matches the answer,
    providing personalized feedback addressing the student by username.
    """
    persona_prompt = build_user_persona_prompt(user_context)
    student_name = (user_context and user_context.get("username")) or "Scholar"

    system_prompt = f"""You are WordNest's encouraging academic sentence evaluator.
{persona_prompt}
Analyze the student's written sentence for the target vocabulary term: '{term}'.
Expected definition context: '{expected_definition}'

SCORING RULES (Score out of 100):
- 90-100: The sentence uses '{term}' correctly with clean, natural grammar and syntax.
- 70-89: The sentence uses '{term}' correctly but has minor typos, punctuation flaws, or slight awkwardness.
- 40-69: The sentence attempts '{term}' but has noticeable syntax errors, run-on phrases, or repetitive words.
- 0-39: The sentence omits '{term}' or is completely nonsensical.

FEEDBACK FORMATTING INSTRUCTIONS:
1. "feedback": Highlight specific grammatical or syntax issues in 1-2 direct sentences. If score < 90, begin with: "Not quite {student_name}." or "You tried well {student_name}!" followed by explicitly stating what phrase or repeated word is incorrect (e.g. "The sentence has a repeated 'over' and the phrase 'that are in the shoulder' is incorrect.").
2. "natural_correction": Provide the primary, natural corrected version of the user's sentence (e.g. "The children jumped over the puddles that were on the shoulder of the road.").
3. "alternative_correction": Provide an alternative natural variation if applicable (e.g. "The children jumped over the puddle that was on the shoulder of the road.").
4. "alternative_label": Provide the label for the alternative (e.g. "Or, if you mean one puddle:").

Respond STRICTLY with valid JSON matching this schema:
{{
  "is_correct": true or false,
  "score": integer between 0 and 100,
  "feedback": "Direct explanation of what phrase or repeated word is incorrect addressing {student_name}",
  "natural_correction": "Primary natural correction sentence",
  "alternative_correction": "Alternative natural correction sentence or null",
  "alternative_label": "Label for alternative or null"
}}
Return ONLY valid JSON without markdown wrapping."""

    user_prompt = f"Target Term: {term}\nStudent's Sentence: {user_response}"

    raw_response = await _call_groq(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=500
    )

    clean_json = raw_response.strip().replace("```json", "").replace("```", "").strip()
    try:
        data = json.loads(clean_json)
        if "natural_correction" not in data or not data["natural_correction"]:
            data["natural_correction"] = user_response.strip()
        # Clean up any dummy fallbacks if term is unrelated
        alt = data.get("alternative_correction")
        if alt and ("puddle" in alt.lower() or "shoulder" in alt.lower()) and "puddle" not in term.lower():
            data["alternative_correction"] = None
            data["alternative_label"] = None
        return data
    except Exception:
        has_word = term.lower() in user_response.lower()
        return {
            "is_correct": has_word,
            "score": 85 if has_word else 40,
            "feedback": f"You tried well {student_name}! Here is the natural phrasing for '{term}'.",
            "natural_correction": user_response.strip(),
            "alternative_correction": None,
            "alternative_label": None
        }

async def chat_socratic_tutor(
    deck_title: str, 
    cards: List[Dict[str, str]], 
    conversation_history: List[Dict[str, str]], 
    user_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    An interactive conversational AI tutor powered by Groq Llama that quizzes the student 
    using the Socratic method, dynamically adapted to their username, age, and occupation.
    """
    persona_prompt = build_user_persona_prompt(user_context)
    cards_context = "\n".join([f"- {c.get('term', '')}: {c.get('definition', '')}" for c in cards[:25]])
    
    system_prompt = f"""You are WordNest's friendly, brilliantly witty Socratic AI Tutor.
{persona_prompt}
You are currently helping the student study the deck titled: '{deck_title}'.
Here are the cards in this study set:
{cards_context}

YOUR TUTORING RULES:
1. Address the student naturally by their username.
2. Do NOT just dump definitions. Use the Socratic method: ask engaging, intuitive thought-provoking questions one at a time to test their understanding.
3. Adapt analogies and question complexity to their age and occupation.
4. When they answer, affirm what they got right, gently correct any misunderstanding, and present the next challenge or real-world example.
5. Keep responses conversational, enthusiastic, and concise (under 3 paragraphs). Use markdown formatting and emojis appropriately to make studying fun!"""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)

    return await _call_groq(messages=messages, temperature=0.7, max_tokens=1024)

async def generate_word_definition(word: str, user_context: Optional[Dict[str, Any]] = None) -> str:
    """Generates a super concise, simple, 1-sentence flashcard definition adapted to student's background."""
    persona_prompt = build_user_persona_prompt(user_context)
    system_prompt = (
        f"You are a friendly vocabulary tutor.\n{persona_prompt}\n"
        "Provide an extremely simple, short, 1-sentence definition suitable for a study flashcard.\n"
        "RULES:\n"
        "1. Keep it brief and clear (10 to 15 words maximum).\n"
        "2. Use plain, easy-to-understand everyday English.\n"
        "3. Do NOT write complex or verbose dictionary definitions.\n"
        "4. Output ONLY the raw definition. Do not write the word. Do not use quotes or intro phrases."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Word: {word}"}
    ]
    try:
        response = await _call_groq(messages=messages, temperature=0.1, max_tokens=45)
        clean_resp = response.strip().strip('"').strip("'").strip("-").strip()
        return clean_resp
    except Exception as e:
        print(f"[Generate Word Definition Error]: {str(e)}")
        raise e

async def generate_word_example(word: str, user_context: Optional[Dict[str, Any]] = None) -> str:
    """Generates a contextual usage sentence adapted to student's background."""
    persona_prompt = build_user_persona_prompt(user_context)
    system_prompt = (
        f"You are an expert teacher.\n{persona_prompt}\n"
        "Provide a single, engaging, and clear contextual sentence using the given vocabulary word. "
        "Tailor the sentence context so it relates to someone of their age and occupation.\n"
        "Output ONLY the raw sentence. Do not write anything else. Do not use quotes."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Word: {word}"}
    ]
    try:
        response = await _call_groq(messages=messages, temperature=0.3, max_tokens=60)
        clean_resp = response.strip().strip('"').strip("'").strip()
        return clean_resp
    except Exception as e:
        print(f"[Generate Word Example Error]: {str(e)}")
        raise e
