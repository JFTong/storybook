浏览量/默认 评论/默认 

分享/默认@2x 

顶 收藏 分享/打 

转载 收录 反馈 

评论 回到顶部 

左侧收起 

已收藏 已顶

[首页](https://km.woa.com/?kmref=vkm_header) [AI问答](https://km.woa.com/ai/chat?kmref=vkm_header) [悦读](https://km.woa.com/read?kmref=vkm_header) [乐问](https://km.woa.com/q?kmref=vkm_header) [TEKO](https://teko.woa.com/?kmref=vkm_header)

应用

K吧

[![](https://km.woa.com/asset/avatar/alanjftong)](https://km.woa.com/user/alanjftong?kmref=vkm_header)

[文章](https://km.woa.com/read) /

文章详情

大纲

Intro

一、AI 生图？ 我老家的二舅也会

每一页长得都不一样

二、原型参考：让 AI 先学再画

三、定义角色：给 AI 一份视觉规范

四、编写分镜脚本：从故事弧线到每一帧

五、上下文爆了：用 Sub-Agent 拆分工作

六、逐页生成：参考图与图片压缩

七、确认关卡与迭代修改

八、Skill 的封装

MCP VS Shell 脚本

回顾与总结

如何用 NanoBanana2 给小孩定制绘本 

5

[kelvinzhou](https://km.woa.com/user/kelvinzhou)

2026-03-16 14:02

AI辅助声明

1387

25

115

分享

文章摘要

思维导图

文章朗读

丨 导语 AI 发展的速度实在是太快了，各种 AI 工具和平台层出不穷，肯定有不少同学想吐槽，根本学不过来。为了缓解这种 FOMO 情绪，这篇文章不会堆砌术语，而是从实际问题出发，自然地引出我用了什么技术手段来解决。读完之后，或许会对你理解如何编排一个多步骤的 AI 工作流有帮助。

## [](#intro)Intro

上一篇文章《[从痛点到工具链 —— AI 驱动的个人工具链实践](https://km.woa.com/articles/show/%5Bhttps://km.woa.com/articles/show/653365)》分享了我如何用 AI 生成工作和学习中用到的小工具，上了 KM 热文。没想到大家最感兴趣的不是思路本身，而是想知道如何搭建个人 Agent 实现文章助记图并自动生成 Notion 文章。乘热打铁，这次我把 AI 用在了一个完全不同的场景——育儿。具体来说，就是我用 AI 帮我儿子定制了一本专属绘本。

> 他最近很抵触刷牙，我和妈妈想根据他最喜欢的绘本 DIY 个专属绘本送给他。

先看最终成果，一本 10 页的儿童绘本《闪亮的牙齿》，讲的是小兔子皮普在好朋友小老鼠波西的帮助下学会刷牙的故事：

![](https://km.woa.com/asset/000100022603004de0233b8cbb4dfd01?height=1414&width=3342&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

从一个故事主题到一本完整的书，中间经历了什么？下面从头讲起。

## [](#%E4%B8%80%E3%80%81ai-%E7%94%9F%E5%9B%BE%EF%BC%9F-%E6%88%91%E8%80%81%E5%AE%B6%E7%9A%84%E4%BA%8C%E8%88%85%E4%B9%9F%E4%BC%9A)一、AI 生图？ 我老家的二舅也会

2026 年的今天，AI 生图可选择非常多，任何人都可以直接打开个 App，通过简单的描述去生成一张图。

> 一只灰色小兔子和一只棕色小老鼠，在浴室里开心地刷牙，卡通风格，温暖明亮的颜色。

十几秒后出图：

![](https://km.woa.com/asset/00010002260300c67e5e486cdd48a602?height=559&width=1024&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

单看这一张，效果还不错。但绘本不是一张图，是十几张图讲一个连贯的故事。当我用类似的 Prompt 分别画了"吃饭"、"逃避刷牙"、"牙齿上沾了菜叶"几个场景后，问题暴露了：

### [](#%E6%AF%8F%E4%B8%80%E9%A1%B5%E9%95%BF%E5%BE%97%E9%83%BD%E4%B8%8D%E4%B8%80%E6%A0%B7)每一页长得都不一样

第一页小兔子穿蓝衣服，第二页变成红色。眼睛的画法也在变化，有时是圆的，有时变成细长的。原因很直接：每次 AI 画图都是一个独立请求，模型没有"记忆"，不知道上一页画了什么。对于单张配图来说这不是问题，但对于一本需要角色一致的绘本来说，这是根本性的障碍。

上一页波西的衣服是有领子的黄色连衣裙，第二页变成粉红色。

![](https://km.woa.com/asset/00010002260300e2486a181e9e42db01?height=524&width=2128&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

这意味着，做绘本和做单张图是两个完全不同量级的问题。做绘本的核心挑战是：**跨页面的角色一致性，这需要工程化的解决方案。**

## [](#%E4%BA%8C%E3%80%81%E5%8E%9F%E5%9E%8B%E5%8F%82%E8%80%83%EF%BC%9A%E8%AE%A9-ai-%E5%85%88%E5%AD%A6%E5%86%8D%E7%94%BB)二、原型参考：让 AI 先学再画

我儿子最喜欢的绘本系列是 Axel Scheffler 的《波西和皮普》。我希望定制的绘本能尽量接近这个系列的风格——不是照抄，而是学习它的画风特征和叙事结构，让孩子在阅读时有熟悉感。

问题是，我自己并不是绘本设计方面的专家。我能感觉到波西和皮普的画面"很舒服"，但说不清楚到底是什么让它舒服。所以我做的第一件事不是动手画，而是**让 AI 去研究原著**。

我让 AI 联网查询了波西和皮普系列的相关资料——作者的插画风格、这个系列的典型叙事模式、面向的年龄段和设计理念。AI 帮我提炼出了几个关键特征：

**画风层面：**

- 手绘墨线轮廓，线条粗细有变化，不是数字感很强的均匀线条
    
- 色彩明亮温暖，以暖黄、暖橙为主色调
    
- 角色比例偏"幼态"，头身比约 1:1.5，圆润的体型
    
- 背景细节丰富但不抢戏，服务于角色和情绪
    

**叙事层面：**

- 经典的 **"OH DEAR → HURRAY"** 结构：前半段制造一个小麻烦（"哎呀！"），后半段解决它（"太好了！"）
    
- 情绪先低后高，结尾一定是温暖正面的
    
- 角色之间不会互相取笑或指责，矛盾的解决靠行动示范，不靠说教
    
- 每一页的结尾留一个小悬念，驱动孩子想翻到下一页（行业术语叫**翻页钩子**）
    

这些提炼出来的原则变成了后续所有步骤的"设计规范"。比如叙事结构直接指导了分镜脚本的设计，画风特征成为了每个 Prompt 开头的**风格锚点**。这一步的价值在于：**把模糊的"我想要这种感觉"变成了可执行的、结构化的设计原则**。后续不管是角色设计、分镜编写还是 Prompt 工程，都有据可循。

## [](#%E4%B8%89%E3%80%81%E5%AE%9A%E4%B9%89%E8%A7%92%E8%89%B2%EF%BC%9A%E7%BB%99-ai-%E4%B8%80%E4%BB%BD%E8%A7%86%E8%A7%89%E8%A7%84%E8%8C%83)三、定义角色：给 AI 一份视觉规范

有了设计原则，接下来要做的是定义角色。

我需要写一份**角色定义文档**，详细描述每个角色的外貌、服装、色彩和表情范围。这份文档的精细程度可能超出你的想象——不是"一只灰色兔子"这种粗略描述，而是精确到：

- 皮普：灰色（#8E8E8E）小兔子，长耳朵（内侧粉色 #F2B5B5），穿绿白条纹 T 恤（绿色 #4CAF50）和蓝色短裤（#2C5F8A）
    
- 4 种标准表情：开心（嘴巴张开露小门牙）、不情愿（嘴巴紧闭，耳朵后倾）、难过（嘴角下撇，耳朵下垂）、惊讶（嘴巴张成圆形，耳朵直竖）
    

之所以要这么精确，是因为这份文档会被用来生成一张**角色参考图**——一张包含所有角色正面、侧面和多种表情的汇总图。这张图不是绘本的一页，而是整本书的**视觉规范**。后续每一页的生成都会带上这张图作为"参考图"（ref image），告诉 AI："照着这个标准来画。"

![](https://km.woa.com/asset/00010002260300d1e6052a81d343fd02?height=1792&width=2400&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

这是保证一致性的第一道防线。

## [](#%E5%9B%9B%E3%80%81%E7%BC%96%E5%86%99%E5%88%86%E9%95%9C%E8%84%9A%E6%9C%AC%EF%BC%9A%E4%BB%8E%E6%95%85%E4%BA%8B%E5%BC%A7%E7%BA%BF%E5%88%B0%E6%AF%8F%E4%B8%80%E5%B8%A7)四、编写分镜脚本：从故事弧线到每一帧

角色定好了，下一步是设计整本书的内容。

基于前面研究到的 "OH DEAR → HURRAY" 叙事结构，我让 AI 帮我设计了这样的故事弧线：

1.  **日常铺垫**（第 1-2 页）：皮普和波西一起吃晚饭，波西开心地去刷牙
    
2.  **冲突开始**（第 3-4 页）：皮普不想刷牙，紧闭嘴巴，偷偷把牙刷藏起来
    
3.  **"OH DEAR"**（第 5-6 页）：皮普得意地张嘴大笑，结果牙齿上全是绿色菜叶——尴尬，难过地捂住嘴
    
4.  **转机**（第 7-8 页）：波西不取笑他，轻轻牵着他去浴室，示范刷牙
    
5.  **"HURRAY"**（第 9-10 页）：皮普照镜子发现牙齿白白亮亮的，两个好朋友一起露出闪亮的笑容
    

但光有故事线不够。每一页还需要详细的**分镜描述**，包括镜头（近景/中景/全景）、构图（角色位置、视线方向）、光线色调（情绪低谷时偏冷灰，结尾最温暖明亮）和翻页钩子。

写到这一步时，问题出现了。

## [](#%E4%BA%94%E3%80%81%E4%B8%8A%E4%B8%8B%E6%96%87%E7%88%86%E4%BA%86%EF%BC%9A%E7%94%A8-sub-agent-%E6%8B%86%E5%88%86%E5%B7%A5%E4%BD%9C)五、上下文爆了：用 Sub-Agent 拆分工作

最初我是在一个 AI 对话里做所有事情的——定义角色、写分镜、生成 Prompt、调用画图——结果到了第六七页时，AI 开始"健忘"：它丢掉了角色的某些细节，故事节奏也出现偏差。

这是 AI 的一个内在限制：**上下文窗口**。可以把它理解为 AI 的"工作台面"——面积有限，堆的材料越多，最早放上去的内容就会被挤掉。当角色定义、分镜脚本、多页 Prompt 全部堆在同一个对话里，上下文超过容量后，系统会自动压缩早期内容来腾出空间（称为 **compact**）。通常压缩后会丢失很多细节，这是导致大模型突然降智的主要原因。

解决方案是**拆分工作流**，让不同的 AI 角色各自负责一个环节：

| Sub-Agent | 职责  | 输入  | 输出  |
| --- | --- | --- | --- |
| 角色设定师 | 定义角色外貌、色彩、表情 | 故事主题 + 设计规范 | `characters.md` |
| 分镜编剧 | 设计每页的故事和视觉描述 | 角色文档 + 叙事结构 | `storyboard.md` |
| Prompt 工程师 | 将分镜翻译为 AI 画图指令 | 角色文档 + 分镜脚本 | `prompts/01-page.md` ... |
| 画师  | 执行图片生成 | Prompt + 角色参考图 + 前页图 | `01-page.jpeg` ... |

这个模式在 AI 领域叫 **Sub-Agent**（子代理），主流程（编排器）负责协调，每个 Sub-Agent 在独立的上下文中执行单一任务。关键优势有两个：

1.  **每个 Agent 只加载它需要的信息**。分镜编剧启动时只读角色文档和故事主题，不会看到角色设定过程中的讨论记录，"工作台"上只有必要的材料。
    
2.  **步骤间通过文件传递信息**。角色设定师写出 `characters.md`，分镜编剧读这个文件再输出 `storyboard.md`。信息持久化在磁盘上，不依赖任何单一对话的记忆。
    

```javascript
...
## 架构：编排器 + Sub-Agent

本 Skill 使用 **Sub-Agent 委派模式**来避免上下文爆炸：

- **主 Agent（编排器）**：负责用户交互、进度协调、轻量分析（Step 1, 2, 6, 7.2, 9）
- **Sub-Agent**：通过 `Task` 工具启动，各自读取所需的参考文档，完成重活后返回摘要
...
```

**重点！！！** SubAgent 看起来很复杂，但是在 AI 时代，我们并不需要理解背后是怎么工作的，只需要在对话过程中，告诉 AI 拆成 SubAgent 去做就行。

## [](#%E5%85%AD%E3%80%81%E9%80%90%E9%A1%B5%E7%94%9F%E6%88%90%EF%BC%9A%E5%8F%82%E8%80%83%E5%9B%BE%E4%B8%8E%E5%9B%BE%E7%89%87%E5%8E%8B%E7%BC%A9)六、逐页生成：参考图与图片压缩

准备工作完成后，进入最关键的环节——逐页生成图片。

核心策略是一条**参考图链条**：

```javascript
封面 ← 角色参考图
第1页 ← 角色参考图 + 封面
第2页 ← 角色参考图 + 第1页
...
第N页 ← 角色参考图 + 第N-1页
```

发送给 Gemini 的 API 请求格式：

```javascript
{
    "contents": [{
      "parts": [
        { "inlineData": { "data": "base64编码的字符参考图", ... } },
        { "inlineData": { "data": "base64编码的前一页", ... } },
        { "text": "详细的场景提示词..." }
      ]
    }]
}
```

不需要过度关注实现细节，告诉 AI 我们使用 Gemini 风格的接口，把图片带上去就可以。

每一页的生成有两个视觉锚点：角色参考图（保证角色一致）和上一页的生成图（保证场景风格、光线的连贯性）。这是保证**视觉一致性的关键**，即使 AI 对每次请求都"失忆"，通过这两个锚点也能维持整本书的视觉统一。

上一页出现的洗漱台、角色的形象、穿搭，在下一页依然可以保持稳定。

![](https://km.woa.com/asset/000100022603000b493af99b6b4d9b02?height=1536&width=2752&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

![](https://km.woa.com/asset/0001000226030089319f4c7df2477402?height=1536&width=2752&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

但实际执行时遇到了一个工程问题：**参考图太大了**。生成的每张生成图都是 2K 分辨率，约 2.5 MB。将这样的图片作为参考传给 API 时，服务端返回了 502 错误——请求体超过大小限制。

![](https://km.woa.com/asset/00010002260300e83ab4cc7e56481801?height=336&width=1328&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

解决方案是在图片生成脚本中加入了自动压缩逻辑：参考图在传给 API 前，检查文件大小，超过 500 KB 的自动压缩到最长边 1024 像素、JPEG 质量 70。压缩后一般在 400-600 KB，作为参考已经足够，而 API 请求不再报错。

同样的，我们并不需要关心怎么压缩，Prompt 告诉 AI 去编写脚本就可以。

## [](#%E4%B8%83%E3%80%81%E7%A1%AE%E8%AE%A4%E5%85%B3%E5%8D%A1%E4%B8%8E%E8%BF%AD%E4%BB%A3%E4%BF%AE%E6%94%B9)七、确认关卡与迭代修改

整套流程跑完一遍并不意味着一切完美。可能某一页的光线不对，某个表情不够到位。所以我在流程中设计了两道**确认关卡**。

**第一道：分镜确认。** 在执行图片生成之前，必须把完整的分镜脚本展示给用户审阅。这是一个硬性门槛——代码层面强制调用确认交互，不允许 AI 自行跳过。原因很直接：图片生成是整个流程中最耗时的操作，如果分镜有问题到第 5 页才发现，前面的工作都浪费了。

**第二道：角色参考图确认。** 生成角色参考图后，用户检查角色形象是否符合预期。如果不满意（比如颜色偏差、比例失调），可以修改角色定义文档后重新生成，循环直到满意。只有锁定了角色参考图，才进入正式的逐页生成。

```javascript
  → Step 2 (编排器: 用户确认方案) ⛔ 必须 AskUserQuestion 确认
  │         ├─ 完整确认模式（素材少，展示完整方案 + 故事梗概）
  │         ├─ 快速确认模式（素材多，只确认画风/页数/目录）
  │         └─ ⚠️ 用户未确认前禁止进入 Step 3
```

对于已生成但不满意的单页，还有一个**微调**机制：将原图作为第一参考、角色参考图作为第二参考，配合修改指令（如"把背景光线调暖"）重新生成。一个关键设计：**修改时始终以原图为参考基准，不以中间修改结果为基准**，避免多轮修改后越改越偏。

## [](#%E5%85%AB%E3%80%81skill-%E7%9A%84%E5%B0%81%E8%A3%85)八、Skill 的封装

以上这些步骤——Sub-Agent 拆分、确认关卡、Shell 脚本调用、动态流程分支——我是用 CodeBuddy Code 的 **Skill** 机制串联起来的。

> 封装完 Skill 之后，下一次生成其他绘本就可以直接复用了。

```javascript
├── refine
│   └── SKILL.md
└── storybook
    ├── references
    │   ├── character-template.md
    │   ├── prompt-guide.md
    │   ├── storyboard-template.md
    │   └── what-is-storybook.md
    ├── scripts
    │   ├── generate-image.ts
    │   ├── stitch-pages.ts
    │   └── types.ts
    └── SKILL.md
```

Skill 本质上是一份结构化的工作流定义，用代码逻辑控制每一步的执行。市面上有不少图形化的工作流编排工具（如 Dify），它们通过拖拽节点来搭建流程，上手很快。但在这个项目中我选择了 Skill，核心原因有三：

1.  **精细的流程控制**：分镜确认是硬性关卡，必须强制用户确认，不能被 AI 自行跳过。这种"流程强制"在图形化工具中较难表达。
    
2.  **动态分支**：根据用户提供材料的完整度（完整角色定义 / 仅主题大纲 / 什么都没有），自动决定哪些步骤跳过、哪些需要启动 Sub-Agent。这类条件判断在代码中是自然的 if-else，在拖拽界面中需要复杂的节点配置。
    
3.  **异构操作混合**：Shell 脚本处理图片压缩、AI Agent 负责创意生成、Node.js 脚本拼接长图——不同类型的操作在 Skill 中可以无缝混合。
    

简而言之：**标准化流程适合图形化工具，需要深度定制的工程化流程适合 Skill**。

### [](#mcp-vs-shell-%E8%84%9A%E6%9C%AC)MCP VS Shell 脚本

这个项目过程并没有用到 MCP，是因为大部分 AI 外部操作就具有完全确定性。例如图片压缩，调用 NanoBanana2 生成图片等等，不需要 AI 做任何判断，让 AI 写一个可重复调用的 Shell 脚本，在 Skill.md 中告诉 AI 什么时候调用，传入什么参数即可，现在大模型已经足够聪明，大部分场景不需要 MCP 式的具体到每个字段的 Scheme 声明。

**确定性操作交给脚本，需要创意和判断的操作交给 AI**，是贯穿这个项目的一条设计原则。

## [](#%E5%9B%9E%E9%A1%BE%E4%B8%8E%E6%80%BB%E7%BB%93)回顾与总结

从"画一张图"到"做一本书"，技术上的核心挑战不在于 AI 画得好不好看，而在于**如何组织多步骤工作流，让每一步都拿到正确的输入**。

![](https://km.woa.com/asset/000100022603004de0233b8cbb4dfd01?height=1414&width=3342&imageMogr2/thumbnail/1540x%3E/ignore-error/1)

几个关键决策的回顾：

- **先研究再动手**：通过 AI 联网检索原著的画风和叙事模式，将模糊的审美偏好转化为结构化的设计规范
    
- **角色参考图是一致性的基石**：所有页面以它为视觉锚点，配合前后页引用链条保持连贯
    
- **Sub-Agent 拆分解决上下文瓶颈**：每个角色只加载必要信息，通过文件传递数据
    
- **确认关卡在昂贵操作前兜底**：先检查再执行，降低返工成本
    
- **确定性操作交给脚本**：图片压缩不需要 AI 判断，Shell 脚本比 AI 调用更高效
    
- **选择与需求匹配的工具**：需要深度定制流程时，代码编排比图形化拖拽更灵活
    

这些思路不局限于绘本场景。任何涉及"多步骤 + 多角色 + 一致性要求"的 AI 项目——自动化 PPT 生成、批量文档处理、多模态内容创作——都会面对类似的问题。核心是同一个：**不是让 AI 更聪明，而是让 AI 在正确的上下文中工作**。

**最后，再强调一次，不要焦虑！！！** 多动手去 Build Something，体会这些新名词/工具都是用来解决什么问题，指挥 AI 让它们自然而然的在项目里长出来。

❤️ 如果你对具体的 Skill 实现感兴趣：[工蜂直达](https://git.woa.com/kelvinzhou/storybook)

更新于：2026-03-17 09:29

标签： [PROMPT](https://km.woa.com/tag/4931/related-articles?current_group_id=) [AI](https://km.woa.com/tag/26413/related-articles?current_group_id=) [绘本](https://km.woa.com/tag/98027/related-articles?current_group_id=) [NanoBanana](https://km.woa.com/tag/267104/related-articles?current_group_id=)

相关阅读(1)

[从痛点到工具链 —— AI 驱动的个人工具链实践](https://km.woa.com/articles/show/653365)

[](https://km.woa.com/group/knowledge1?kmref=knowledge_apply)

已顶 78

已收藏 115

分享

转载

收录

反馈

评论 25 智能排序

[![](https://km.woa.com/asset/avatar/alanjftong)](https://km.woa.com/user/alanjftong)

评论

表情

图片

更多功能

[![](https://km.woa.com/asset/avatar/dengjudeng)](https://km.woa.com/user/dengjudeng)

[dengjudeng](https://km.woa.com/user/dengjudeng)

哈哈哈，正好我这个准爸爸，即将用上！收藏了![](https://km.woa.com/img/face/76.gif)

今天 12:42 · 回复

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) 作者

💪 冲冲冲

今天 15:02 · 回复

[![](https://km.woa.com/asset/avatar/shugenniu)](https://km.woa.com/user/shugenniu)

[shugenniu](https://km.woa.com/user/shugenniu)

牛逼

昨天 14:48 · 回复

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) 作者

\[抱拳\] 感谢大佬好评

昨天 14:50 · 回复

[![](https://km.woa.com/asset/avatar/corkyliu)](https://km.woa.com/user/corkyliu)

[corkyliu](https://km.woa.com/user/corkyliu)

太棒了！

昨天 15:44 · 回复

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) 作者

感谢宇哥！

昨天 16:17 · 回复

[![](https://km.woa.com/asset/avatar/joeqychen)](https://km.woa.com/user/joeqychen)

[joeqychen](https://km.woa.com/user/joeqychen)

这个太好了

昨天 16:14 · 回复

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) 作者

谢谢！

昨天 16:18 · 回复

[![](https://km.woa.com/asset/avatar/arielpan)](https://km.woa.com/user/arielpan)

[arielpan](https://km.woa.com/user/arielpan)

太强了楷神，学习下

昨天 19:07 · 回复

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) 作者

![](https://km.woa.com/img/face/13.gif) 谢谢

昨天 20:17 · 回复

[![](https://km.woa.com/asset/avatar/speedywang)](https://km.woa.com/user/speedywang)

[speedywang](https://km.woa.com/user/speedywang)

牛![](https://km.woa.com/img/face/76.gif)

昨天 19:58 · 回复

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) 作者

谢谢 bobo![](https://km.woa.com/img/face/13.gif)

昨天 20:18 · 回复

[![](https://km.woa.com/asset/avatar/helenahe)](https://km.woa.com/user/helenahe)

[helenahe](https://km.woa.com/user/helenahe)

不愧是我心中的神！

昨天 20:08 · 回复

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) 作者

谢谢蕾爷！![](https://km.woa.com/img/face/66.gif)

昨天 20:17 · 回复

[![](https://km.woa.com/asset/avatar/dockerzhang)](https://km.woa.com/user/dockerzhang)

[dockerzhang](https://km.woa.com/user/dockerzhang)

![](https://km.woa.com/img/face/76.gif)![](https://km.woa.com/img/face/76.gif)![](https://km.woa.com/img/face/76.gif)

昨天 18:25 · 回复

[![](https://km.woa.com/asset/avatar/damienli)](https://km.woa.com/user/damienli)

[damienli](https://km.woa.com/user/damienli)

学习到了

昨天 19:00 · 回复

[![](https://km.woa.com/asset/avatar/rooniejiang)](https://km.woa.com/user/rooniejiang)

[rooniejiang](https://km.woa.com/user/rooniejiang)

![](https://km.woa.com/img/face/76.gif)![](https://km.woa.com/img/face/76.gif)![](https://km.woa.com/img/face/76.gif)六百六十六

昨天 21:59 · 回复

[![](https://km.woa.com/asset/avatar/rickxie)](https://km.woa.com/user/rickxie)

[rickxie](https://km.woa.com/user/rickxie)

太屌了，牛逼

昨天 22:05 · 回复

[![](https://km.woa.com/asset/avatar/zilongliang)](https://km.woa.com/user/zilongliang)

[zilongliang](https://km.woa.com/user/zilongliang)

牛。学习了，参考给女儿也搞一个绘本![](https://km.woa.com/img/face/13.gif)

昨天 23:42 · 回复

[![](https://km.woa.com/asset/avatar/zhenhualiu)](https://km.woa.com/user/zhenhualiu)

[zhenhualiu](https://km.woa.com/user/zhenhualiu)

tql

今天 09:23 · 回复

[![](https://km.woa.com/asset/avatar/jeddylin)](https://km.woa.com/user/jeddylin)

[jeddylin](https://km.woa.com/user/jeddylin)

学习了![](https://km.woa.com/img/face/76.gif)

今天 09:49 · 回复

[![](https://km.woa.com/asset/avatar/jepongqin)](https://km.woa.com/user/jepongqin)

[jepongqin](https://km.woa.com/user/jepongqin)

学习到了！

今天 11:16 · 回复

[![](https://km.woa.com/asset/avatar/shiluli)](https://km.woa.com/user/shiluli)

[shiluli](https://km.woa.com/user/shiluli)

收藏学习了，先给我女儿弄一个绘本

今天 17:37 · 回复

[![](https://km.woa.com/asset/avatar/celineytcao)](https://km.woa.com/user/celineytcao)

[celineytcao](https://km.woa.com/user/celineytcao)

喜欢这个

29分钟前 · 回复

[![](https://km.woa.com/asset/avatar/palinchen)](https://km.woa.com/user/palinchen)

[palinchen](https://km.woa.com/user/palinchen)

献上膝盖

9分钟前 · 回复

已到底部

78

115

25

[![](https://km.woa.com/asset/avatar/kelvinzhou)](https://km.woa.com/user/kelvinzhou)

[kelvinzhou](https://km.woa.com/user/kelvinzhou) [![](https://km.woa.com/asset/0001000d231200225b5561042049c601?height=72&width=63)](https://km.woa.com/user/kelvinzhou?award_id=5 "头条作者")

[CDG\\微信广告部\\流量接入开发组员工](https://km.woa.com/user/kelvinzhou)

作者文章[](https://km.woa.com/user/kelvinzhou/articles?kmref=author_recommend)

[从痛点到工具链 —— AI 驱动的个人工具链实践](https://km.woa.com/articles/show/653365?kmref=author_recommend "从痛点到工具链 —— AI 驱动的个人工具链实践")

[基于Unix管道思想实现可配置的状态流转描述方案](https://km.woa.com/articles/show/594750?kmref=author_recommend "基于Unix管道思想实现可配置的状态流转描述方案")

[推倒重来打造内网超溜的前端发布流程](https://km.woa.com/articles/show/592533?kmref=author_recommend "推倒重来打造内网超溜的前端发布流程")

[AI](https://km.woa.com/entry/1bc73347f8824309a997cc48a6aafaea/home?kmref=entry_card) [AI专业问答](https://km.woa.com/entry/1bc73347f8824309a997cc48a6aafaea/home?kmref=entry_card&ai=open) 

换一换

[文章 (21206)](https://km.woa.com/entry/1bc73347f8824309a997cc48a6aafaea/related-articles?kmref=entry_card) [乐问 (2809)](https://km.woa.com/entry/1bc73347f8824309a997cc48a6aafaea/related-questions?kmref=entry_card) [文集 (20)](https://km.woa.com/entry/1bc73347f8824309a997cc48a6aafaea/related-knowledges?kmref=entry_card) [用户 (20)](https://km.woa.com/entry/1bc73347f8824309a997cc48a6aafaea/active-users?kmref=entry_card)

- [你在Vibe Coding什么好东西呀？](https://teko.woa.com/mkplus/q/304027?kmref=entry_card)
    
    TEKO 2283阅读 昨天 17:42
    
- [KaLM大模型应用实践](https://km.woa.com/knowledge/8139?kmref=entry_card)
    
    文集 6298阅读 3月11日
    
- [放弃折腾龙虾后，我用 CodeBuddy 捏了个住在微信里的 AI 管家](https://km.woa.com/articles/show/654195?kmref=entry_card)
    
    文章 12654阅读 3月9日
    
- [Prompt学习手册](https://km.woa.com/knowledge/9793?kmref=entry_card)
    
    文集 4131阅读 2025年05月13日
    
- [鹅厂打工人提效秘诀：AI+风水](https://km.woa.com/knowledge/9760?kmref=entry_card)
    
    文集 5589阅读 2025年04月22日
    

AI摘要