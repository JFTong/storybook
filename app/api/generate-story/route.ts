import { NextRequest, NextResponse } from "next/server";

const STORY_PROMPT_TEMPLATE = `You are a creative children's book author. Write a heartwarming story for children aged 3-6 years old.

Theme: {theme}

Characters:
{characters}

Guidelines:
- Use simple, engaging language suitable for young children
- Follow a classic story structure: introduction → problem → resolution
- Include emotional moments but end positively
- Keep the story concise, around 200-300 words
- Create natural page breaks for illustration opportunities

Write the story now:`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, theme, characters, agentConfig } = body;

    if (!apiKey || !theme) {
      return NextResponse.json(
        { error: "API key and theme are required" },
        { status: 400 }
      );
    }

    const characterDescriptions = characters
      ?.map((c: { name: string; description: string }) => `- ${c.name}: ${c.description}`)
      .join("\n") || "No specific characters defined.";

    const styleModifier = agentConfig?.type === "creative"
      ? "Be imaginative and playful."
      : agentConfig?.type === "detailed"
      ? "Include rich sensory details."
      : agentConfig?.type === "minimal"
      ? "Keep it simple and concise."
      : agentConfig?.customPrompt || "";

    const prompt = STORY_PROMPT_TEMPLATE
      .replace("{theme}", theme)
      .replace("{characters}", characterDescriptions) + `\n\n${styleModifier}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "Failed to generate story" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const story = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ story });
  } catch (error) {
    console.error("Story generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}