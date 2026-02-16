"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("密码不对哦，再试试~");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="text-6xl">🎨</div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent">心晴创作室</h1>
          <p className="text-sm text-muted-foreground">输入密码进入</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-center text-lg"
            autoFocus
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
            {loading ? "验证中..." : "进入"}
          </Button>
        </form>
      </div>
    </div>
  );
}
