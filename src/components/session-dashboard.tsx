"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, RefreshCw, CheckCircle, XCircle, AlertCircle, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BentoGrid, BentoItem } from "@/components/bento-grid";
import { SessionCard } from "@/components/session-card";
import { CreateSessionModal } from "@/components/create-session-modal";
import { getStudySessions, getMyJoinedSessions } from "@/app/actions";
import { joinSession, leaveSession } from "@/app/actions";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

interface Session {
  id: string;
  title: string;
  max_capacity: number;
  current_capacity: number;
  time: string;
  location: string;
  created_at: string;
  creator_id: string;
  users?: { nama: string } | null;
  subjects?: { subject_name: string } | { subject_name: string }[] | null;
}

interface NotificationItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export function SessionDashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningIds, setJoiningIds] = useState<Set<string>>(new Set());
  const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set());
  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [user, setUser] = useState<import("@supabase/supabase-js").User | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const joined = await getMyJoinedSessions();
      setJoinedSessionIds(new Set(joined.map(s => s.id)));
    }
  }, [supabase]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudySessions();
      setSessions(data as Session[]);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      addNotification("error", "Gagal memuat sesi belajar");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUser();
    fetchSessions();
  }, [fetchUser, fetchSessions, refreshKey]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    setUser(null);
    setJoinedSessionIds(new Set());
    addNotification("info", "Berhasil keluar");
  };

  const handleJoin = async (sessionId: string) => {
    if (!user) {
      router.push("/auth");
      return;
    }
    setJoiningIds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(sessionId);
      return next;
    });
    try {
      const result = await joinSession(sessionId);
      if (result.success) {
        setJoinedSessionIds((prev) => {
          const next = new Set(Array.from(prev));
          next.add(sessionId);
          return next;
        });
        addNotification("success", "Berhasil bergabung!");
        setRefreshKey((k) => k + 1);
      } else {
        addNotification("error", result.error ?? "Gagal bergabung");
      }
    } catch (error) {
      console.error("Error joining session:", error);
      addNotification("error", "Terjadi kesalahan saat bergabung");
    } finally {
      setJoiningIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const handleLeave = async (sessionId: string) => {
    if (!user) return;
    setLeavingIds((prev) => {
      const next = new Set(Array.from(prev));
      next.add(sessionId);
      return next;
    });
    try {
      const result = await leaveSession(sessionId);
      if (result.success) {
        setJoinedSessionIds((prev) => {
          const next = new Set(prev);
          next.delete(sessionId);
          return next;
        });
        addNotification("info", "Anda telah keluar dari sesi");
        setRefreshKey((k) => k + 1);
      } else {
        addNotification("error", result.error ?? "Gagal keluar");
      }
    } catch (error) {
      console.error("Error leaving session:", error);
      addNotification("error", "Terjadi kesalahan saat keluar");
    } finally {
      setLeavingIds((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addNotification = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, type, message }]);
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 4000);
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter((session) => {
    const query = searchQuery.toLowerCase();
    const subjectName = Array.isArray(session.subjects)
      ? session.subjects[0]?.subject_name
      : session.subjects?.subject_name ?? "";

    return (
      session.title.toLowerCase().includes(query) ||
      subjectName.toLowerCase().includes(query) ||
      session.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Sesi Belajar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Temukan dan bergabung dengan sesi belajar mahasiswa lain
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Masuk sebagai</span>
                <span className="text-sm font-medium text-indigo-400">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="border-border/50 hover:bg-red-500/10 hover:text-red-400"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                <Plus className="w-4 h-4" />
                Buat Sesi
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => router.push("/auth")}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 w-full sm:w-auto"
            >
              <User className="w-4 h-4" />
              Masuk untuk Buat Sesi
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari sesi berdasarkan mata kuliah..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-input/30 border-border/50 focus:border-indigo-500"
        />
      </div>

      {/* Session Count */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-muted-foreground">
          {filteredSessions.length} sesi ditemukan
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={fetchSessions}
          className="text-muted-foreground hover:text-slate-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Bento Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-20"
          >
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-sm text-muted-foreground">Memuat sesi...</span>
            </div>
          </motion.div>
        ) : filteredSessions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-50 mb-1">
              {searchQuery ? "Sesi Tidak Ditemukan" : "Belum Ada Sesi"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {searchQuery
                ? `Tidak ada sesi yang cocok dengan "${searchQuery}"`
                : "Jadilah yang pertama membuat sesi belajar baru!"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BentoGrid>
              {filteredSessions.map((session, index) => (
                <BentoItem key={session.id} delay={index * 0.05}>
                  <SessionCard
                    session={session}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    isJoining={joiningIds.has(session.id)}
                    isLeaving={leavingIds.has(session.id)}
                    joinedSessionIds={joinedSessionIds}
                  />
                </BentoItem>
              ))}
            </BentoGrid>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Session Modal */}
      <CreateSessionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false);
          addNotification("success", "Sesi belajar berhasil dibuat!");
          setRefreshKey((k) => k + 1);
        }}
      />

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg ${
                notification.type === "success"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : notification.type === "error"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
              }`}
            >
              {notification.type === "success" && (
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              {notification.type === "error" && (
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              {notification.type === "info" && (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <p className="flex-1 text-sm">{notification.message}</p>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
