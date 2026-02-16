"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addToGallery } from "@/lib/gallery-store";

const STYLES = [
  { value: "写实", label: "📷 写实" },
  { value: "水彩", label: "🎨 水彩" },
  { value: "油画", label: "🖼️ 油画" },
  { value: "漫画", label: "✏️ 漫画" },
  { value: "像素风", label: "👾 像素" },
  { value: "中国风", label: "🏯 国风" },
];

const SIZES = [
  { value: "1:1", label: "1:1 方图" },
  { value: "16:9", label: "16:9 横版" },
  { value: "9:16", label: "9:16 竖版" },
];

const RESTYLE_STYLES = [
  { value: "水彩", label: "🎨 水彩" },
  { value: "油画", label: "🖼️ 油画" },
  { value: "漫画", label: "✏️ 漫画" },
  { value: "素描", label: "✒️ 素描" },
  { value: "像素风", label: "👾 像素" },
  { value: "中国风", label: "🏯 国风" },
  { value: "赛博朋克", label: "🌃 赛博" },
  { value: "吉卜力", label: "🌿 吉卜力" },
];

type Tab = "generate" | "restyle";

export default function DrawPage() {
  const [tab, setTab] = useState<Tab>("generate");

  // Generate state
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("写实");
  const [size, setSize] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");

  // Restyle state
  const [uploadPreview, setUploadPreview] = useState("");
  const [uploadBase64, setUploadBase64] = useState("");
  const [restyleStyle, setRestyleStyle] = useState("水彩");
  const [restyleLoading, setRestyleLoading] = useState(false);
  const [restyleResult, setRestyleResult] = useState("");
  const [restyleError, setRestyleError] = useState("");
  const [inputKey, setInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setImageUrl("");

    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, size }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成失败");
      setImageUrl(data.imageUrl);
      addToGallery({ type: "draw", imageUrl: data.imageUrl, prompt, style });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setRestyleError("图片不能超过 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadPreview(base64);
      setUploadBase64(base64);
      setRestyleResult("");
      setRestyleError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleRestyle() {
    if (!uploadBase64) return;
    setRestyleLoading(true);
    setRestyleError("");
    setRestyleResult("");

    try {
      const res = await fetch("/api/draw/restyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: uploadBase64,
          style: restyleStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "转绘失败");
      setRestyleResult(data.imageUrl);
      addToGallery({ type: "restyle", imageUrl: data.imageUrl, prompt: "风格转绘", style: restyleStyle });
    } catch (err) {
      setRestyleError(err instanceof Error ? err.message : "转绘失败");
    } finally {
      setRestyleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-6">
      <header className="mb-4">
        <h1 className="text-lg font-bold">🎨 AI 绘画</h1>
        <p className="text-xs text-muted-foreground">
          AI 文生图 & 图片风格转绘
        </p>
      </header>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 mb-4">
        <button
          onClick={() => setTab("generate")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "generate"
              ? "bg-white shadow-sm text-pink-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ✨ 文字生图
        </button>
        <button
          onClick={() => setTab("restyle")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
            tab === "restyle"
              ? "bg-white shadow-sm text-pink-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🖌️ 风格转绘
        </button>
      </div>

      {/* Generate tab */}
      {tab === "generate" && (
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="描述你想画的内容，比如：竹林中的大熊猫、星空下的城堡..."
            className="min-h-[80px] resize-none"
          />

          <div>
            <p className="text-sm font-medium mb-2">选择风格</p>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`rounded-xl py-2 text-sm transition-all ${
                    style === s.value
                      ? "bg-pink-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">选择尺寸</p>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSize(s.value)}
                  className={`rounded-xl py-2 text-sm transition-all ${
                    size === s.value
                      ? "bg-pink-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full h-11"
          >
            {loading ? "生成中..." : "✨ 开始生成"}
          </Button>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {imageUrl && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl shadow-lg">
                <img src={imageUrl} alt={prompt} className="w-full" />
              </div>
              <a
                href={imageUrl}
                download={`ai-drawing-${Date.now()}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                ⬇️ 下载图片
              </a>
            </div>
          )}
        </div>
      )}

      {/* Restyle tab */}
      {tab === "restyle" && (
        <div className="space-y-4">
          {/* Upload area */}
          <input
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!uploadPreview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center hover:border-pink-300 hover:bg-pink-50 transition-colors"
            >
              <p className="text-3xl mb-2">📸</p>
              <p className="text-sm text-muted-foreground">
                点击上传图片
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持 JPG、PNG，最大 10MB
              </p>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-2xl shadow-sm">
                <img
                  src={uploadPreview}
                  alt="上传的图片"
                  className="w-full max-h-[300px] object-contain bg-gray-50"
                />
                <button
                  onClick={() => {
                    setUploadPreview("");
                    setUploadBase64("");
                    setRestyleResult("");
                    setRestyleError("");
                    setInputKey((k) => k + 1);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white hover:bg-black/70"
                >
                  换一张
                </button>
              </div>
            </div>
          )}

          {/* Style selection */}
          <div>
            <p className="text-sm font-medium mb-2">转绘风格</p>
            <div className="grid grid-cols-4 gap-2">
              {RESTYLE_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setRestyleStyle(s.value)}
                  className={`rounded-xl py-2 text-sm transition-all ${
                    restyleStyle === s.value
                      ? "bg-pink-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRestyle}
            disabled={restyleLoading || !uploadBase64}
            className="w-full h-11"
          >
            {restyleLoading ? "转绘中...约30秒" : "🖌️ 开始转绘"}
          </Button>

          {restyleError && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {restyleError}
            </div>
          )}

          {/* Before/After comparison */}
          {restyleResult && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">
                    原图
                  </p>
                  <div className="overflow-hidden rounded-xl">
                    <img
                      src={uploadPreview}
                      alt="原图"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground text-center">
                    转绘
                  </p>
                  <div className="overflow-hidden rounded-xl shadow-lg">
                    <img
                      src={restyleResult}
                      alt="转绘结果"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                </div>
              </div>
              <a
                href={restyleResult}
                download={`restyle-${restyleStyle}-${Date.now()}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                ⬇️ 下载转绘图片
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
