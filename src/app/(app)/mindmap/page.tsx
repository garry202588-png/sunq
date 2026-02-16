"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MindmapPage() {
  const [topic, setTopic] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const svgRef = useRef<HTMLDivElement>(null);
  const markmapRef = useRef<{ mm: unknown; svg: SVGSVGElement } | null>(null);

  const renderMarkmap = useCallback(async (md: string) => {
    if (!svgRef.current || !md) return;

    const { Transformer } = await import("markmap-lib");
    const { Markmap } = await import("markmap-view");

    const transformer = new Transformer();
    const { root } = transformer.transform(md);

    // Clear previous
    svgRef.current.innerHTML = "";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("style", "width:100%;height:100%");
    svgRef.current.appendChild(svg);

    const mm = Markmap.create(svg, { autoFit: true }, root);
    markmapRef.current = { mm: mm, svg };
  }, []);

  useEffect(() => {
    if (markdown) {
      renderMarkmap(markdown);
    }
  }, [markdown, renderMarkmap]);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setMarkdown("");

    try {
      const res = await fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!res.ok) throw new Error("生成失败");

      const fullText = await res.text();
      setMarkdown(fullText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportPNG() {
    if (!svgRef.current) return;
    const { toPng } = await import("html-to-image");
    try {
      const dataUrl = await toPng(svgRef.current, { backgroundColor: "#fff" });
      const link = document.createElement("a");
      link.download = `mindmap-${topic}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setError("导出失败");
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4 pb-6">
      <header className="mb-4">
        <h1 className="text-lg font-bold">🧠 思维导图</h1>
        <p className="text-xs text-muted-foreground">
          输入一个主题，自动生成思维导图
        </p>
      </header>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="输入主题，如：唐朝历史、光合作用..."
            className="h-11"
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="h-11 px-6 shrink-0"
          >
            {loading ? "生成中..." : "生成"}
          </Button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {markdown && (
          <>
            <div
              ref={svgRef}
              className="h-[400px] overflow-hidden rounded-2xl border bg-white shadow-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportPNG}
                className="flex-1"
              >
                ⬇️ 导出 PNG
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const blob = new Blob([markdown], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `mindmap-${topic}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1"
              >
                📄 导出 Markdown
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
