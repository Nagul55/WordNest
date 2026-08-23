import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { word, user_context } = await req.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: "Please provide a valid vocabulary term." }, { status: 400 });
    }

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

    let pronoun_guidance = "";
    if (username.toLowerCase().includes("nagul")) {
      pronoun_guidance = "\n3. Note: The student 'Nagul' is male. Always use male pronouns (he/him/his) when referring to him.";
    }

    const persona_prompt = `=== STUDENT PROFILE ===\nName: ${username}\nAge: ${age || 'Not specified'}\nRole: ${occupation}\nINSTRUCTIONS:\n1. Adapt explanations to a ${age || 'student'}-year-old '${occupation}'.\n2. ${tone_instruction}${pronoun_guidance}`;

    const system_prompt = `You are an expert teacher.
${persona_prompt}
Provide a single, engaging, and clear contextual sentence using the given vocabulary word.
Tailor the sentence context so it relates to someone of their age and occupation.
Output ONLY the raw sentence. Do not write anything else. Do not use quotes.`;

    const modelsToTry = ["groq/compound", "groq/compound-mini"];
    let lastError: any = null;
    let chatCompletion: any = null;

    for (const modelName of modelsToTry) {
      try {
        chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: `Generate a contextual usage sentence for the word: ${word}` }
          ],
          model: modelName,
          temperature: 0.3,
          max_tokens: 100
        });
        if (chatCompletion) break;
      } catch (err) {
        console.warn(`[Example Route Warning for model ${modelName}]:`, err);
        lastError = err;
      }
    }

    if (!chatCompletion) {
      throw lastError || new Error("Failed to call Groq API with any models");
    }

    let example = chatCompletion.choices?.[0]?.message?.content || "";
    example = example.trim().replace(/^['"]|['"]$/g, '').trim();

    return NextResponse.json({ status: "success", example });
  } catch (error: any) {
    console.error("Next.js AI Example Route Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
