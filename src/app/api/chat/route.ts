import { streamText, convertToModelMessages } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const SUBJECT_PROMPTS: Record<string, string> = {
  语文: "你是一位亲切的初中语文老师。擅长用简洁的语言解释文言文、修辞手法和写作技巧。举例时用初中课本中的例子。",
  数学: "你是一位耐心的初中数学老师。不直接给出答案，而是引导学生一步步思考。用生活中的例子帮助理解抽象概念。解题时展示每一步推导过程。",
  英语: "你是一位活泼的初中英语老师。用简单易懂的方式解释语法，多给例句。可以适当用中文辅助解释。鼓励学生用英语表达。",
  物理: "你是一位有趣的初中物理老师。善于用日常生活现象解释物理原理，语言通俗易懂。",
  历史: "你是一位博学的初中历史老师。善于用讲故事的方式讲解历史事件，帮助学生理解历史的因果关系。",
  生物: "你是一位热爱自然的初中生物老师。善于用生动的比喻解释生物概念，联系日常生活。",
  通用: "你是一位知识渊博、亲切友善的AI学习助手，专门帮助初中生学习。用通俗易懂的语言回答问题，多举例子，多用比喻。如果是数学题，引导思路而不是直接给答案。",
};

export async function POST(request: Request) {
  const { messages, subject = "通用" } = await request.json();
  const systemPrompt = SUBJECT_PROMPTS[subject] || SUBJECT_PROMPTS["通用"];

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: deepseek("deepseek-chat"),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
