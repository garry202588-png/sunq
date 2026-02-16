"use client";

import { useState, useEffect } from "react";
import { getGallery, removeFromGallery, type GalleryItem } from "@/lib/gallery-store";

const TYPE_LABELS: Record<string, string> = {
  draw: "画作",
  restyle: "转绘",
  ppt: "PPT",
};

export default function HomePage() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    setGallery(getGallery());
  }, []);

  function handleRemove(id: string) {
    removeFromGallery(id);
    setGallery(getGallery());
  }

  return (
    <div className="mx-auto max-w-5xl px-3 sm:px-6 pt-8 pb-6">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">
          心晴的创作空间
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">每一次创作都值得被记住</p>
      </header>

      {/* Gallery */}
      {gallery.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-6xl mb-4">🎨</div>
          <p className="text-lg font-medium text-gray-500">还没有作品呢</p>
          <p className="mt-2 text-sm text-muted-foreground">
            点击下方 ✨ 按钮，开始你的第一次创作吧！
          </p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {gallery.map((item) => (
            <div
              key={item.id}
              className="mb-3 break-inside-avoid group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <img
                src={item.imageUrl}
                alt={item.prompt}
                className="w-full"
                loading="lazy"
              />
              {/* Overlay with type label */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent p-3 pt-8">
                <span className="inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-pink-600 backdrop-blur-sm">
                  {TYPE_LABELS[item.type] || item.type}
                </span>
                {item.prompt && (
                  <p className="mt-1 text-xs text-white/90 line-clamp-1">
                    {item.prompt}
                  </p>
                )}
              </div>
              {/* Delete button on hover */}
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute top-2 right-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
