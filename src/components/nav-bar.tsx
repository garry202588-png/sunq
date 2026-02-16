"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { href: "/", icon: "🏠", label: "首页" },
  { href: "/draw", icon: "🎨", label: "绘画" },
  { href: "/ppt", icon: "📊", label: "PPT" },
  { href: "/chat", icon: "💬", label: "问答" },
  { href: "/mindmap", icon: "🧠", label: "脑图" },
  { href: "/tools", icon: "🧰", label: "工具" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Expandable menu grid */}
      <div
        className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-xl">
          {MENU_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-5 py-3 text-xs transition-all active:scale-95 ${
                  active
                    ? "bg-pink-100 text-pink-600 font-medium"
                    : "text-gray-600 hover:bg-pink-50"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-90 safe-bottom ${
          open
            ? "bg-gray-700 rotate-45"
            : "bg-gradient-to-r from-pink-500 to-rose-500"
        }`}
      >
        <span className="text-2xl text-white leading-none">
          {open ? "+" : "✨"}
        </span>
      </button>
    </>
  );
}
