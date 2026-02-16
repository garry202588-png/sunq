"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToGallery } from "@/lib/gallery-store";

// Step definitions with options
const STEPS = [
  {
    key: "topic",
    question: "你要做什么主题的 PPT？",
    placeholder: "比如：光合作用、唐朝历史、垃圾分类...",
    options: null, // free input only
  },
  {
    key: "purpose",
    question: "这个 PPT 是用来做什么的？",
    options: [
      { label: "课堂汇报", icon: "🎓" },
      { label: "读书分享", icon: "📖" },
      { label: "活动展示", icon: "🎪" },
      { label: "知识科普", icon: "🔬" },
    ],
  },
  {
    key: "slides",
    question: "大概需要多少页？",
    options: [
      { label: "6 页", icon: "📄" },
      { label: "8 页", icon: "📄" },
      { label: "10 页", icon: "📄" },
      { label: "12 页", icon: "📄" },
    ],
  },
  {
    key: "style",
    question: "想要什么风格？",
    options: [
      { label: "图文并茂", icon: "🖼️" },
      { label: "简约清新", icon: "✨" },
      { label: "学术严谨", icon: "📊" },
      { label: "活泼可爱", icon: "🌈" },
    ],
  },
  {
    key: "focus",
    question: "重点要讲哪些方面？（可以不填，AI 自动规划）",
    placeholder: "比如：重点讲过程和意义、多举例子...",
    options: null, // free input only, optional
    optional: true,
  },
];

type Answers = Record<string, string>;

