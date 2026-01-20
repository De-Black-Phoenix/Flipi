"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { GivingStoryCard } from "@/components/giving-story-card";

export default function SavedItemsPage() {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuthGuard({ requireAuth: true });

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

  // Load saved items
  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

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
                Saved Items
              </h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold mb-2">Saved Items</h1>
          <p className="text-muted-foreground">
            Items you've saved for later
          </p>
        </div>

        {/* Saved Items Grid */}
        {savedItems.length === 0 ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

