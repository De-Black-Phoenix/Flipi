"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, UserMinus, Gift, MapPin } from "lucide-react";

// #region agent log
const log = (message: string, data: any, hypothesisId?: string) => {
  fetch('http://127.0.0.1:7243/ingest/f26d9da2-ab06-4244-a454-eea51bd6aa25',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'user/[id]/page.tsx',message,data,timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

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
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { GivingStoryCard } from "@/components/giving-story-card";
import Image from "next/image";

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
          // #region agent log
          log('Profile not found - redirecting to /find', {userId,profileError:profileError?.message,hasProfileData:!!profileData}, 'F');
          // #endregion
          toast({
            title: "User not found",
            description: "This user profile does not exist",
            variant: "destructive",
          });
          router.push("/find");
          return;
        }

        // #region agent log
        log('Profile loaded successfully', {userId,hasProfile:!!profileData,profileName:profileData?.full_name}, 'G');
        // #endregion
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-8 md:pt-12 pb-8 md:pb-12">
        {/* Back Button - Fixed at top */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-border/40 mb-8">
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
                {profile.full_name || "User Profile"}
              </h1>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="mb-8 mt-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-2 ring-background">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl md:text-3xl bg-primary/10 text-primary font-medium">
                {profile.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile.full_name || "Anonymous"}
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
    </div>
  );
}







