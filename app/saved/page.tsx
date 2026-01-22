"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { GivingStoryCard } from "@/components/giving-story-card";
import { ItemCardSkeleton } from "@/components/skeletons/item-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SavedItemsPage() {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuthGuard({ requireAuth: true });

  // Load saved items
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadSavedItems = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("saved_items")
          .select(`
            *,
            items (
              *,
              profiles!items_owner_id_fkey (
                id,
                full_name,
                avatar_url,
                rank
              )
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading saved items:", error);
          return;
        }

        if (data) {
          const items = data
            .map((saved: any) => ({
              ...saved.items,
              profiles: saved.items?.profiles,
            }))
            .filter((item: any) => item && item.id);
          setSavedItems(items);
        }
      } catch (error) {
        console.error("Error loading saved items:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedItems();
  }, [user, supabase]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-3 md:pt-8 pb-20 md:pb-12">
        {/* Header */}
        <div className="hidden md:block mb-6 md:mb-8">
          <h1 className="text-lg md:text-3xl font-bold mb-2">Saved Items</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Items you've saved for later
          </p>
        </div>

        {/* Saved Items Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : savedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">You haven't saved any items yet</p>
              <Button asChild>
                <a href="/find">Browse Items</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {savedItems.map((item) => (
              <GivingStoryCard
                key={item.id}
                item={item}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

