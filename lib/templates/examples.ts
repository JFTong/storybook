// 角色示例模板
export interface CharacterExample {
  name: string;
  description: string;
  styleDescription?: string;
  expressions: string[];
}

export const characterExamples: CharacterExample[] = [
  {
    name: "小兔皮普",
    description: "一只灰色的小兔子,长耳朵内侧是粉色的,友好且好奇",
    expressions: ["开心", "不情愿", "难过", "惊讶"],
  },
  {
    name: "小熊宝宝",
    description: "一只棕色的小熊,圆圆的耳朵,憨态可掬,喜欢冒险",
    expressions: ["兴奋", "害怕", "思考", "得意"],
  },
  {
    name: "猫头鹰老师",
    description: "一只戴着圆眼镜的猫头鹰,羽毛是深棕色的,睿智而和蔼",
    styleDescription: "温和的智者形象,略显老态",
    expressions: ["微笑", "严肃", "惊讶", "满意"],
  },
  {
    name: "小狐狸莉莉",
    description: "一只橙红色的小狐狸,尾巴蓬松,眼睛明亮,聪明又调皮",
    expressions: ["调皮", "得意", "担心", "开心"],
  },
];

// 故事示例模板
export interface StoryExample {
  title: string;
  theme: string;
  outline: string;
  sampleContent: string;
}

export const storyExamples: StoryExample[] = [
  {
    title: "刷牙的重要性",
    theme: "教导儿童养成刷牙习惯",
    outline: "小兔子不爱刷牙 → 牙齿上沾了菜叶很尴尬 → 好朋友帮助学会刷牙 → 露出闪亮笑容",
    sampleContent: `小兔子皮普最不喜欢刷牙了。每天晚上,妈妈都要提醒他好几次。

有一天,皮普在学校吃完午餐后,忘记了刷牙。下午和朋友们玩耍时,大家都躲着他。

"皮普,你的牙齿上有菜叶!"小熊指着他说。皮普赶紧跑到镜子前,果然看到牙齿上粘着绿绿的菜叶,还有一股不好闻的味道。

皮普难过极了。猫头鹰老师温柔地说:"没关系,我们一起学习正确的刷牙方法吧!"

从那天起,皮普每天早晚都认真刷牙,再也没有出现过尴尬的情况。他的笑容也变得更加灿烂了!`,
  },
  {
    title: "勇敢的小熊",
    theme: "克服恐惧,勇敢尝试新事物",
    outline: "小熊怕黑不敢独自睡觉 → 朋友们鼓励他尝试 → 发现黑夜其实很美丽 → 学会了独立",
    sampleContent: `小熊宝宝有一个小秘密——他很怕黑,总是不敢一个人睡觉。

森林里要举办"勇气之夜"露营活动,大家都很兴奋,只有小熊宝宝犹豫不决。

"你一定可以的!"小狐狸莉莉鼓励他说。在朋友们的陪伴下,小熊宝宝鼓起勇气参加了露营。

夜晚降临,小熊宝宝发现黑夜并不可怕。星星在天空闪烁,萤火虫在草丛里飞舞,一切都那么美好。

从那以后,小熊宝宝再也不怕黑了,他发现勇敢其实就是尝试新事物!`,
  },
  {
    title: "分享的快乐",
    theme: "学会分享和友谊的价值",
    outline: "小狐狸独占玩具 → 朋友们不愿意和她玩 → 学会分享后交到更多朋友 → 体会到分享的快乐",
    sampleContent: `小狐狸莉莉有很多漂亮的玩具,但她从不愿意和别人分享。

"这是我的!"每当有小伙伴想玩她的玩具时,她总是这样说。渐渐地,大家都不愿意和她一起玩了。

莉莉感到很孤单。猫头鹰老师对她说:"快乐是需要分享的,一个人的快乐不如大家的快乐。"

莉莉决定尝试分享。当她把玩具拿出来和大家一起玩时,发现原来和朋友们一起玩更有趣!

从那以后,莉莉成为了最受欢迎的小狐狸,她明白了分享会让快乐加倍!`,
  },
];

// 分镜风格示例
export interface StoryboardStyleExample {
  name: string;
  description: string;
  shotTypes: Array<{
    type: string;
    description: string;
  }>;
}

export const storyboardStyleExamples: StoryboardStyleExample[] = [
  {
    name: "经典三幕式",
    description: "开头 - 发展 - 高潮 - 结尾的经典叙事结构",
    shotTypes: [
      { type: "wide", description: "建立场景,展示环境" },
      { type: "medium", description: "角色互动,推进情节" },
      { type: "close-up", description: "表情特写,情感高潮" },
      { type: "wide", description: "圆满结局,完整收尾" },
    ],
  },
  {
    name: "情绪递进式",
    description: "通过镜头语言逐步推进情绪变化",
    shotTypes: [
      { type: "medium", description: "平静的日常场景" },
      { type: "close-up", description: "问题出现,角色反应" },
      { type: "wide", description: "寻求帮助或解决方案" },
      { type: "close-up", description: "情绪转折,领悟时刻" },
      { type: "medium", description: "问题解决,新的开始" },
    ],
  },
];
