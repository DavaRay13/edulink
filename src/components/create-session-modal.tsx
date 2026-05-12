"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedButton } from "@/components/ui/animated-button";
import { createStudySession, getSubjects } from "@/app/actions";

interface Subject {
  id: string;
  subject_name: string;
}

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSessionModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateSessionModalProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("5");

  // Fetch subjects when modal opens
  useEffect(() => {
    if (open) {
      setLoadingSubjects(true);
      getSubjects()
        .then((data) => {
          setSubjects(data as Subject[]);
          if (data.length > 0) {
            setSubjectId((data as Subject[])[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingSubjects(false));
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setSubjectId("");
      setLocation("");
      setTime("");
      setMaxCapacity("5");
      setError(null);
      setIsSuccess(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subjectId || !location || !time || !maxCapacity) {
      setError("Semua field harus diisi!");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // For demo purposes - in production, get user ID from auth
    // Using first user from seed data
    const DEMO_CREATOR_ID = "b0000001-0001-0001-0001-000000000001";

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subject_id", subjectId);
      formData.append("location", location);
      formData.append("time", time);
      formData.append("max_capacity", maxCapacity);
      formData.append("creator_id", DEMO_CREATOR_ID);

      const result = await createStudySession(formData);

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1000);
      } else {
        setError(result.error ?? "Gagal membuat sesi. Silakan coba lagi.");
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Buat Sesi Belajar Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Judul Sesi</Label>
            <Input
              id="title"
              type="text"
              placeholder="Contoh: Diskusi Basis Data"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Mata Kuliah</Label>
            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat...
              </div>
            ) : (
              <select
                id="subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={isSubmitting}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
              >
                {subjects.length === 0 ? (
                  <option value="">Tidak ada mata kuliah</option>
                ) : (
                  subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Lokasi</Label>
            <Input
              id="location"
              type="text"
              placeholder="Contoh: Perpustakaan Lantai 2"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Time */}
          <div className="space-y-1.5">
            <Label htmlFor="time">Waktu</Label>
            <Input
              id="time"
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={isSubmitting}
              className="dark:[color-scheme:dark]"
            />
          </div>

          {/* Max Capacity */}
          <div className="space-y-1.5">
            <Label htmlFor="max_capacity">Kapasitas Maksimal</Label>
            <Input
              id="max_capacity"
              type="number"
              min="2"
              max="50"
              placeholder="5"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <AnimatedButton
              type="submit"
              variant="default"
              className="bg-indigo-600 hover:bg-indigo-700"
              isLoading={isSubmitting}
              isSuccess={isSuccess}
              loadingText="Membuat..."
              successText="Berhasil!"
              disabled={isSubmitting || isSuccess}
            >
              Buat Sesi
            </AnimatedButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}