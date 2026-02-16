import { NextRequest, NextResponse } from "next/server";

export const config = {
  api: { bodyParser: { sizeLimit: "15mb" } },
};

// Next.js App Router: increase body size limit
export const maxDuration = 120; // seconds

const I2I_URL =
  "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis";

const TASK_URL = "https://dashscope-intl.aliyuncs.com/api/v1/tasks";

const STYLE_PROMPTS: Record<string, string> = {
  水彩: "Convert to watercolor painting style with soft brushstrokes and gentle color blending",
  油画: "Convert to oil painting style with rich colors and textured brushstrokes",
  漫画: "Convert to anime illustration style, cute colorful Japanese manga style",
  素描: "Convert to pencil sketch style, black and white, detailed line drawing",
  像素风: "Convert to pixel art style, 16-bit retro game aesthetic",
  中国风: "Convert to traditional Chinese ink wash painting style, elegant and artistic",
  赛博朋克: "Convert to cyberpunk style with neon lights, futuristic sci-fi atmosphere",
  吉卜力: "Convert to Studio Ghibli anime style, warm colors, hand-drawn feel",
};

export async function POST(request: NextRequest) {
  const { imageBase64, style = "水彩" } = await request.json();

  if (!imageBase64) {
    return NextResponse.json({ error: "请上传图片" }, { status: 400 });
  }

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS["水彩"];

  // Strip data URL prefix (data:image/...;base64,) — DashScope expects raw base64
  const rawBase64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");

  try {
    // Submit i2i task (async mode) with base64 image
    const submitRes = await fetch(I2I_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: "wan2.5-i2i-preview",
        input: {
          prompt: stylePrompt,
          images: [rawBase64],
        },
        parameters: {
          n: 1,
          watermark: false,
          prompt_extend: true,
        },
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      console.error("I2I submit error:", errText);
      return NextResponse.json(
        { error: "转绘提交失败，请重试" },
        { status: submitRes.status }
      );
    }

    const submitData = await submitRes.json();
    const taskId = submitData.output?.task_id;

    if (!taskId) {
      return NextResponse.json(
        { error: "无法获取任务ID" },
        { status: 500 }
      );
    }

    // Poll for result (max 90s)
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 3000));
      attempts++;

      const pollRes = await fetch(`${TASK_URL}/${taskId}`, {
        headers: {
          Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        },
      });

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const status = pollData.output?.task_status;

      if (status === "SUCCEEDED") {
        const resultUrl = pollData.output?.results?.[0]?.url;
        if (resultUrl) {
          return NextResponse.json({ success: true, imageUrl: resultUrl });
        }
        return NextResponse.json(
          { error: "转绘完成但未返回图片" },
          { status: 500 }
        );
      } else if (status === "FAILED") {
        return NextResponse.json(
          { error: "转绘失败，请换一张图片试试" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "转绘超时，请稍后重试" },
      { status: 504 }
    );
  } catch (error) {
    console.error("Restyle error:", error);
    return NextResponse.json(
      { error: "转绘失败，请检查网络后重试" },
      { status: 500 }
    );
  }
}
