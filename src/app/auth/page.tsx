"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nim, setNim] = useState("");
  const [nama, setNama] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
      } else {
        // Register
        if (!nim || !nama) {
          setError("NIM dan Nama harus diisi");
          setIsLoading(false);
          return;
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Sync with public.users table
          const { error: profileError } = await supabase
            .from("users")
            .insert([
              {
                id: signUpData.user.id,
                nim,
                nama,
                email,
              },
            ]);

          if (profileError) {
            console.error("Error creating public profile:", profileError);
            // Even if profile fails, user is created in Auth
          }
        }
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-50">EduLink</span>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glow-card rounded-2xl p-6 sm:p-8"
        >
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-50 mb-2">
              {mode === "login" ? "Selamat Datang!" : "Daftar Akun Baru"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Masuk untuk bergabung dengan sesi belajar"
                : "Buat akun untuk mulai membuat sesi belajar"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  key="register-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* NIM */}
                  <div className="space-y-1.5">
                    <Label htmlFor="nim" className="text-slate-300">
                      NIM
                    </Label>
                    <Input
                      id="nim"
                      type="text"
                      placeholder="212345678"
                      value={nim}
                      onChange={(e) => setNim(e.target.value)}
                      disabled={isLoading}
                      className="bg-input/30 border-border/50 focus:border-indigo-500"
                    />
                  </div>

                  {/* Nama */}
                  <div className="space-y-1.5">
                    <Label htmlFor="nama" className="text-slate-300">
                      Nama Lengkap
                    </Label>
                    <Input
                      id="nama"
                      type="text"
                      placeholder="Nama Anda"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      disabled={isLoading}
                      className="bg-input/30 border-border/50 focus:border-indigo-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-input/30 border-border/50 focus:border-indigo-500"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-input/30 border-border/50 focus:border-indigo-500 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-red-400 text-center"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-10"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {mode === "login" ? "Masuk..." : "Mendaftar..."}
                </span>
              ) : mode === "login" ? (
                "Masuk"
              ) : (
                "Daftar"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">atau</span>
            </div>
          </div>

          {/* Toggle Mode */}
          <p className="text-sm text-center text-muted-foreground">
            {mode === "login"
              ? "Belum punya akun?"
              : "Sudah punya akun?"}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {mode === "login" ? "Daftar" : "Masuk"}
            </button>
          </p>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6"
        >
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-slate-300 transition-colors"
          >
            ← Kembali ke Beranda
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}
