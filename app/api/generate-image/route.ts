import { NextRequest, NextResponse } from "next/server";

const IMAGE_STYLE_PREFIX = `Illustration style: Warm, hand-drawn cartoon style for children's picture books. Soft rounded shapes, bright cheerful colors, expressive characters. Similar to classic children's book illustrations with ink outlines and watercolor-like fills. Kid-friendly, non-scary, inviting atmosphere.

`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, prompt, sceneDescription, characterRefImage, previousImage } = body;

    if (!apiKey || !prompt) {
      return NextResponse.json(
        { error: "API key and prompt are required" },
        { status: 400 }
      );
    }

    const fullPrompt = IMAGE_STYLE_PREFIX + prompt + (sceneDescription ? `\n\nScene: ${sceneDescription}` : "");

    // Build the parts array for the API request
    const parts: { inlineData?: { mimeType: string; data: string }; text?: string }[] = [];

    // Add character reference image if available
    if (characterRefImage) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: characterRefImage,
        },
      });
    }

    // Add previous page image if available (for visual continuity)
    if (previousImage) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: previousImage,
        },
      });
    }

    // Add the text prompt
    parts.push({ text: fullPrompt });

    // Use v1beta API for image generation with Gemini models
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
      const errorMsg = error.error?.message || "Failed to generate image";
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    const data = await response.json();

    // Check for image in response (inline_data or inlineData)
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
        error: "Model returned text instead of image. Use an image-capable model like gemini-2.5-flash-image.",
      }, { status: 400 });
    }

    return NextResponse.json({ error: "No image generated" }, { status: 500 });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}