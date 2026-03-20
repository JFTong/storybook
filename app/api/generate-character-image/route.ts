import { NextRequest, NextResponse } from "next/server";

const CHARACTER_IMAGE_PROMPT = `为儿童绘本生成一个角色形象图片。

角色名称：{name}
角色描述：{description}
{styleDescriptionLine}

风格要求：
- 温暖的手绘卡通风格
- 柔和圆润的造型，明亮温馨的色彩
- 适合儿童的可爱风格，不恐怖
- 简洁或白色背景
- 单个角色，友好的姿态
- 人物特征必须严格参照参考图（如有提供）

请立即生成图片。`;

const CHARACTER_IMAGE_WITH_REF_PROMPT = `为儿童绘本生成一个角色形象图片，请严格参照提供的参考图来绘制角色的外观特征。

角色名称：{name}
角色描述：{description}
{styleDescriptionLine}

风格要求：
- 温暖的手绘卡通风格
- 柔和圆润的造型，明亮温馨的色彩
- 适合儿童的可爱风格，不恐怖
- 简洁或白色背景
- 单个角色，友好的姿态
- 人物特征必须严格参照参考图
- 保持与参考图角色设计的一致性

请立即生成图片。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, model, character, referenceImage } = body;

    if (!apiKey || !character) {
      return NextResponse.json(
        { error: "需要提供 API Key 和角色数据" },
        { status: 400 }
      );
    }

    const styleDescriptionLine = character.styleDescription
      ? `风格描述：${character.styleDescription}`
      : '';

    const promptTemplate = referenceImage ? CHARACTER_IMAGE_WITH_REF_PROMPT : CHARACTER_IMAGE_PROMPT;
    const prompt = promptTemplate
      .replace("{name}", character.name || "角色")
      .replace("{description}", character.description || "")
      .replace("{styleDescriptionLine}", styleDescriptionLine);

    // Build the parts array
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Add reference image first if provided
    if (referenceImage) {
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
      const errorMsg = error.error?.message || "角色图片生成失败";
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
        error: "模型返回了文本而非图片。请确保使用支持图片生成的模型（如 gemini-2.0-flash-exp）。",
      }, { status: 400 });
    }

    return NextResponse.json({ error: "未能生成图片" }, { status: 500 });
  } catch (error) {
    console.error("角色图片生成错误:", error);
    return NextResponse.json({ error: "角色图片生成失败" }, { status: 500 });
  }
}
