"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";
import { MapPin, Gift, Search, X } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { ItemCardSkeleton } from "@/components/skeletons/item-card-skeleton";
import { GivingStoryCard } from "@/components/giving-story-card";

const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Volta",
  "Northern",
  "Upper East",
  "Upper West",
  "Brong Ahafo",
  "Western North",
  "Ahafo",
  "Bono",
  "Bono East",
  "Oti",
  "Savannah",
  "North East",
];

const CATEGORIES = [
  "Clothing",
  "Electronics",
  "Furniture",
  "Books",
  "Toys",
  "Kitchen Items",
  "Sports Equipment",
  "Arts",
  "Other",
];

export default function FindItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedTown, setSelectedTown] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const supabase = createClient();
  const { user } = useAuthGuard({ requireAuth: false });

  // Get user's region if logged in (for display purposes only, not as default)
  useEffect(() => {
    const getUserRegion = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("region")
          .eq("id", user.id)
          .single();

        if (profile?.region) {
          setUserRegion(profile.region);
          // Note: We don't set selectedRegion here - "All Regions" is the default
          // selectedRegion remains "" (empty string) which represents "All Regions"
        }
      }
    };

    getUserRegion();
  }, [supabase]);

  // Debounce search keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Search function
  const searchItems = useCallback(async () => {
    setLoading(true);

    let query = supabase
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
      .eq("status", "available")
      .is("campaign_id", null);

    // Note: Keyword search will be done client-side for reliability
    // Supabase .or() can be complex, so we'll filter after fetching

    // Region filter (only apply if a specific region is selected, not "all" or empty)
    // When "All Regions" is selected, selectedRegion is set to "" (empty string)
    // This allows all items to be returned regardless of region
    if (selectedRegion && selectedRegion !== "all" && selectedRegion !== "") {
      query = query.eq("region", selectedRegion);
    }

    // Town filter (partial match)
    if (selectedTown.trim()) {
      query = query.ilike("town", `%${selectedTown}%`);
    }

    // Category filter
    if (selectedCategory) {
      query = query.eq("category", selectedCategory);
    }

    // Order by most recent
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    } else {
      // Fetch conversation counts for all items using RPC function
      // This bypasses RLS to get accurate counts for all users
      const itemIds = (data || []).map((item: any) => item.id);
      let conversationCounts: Record<string, number> = {};
      
      if (itemIds.length > 0) {
        // Use RPC function to get counts (bypasses RLS)
        // Fallback to 0 if function doesn't exist yet
        const countPromises = itemIds.map(async (itemId: string) => {
          try {
            const { data, error } = await supabase.rpc('get_item_conversation_count', {
              item_uuid: itemId
            });
            // If RPC function doesn't exist, fallback to direct query (will be limited by RLS)
            if (error && error.code === '42883') {
              const { count } = await supabase
                .from("conversations")
                .select("*", { count: "exact", head: true })
                .eq("item_id", itemId);
              return { itemId, count: count || 0 };
            }
            return { itemId, count: error ? 0 : (data || 0) };
          } catch (err) {
            return { itemId, count: 0 };
          }
        });
        
        const countResults = await Promise.all(countPromises);
        countResults.forEach(({ itemId, count }) => {
          conversationCounts[itemId] = count;
        });
      }

      // Apply keyword search client-side for reliable multi-field search
      let filteredData = (data || []).map((item: any) => ({
        ...item,
        like_count: item.like_count || 0, // Default to 0 if column doesn't exist yet
        conversation_count: conversationCounts[item.id] || 0, // Total requests from all users
      }));
      
      if (debouncedKeyword.trim()) {
        const keyword = debouncedKeyword.toLowerCase();
        filteredData = filteredData.filter(
          (item: any) =>
            item.title?.toLowerCase().includes(keyword) ||
            item.description?.toLowerCase().includes(keyword) ||
            item.category?.toLowerCase().includes(keyword)
        );
      }
      setItems(filteredData);
    }

    setLoading(false);
  }, [debouncedKeyword, selectedRegion, selectedTown, selectedCategory, supabase]);

  // Trigger search when filters change
  useEffect(() => {
    searchItems();
  }, [searchItems]);

  // Clear all filters
  const clearFilters = () => {
    setSearchKeyword("");
    setDebouncedKeyword("");
    setSelectedTown("");
    setSelectedCategory("");
    setSelectedRegion(userRegion || "");
  };

  const hasActiveFilters =
    debouncedKeyword.trim() ||
    selectedTown.trim() ||
    selectedCategory ||
    (selectedRegion && selectedRegion !== userRegion);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-2 pb-6 md:py-6">
      {/* Modern Compact Search and Filters */}
      <div className="mb-3 md:mb-6 space-y-2 md:space-y-4">
        {/* Search Bar - Compact */}
        <div className="relative">
          <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 md:w-4 md:h-4" />
          <Input
            type="text"
            placeholder="Search items..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-8 pr-8 h-8 md:h-9 text-xs md:text-sm"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword("")}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips - Above Location Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("")}
            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap transition-colors ${
                !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

        {/* Location Filters Row - Compact Single Line */}
        <div className="flex flex-row md:flex-wrap items-center gap-2">
          {/* Region Filter */}
          <div className="w-auto flex-1 md:flex-none min-w-0 md:min-w-[180px]">
            <SearchableSelect
              options={REGIONS}
              value={selectedRegion || ""}
              onValueChange={(value) => setSelectedRegion(value || "")}
              placeholder="All Regions"
              emptyMessage="No regions found"
              className="flex-1 min-w-0 md:flex-none [&_input]:h-8 [&_input]:md:h-9 [&_input]:text-xs [&_input]:md:text-sm"
            />
        </div>

          {/* Town/City Filter - Keep as text input for flexible partial matching */}
          <Input
            type="text"
            placeholder="Town/City"
            value={selectedTown}
            onChange={(e) => setSelectedTown(e.target.value)}
              className="h-8 md:h-9 flex-1 md:flex-none min-w-0 md:min-w-[150px] md:max-w-[220px] text-xs md:text-sm"
          />

          {/* Clear Filters Button - Compact */}
        {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 md:h-9 px-2 text-[10px] md:text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
          </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              No items found in your area yet.
            </p>
            <p className="text-sm text-gray-400">
              Try a different search or check back later 💙
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600 hidden md:block">
            Found {items.length} item{items.length !== 1 ? "s" : ""}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))
            ) : (
              items.map((item: any) => (
                <GivingStoryCard
                  key={item.id}
                  item={item}
                  currentUserId={user?.id}
                />
              ))
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
