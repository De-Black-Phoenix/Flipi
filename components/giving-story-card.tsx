"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Heart, Bookmark, MoreHorizontal, Share2, Flag, ChevronLeft, ChevronRight, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

// Rank tier information
const getRankInfo = (rank?: string) => {
  const rankMap: Record<string, { emoji: string; name: string }> = {
    Seed: { emoji: "🌱", name: "Seed" },
    Helper: { emoji: "🤝", name: "Helper" },
    Giver: { emoji: "🎁", name: "Giver" },
    Hero: { emoji: "⭐", name: "Hero" },
    Champion: { emoji: "🏅", name: "Champion" },
    Guardian: { emoji: "🕊", name: "Guardian" },
  };
  return rankMap[rank || "Seed"] || rankMap["Seed"];
};

export function GivingStoryCard({ item, currentUserId }: GivingStoryCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAppreciated, setIsAppreciated] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [appreciationCount, setAppreciationCount] = useState(item.like_count || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [showAppreciationAnimation, setShowAppreciationAnimation] = useState(false);
  const [saveCount, setSaveCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const images = item.images && item.images.length > 0 ? item.images : [];
  const hasMultipleImages = images.length > 1;
  const owner = item.profiles;
  const isOwner = currentUserId === item.owner_id;
  const rankInfo = getRankInfo(owner?.rank);

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  // Load appreciation and save state
  useEffect(() => {
    const loadState = async () => {
      try {
        // Load counts (for all users)
        const [saveCountResult, shareCountResult] = await Promise.all([
          supabase
            .from("saved_items")
            .select("*", { count: "exact", head: true })
            .eq("item_id", item.id)
            .catch(() => ({ count: 0, error: null })),
          supabase
            .from("item_shares")
            .select("*", { count: "exact", head: true })
            .eq("item_id", item.id)
            .catch(() => ({ count: 0, error: null })),
        ]);
        
        if (saveCountResult.count !== null) {
          setSaveCount(saveCountResult.count);
        }
        if (shareCountResult.count !== null) {
          setShareCount(shareCountResult.count);
        }

        if (!user) return;

        const [appreciationResult, saveResult, shareResult] = await Promise.all([
          supabase
            .from("item_likes")
            .select("id")
            .eq("item_id", item.id)
            .eq("user_id", user.id)
            .single()
            .catch(() => ({ data: null, error: null })),
          supabase
            .from("saved_items")
            .select("id")
            .eq("item_id", item.id)
            .eq("user_id", user.id)
            .single()
            .catch(() => ({ data: null, error: null })),
          supabase
            .from("item_shares")
            .select("id")
            .eq("item_id", item.id)
            .eq("user_id", user.id)
            .single()
            .catch(() => ({ data: null, error: null })),
        ]);

        setIsAppreciated(!!appreciationResult.data);
        setIsSaved(!!saveResult.data);
        setIsShared(!!shareResult.data);
      } catch (error) {
        // Silently fail if tables don't exist yet
        console.error("Error loading social state:", error);
      }
    };

    loadState();
  }, [user, item.id]);

  // Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
    if (isRightSwipe && hasMultipleImages) {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [touchStart, touchEnd, hasMultipleImages, images.length]);

  const handleAppreciate = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to appreciate giving stories",
        variant: "destructive",
      });
      return;
    }

    const newAppreciated = !isAppreciated;
    setIsAppreciated(newAppreciated);
    setAppreciationCount((prev) => (newAppreciated ? prev + 1 : Math.max(0, prev - 1)));

    if (newAppreciated) {
      setShowAppreciationAnimation(true);
      setTimeout(() => setShowAppreciationAnimation(false), 800);
    }

    try {
      // Always use POST - API handles toggle
      const response = await fetch("/api/item/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update appreciation");
      }

      const responseData = await response.json().catch(() => ({}));
      // Update state based on API response
      if (responseData.action === "unliked") {
        setIsAppreciated(false);
        setAppreciationCount((prev) => Math.max(0, prev - 1));
      } else {
        setIsAppreciated(true);
        setAppreciationCount((prev) => prev + 1);
      }

      // Try to refresh appreciation count from database
      try {
        const { count: appreciationCountData } = await supabase
          .from("item_likes")
          .select("*", { count: "exact", head: true })
          .eq("item_id", item.id);
        
        if (appreciationCountData !== null) {
          setAppreciationCount(appreciationCountData);
        }
      } catch (err) {
        // Silently fail - we already updated optimistically
      }
    } catch (error: any) {
      // Revert optimistic update
      setIsAppreciated(!newAppreciated);
      setAppreciationCount((prev) => (newAppreciated ? Math.max(0, prev - 1) : prev + 1));
      toast({
        title: "Error",
        description: error.message || "Failed to update appreciation",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items for later",
        variant: "destructive",
      });
      return;
    }

    const newSaved = !isSaved;
    setIsSaved(newSaved);
    setMenuOpen(false);

    try {
      // Always use POST - API handles toggle
      const response = await fetch("/api/item/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save");
      }

      const responseData = await response.json().catch(() => ({}));
      // Update state based on API response
      if (responseData.action === "unsaved") {
        setIsSaved(false);
        setSaveCount((prev) => Math.max(0, prev - 1));
      } else {
        setIsSaved(true);
        setSaveCount((prev) => prev + 1);
      }

      // Try to refresh save count from database
      try {
        const { count: saveCountData } = await supabase
          .from("saved_items")
          .select("*", { count: "exact", head: true })
          .eq("item_id", item.id);
        
        if (saveCountData !== null) {
          setSaveCount(saveCountData);
        }
      } catch (err) {
        // Silently fail - we already updated optimistically
      }

      toast({
        title: responseData.action === "saved" ? "Saved for later" : "Removed from saved",
        description: responseData.action === "saved" ? "You can find this in your saved items" : "Item removed from saved",
      });
    } catch (error: any) {
      // Revert optimistic update
      setIsSaved(!newSaved);
      // Revert save count
      if (newSaved) {
        setSaveCount((prev) => Math.max(0, prev - 1));
      } else {
        setSaveCount((prev) => prev + 1);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to save",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/items/${item.id}`;
    setMenuOpen(false);

    const newShared = !isShared;
    setIsShared(newShared);
    
    // Track share in database
    if (user) {
      try {
        const response = await fetch("/api/item/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id }),
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          // Update state based on API response
          if (responseData.action === "unshared") {
            setIsShared(false);
            setShareCount((prev) => Math.max(0, prev - 1));
          } else {
            setIsShared(true);
            setShareCount((prev) => prev + 1);
          }

          // Try to refresh share count from database
          try {
            const { count: shareCountData } = await supabase
              .from("item_shares")
              .select("*", { count: "exact", head: true })
              .eq("item_id", item.id);
            
            if (shareCountData !== null) {
              setShareCount(shareCountData);
            }
          } catch (err) {
            // Silently fail - we already updated optimistically
          }
        }
      } catch (error) {
        // Revert optimistic update
        setIsShared(!newShared);
        if (newShared) {
          setShareCount((prev) => Math.max(0, prev - 1));
        } else {
          setShareCount((prev) => prev + 1);
        }
      }
    }

    // Perform share action
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description || item.title,
          url: shareUrl,
        });
        toast({
          title: "Shared",
          description: "Sharing this giving story",
        });
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          // Fallback to clipboard if share fails
          try {
            await navigator.clipboard.writeText(shareUrl);
            toast({
              title: "Link copied!",
              description: "Giving story link copied to clipboard",
            });
          } catch (clipboardError) {
            toast({
              title: "Error",
              description: "Failed to share or copy link",
              variant: "destructive",
            });
          }
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Giving story link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to copy link. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleReport = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to report items",
        variant: "destructive",
      });
      return;
    }

    if (!reportReason) {
      toast({
        title: "Reason required",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/item/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          reason: reportReason,
          details: reportDetails || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      setReportModalOpen(false);
      setMenuOpen(false);
      setReportReason("");
      setReportDetails("");
      toast({
        title: "Report submitted",
        description: "We'll review this soon. Thank you for keeping Flipi safe.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit report",
        variant: "destructive",
      });
    }
  };

  const conditionLabels: Record<string, string> = {
    new: "New",
    like_new: "Like New",
    good: "Good",
    fair: "Fair",
  };

  return (
    <>
      <Card
        className="overflow-hidden border border-border/40 shadow-sm bg-card rounded-2xl"
      >
        {/* Giver Context (Top Section) - Emotional Anchor */}
        <div
          className="flex items-start justify-between px-4 pt-4 pb-2"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {item.owner_id ? (
              <Link
                href={`/user/${item.owner_id}`}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="cursor-pointer"
              >
                <Avatar className="w-9 h-9 ring-2 ring-background">
                  <AvatarImage src={owner?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {owner?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Avatar className="w-9 h-9 ring-2 ring-background">
                <AvatarImage src={owner?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {owner?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {item.owner_id ? (
                  <Link
                    href={`/user/${item.owner_id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="font-semibold text-sm truncate hover:text-primary transition-colors text-left relative z-10 cursor-pointer"
                  >
                    {owner?.full_name || "Anonymous"}
                  </Link>
                ) : (
                  <p className="font-semibold text-sm truncate">
                    {owner?.full_name || "Anonymous"}
                  </p>
                )}
                {owner?.rank && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    <span>{rankInfo.emoji}</span>
                    <span>{rankInfo.name}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.town === item.region 
                  ? `Giving from ${item.town}`
                  : `Giving from ${item.town}, ${item.region}`
                }
              </p>
            </div>
          </div>
          
          {/* Soft 3-dots menu */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem
                onClick={() => {
                  setReportModalOpen(true);
                  setMenuOpen(false);
                }}
                className="gap-3 cursor-pointer"
              >
                <Flag className="w-4 h-4" />
                Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleShare();
                  setMenuOpen(false);
                }}
                className="gap-3 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleSave();
                  setMenuOpen(false);
                }}
                className="gap-3 cursor-pointer"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? "fill-primary text-primary" : ""}`} />
                {isSaved ? "Unsave" : "Save for later"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Story Image Frame (Middle Section) - Context, not promotion */}
        <div
          ref={imageContainerRef}
          className="relative mx-4 mb-3 aspect-[4/3] bg-muted/30 rounded-xl overflow-hidden border border-border/60"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {images.length > 0 ? (
            <>
              <div className="relative w-full h-full">
                <Image
                  src={images[currentImageIndex]}
                  alt={item.title}
                  fill
                  className="object-cover"
                  priority={currentImageIndex === 0}
                />
              </div>
              {hasMultipleImages && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
                    }
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm"
                    onClick={() =>
                      setCurrentImageIndex((prev) => (prev + 1) % images.length)
                    }
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "w-5 bg-white"
                            : "w-1.5 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {/* Gentle Appreciation Animation */}
              <AnimatePresence>
                {showAppreciationAnimation && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <Heart className="w-16 h-16 text-primary fill-primary/80" />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gift className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Item Story (Text Section) */}
        <div className="px-4 pb-3 space-y-2">
          {/* Item Name */}
          <div>
            <Link href={`/items/${item.id}`}>
              <h3 className="font-semibold text-sm text-foreground hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>
            </Link>
            {item.status === "available" && (
              <p className="text-xs text-muted-foreground/80 italic mt-0.5">
                Available for someone who needs it
              </p>
            )}
          </div>

          {/* Category & Condition Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
              {item.category}
            </span>
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded-full border border-border/40">
              {conditionLabels[item.condition] || item.condition}
            </span>
          </div>
        </div>

        {/* Appreciation & Actions (Bottom Section) */}
        <div className="px-4 pb-4 pt-2.5 border-t border-border/40">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent gap-1.5 text-muted-foreground hover:text-primary"
              onClick={handleAppreciate}
            >
              <motion.div
                animate={{ scale: isAppreciated ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isAppreciated
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span className="text-xs font-medium">
                {appreciationCount} {appreciationCount === 1 ? 'appreciation' : 'appreciations'}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent gap-1.5 text-muted-foreground hover:text-primary"
              onClick={handleSave}
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isSaved
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <span className="text-xs font-medium">
                {saveCount} {saveCount === 1 ? 'save' : 'saves'}
              </span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:bg-transparent gap-1.5 text-muted-foreground hover:text-primary ml-auto"
              onClick={handleShare}
            >
              <Share2
                className={`w-4 h-4 ${
                  isShared
                    ? "fill-primary text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <span className="text-xs font-medium">
                {shareCount} {shareCount === 1 ? 'share' : 'shares'}
              </span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report Giving Story</DialogTitle>
            <DialogDescription>
              Help us keep Flipi safe by reporting content that violates our community guidelines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Reason for reporting</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                  <Label htmlFor="inappropriate" className="font-normal cursor-pointer">
                    Inappropriate content
                  </Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="misleading" id="misleading" />
                  <Label htmlFor="misleading" className="font-normal cursor-pointer">
                    Misleading information
                  </Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="fake_profile" id="fake_profile" />
                  <Label htmlFor="fake_profile" className="font-normal cursor-pointer">
                    Fake profile
                  </Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="scam" id="scam" />
                  <Label htmlFor="scam" className="font-normal cursor-pointer">
                    Scam / Suspicious
                  </Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="stolen" id="stolen" />
                  <Label htmlFor="stolen" className="font-normal cursor-pointer">
                    Stolen item
                  </Label>
                </div>
                <div className="flex items-center space-x-2 py-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">
                    Other
                  </Label>
                </div>
              </RadioGroup>
            </div>
            {reportReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="details">Additional details</Label>
                <Textarea
                  id="details"
                  placeholder="Please provide more information..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setReportModalOpen(false);
                  setReportReason("");
                  setReportDetails("");
                }}
                className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
              >
                Cancel
              </Button>
              <Button onClick={handleReport}>Submit Report</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
