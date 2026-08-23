import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { word, user_context } = await req.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: "Please provide a valid vocabulary term." }, { status: 400 });
    }

    const cleanWord = word.trim();
    // Use the backend GROQ_API_KEY from env (the user will need to add this to Vercel/Next.js)
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      console.error("No GROQ_API_KEY found in Next.js environment!");
      return NextResponse.json({ error: "AI service is not configured on this environment." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Build persona
    const username = user_context?.username || "Student";
    const age = user_context?.age || "";
    const occupation = user_context?.occupation || "Learner";

    let tone_instruction = "Use clear, engaging, structured educational guidance.";
    const ageNum = parseInt(age);
    if (!isNaN(ageNum)) {
      if (ageNum <= 13) tone_instruction = "Use highly intuitive, fun, encouraging language with simple metaphors suitable for a young student.";
      else if (ageNum <= 18) tone_instruction = "Use energetic, clear explanations with practical examples suitable for high school / college students.";
      else if (ageNum <= 25) tone_instruction = "Use crisp, academic and career-focused depth suitable for university students and young professionals.";
      else tone_instruction = "Use professional, efficient, domain-relevant terminology tailored for adult professionals and domain experts.";
    }

    const persona_prompt = `=== STUDENT PROFILE ===\nName: ${username}\nAge: ${age || 'Not specified'}\nRole: ${occupation}\nINSTRUCTIONS:\n1. Adapt explanations to a ${age || 'student'}-year-old '${occupation}'.\n2. ${tone_instruction}`;

    const system_prompt = `You are a vocabulary assistant for a flashcard app called WordNest. Your only job is to generate a simple, clear, one-sentence definition (a "hint") for the vocabulary word the user provides.

STRICT RULES:
1. Always respond with a definition — never refuse, never say "I don't know," never leave it blank. If the word is obscure, slang, a name, or unclear, give your best reasonable guess at a simple definition rather than declining.
2. Keep it to ONE sentence only. No multi-sentence explanations, no examples, no etymology, no extra commentary.
3. Use simple, everyday language — write for a 12-year-old reading level. Avoid complex or technical words in the definition itself.
4. Do not restate the word awkwardly (e.g. never write "A vocabulary term referring to X"). Actually define what it means.
5. Do not include the word "definition," "meaning," or the word itself inside the hint text.
6. No quotation marks, no markdown, no bullet points, no prefixes like "Hint:" — return ONLY the plain sentence itself.
7. If the word has multiple meanings, pick the most common everyday meaning.
8. If the word is a name, abbreviation, or not a real dictionary word, describe what it commonly refers to in one simple sentence instead of refusing.

${persona_prompt}

OUTPUT FORMAT:
Return ONLY the definition sentence. No labels, no JSON, no extra text before or after.

EXAMPLES:

Word: Ocean
Output: A very large body of salt water that covers much of the Earth and is home to many marine creatures.

Word: Mountain
Output: A very high natural landform that rises above the surrounding area and is often climbed by hikers.

Word: Puddle
Output: A shallow pool of liquid or water on a surface or path.

Word: Rag
Output: A small piece of old or torn cloth, often used for cleaning.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: `Now generate a definition for this word: ${cleanWord}` }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 75
    });

    let definition = chatCompletion.choices?.[0]?.message?.content || "";
    definition = definition.trim().replace(/^['"]|['"]$/g, '').replace(/^-/, '').trim();

    return NextResponse.json({ definition });
  } catch (error: any) {
    console.error("Next.js AI Route Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
