import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { term, expected_definition, user_response, user_context } = await req.json();

    if (!term || !expected_definition || !user_response) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      console.error("No GROQ_API_KEY found in Next.js environment!");
      return NextResponse.json({ error: "AI service is not configured on this environment." }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    // Build persona
    const student_name = user_context?.username || "Scholar";
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
    if (student_name.toLowerCase().includes("nagul")) {
      pronoun_guidance = "\n3. Note: The student 'Nagul' is male. Always use male pronouns (he/him/his) when referring to him.";
    }

    const persona_prompt = `=== STUDENT PROFILE ===\nName: ${student_name}\nAge: ${age || 'Not specified'}\nRole: ${occupation}\nINSTRUCTIONS:\n1. Adapt feedback to a ${age || 'student'}-year-old '${occupation}'.\n2. ${tone_instruction}${pronoun_guidance}`;

    const system_prompt = `You are WordNest's encouraging academic sentence evaluator.
${persona_prompt}
Analyze the student's written sentence for the target vocabulary term: '${term}'.
Expected definition context: '${expected_definition}'

SCORING RULES (Score out of 100):
- 90-100: The sentence uses '${term}' correctly with clean, natural grammar and syntax.
- 70-89: The sentence uses '${term}' correctly but has minor typos, punctuation flaws, or slight awkwardness.
- 40-69: The sentence attempts '${term}' but has noticeable syntax errors, run-on phrases, or repetitive words.
- 0-39: The sentence omits '${term}' or is completely nonsensical.

FEEDBACK FORMATTING INSTRUCTIONS:
1. "feedback": Highlight specific grammatical or syntax issues in 1-2 direct sentences. If score < 90, begin with: "Not quite ${student_name}." or "You tried well ${student_name}!" followed by explicitly stating what phrase or repeated word is incorrect (e.g. "The sentence has a repeated 'over' and the phrase 'that are in the shoulder' is incorrect.").
2. "natural_correction": Provide the primary, natural corrected version of the user's sentence. CRITICAL: If the score is less than 90, you MUST apply grammatical and syntactic corrections to their sentence. Do NOT return the exact same sentence they typed if it contains mistakes or awkward phrasing (e.g., if they write "I travelled on Tuk Tuk to reach the house.", you must correct it to "I travelled on a Tuk Tuk to reach the house.").
3. "alternative_correction": Provide an alternative natural variation if applicable (e.g. "The children jumped over the puddle that was on the shoulder of the road.").
4. "alternative_label": Provide the label for the alternative (e.g. "Or, if you mean one puddle:").

Respond STRICTLY with valid JSON matching this schema:
{
  "is_correct": true or false,
  "score": integer between 0 and 100,
  "feedback": "Direct explanation of what phrase or repeated word is incorrect addressing ${student_name}",
  "natural_correction": "Primary natural correction sentence",
  "alternative_correction": "Alternative natural correction sentence or null",
  "alternative_label": "Label for alternative or null"
}
Return ONLY valid JSON without markdown wrapping.`;

    const modelsToTry = ["groq/compound", "groq/compound-mini"];
    let lastError: any = null;
    let chatCompletion: any = null;

    for (const modelName of modelsToTry) {
      try {
        chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: `Target Term: ${term}\nStudent's Sentence: ${user_response}` }
          ],
          model: modelName,
          temperature: 0.3,
          max_tokens: 500
        });
        if (chatCompletion) break;
      } catch (err) {
        console.warn(`[Grade Route Warning for model ${modelName}]:`, err);
        lastError = err;
      }
    }

    if (!chatCompletion) {
      throw lastError || new Error("Failed to call Groq API with any models");
    }

    let raw_response = chatCompletion.choices?.[0]?.message?.content || "";
    let clean_json = raw_response.trim();
    clean_json = clean_json.replace("```json", "").replace("```", "").trim();

    try {
      const data = JSON.parse(clean_json);
      if (!data.natural_correction) {
        data.natural_correction = user_response.trim();
      }
      return NextResponse.json({ status: "success", data });
    } catch (e) {
      console.error("JSON parse failure in grading:", clean_json);
      const has_word = user_response.toLowerCase().includes(term.toLowerCase());
      return NextResponse.json({
        status: "success",
        data: {
          is_correct: has_word,
          score: has_word ? 85 : 40,
          feedback: `You tried well ${student_name}! But there are some small changes needed.`,
          natural_correction: user_response.trim(),
          alternative_correction: null,
          alternative_label: null
        }
      });
    }
  } catch (error: any) {
    console.error("Next.js AI Grade Route Error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
