"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("WPaJiShoes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Login failed");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paji-charcoal px-4">
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-paji-orange/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-paji-orange/10 blur-3xl" />
      <form onSubmit={onSubmit} className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 shadow-2xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-paji-orange">Paji Shoes</p>
        <h1 className="mt-2 text-2xl font-bold text-paji-charcoal">Admin Login</h1>
        <p className="mt-1 text-sm text-gray-500">Username is case-insensitive</p>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username
            </label>
            <Input
              id="username"
              placeholder="WPaJiShoes"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
