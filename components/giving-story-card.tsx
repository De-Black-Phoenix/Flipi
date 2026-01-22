"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Heart,
  Bookmark,
  MoreHorizontal,
  Share2,
  Flag,
  ChevronLeft,
  ChevronRight,
  Gift,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

/* ---------- types ---------- */

interface GivingStoryCardProps {
  item: {
    id: string;
    title: string;
    description?: string;
    category: string;
    condition: string;
    images?: string[];
    town: string;
    region: string;
    status: string;
    like_count?: number;
    owner_id: string;
    profiles?: {
      id: string;
      full_name: string;
      avatar_url: string | null;
      rank?: string;
    };
  };
  currentUserId?: string;
}

/* ---------- rank helper ---------- */

const getRankInfo = (rank?: string) => {
  const map: Record<string, { emoji: string; name: string }> = {
    Seed: { emoji: "🌱", name: "Seed" },
    Helper: { emoji: "🤝", name: "Helper" },
    Giver: { emoji: "🎁", name: "Giver" },
    Hero: { emoji: "⭐", name: "Hero" },
    Champion: { emoji: "🏅", name: "Champion" },
    Guardian: { emoji: "🕊", name: "Guardian" },
  };
  return map[rank ?? "Seed"] ?? map.Seed;
};

export function GivingStoryCard({ item, currentUserId }: GivingStoryCardProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAppreciated, setIsAppreciated] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);

  const [appreciationCount, setAppreciationCount] = useState(item.like_count ?? 0);
  const [saveCount, setSaveCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");

  const [showAppreciationAnimation, setShowAppreciationAnimation] = useState(false);

  const imageContainerRef = useRef<HTMLDivElement>(null);

  const images = item.images ?? [];
  const hasMultipleImages = images.length > 1;
  const owner = item.profiles;
  const rankInfo = getRankInfo(owner?.rank);

  /* ---------- auth ---------- */

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, [supabase]);


  /* ---------- load counts & state ---------- */

  useEffect(() => {
    const load = async () => {
      // counts
      const [saved, shared] = await Promise.all([
        (async () => {
          const { count } = await supabase
            .from("saved_items")
            .select("*", { count: "exact", head: true })
            .eq("item_id", item.id);
          return count ?? 0;
        })(),
        (async () => {
          const { count } = await supabase
            .from("item_shares")
            .select("*", { count: "exact", head: true })
            .eq("item_id", item.id);
          return count ?? 0;
        })(),
      ]);

      setSaveCount(saved);
      setShareCount(shared);

      if (!user) return;

      const [like, save, share] = await Promise.all([
        supabase
          .from("item_likes")
          .select("id")
          .eq("item_id", item.id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("saved_items")
          .select("id")
          .eq("item_id", item.id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("item_shares")
          .select("id")
          .eq("item_id", item.id)
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      setIsAppreciated(!!like.data);
      setIsSaved(!!save.data);
      setIsShared(!!share.data);
    };

    load();
  }, [user, item.id, supabase]);

  /* ---------- swipe ---------- */

  const minSwipeDistance = 50;
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(0);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance && hasMultipleImages) {
      setCurrentImageIndex((i) => (i + 1) % images.length);
    }
    if (distance < -minSwipeDistance && hasMultipleImages) {
      setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
    }
  }, [touchStart, touchEnd, hasMultipleImages, images.length]);

  /* ---------- handlers ---------- */

  const handleAppreciate = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }

    const optimistic = !isAppreciated;
    setIsAppreciated(optimistic);
    setAppreciationCount((c) => (optimistic ? c + 1 : Math.max(0, c - 1)));

    if (optimistic) {
      setShowAppreciationAnimation(true);
      setTimeout(() => setShowAppreciationAnimation(false), 700);
    }

    try {
      await fetch("/api/item/like", {
        method: "POST",
        body: JSON.stringify({ itemId: item.id }),
      });
    } catch {
      setIsAppreciated(!optimistic);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const optimistic = !isSaved;
    setIsSaved(optimistic);
    setSaveCount((c) => (optimistic ? c + 1 : Math.max(0, c - 1)));

    try {
      await fetch("/api/item/save", {
        method: "POST",
        body: JSON.stringify({ itemId: item.id }),
      });
    } catch {
      setIsSaved(!optimistic);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/items/${item.id}`;
    setIsShared(true);
    setShareCount((c) => c + 1);

    try {
      await navigator.share?.({ url, title: item.title });
    } catch {
      await navigator.clipboard.writeText(url);
    }
  };

  const handleReport = async () => {
    if (!user || !reportReason) return;

    await fetch("/api/item/report", {
      method: "POST",
      body: JSON.stringify({
        itemId: item.id,
        reason: reportReason,
        details: reportDetails || null,
      }),
    });

    setReportModalOpen(false);
    setReportReason("");
    setReportDetails("");
  };

  /* ---------- render ---------- */

  const conditionLabels: Record<string, string> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
  };

  return (
    <>
      <Card className="overflow-hidden border-border/60 bg-card shadow-sm">
        <div className="p-3 md:p-3 pb-2 md:pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={owner?.avatar_url ?? undefined} />
                <AvatarFallback>{owner?.full_name?.slice(0, 1) ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-xs truncate text-foreground">
                  <span className="user-name">{owner?.full_name ?? "Unknown"}</span>
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {rankInfo.emoji} {rankInfo.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="More"
                    className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-[18px] h-[18px]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setReportModalOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Flag className="w-[18px] h-[18px]" /> Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <Link href={`/items/${item.id}`} className="block">
          <div className="relative w-full aspect-[4/3] bg-muted">
            {images[0] ? (
              <Image
                src={images[0]}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Gift className="w-10 h-10" />
              </div>
            )}
          </div>
        </Link>

        <div className="p-3 md:p-3 space-y-1.5">

          <div className="min-w-0">
            <Link href={`/items/${item.id}`} className="block">
              <div className="font-semibold text-sm leading-tight truncate font-[var(--font-bricolage)]">
                {item.title}
              </div>
            </Link>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {item.category} • {conditionLabels[item.condition] ?? item.condition}
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAppreciate();
              }}
              className={`inline-flex items-center gap-1.5 text-xs ${
                isAppreciated ? "text-red-600" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Appreciate"
            >
              <Heart className={`w-4 h-4 ${isAppreciated ? "fill-current" : ""}`} />
              <span>{appreciationCount}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              className={`inline-flex items-center gap-1.5 text-xs ${
                isSaved ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Save"
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
              <span>{saveCount}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare();
              }}
              className={`inline-flex items-center gap-1.5 text-xs ${
                isShared ? "text-emerald-600" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Share"
            >
              <Share2 className="w-[18px] h-[18px]" />
              <span>{shareCount}</span>
            </button>
          </div>
        </div>
      </Card>

      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report item</DialogTitle>
            <DialogDescription>
              Help us keep Flipi safe. Choose a reason and optionally add details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reason</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason} className="grid gap-2">
                {["Spam", "Inappropriate", "Scam", "Other"].map((r) => (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={`reason-${item.id}-${r}`} />
                    <Label htmlFor={`reason-${item.id}-${r}`}>{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Details (optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Add details…"
                maxLength={1000}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleReport();
                  toast({ title: "Report submitted" });
                }}
                disabled={!reportReason}
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
