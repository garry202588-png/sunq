import { generateText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(request: Request) {
  const { topic, purpose, slides, style, focus } = await request.json();

  const numSlides = parseInt(slides) || 8;

  const prompt = `请为以下PPT生成一份大纲，每页一行标题，共${numSlides}页。

主题：${topic}
用途：${purpose || "课堂汇报"}
风格：${style || "图文并茂"}
${focus ? `重点方向：${focus}` : ""}

要求：
- 输出${numSlides}行，每行是一页PPT的标题
- 格式：1. 标题内容（不要其他额外说明）
- 第一页是封面标题，最后一页是总结
- 内容准确，适合初中生
- 每个标题简洁明了，5-15个字`;

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    prompt,
  });

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