export default function PPTPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Outline generation
  const [outline, setOutline] = useState<string[] | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);

  // PPT generation
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [result, setResult] = useState<{
    downloadUrl?: string;
    viewUrl?: string;
    embedUrl?: string;
  } | null>(null);
  const [error, setError] = useState("");

  const currentStep = STEPS[step];
  const isLastStep = step >= STEPS.length;

  function selectOption(value: string) {
    const key = currentStep.key;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    setCustomInput("");
    setShowCustom(false);
    advanceStep(newAnswers);
  }

  function submitCustom() {
    if (!customInput.trim() && !currentStep.optional) return;
    const key = currentStep.key;
    const value = customInput.trim() || "（AI 自动规划）";
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    setCustomInput("");
    setShowCustom(false);
    advanceStep(newAnswers);
  }

  function skipOptional() {
    const key = currentStep.key;
    const newAnswers = { ...answers, [key]: "" };
    setAnswers(newAnswers);
    advanceStep(newAnswers);
  }

  function advanceStep(newAnswers: Answers) {
    const nextStep = step + 1;
    if (nextStep >= STEPS.length) {
      setStep(nextStep);
      generateOutline(newAnswers);
    } else {
      setStep(nextStep);
    }
  }

  async function generateOutline(data: Answers) {
    setOutlineLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ppt/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("生成大纲失败");

      const text = await res.text();
      // Parse numbered lines
      const lines = text
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s*/, "").trim())
        .filter((l) => l.length > 0);
      setOutline(lines);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setOutlineLoading(false);
    }
  }

  function updateOutlineItem(index: number, value: string) {
    if (!outline) return;
    const newOutline = [...outline];
    newOutline[index] = value;
    setOutline(newOutline);
  }

  function addOutlineItem() {
    if (!outline) return;
    setOutline([...outline, "新页面"]);
  }

  function removeOutlineItem(index: number) {
    if (!outline || outline.length <= 2) return;
    setOutline(outline.filter((_, i) => i !== index));
  }

  async function handleGeneratePPT() {
    if (!outline) return;
    setGenerating(true);
    setError("");
    setProgress(0);
    setProgressText("正在提交到 Gamma...");

    const numSlides = parseInt(answers.slides) || outline.length;

    // Smoother progress: fast to 30%, slow to 70%, crawl to 90%
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p < 30) return p + 3;
        if (p < 70) return p + 1;
        if (p < 90) return p + 0.3;
        return p;
      });
      setProgressText((prev) => {
        if (prev.includes("提交")) return "Gamma 正在生成 PPT...";
        return prev;
      });
    }, 1000);

    // 3 minute timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      const res = await fetch("/api/ppt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outline,
          topic: answers.topic,
          numSlides,
          style: answers.style,
          purpose: answers.purpose,
        }),
        signal: controller.signal,
      });

      clearInterval(progressInterval);
      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失败");
      }

      const data = await res.json();
      setProgress(100);
      setProgressText("完成！");
      setResult(data);
      if (data.embedUrl || data.viewUrl) {
        await addToGallery({
          type: "ppt",
          imageUrl: data.embedUrl || data.viewUrl,
          prompt: answers.topic,
          style: answers.style || "PPT",
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("生成超时（超过3分钟），Gamma 服务器可能繁忙，请稍后重试");
      } else {
        setError(err instanceof Error ? err.message : "生成失败");
      }
    } finally {
      clearInterval(progressInterval);
      clearTimeout(timeout);
      setGenerating(false);
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setCustomInput("");
    setShowCustom(false);
    setOutline(null);
    setOutlineLoading(false);
    setGenerating(false);
    setProgress(0);
    setResult(null);
    setError("");
  }

  return (
    <div className={`mx-auto px-4 pt-4 pb-6 ${result ? "max-w-2xl" : "max-w-lg"}`}>
      <header className="mb-6">
        <h1 className="text-lg font-bold">📊 AI PPT 生成</h1>
        <p className="text-xs text-muted-foreground">
          回答几个问题，AI 帮你制作精美 PPT
        </p>
      </header>

      {/* Already answered questions */}
      <div className="space-y-3 mb-4">
        {STEPS.slice(0, step).map((s, i) => (
          <div key={s.key} className="space-y-1">
            <p className="text-xs text-muted-foreground">{s.question}</p>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-pink-600 px-3 py-1 text-sm text-white">
                {answers[s.key] || "跳过"}
              </span>
              {i === step - 1 && !isLastStep && (
                <button
                  onClick={() => {
                    setStep(i);
                    setShowCustom(false);
                    setCustomInput("");
                  }}
                  className="text-xs text-pink-600 hover:underline"
                >
                  修改
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current question */}
      {!isLastStep && currentStep && (
        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <p className="font-medium text-sm">{currentStep.question}</p>

          {/* Option buttons */}
          {currentStep.options && !showCustom && (
            <div className="grid grid-cols-2 gap-2">
              {currentStep.options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => selectOption(opt.label)}
                  className="flex items-center gap-2 rounded-xl border-2 border-transparent bg-gray-50 px-4 py-3 text-sm font-medium transition-all hover:border-pink-300 hover:bg-pink-50 active:scale-[0.97]"
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Custom input toggle */}
          {currentStep.options && !showCustom && (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full rounded-xl border border-dashed border-gray-300 py-2.5 text-sm text-muted-foreground hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              ✏️ 自己输入
            </button>
          )}

          {/* Free input (when no options or custom mode) */}
          {(!currentStep.options || showCustom) && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={currentStep.placeholder || "输入你的想法..."}
                  className="h-11"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitCustom();
                  }}
                />
                <Button onClick={submitCustom} className="h-11 px-5 shrink-0">
                  确定
                </Button>
              </div>
              {currentStep.optional && (
                <button
                  onClick={skipOptional}
                  className="text-xs text-muted-foreground hover:text-pink-600"
                >
                  跳过，让 AI 自动规划 →
                </button>
              )}
              {showCustom && (
                <button
                  onClick={() => setShowCustom(false)}
                  className="text-xs text-muted-foreground hover:text-pink-600"
                >
                  ← 返回选择
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Outline loading */}
      {outlineLoading && (
        <div className="rounded-2xl bg-white p-5 shadow-sm text-center">
          <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
          <p className="text-sm text-muted-foreground">AI 正在规划大纲...</p>
        </div>
      )}

      {/* Editable outline */}
      {outline && !generating && !result && (
        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm">📋 大纲预览（可编辑）</p>
            <button
              onClick={addOutlineItem}
              className="text-xs text-pink-600 hover:underline"
            >
              + 添加一页
            </button>
          </div>
          <ol className="space-y-2 text-sm">
            {outline.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-pink-100 text-xs font-medium text-pink-600">
                  {i + 1}
                </span>
                <input
                  value={item}
                  onChange={(e) => updateOutlineItem(i, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm focus:border-pink-400 focus:outline-none focus:ring-1 focus:ring-pink-400"
                />
                {outline.length > 2 && (
                  <button
                    onClick={() => removeOutlineItem(i)}
                    className="shrink-0 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                    title="删除"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Button onClick={handleGeneratePPT} className="flex-1 h-11">
              🚀 开始生成 PPT
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOutline(null);
                generateOutline(answers);
              }}
              className="h-11"
            >
              🔄 换一版
            </Button>
          </div>
        </div>
      )}

      {/* Generating progress */}
      {generating && (
        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
          <p className="text-sm font-medium">{progressText || "正在生成 PPT..."}</p>
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {Math.round(progress)}% · 预计需要 30-120 秒，请耐心等待
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
            <div className="text-center">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-medium text-green-600">PPT 生成完成！</p>
            </div>

            {/* Embedded preview */}
            {result.embedUrl && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">在线预览</p>
                <div className="relative w-full overflow-hidden rounded-xl border bg-gray-50" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={result.embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    style={{ border: "none" }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {result.downloadUrl && (
                <a
                  href={result.downloadUrl}
                  download
                  className="flex items-center justify-center gap-2 rounded-xl bg-pink-600 py-3 text-sm font-medium text-white hover:bg-pink-700 transition-colors"
                >
                  ⬇️ 下载 PPT 文件
                </a>
              )}
              <div className="flex gap-2">
                {result.viewUrl && (
                  <a
                    href={result.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    ✏️ 在线编辑
                  </a>
                )}
                <Button variant="outline" onClick={handleReset} className="flex-1 h-auto py-2.5">
                  ✨ 再做一个
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button
            onClick={handleReset}
            className="ml-2 underline hover:no-underline"
          >
            重新开始
          </button>
        </div>
      )}

      {/* Progress indicator */}
      {!result && (
        <div className="mt-6 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < step
                  ? "w-6 bg-pink-600"
                  : i === step
                    ? "w-6 bg-pink-300"
                    : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
