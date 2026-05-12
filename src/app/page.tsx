"use client";

import { motion } from "framer-motion";
import { BookOpen, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionDashboard } from "@/components/session-dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712]">
      {/* Header */}
      <header className="border-b border-border/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-50">EduLink</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-slate-50 hidden sm:flex"
              onClick={() => window.location.href = "/auth"}
            >
              Masuk
            </Button>
            <Button
              variant="outline"
              className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10"
              onClick={() => window.location.href = "/auth"}
            >
              Daftar
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 pt-16 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-50 mb-4">
              Temukan Teman
              <span className="text-indigo-500"> Belajar</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8">
              Platform sederhana untuk mahasiswa menemukan sesi diskusi dan
              belajar bersama berdasarkan mata kuliah
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-300">Grup Belajar</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
              >
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-300">Real-time Update</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span className="text-sm text-slate-300">Berbagai Mata Kuliah</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-20">
        <SessionDashboard />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            EduLink — Dibuat untuk kebutuhan Basis Data 2
          </p>
        </div>
      </footer>
    </div>
  );
}
