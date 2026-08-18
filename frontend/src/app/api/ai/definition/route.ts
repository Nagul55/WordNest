import { NextResponse } from 'next/server';

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

    const system_prompt = `You are a friendly vocabulary tutor.\n${persona_prompt}\nProvide an extremely simple, short, 1-sentence definition suitable for a study flashcard.\nRULES:\n1. Keep it brief and clear (10 to 15 words maximum).\n2. Use plain, easy-to-understand everyday English.\n3. Do NOT write complex or verbose dictionary definitions.\n4. Output ONLY the raw definition. Do not write the word. Do not use quotes or intro phrases.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Using a highly reliable, fast model
        messages: [
          { role: "system", content: system_prompt },
          { role: "user", content: `Word: ${cleanWord}` }
        ],
        temperature: 0.2,
        max_tokens: 45
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq Cloud API Error:", errText);
      return NextResponse.json({ error: "Failed to generate definition from AI." }, { status: 500 });
    }

    const data = await response.json();
    let definition = data.choices?.[0]?.message?.content || "";
    definition = definition.trim().replace(/^['"]|['"]$/g, '').replace(/^-/, '').trim();

    return NextResponse.json({ definition });
  } catch (error: any) {
    console.error("Next.js AI Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
