"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Image as ImageIcon, Mic, Square, Trash2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMessages, sendMessage, deleteMessage } from "@/app/actions";
import { createClient } from "@/lib/supabase-client";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  attachment_url?: string;
  attachment_type?: "image" | "audio";
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
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const supabase = createClient();

  const scrollToBottom = useCallback((behavior: "smooth" | "auto" = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchMessages = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    const data = await getMessages(sessionId);
    setMessages(data as Message[]);
    if (isInitial) setLoading(false);
    
    // Use timeout to ensure DOM is updated before scrolling
    setTimeout(() => scrollToBottom(isInitial ? "auto" : "smooth"), 100);
  }, [sessionId, scrollToBottom]);

  useEffect(() => {
    if (open) {
      const initChat = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        await fetchMessages(true);

        const channel = supabase
          .channel(`session_chat:${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "*", // Listen for all events (INSERT, DELETE)
              schema: "public",
              table: "messages",
              filter: `session_id=eq.${sessionId}`,
            },
            async (payload) => {
              if (payload.eventType === 'INSERT') {
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
              } else if (payload.eventType === 'DELETE') {
                setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      };

      initChat();
    }
  }, [open, sessionId, supabase, fetchMessages]);

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
        setNewMessage(content);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteMessage(id);
      if (!result.success) {
        alert("Gagal menghapus pesan: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat_attachments')
        .getPublicUrl(filePath);

      await sendMessage(sessionId, "Mengirim gambar", publicUrl, 'image');
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const fileName = `${Math.random()}.webm`;
        const filePath = `audio/${fileName}`;

        setUploading(true);
        try {
          const { error: uploadError } = await supabase.storage
            .from('chat_attachments')
            .upload(filePath, audioBlob);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('chat_attachments')
            .getPublicUrl(filePath);

          await sendMessage(sessionId, "Pesan suara", publicUrl, 'audio');
        } catch (error) {
          console.error("Error uploading audio:", error);
        } finally {
          setUploading(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Could not start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && recording) {
      mediaRecorder.current.stop();
      setRecording(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#030712] border-border/50">
        <DialogHeader className="p-4 border-b border-border/30 shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-50 truncate pr-4">
                {sessionTitle}
              </span>
              <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-bold">
                Obrolan Grup
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => fetchMessages()}
              className="text-muted-foreground hover:text-indigo-400"
              title="Refresh Pesan"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
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
                  className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
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
                    {isMe && (
                      <button 
                        onClick={() => handleDelete(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-500/50 hover:text-red-500"
                        title="Hapus Pesan"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl text-sm relative ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-none"
                    } ${msg.attachment_type === 'image' ? 'p-1' : 'px-3 py-2'}`}
                  >
                    {msg.attachment_type === 'image' && msg.attachment_url && (
                      <img 
                        src={msg.attachment_url} 
                        alt="Attachment" 
                        className="rounded-xl max-w-full h-auto cursor-pointer"
                        onClick={() => window.open(msg.attachment_url, '_blank')}
                      />
                    )}
                    {msg.attachment_type === 'audio' && msg.attachment_url && (
                      <audio controls className="h-10 w-48 sm:w-64">
                        <source src={msg.attachment_url} type="audio/webm" />
                      </audio>
                    )}
                    <p className={msg.attachment_type ? "mt-1 px-2 pb-1" : ""}>{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border/30 shrink-0 bg-slate-950/50">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleUpload} 
                className="hidden" 
                accept="image/*"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || recording || sending}
                className="text-muted-foreground hover:text-indigo-400"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={recording ? stopRecording : startRecording}
                disabled={uploading || sending}
                className={`${recording ? "text-red-500 bg-red-500/10 animate-pulse" : "text-muted-foreground hover:text-indigo-400"}`}
              >
                {recording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
              </Button>

              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={recording ? "Sedang merekam..." : "Ketik pesan..."}
                className="bg-input/30 border-border/50 focus:border-indigo-500 flex-1"
                disabled={sending || recording}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!newMessage.trim() || sending || recording || uploading}
                className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
              >
                {sending || uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {uploading && (
              <p className="text-[10px] text-center text-indigo-400 animate-pulse">
                Sedang mengunggah file...
              </p>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
