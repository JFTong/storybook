import { NextRequest, NextResponse } from "next/server";

const STORYBOARD_PROMPT_TEMPLATE = `You are a professional storyboard artist for children's picture books. Create a detailed storyboard based on the following story.

Story:
{story}

Characters:
{characters}

Create a storyboard with 8-12 pages. For each page, provide:
1. scene: A short title for the scene
2. description: What happens in this scene (1-2 sentences)
3. visualPrompt: A detailed description for AI image generation, including:
   - Character positions and expressions
   - Setting and background details
   - Lighting and mood
   - Camera angle (close-up/medium/wide)
4. shotType: One of "close-up", "medium", or "wide"
5. mood: The emotional tone (e.g., "warm", "tense", "joyful")

Return a JSON array of storyboard objects. Example format:
[
  {
    "scene": "Opening Scene",
    "description": "Pip and Posy are playing happily in the garden.",
    "visualPrompt": "A gray rabbit and brown mouse playing in a sunny garden, bright colors, cartoon style, medium shot, warm mood",
    "shotType": "medium",
    "mood": "warm"
  }
]

Return ONLY the JSON array, no additional text:`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, storyContent, characters, agentConfig } = body;

    if (!apiKey || !storyContent) {
      return NextResponse.json(
        { error: "API key and story content are required" },
        { status: 400 }
      );
    }

    const characterDescriptions = characters
      ?.map((c: { name: string; description: string; styleDescription?: string }) => {
        let desc = `- ${c.name}: ${c.description}`;
        if (c.styleDescription) desc += `, 风格: ${c.styleDescription}`;
        return desc;
      })
      .join("\n") || "No specific characters defined.";

    const styleModifier = agentConfig?.type === "creative"
      ? "Be imaginative with the visual compositions."
      : agentConfig?.type === "detailed"
      ? "Include very detailed visual descriptions."
      : agentConfig?.type === "minimal"
      ? "Keep visual descriptions concise."
      : agentConfig?.customPrompt || "";

    const prompt = STORYBOARD_PROMPT_TEMPLATE
      .replace("{story}", storyContent)
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
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "Failed to generate storyboard" },
        { status: response.status }
      );
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to extract JSON from the response
    try {
      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      const storyboards = JSON.parse(text);
      return NextResponse.json({ storyboards });
    } catch {
      // If parsing fails, try to find JSON array in the text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const storyboards = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ storyboards });
      }
      return NextResponse.json(
        { error: "Failed to parse storyboard response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Storyboard generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate storyboard" },
      { status: 500 }
    );
  }
}