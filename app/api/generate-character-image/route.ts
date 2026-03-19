import { NextRequest, NextResponse } from "next/server";

const CHARACTER_IMAGE_PROMPT = `Generate an image of a character for a children's picture book.

Character: {name}
Description: {description}
Colors: Primary {primaryColor}, Secondary {secondaryColor}
Clothing: {clothing}

Style requirements:
- Warm, hand-drawn cartoon style
- Soft rounded shapes, bright cheerful colors
- Kid-friendly, non-scary
- Simple or white background
- Single character in a friendly pose

Generate the image now.`;

const CHARACTER_IMAGE_WITH_REF_PROMPT = `Generate an image of a character for a children's picture book, using the provided reference image as a guide for the character's appearance.

Character: {name}
Description: {description}
Colors: Primary {primaryColor}, Secondary {secondaryColor}
Clothing: {clothing}

Style requirements:
- Warm, hand-drawn cartoon style
- Soft rounded shapes, bright cheerful colors
- Kid-friendly, non-scary
- Simple or white background
- Single character in a friendly pose
- Maintain consistency with the reference image's character design

Generate the image now.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, character, referenceImage } = body;

    if (!apiKey || !character) {
      return NextResponse.json(
        { error: "API key and character data are required" },
        { status: 400 }
      );
    }

    const promptTemplate = referenceImage ? CHARACTER_IMAGE_WITH_REF_PROMPT : CHARACTER_IMAGE_PROMPT;
    const prompt = promptTemplate
      .replace("{name}", character.name || "Character")
      .replace("{description}", character.description || "")
      .replace("{primaryColor}", character.colors?.primary || "#8E8E8E")
      .replace("{secondaryColor}", character.colors?.secondary || "#F2B5B5")
      .replace("{clothing}", character.clothing || "casual clothes");

    // Build the parts array
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Add reference image first if provided
    if (referenceImage) {
      // Extract base64 data (remove data:image/xxx;base64, prefix if present)
      const base64Data = referenceImage.includes(",") ? referenceImage.split(",")[1] : referenceImage;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      });
    }

    // Add text prompt
    parts.push({ text: prompt });

    // Use v1beta API for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["image", "text"],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      const errorMsg = error.error?.message || "Failed to generate character image";
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    const data = await response.json();

    // Check for image in response (inline_data)
    const imagePart = data.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { data: string }; inline_data?: { data: string } }) =>
        part.inlineData || part.inline_data
    );

    const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data;

    if (imageData) {
      return NextResponse.json({ imageUrl: imageData });
    }

    // Check for text response (error case)
    const textPart = data.candidates?.[0]?.content?.parts?.find(
      (part: { text?: string }) => part.text
    );

    if (textPart?.text) {
      return NextResponse.json({
        error: "Model returned text instead of image. Make sure you're using an image-capable model like gemini-2.0-flash-exp.",
      }, { status: 400 });
    }

    return NextResponse.json({ error: "No image generated" }, { status: 500 });
  } catch (error) {
    console.error("Character image generation error:", error);
    return NextResponse.json({ error: "Failed to generate character image" }, { status: 500 });
  }
}