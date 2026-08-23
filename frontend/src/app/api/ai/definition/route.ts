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

    const system_prompt = `You are an expert vocabulary assistant for a flashcard app. Your only job is to generate a simple, clear, one-sentence definition for the vocabulary term the user provides. 

CRITICAL RULES:
1. YOU MUST ACTUALLY DEFINE THE TERM. NEVER give a generic fallback like "[Term] is a concept or term used to describe...". That is strictly forbidden.
2. If the user provides a compound word or phrase (e.g. "hard helmet", "departure platform"), define the actual object or concept directly (e.g. "A tough protective hat worn by construction workers" or "The designated area at a station where passengers wait to board a train").
3. Keep it to exactly ONE sentence. No examples, no extra commentary.
4. Use simple, everyday language suitable for a 12-year-old.
5. NEVER include the word itself in the definition, and NEVER use phrases like "A term referring to" or "A concept used to describe". Just state what the thing is.
6. No quotation marks, no markdown, no prefixes like "Hint:" — return ONLY the plain text sentence.

${persona_prompt}

EXAMPLES:

Word: Hard helmet
Output: A tough, protective hat worn to prevent head injuries in dangerous areas like construction sites.

Word: Departure platform
Output: A designated area at a train or bus station where passengers wait to board their ride.

Word: Ocean
Output: A very large body of salt water that covers much of the Earth.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: `Generate the definition for: ${cleanWord}` }
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
