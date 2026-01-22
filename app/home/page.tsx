"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { GiveItemButton } from "@/components/give-item-button";
import { Footer } from "@/components/footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Sparkles, X, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TopGiver {
  id: string;
  full_name: string;
  avatar_url: string | null;
  points: number;
  rank: string | null;
  user_type: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [originalGivers, setOriginalGivers] = useState<TopGiver[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Check for welcome parameter
  useEffect(() => {
    const welcome = searchParams.get("welcome");
    if (welcome === "true") {
      setShowWelcomeModal(true);
      // Remove the query parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("welcome");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams]);

  // Fetch top 10 profiles with most points, or oldest accounts if no points
  useEffect(() => {
    let mounted = true;
    const fetchTopGivers = async () => {
      // First, check if there are any users with points > 0
      const { data: pointsCheck, error: pointsError } = await supabase
        .from("profiles")
        .select("id, points")
        .gt("points", 0)
        .limit(1);

      if (pointsError) {
        if (mounted) console.error("Error checking points:", pointsError);
        return;
      }

      let profilesData;
      let profilesError;

      if (pointsCheck && pointsCheck.length > 0) {
        // Users have points - fetch top 10 by points
        const result = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, points, rank, user_type, created_at")
          .order("points", { ascending: false })
          .limit(10);
        profilesData = result.data;
        profilesError = result.error;
      } else {
        // No users have points - fetch first 10 users by account creation date (oldest first)
        const result = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, points, rank, user_type, created_at")
          .order("created_at", { ascending: true })
          .limit(10);
        profilesData = result.data;
        profilesError = result.error;
      }

      if (profilesError || !profilesData) {
        if (mounted) console.error("Error fetching profiles:", profilesError);
        return;
      }

      if (!mounted) return;

      // Map profile data to TopGiver interface
      const topGivers: TopGiver[] = profilesData
        .map((profile) => ({
          id: profile.id,
          full_name: profile.full_name || "Community Member",
          avatar_url: profile.avatar_url,
          points: profile.points || 0,
          rank: profile.rank || "Seed",
          user_type: profile.user_type || "user",
        }));

      // Store original givers for seamless infinite scroll
      setOriginalGivers(topGivers);
    };

    fetchTopGivers();
    return () => { mounted = false; };
  }, [supabase]);

  // Create duplicated array for seamless loop (3 sets: original + 2 clones)
  const duplicatedGivers = useMemo(() => {
    if (originalGivers.length === 0) return [];
    // Create 3 identical sets for seamless looping
    return [...originalGivers, ...originalGivers, ...originalGivers];
  }, [originalGivers]);

  // Calculate the width of one set for animation
  const singleSetWidth = useMemo(() => {
    if (originalGivers.length === 0) return '0%';
    // Each card is approximately 200px + 1rem gap on desktop
    // For mobile: 160px + 1rem gap
    // We'll use a more accurate calculation
    return `${100 / 3}%`; // One-third of the total duplicated width
  }, [originalGivers.length]);

  // Get rank color and emoji based on rank level - memoized
  const getRankInfo = useCallback((rank: string | null) => {
    switch (rank) {
      case "Guardian":
        return { color: "text-purple-600 bg-purple-50 border-purple-200", emoji: "🕊" };
      case "Champion":
        return { color: "text-yellow-600 bg-yellow-50 border-yellow-200", emoji: "🏅" };
      case "Hero":
        return { color: "text-orange-600 bg-orange-50 border-orange-200", emoji: "⭐" };
      case "Giver":
        return { color: "text-blue-600 bg-blue-50 border-blue-200", emoji: "🎁" };
      case "Helper":
        return { color: "text-green-600 bg-green-50 border-green-200", emoji: "🤝" };
      case "Seed":
      default:
        return { color: "text-gray-600 bg-gray-50 border-gray-200", emoji: "🌱" };
    }
  }, []);

  return (
    <>
      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="sm:max-w-md rounded-[24px]">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">Welcome to Flipi! 🎉</DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Your account is all set up! Start exploring items, giving back to your community, and making a difference.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => {
                setShowWelcomeModal(false);
                router.push("/find");
              }}
              className="flex-1 rounded-[24px]"
            >
              Start Exploring
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowWelcomeModal(false)}
              className="flex-1 rounded-[24px]"
            >
              Continue to Homepage
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-full flex flex-col bg-background">
        {/* Main Content - Centered */}
        <div className="flex-none flex items-start justify-center px-4 md:px-6 pt-5 pb-6 md:pt-6 md:pb-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
            Need it? <span className="text-primary font-brand">Flipi.</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-4 leading-relaxed">
              A friendly community where kindness flows. Give what you don't need, find what you can't afford.
            </p>
            <div className="flex flex-row gap-3 justify-center">
              <GiveItemButton size="default" className="px-6 flex-1 sm:flex-none">
                Give an item
              </GiveItemButton>
              <Button asChild variant="outline" size="default" className="px-6 flex-1 sm:flex-none">
                <Link href="/find">Find help</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Top Givers Section */}
        <div className="flex-shrink-0 px-4 md:px-6 pt-4 pb-6 md:py-10 border-t border-border">
          <div className="max-w-4xl mx-auto">
            {/* Section Title */}
            <div className="mb-4 md:mb-6 text-center">
              <h2 className="text-lg md:text-2xl font-bold text-foreground mb-2">Top Contributors in Our Community</h2>
              <p className="text-xs md:text-sm text-muted-foreground">Celebrating individuals with the most points who make a difference through generosity</p>
            </div>

            {/* Top Givers Cards - Seamless Infinite Scroll */}
            {originalGivers.length > 0 ? (
              <div className="relative overflow-hidden w-full">
                {/* Left fade gradient */}
                <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
                {/* Right fade gradient */}
                <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
                <div
                  ref={carouselRef}
                  className="seamless-carousel-track"
                  style={{
                    '--carousel-duration': `${originalGivers.length * 3}s`,
                  } as React.CSSProperties & { '--carousel-duration': string }}
                >
                  {duplicatedGivers.map((giver, index) => {
                    return (
                      <div
                        key={`${giver.id}-${index}`}
                        className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] aspect-square rounded-[24px] overflow-hidden relative group bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 md:backdrop-blur-none"
                      >
                        {/* User Avatar */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                          <div className="relative mb-3">
                            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-primary/30 md:shadow-lg">
                              <AvatarImage src={giver.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                {giver.full_name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            {/* Generosity Badge */}
                            <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5 shadow-md">
                              <Sparkles className="w-3 h-3 text-primary-foreground" />
                            </div>
                          </div>
                          
                          {/* User Name */}
                          <h3 className="text-sm md:text-base font-semibold text-foreground mb-1.5 text-center line-clamp-1 user-name">
                            {giver.full_name}
                          </h3>
                          
                          {/* Giver Level (rank) - No admin status shown */}
                          <div className="mb-2 flex flex-col items-center gap-1.5">
                            {(() => {
                              const rankInfo = getRankInfo(giver.rank);
                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${rankInfo.color}`}>
                                  <span>{rankInfo.emoji}</span>
                                  <span>{giver.rank || "Seed"}</span>
                                </span>
                              );
                            })()}
                          </div>
                          
                          {/* Points Display */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Trophy className="w-3 h-3 text-primary" />
                            <span className="font-medium">{giver.points} {giver.points === 1 ? 'point' : 'points'}</span>
                          </div>
                        </div>

                        {/* Decorative gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[24px] bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* X Style Footer */}
        <Footer />
      </div>
    </>
  );
}

