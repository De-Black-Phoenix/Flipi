"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Heart, TrendingUp, Users, Lightbulb, Star } from "lucide-react";
import Link from "next/link";

export function RightSidebar() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    itemsGiven: 0,
    activeRequests: 0,
    generosityPoints: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        // Load user stats
        const [itemsGivenResult, activeRequestsResult, profileResult] = await Promise.all([
          supabase
            .from("items")
            .select("id", { count: "exact", head: true })
            .eq("owner_id", user.id)
            .eq("status", "given"),
          supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .eq("requester_id", user.id)
            .eq("status", "pending"),
          supabase
            .from("profiles")
            .select("generosity_points")
            .eq("id", user.id)
            .single(),
        ]);

        setStats({
          itemsGiven: itemsGivenResult.count || 0,
          activeRequests: activeRequestsResult.count || 0,
          generosityPoints: profileResult.data?.generosity_points || 0,
        });
      }
    };

    getUser();
  }, [supabase]);

  return (
    <aside className="hidden lg:flex flex-col w-80 h-screen border-l border-gray-200 bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* User Stats */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-600">Items Given</span>
                </div>
                <span className="font-bold text-lg">{stats.itemsGiven}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span className="text-sm text-gray-600">Active Requests</span>
                </div>
                <span className="font-bold text-lg">{stats.activeRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Generosity Points</span>
                </div>
                <span className="font-bold text-lg">{stats.generosityPoints}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips for Giving */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Tips for Giving
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>• Meet in safe, public locations</p>
            <p>• Take clear photos of items</p>
            <p>• Be honest about item condition</p>
            <p>• Respond to requests promptly</p>
            <p>• Coordinate pickup times clearly</p>
          </CardContent>
        </Card>

        {/* Featured Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Popular Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["Electronics", "Clothing", "Furniture", "Books", "Toys"].map((category) => (
                <Button
                  key={category}
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Link href={`/find?category=${category}`}>{category}</Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Community
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>Join thousands of members sharing kindness</p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/campaigns">View Campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}









