"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Wifi, Radio } from "lucide-react";
import { computeLiveClassStatus, resolveImageUrl } from "@/lib/utils/course";
import { joinLiveClass } from "@/lib/liveClass";
import Image from "next/image";

interface LiveClassCardProps {
  lc: any;
  showJoin?: boolean;
  variant?: "small" | "full";
}

export function LiveClassCard({ lc, showJoin = true, variant = "small" }: LiveClassCardProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const { isJoinable, isUpcoming, displayStatus } = computeLiveClassStatus(lc);

  const start = lc.startTime ?? lc.scheduledAt ?? lc.startsAt ?? lc.scheduledDate;
  const instructor = lc.lecturerName ?? lc.instructorName ?? lc.lecturer?.fullName;
  const duration = lc.durationMinutes ?? lc.duration ?? lc.durationInMinutes;
  const imgUrl = resolveImageUrl(lc.thumbnailUrl ?? lc.bannerImageUrl ?? lc.courseImageUrl);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinLiveClass(lc.id, router);
    } finally {
      setJoining(false);
    }
  };

  const formatClassTime = (scheduledAt: string) => {
    return new Date(scheduledAt).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (variant === "full") {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="relative h-[180px] bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-500)]">
          {imgUrl ? (
            <Image src={imgUrl} alt={lc.title} fill sizes="100vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Radio className="h-12 w-12 text-white/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${
                isJoinable ? "bg-[var(--color-primary-600)]/90" : 
                isUpcoming ? "bg-amber-500/90" : 
                "bg-gray-500/80"
              }`}>
                {isJoinable && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                {displayStatus}
            </span>
          </div>
          {isJoinable && showJoin && (
            <div className="absolute bottom-3 right-3">
              <Button
                size="sm"
                onClick={handleJoin}
                disabled={joining}
                className="bg-[#2A5D9F] text-white hover:bg-[#1E4A80]"
              >
                {joining ? "Joining..." : "Join Now"}
              </Button>
            </div>
          )}
        </div>
        <div className="p-3 space-y-1.5">
          {(lc.subjectName ?? lc.courseTitle) && (
            <p className="text-[11px] text-[var(--muted-foreground)]">{lc.subjectName ?? lc.courseTitle}</p>
          )}
          <p className="font-semibold text-sm line-clamp-2">{lc.title}</p>
          {start && (
            <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Clock className="h-3 w-3 shrink-0" />
              {formatClassTime(start)}
            </div>
          )}
          {instructor && (
            <div className="flex items-center gap-1.5 pt-1">
              <div className="h-5 w-5 rounded-full bg-[var(--color-primary-100)] overflow-hidden flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-[var(--color-primary-600)]">
                  {instructor.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">{instructor}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 w-64">
      <Card className="h-full">
        <CardContent className="py-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold line-clamp-2">{lc.title}</p>
            {isJoinable ? (
              <span className="flex items-center gap-1 shrink-0">
                <span className="h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                <Badge className="bg-[var(--color-success)] text-white text-[10px]">Live</Badge>
              </span>
            ) : (
              <Badge className="bg-[var(--color-warning)] text-white text-[10px] shrink-0">Upcoming</Badge>
            )}
          </div>
          {instructor && (
            <p className="text-xs text-[var(--muted-foreground)]">{instructor}</p>
          )}
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Clock className="h-3 w-3" />
            {start ? formatClassTime(start) : ""}
            {duration && (
              <span className="ml-1">· {duration}m</span>
            )}
          </div>
          {showJoin && isJoinable && (
            <Button
              size="sm"
              variant="default"
              className="w-full gap-1 mt-1"
              onClick={handleJoin}
              loading={joining}
              disabled={joining}
            >
              <Wifi className="h-3 w-3" />
              Join Now
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
