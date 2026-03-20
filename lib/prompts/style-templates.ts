// 绘本插画基础风格描述
export const ILLUSTRATION_STYLE_PROMPT = `
绘本插画风格要求：
- 艺术风格：温暖的手绘卡通风格，类似经典儿童绘本（如 Axel Scheffler 的作品）
- 线条特征：墨线勾边，线条粗细有自然变化，展现手绘质感
- 色彩处理：明亮温暖的配色，以暖黄、暖橙为主色调，色彩饱和度适中，避免过于鲜艳  
- 形体设计：圆润柔和的造型，角色头身比约 1:1.5，呈现幼态化特征
- 材质表现：水彩渲染效果，色块之间自然过渡，保留纸张质感
- 背景处理：细节丰富但不抢戏，服务于角色和情绪表达
- 整体氛围：儿童友好、非恐怖、富有亲和力
`;

// 角色一致性要求（极其重要）
export const CHARACTER_CONSISTENCY_PROMPT = `
角色一致性要求（极其重要）：
- 严格参照参考图中的角色特征，包括但不限于：体型比例、面部特征、毛发/皮肤颜色、服装款式和颜色
- 角色的标志性特征必须在每一帧中保持完全一致
- 表情变化时，仅调整五官的细微动作，其他特征不变
- 角色在不同场景中的姿态可以变化，但外观特征必须保持稳定
- 如果参考图中有多个角色，请确保每个角色都能准确对应并保持一致
`;

// 画面构图指导
export const SCENE_COMPOSITION_PROMPT = `
画面构图指导：
- 根据镜头类型（特写/中景/全景）合理安排角色在画面中的位置和大小
- 采用三分法构图或黄金分割，避免居中式呆板构图
- 利用前景、中景、背景的层次关系增强画面深度
- 通过角色视线和肢体语言引导观众注意力
- 为翻页预留视觉悬念，画面边缘的处理要考虑叙事连贯性
`;

// 镜头类型描述映射
const SHOT_TYPE_DESCRIPTIONS: Record<string, string> = {
  'close-up': '特写镜头，聚焦角色面部表情和细节',
  'medium': '中景镜头，展现角色上半身和周围环境',
  'wide': '全景镜头，完整呈现场景和角色全貌',
};

// 构建增强的图片生成 Prompt
export interface BuildPromptParams {
  sceneDescription: string;    // 场景描述
  visualPrompt: string;         // 视觉要求
  shotType: string;             // 镜头类型
  mood: string;                 // 氛围/情绪
  hasCharacterRef: boolean;     // 是否提供了角色参考图
  hasPreviousPage: boolean;     // 是否提供了前一页图片
}

export function buildEnhancedPrompt(params: BuildPromptParams): string {
  const parts: string[] = [];
  
  // 1. 基础风格要求
  parts.push(ILLUSTRATION_STYLE_PROMPT);
  
  // 2. 角色一致性要求（如果有参考图）
  if (params.hasCharacterRef) {
    parts.push(CHARACTER_CONSISTENCY_PROMPT);
    parts.push("参考图说明：已提供角色参考图，请严格遵循参考图中的所有视觉特征。");
  }
  
  // 3. 连贯性要求（如果有前一页）
  if (params.hasPreviousPage) {
    parts.push("连贯性要求：已提供前一页的画面，请保持画风、光线、色调的连贯性。");
  }
  
  // 4. 构图指导
  parts.push(SCENE_COMPOSITION_PROMPT);
  
  // 5. 具体场景信息
  const shotTypeDesc = SHOT_TYPE_DESCRIPTIONS[params.shotType] || params.shotType;
  parts.push(`场景信息：
- 描述：${params.sceneDescription}
- 镜头：${shotTypeDesc}
- 氛围：${params.mood}`);
  
  // 6. 具体画面要求
  parts.push(`具体画面要求：
${params.visualPrompt}`);
  
  return parts.join('\n\n');
}

// 根据角色信息生成角色描述 Prompt（用于角色图片生成）
export function buildCharacterPrompt(character: {
  name: string;
  description: string;
  styleDescription?: string;
}): string {
  let prompt = ILLUSTRATION_STYLE_PROMPT + '\n\n';
  
  prompt += `角色设计要求：
- 角色名称：${character.name}
- 角色描述：${character.description}`;
  
  if (character.styleDescription) {
    prompt += `\n- 风格特征：${character.styleDescription}`;
  }
  
  prompt += `\n\n请生成一个正面站立的角色设计图，展现完整的角色特征，适合作为后续绘本插画的参考图。`;
  
  return prompt;
}
