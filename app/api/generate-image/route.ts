import { NextRequest, NextResponse } from "next/server";
import { buildEnhancedPrompt } from "@/lib/prompts/style-templates";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      apiKey, 
      model, 
      sceneDescription, 
      visualPrompt,
      shotType = 'medium',
      mood = '',
      characterRefImage, 
      previousImage,
      config = {}
    } = body;

    if (!apiKey || !visualPrompt) {
      return NextResponse.json(
        { error: "API key and visual prompt are required" },
        { status: 400 }
      );
    }

    // 使用增强的 Prompt 构建系统
    const fullPrompt = buildEnhancedPrompt({
      sceneDescription: sceneDescription || '',
      visualPrompt,
      shotType,
      mood,
      hasCharacterRef: !!characterRefImage,
      hasPreviousPage: !!previousImage,
    });

    // Build the parts array for the API request
    const parts: { inlineData?: { mimeType: string; data: string }; text?: string }[] = [];

    // Add character reference image if available (最优先)
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

    // 构建生成配置
    const generationConfig: any = {
      responseModalities: ["image", "text"],
    };

    // 支持自定义配置参数
    if (config.temperature !== undefined) {
      generationConfig.temperature = config.temperature;
    }
    if (config.topP !== undefined) {
      generationConfig.topP = config.topP;
    }
    if (config.seed !== undefined) {
      generationConfig.seed = config.seed;
    }

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
          generationConfig,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      const errorMsg = error.error?.message || "Failed to generate image";
      console.error("Gemini API error:", error);
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
      console.error("Model returned text instead of image:", textPart.text);
      return NextResponse.json({
        error: "模型返回了文本而非图片，请使用支持图片生成的模型（如 gemini-2.5-flash-image）",
      }, { status: 400 });
    }

    return NextResponse.json({ error: "未生成图片" }, { status: 500 });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "图片生成失败" 
    }, { status: 500 });
  }
}