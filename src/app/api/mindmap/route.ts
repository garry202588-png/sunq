import { streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const SYSTEM_PROMPT = `你是一个思维导图生成助手。用户给你一个主题，你用 Markdown 标题格式输出思维导图结构。

规则：
- 用 # 表示中心主题
- 用 ## 表示一级分支
- 用 ### 表示二级分支
- 用 #### 表示三级分支（如需要）
- 每个节点简洁明了，2-8个字
- 一级分支 4-8 个
- 二级分支每个 2-5 个
- 内容准确，适合初中生理解
- 只输出 Markdown，不要其他解释文字`;

export async function POST(request: Request) {
  const { topic } = await request.json();

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `请生成关于「${topic}」的思维导图` }],
  });

  return result.toTextStreamResponse();
}
