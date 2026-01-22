"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, UserMinus, Gift, MapPin, Flag } from "lucide-react";


// Rank tier emoji helper
const getRankEmoji = (rank?: string) => {
  const rankMap: Record<string, string> = {
    Seed: "🌱",
    Helper: "🤝",
    Giver: "🎁",
    Hero: "⭐",
    Champion: "🏅",
    Guardian: "🕊",
  };
  return rankMap[rank || "Seed"] || rankMap["Seed"];
};

const REPORT_REASONS = [
  "Fake or misleading item",
  "Stolen item",
  "Scam or fraud attempt",
  "Inappropriate content",
  "Hate or harassment",
  "Dangerous or illegal item",
  "Duplicate or spam listing",
  "Impersonation",
  "Other",
];
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { GivingStoryCard } from "@/components/giving-story-card";
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton";
import Image from "next/image";
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

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const { user } = useAuthGuard({ requireAuth: false });

  // Scroll detection
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

  // Load profile and items
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError || !profileData) {
          toast({
            title: "User not found",
            description: "This user profile does not exist",
            variant: "destructive",
          });
          router.push("/find");
          return;
        }

        setProfile(profileData);

        // Load items
        const { data: itemsData } = await supabase
          .from("items")
          .select(`
            *,
            profiles!items_owner_id_fkey (
              id,
              full_name,
              avatar_url,
              rank
            )
          `)
          .eq("owner_id", userId)
          .eq("status", "available")
          .order("created_at", { ascending: false });

        if (itemsData) {
          setItems(itemsData);
        }

        // Load follow counts
        const [followersResult, followingResult] = await Promise.all([
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("following_id", userId),
          supabase
            .from("follows")
            .select("id", { count: "exact", head: true })
            .eq("follower_id", userId),
        ]);

        setFollowersCount(followersResult.count || 0);
        setFollowingCount(followingResult.count || 0);

        // Check if current user is following
        if (user && user.id !== userId) {
          const { data: followData } = await supabase
            .from("follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", userId)
            .single();

          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId, user, supabase, router, toast]);

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow users",
        variant: "destructive",
      });
      return;
    }

    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setFollowersCount((prev) => (newFollowing ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const response = await fetch(
        newFollowing ? "/api/user/follow" : `/api/user/follow?userId=${userId}`,
        {
          method: newFollowing ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: newFollowing ? JSON.stringify({ userId }) : undefined,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update follow");
      }

      toast({
        title: newFollowing ? "Following" : "Unfollowed",
        description: newFollowing
          ? `You're now following ${profile?.full_name || "this user"}`
          : `You unfollowed ${profile?.full_name || "this user"}`,
      });
    } catch (error) {
      setIsFollowing(!newFollowing);
      setFollowersCount((prev) => (newFollowing ? Math.max(0, prev - 1) : prev + 1));
      toast({
        title: "Error",
        description: "Failed to update follow",
        variant: "destructive",
      });
    }
  };

  const handleReportUser = async () => {
    if (!user || !reportReason) return;
    if (reportReason === "Other" && !reportDetails.trim()) return;

    setReportSubmitting(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        body: JSON.stringify({
          reportedUserId: userId,
          reason: reportReason,
          details: reportReason === "Other" ? reportDetails.trim() : null,
        }),
      });
    } catch {
      // Intentionally silent for a calm reporting experience.
    } finally {
      toast({ title: "Thanks for helping keep Flipi safe." });
      setReportModalOpen(false);
      setReportReason("");
      setReportDetails("");
      setReportSubmitting(false);
    }
  };

  // Render immediately with skeleton while loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 pb-8 md:pb-12">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 md:pt-8 pb-20 md:pb-12">
        {/* Back Button - Fixed at top */}
        <div className="sticky top-14 md:top-0 z-50 bg-background/95 backdrop-blur-sm py-3 md:py-4 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-border/40 mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="border-transparent hover:bg-transparent hover:border hover:border-primary/20 hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {isScrolled && (
              <h1 className="text-lg font-semibold text-foreground transition-opacity duration-200">
                <span className="user-name">{profile.full_name || "User Profile"}</span>
              </h1>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <Avatar className="w-20 h-20 md:w-32 md:h-32 ring-2 ring-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary font-medium">
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <h1 className="text-lg md:text-3xl font-bold">
                  <span className="user-name">{profile.full_name || "Anonymous"}</span>
                </h1>
                {profile.rank && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    <span>{getRankEmoji(profile.rank)}</span>
                    <span>{profile.rank}</span>
                  </span>
                )}
              </div>
              {profile.region && profile.town && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {profile.town}, {profile.region}
                  </span>
                </div>
              )}
              {profile.bio && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {profile.bio}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="font-semibold">{followersCount}</span>
                  <span className="text-muted-foreground ml-1">followers</span>
                </div>
                <div>
                  <span className="font-semibold">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">following</span>
                </div>
                <div>
                  <span className="font-semibold">{items.length}</span>
                  <span className="text-muted-foreground ml-1">items</span>
                </div>
              </div>
              {!isOwnProfile && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="w-auto"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setReportModalOpen(true)} className="w-auto">
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User's Items */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Items</h2>
          {items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No items available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <GivingStoryCard
                  key={item.id}
                  item={{
                    ...item,
                    profiles: item.profiles || {
                      id: profile.id,
                      full_name: profile.full_name,
                      avatar_url: profile.avatar_url,
                      rank: profile.rank,
                    },
                  }}
                  currentUserId={user?.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report user</DialogTitle>
            <DialogDescription>
              Help us keep Flipi safe. Choose a reason and add details if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Reason</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason} className="grid gap-2">
                {REPORT_REASONS.map((r) => (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={`user-reason-${userId}-${r}`} />
                    <Label htmlFor={`user-reason-${userId}-${r}`}>{r}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {reportReason === "Other" && (
              <div className="space-y-2">
                <Label>Details</Label>
                <Textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Add details…"
                  maxLength={1000}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReportUser}
                disabled={!reportReason || reportSubmitting || (reportReason === "Other" && !reportDetails.trim())}
              >
                {reportSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}







