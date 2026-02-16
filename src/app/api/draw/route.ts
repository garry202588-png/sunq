import { NextRequest, NextResponse } from "next/server";

const DASHSCOPE_URL =
  "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

const STYLE_MAP: Record<string, string> = {
  水彩: "watercolor painting style, soft colors, artistic",
  油画: "oil painting style, rich colors, textured brushstrokes",
  漫画: "anime illustration style, cute, colorful, Japanese manga",
  写实: "photorealistic, highly detailed, professional photography",
  像素风: "pixel art style, 16-bit, retro game aesthetic",
  中国风: "traditional Chinese painting style, ink wash, elegant",
};

const SIZE_MAP: Record<string, string> = {
  "1:1": "1024*1024",
  "16:9": "1280*720",
  "9:16": "720*1280",
};

export async function POST(request: NextRequest) {
  const { prompt, style = "写实", size = "1:1" } = await request.json();

  const stylePrefix = STYLE_MAP[style] || "";
  const fullPrompt = stylePrefix ? `${prompt}, ${stylePrefix}` : prompt;
  const resolution = SIZE_MAP[size] || "1024*1024";

  try {
    const res = await fetch(DASHSCOPE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "wan2.6-t2i",
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: fullPrompt }],
            },
          ],
        },
        parameters: {
          size: resolution,
          n: 1,
          prompt_extend: true,
          watermark: false,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("DashScope error:", errText);
      return NextResponse.json(
        { error: `生成失败: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const imageUrl =
      data.output?.choices?.[0]?.message?.content?.find(
        (c: { type: string }) => c.type === "image"
      )?.image;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return NextResponse.json(
        { error: "生成成功但未返回图片" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error("Draw error:", error);
    return NextResponse.json(
      { error: "生成失败，请检查网络后重试" },
      { status: 500 }
    );
  }
}
