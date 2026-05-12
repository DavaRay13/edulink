"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages, sendMessage } from "@/app/actions";
import { createClient } from "@/lib/supabase-client";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users?: { nama: string } | null;
}

interface ChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle: string;
}

export function ChatModal({
  open,
  onOpenChange,
  sessionId,
  sessionTitle,
}: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      const initChat = async () => {
        setLoading(true);
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // Fetch initial messages
        const data = await getMessages(sessionId);
        setMessages(data as Message[]);
        setLoading(false);

        // Subscribe to real-time messages
        const channel = supabase
          .channel(`session_chat:${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `session_id=eq.${sessionId}`,
            },
            async (payload) => {
              // Fetch user info for the new message
              const { data: userData } = await supabase
                .from("users")
                .select("nama")
                .eq("id", payload.new.user_id)
                .single();
              
              const newMsg = {
                ...payload.new,
                users: userData
              } as Message;
              
              setMessages((prev) => [...prev, newMsg]);
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      };

      initChat();
    }
  }, [open, sessionId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    try {
      const result = await sendMessage(sessionId, content);
      if (!result.success) {
        console.error("Failed to send message:", result.error);
        setNewMessage(content); // Restore message on failure
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#030712] border-border/50">
        <DialogHeader className="p-4 border-b border-border/30 shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-50 truncate max-w-[300px]">
                {sessionTitle}
              </span>
              <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">
                Obrolan Grup
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-indigo-500/20">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-sm">Memuat obrolan...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
                <Send className="w-6 h-6 text-indigo-500/50" />
              </div>
              <p className="text-sm text-slate-400">Belum ada pesan</p>
              <p className="text-xs text-muted-foreground mt-1">
                Mulailah obrolan dengan teman belajarmu!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe && (
                      <span className="text-[10px] font-bold text-indigo-400">
                        {msg.users?.nama || "User"}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/30 shrink-0 bg-slate-950/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ketik pesan..."
              className="bg-input/30 border-border/50 focus:border-indigo-500 flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || sending}
              className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
