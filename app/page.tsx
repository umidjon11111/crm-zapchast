"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Package } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Foydalanuvchi nomi yoki parol noto'g'ri");
      }
    } catch {
      setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-2xl shadow-lg mb-4">
            <Package className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Zapchast Omborxona
          </h1>
          <p className="text-slate-500 text-sm mt-1">Inventarizatsiya tizimi</p>
        </div>

        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center text-slate-700">
              Tizimga kirish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-base font-medium text-slate-700"
                >
                  Foydalanuvchi nomi
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-base font-medium text-slate-700"
                >
                  Parol
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="h-12 text-base rounded-xl border-slate-200 focus:border-blue-500"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Kirish...
                  </>
                ) : (
                  "Kirish"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
