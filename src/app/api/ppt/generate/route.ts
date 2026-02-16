import { NextRequest, NextResponse } from "next/server";

const GAMMA_API_URL = "https://public-api.gamma.app/v1.0/generations";

export async function POST(request: NextRequest) {
  const { outline, topic, numSlides, style, purpose } = await request.json();

  const outlineText = outline
    .map((item: string, i: number) => `${i + 1}. ${item}`)
    .join("\n");

  const inputText = `主题：${topic}\n用途：${purpose}\n\n详细大纲：\n${outlineText}`;

  try {
    // Step 1: Create generation with exportAs: "pptx"
    const createRes = await fetch(GAMMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.GAMMA_API_KEY!,
      },
      body: JSON.stringify({
        inputText,
        textMode: "generate",
        format: "presentation",
        numCards: numSlides || outline.length,
        exportAs: "pptx",
        additionalInstructions: `风格：${style || "图文并茂"}。这是一份初中生的${purpose || "课堂汇报"}PPT。`,
        textOptions: {
          language: "zh-cn",
          amount: "detailed",
          tone: "educational",
          audience: "初中生课堂汇报",
        },
        imageOptions: {
          source: "aiGenerated",
        },
        sharingOptions: {
          externalAccess: "view",
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Gamma create error:", errText);
      return NextResponse.json(
        { error: `Gamma API 错误: ${errText}` },
        { status: createRes.status }
      );
    }

    const createData = await createRes.json();
    const generationId = createData.generationId;

    if (!generationId) {
      console.error("No generationId in response:", createData);
      return NextResponse.json(
        { error: "Gamma 未返回 generationId" },
        { status: 500 }
      );
    }

    // Step 2: Poll until complete (max 3 min)
    let attempts = 0;
    const maxAttempts = 36; // 36 * 5s = 180s = 3 min
    let result = null;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000));
      attempts++;

      try {
        const pollRes = await fetch(`${GAMMA_API_URL}/${generationId}`, {
          headers: { "X-API-KEY": process.env.GAMMA_API_KEY! },
        });

        if (!pollRes.ok) {
          console.error("Poll error:", pollRes.status);
          continue;
        }

        const pollData = await pollRes.json();
        console.log(`Poll #${attempts}: status=${pollData.status}`);

        if (pollData.status === "completed") {
          result = pollData;
          console.log("Completed:", JSON.stringify(pollData, null, 2));
          break;
        } else if (pollData.status === "failed") {
          return NextResponse.json(
            { error: "PPT 生成失败，请稍后重试" },
            { status: 500 }
          );
        }
      } catch (pollErr) {
        console.error("Poll fetch error:", pollErr);
        continue;
      }
    }

    if (!result) {
      return NextResponse.json(
        { error: "生成超时，请稍后重试" },
        { status: 504 }
      );
    }

    // gammaUrl: "https://gamma.app/docs/xxxxx"
    // exportUrl: "https://assets.api.gamma.app/export/pptx/xxxxx/hash/xxxxx.pptx"
    // Extract slug from gammaUrl for embed: https://gamma.app/embed/{slug}
    const gammaUrl = result.gammaUrl;
    const exportUrl = result.exportUrl || null;
    let embedUrl = null;

    if (gammaUrl) {
      const slug = gammaUrl.split("/").pop();
      if (slug) {
        embedUrl = `https://gamma.app/embed/${slug}`;
      }
    }

    return NextResponse.json({
      success: true,
      downloadUrl: exportUrl,
      viewUrl: gammaUrl,
      embedUrl,
      title: topic,
    });
  } catch (error) {
    console.error("PPT generation error:", error);
    return NextResponse.json(
      { error: "生成失败，请检查网络后重试" },
      { status: 500 }
    );
  }
}
