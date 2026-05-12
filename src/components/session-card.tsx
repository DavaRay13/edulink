"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedButton } from "@/components/ui/animated-button";

interface Session {
  id: string;
  title: string;
  max_capacity: number;
  current_capacity: number;
  time: string;
  location: string;
  created_at: string;
  users?: { nama: string } | null;
  subjects?: { subject_name: string } | { subject_name: string }[] | null;
}

interface SessionCardProps {
  session: Session;
  onJoin: (sessionId: string) => Promise<void>;
  onLeave: (sessionId: string) => Promise<void>;
  isJoining: boolean;
  isLeaving: boolean;
  joinedSessionIds: Set<string>;
}

export function SessionCard({
  session,
  onJoin,
  onLeave,
  isJoining,
  isLeaving,
  joinedSessionIds,
}: SessionCardProps) {
  const isFull = session.current_capacity >= session.max_capacity;
  const isJoined = joinedSessionIds.has(session.id);

  const subjectName = Array.isArray(session.subjects)
    ? session.subjects[0]?.subject_name
    : session.subjects?.subject_name;

  // Determine badge variant based on capacity
  const getCapacityBadgeVariant = () => {
    const ratio = session.current_capacity / session.max_capacity;
    if (ratio >= 1) return "destructive";
    if (ratio >= 0.75) return "secondary";
    return "default";
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <Card className="glow-card h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate pr-2">{session.title}</CardTitle>
              <CardDescription className="mt-1">
                oleh <span className="text-indigo-400">{session.users?.nama ?? "Unknown"}</span>
              </CardDescription>
            </div>
            <Badge variant={getCapacityBadgeVariant()} className="shrink-0">
              <Users className="w-3 h-3 mr-1" />
              {session.current_capacity}/{session.max_capacity}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3">
          {/* Subject Badge */}
          {subjectName && (
            <Badge variant="outline" className="w-fit bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
              {subjectName}
            </Badge>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{session.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{session.location}</span>
            </div>
          </div>
        </CardContent>

        {/* Footer with Join/Leave Button */}
        <div className="px-4 pb-4 mt-auto">
          {isJoined ? (
            <AnimatedButton
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onLeave(session.id)}
              isLoading={isLeaving}
              isSuccess={false}
              disabled={isLeaving || isJoining}
              successText="Berhasil!"
              defaultText="Keluar"
            />
          ) : isFull ? (
            <AnimatedButton
              variant="secondary"
              size="sm"
              className="w-full opacity-60 cursor-not-allowed"
              disabled
              defaultText="Sesi Penuh"
            />
          ) : (
            <AnimatedButton
              variant="default"
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => onJoin(session.id)}
              isLoading={isJoining}
              isSuccess={false}
              disabled={isLeaving || isJoining}
              loadingText="Mengikuti..."
              defaultText="Ikuti Sesi"
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}
