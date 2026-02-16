import { streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const SYSTEM_PROMPT = `你是一位专业的PPT设计顾问，帮助初中生制作课堂演示文稿。

你的任务是通过对话引导用户明确PPT需求，收集以下信息：
1. PPT主题是什么
2. 用途（课堂汇报、读书分享、活动展示等）
3. 大约需要多少页
4. 希望什么风格（学术型、图文并茂型、简约型等）
5. 重点要讲哪些方面

对话规则：
- 最多5轮对话就要收集完信息
- 语言亲切活泼，适合和初中生交流
- 每次提问最多问2个问题，不要一次问太多
- 当信息收集完毕后，整理一份大纲并请用户确认
- 大纲确认后，在回复的最后加上标记 [OUTLINE_READY]，并用以下JSON格式输出大纲：
\`\`\`json
{"topic":"主题","purpose":"用途","numSlides":数字,"style":"风格","outline":["第1页标题","第2页标题",...]}
\`\`\``;

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: SYSTEM_PROMPT,
    messages,
  });

  return result.toUIMessageStreamResponse();
}
