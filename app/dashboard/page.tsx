"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Gift, Heart, MessageSquare, Trophy, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [stats, setStats] = useState({
    listedItemsCount: 0,
    itemsGivenCount: 0,
    activeRequestsCount: 0,
    unreadMessagesCount: 0,
  });

  // Rank tier information
  const getRankInfo = (points: number) => {
    const tiers = [
      { name: "Seed", emoji: "🌱", min: 0, max: 4 },
      { name: "Helper", emoji: "🤝", min: 5, max: 14 },
      { name: "Giver", emoji: "🎁", min: 15, max: 29 },
      { name: "Hero", emoji: "⭐", min: 30, max: 59 },
      { name: "Champion", emoji: "🏅", min: 60, max: 99 },
      { name: "Guardian", emoji: "🕊", min: 100, max: Infinity },
    ];

    for (const tier of tiers) {
      if (points >= tier.min && points <= tier.max) {
        const nextTier = tiers.find((t) => t.min > tier.max);
        const pointsInTier = points - tier.min;
        const pointsNeededForNext = nextTier ? nextTier.min - points : 0;
        const tierRange = tier.max - tier.min + 1;
        const progress = nextTier ? (pointsInTier / tierRange) * 100 : 100;

        return {
          ...tier,
          pointsInTier,
          pointsNeededForNext,
          progress: Math.min(100, Math.max(0, progress)),
          nextTierName: nextTier?.name,
          nextTierEmoji: nextTier?.emoji,
        };
      }
    }
    return tiers[0];
  };
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    // Load profile and statistics
    const loadData = async () => {
      try {
        // Load profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          router.replace("/onboarding");
          setLoading(false);
          return;
        }

        // Check email verification
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser?.email_confirmed_at) {
          router.replace("/verify-email");
          setLoading(false);
          return;
        }

        if (!data.onboarding_completed || !data.region || !data.town) {
          router.replace("/onboarding");
          setLoading(false);
          return;
        }

        setProfile(data);

        // Load statistics in parallel
        const [
          listedItemsResult,
          activeRequestsResult,
          unreadMessagesResult,
        ] = await Promise.all([
          // Count of all items listed by user
          supabase
            .from("items")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id),
          // Count of active requests (conversations with pending status)
          supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .eq("requester_id", user.id)
            .eq("status", "pending"),
          // Count of unread messages for owner
          supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("is_read_by_owner", false),
        ]);

        setStats({
          listedItemsCount: listedItemsResult.count || 0,
          itemsGivenCount: data.items_given || 0,
          activeRequestsCount: activeRequestsResult.count || 0,
          unreadMessagesCount: unreadMessagesResult.count || 0,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // Scroll detection for sticky title
  useEffect(() => {
    let scrollContainer: HTMLElement | null = null;
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      if (scrollContainer) {
        setIsScrolled(scrollContainer.scrollTop > 100);
      } else {
        setIsScrolled(window.scrollY > 100);
      }
    };

    timeoutId = setTimeout(() => {
      scrollContainer = document.querySelector('main div.overflow-y-auto') as HTMLElement;
      const target = scrollContainer || window;
      
      target.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  if (authLoading || loading || !profile) {
    return (
      <div className="h-full overflow-y-auto bg-background">
        <DashboardSkeleton />
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-background">
      <div className="px-4 py-4 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-normal">{currentDate}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}
              {profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
          </div>
      </div>

        {/* Stats Cards Grid - Monochrome, minimalist */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Your Rank</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-2xl font-bold text-foreground block leading-none">
                    {getRankInfo(profile.points || 0).emoji} {profile.rank || "Seed"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 font-normal">{profile.points || 0} points</p>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Items Given</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-2xl font-bold text-foreground block leading-none">{profile.items_given || 0}</span>
                  <p className="text-xs text-muted-foreground mt-1 font-normal">Regular items</p>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Campaign Items</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-2xl font-bold text-foreground block leading-none">{profile.campaign_items || 0}</span>
                  <p className="text-xs text-muted-foreground mt-1 font-normal">Campaign items</p>
                </div>
            </div>
          </CardContent>
        </Card>

          <Card className="hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-muted-foreground uppercase tracking-wider">Total Points</CardTitle>
          </CardHeader>
          <CardContent>
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-2xl font-bold text-foreground block leading-none">{profile.points || 0}</span>
                  <p className="text-xs text-muted-foreground mt-1 font-normal">Points earned</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Rank Progress Card */}
        {(() => {
          const rankInfo = getRankInfo(profile.points || 0);
          return (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Rank Progress</CardTitle>
                <CardDescription className="text-sm">
                  {"nextTierName" in rankInfo && rankInfo.nextTierName ? (
                    <>
                      {rankInfo.pointsNeededForNext} points until {rankInfo.nextTierEmoji} {rankInfo.nextTierName}
                    </>
                  ) : (
                    "You've reached the highest rank!"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {rankInfo.emoji} {rankInfo.name} ({profile.points || 0} points)
                    </span>
                    {"nextTierName" in rankInfo && rankInfo.nextTierName && (
                      <span className="text-muted-foreground">
                        {rankInfo.nextTierEmoji} {rankInfo.nextTierName} ({rankInfo.min} points)
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300 rounded-full"
                      style={{ width: "progress" in rankInfo ? `${rankInfo.progress}%` : "100%", }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-4">
        <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
              <CardDescription className="text-sm">Get started with Flipi</CardDescription>
          </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild className="w-auto" size="default">
              <Link href="/give">Give an Item</Link>
            </Button>
              <Button asChild variant="outline" className="w-auto" size="default">
              <Link href="/find">Find Items</Link>
            </Button>
              <Button asChild variant="outline" className="w-auto" size="default">
              <Link href="/campaigns">Browse Campaigns</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Your Items</CardTitle>
              <CardDescription className="text-sm">Manage your listings</CardDescription>
          </CardHeader>
          <CardContent>
              {stats.listedItemsCount === 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">You haven&apos;t listed any items yet.</p>
                  <Button asChild variant="outline" className="w-auto">
                    <Link href="/my-items">View My Items</Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <span className="text-2xl font-bold text-foreground block leading-none">{stats.listedItemsCount}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        item{stats.listedItemsCount !== 1 ? "s" : ""} listed
                      </span>
                    </div>
                  </div>
            <Button asChild variant="outline" className="w-auto">
              <Link href="/my-items">View My Items</Link>
            </Button>
                </>
              )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
