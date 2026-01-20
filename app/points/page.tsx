"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, Gift, Heart, Star, Shield, ArrowRight, ArrowLeft } from "lucide-react";

const RANK_TIERS = [
  { name: "Seed", emoji: "🌱", range: "0–4 points", description: "Just starting your giving journey" },
  { name: "Helper", emoji: "🤝", range: "5–14 points", description: "Making a difference in your community" },
  { name: "Giver", emoji: "🎁", range: "15–29 points", description: "A generous member of the Flipi community" },
  { name: "Hero", emoji: "⭐", range: "30–59 points", description: "Recognized for your consistent generosity" },
  { name: "Champion", emoji: "🏅", range: "60–99 points", description: "A leader in community giving" },
  { name: "Guardian", emoji: "🕊", range: "100+ points", description: "The highest honor for exceptional giving" },
];

export default function PointsPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);

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

    // Find the scroll container (AppShell scroll container)
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
                Points & Ranks
              </h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Points & Ranks</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn how Flipi rewards your generosity and builds trust in our community
          </p>
        </div>

        {/* How Points Work */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">How Points Work</CardTitle>
            <CardDescription>
              Earn points every time you give and make a positive impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Regular Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Give any item to someone in need and earn <strong>1 point</strong> for each item given.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Campaign Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Donate items to NGO campaigns and earn <strong>5 points</strong> for each campaign item given.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rank Ladder */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Rank Ladder</CardTitle>
            <CardDescription>
              Progress through ranks as you give more and help more people
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RANK_TIERS.map((tier, index) => (
                <div
                  key={tier.name}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 text-3xl">{tier.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{tier.name}</h3>
                      <span className="text-sm text-muted-foreground">({tier.range})</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                  {index < RANK_TIERS.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Why Ranks Matter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Why Ranks Matter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Build Trust</h3>
                <p className="text-sm text-muted-foreground">
                  Your rank shows your commitment to giving. Higher ranks help others see that you&apos;re a reliable and generous member of the community.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Community Recognition</h3>
                <p className="text-sm text-muted-foreground">
                  Your rank is displayed on your profile, helping you stand out as someone who actively contributes to making a difference.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How Giving Increases Trust */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">How Giving Increases Trust</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Every item you give helps build trust in the Flipi community. When others see your rank and points, they know you&apos;re someone who:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Follows through on commitments</li>
              <li>Actively contributes to helping others</li>
              <li>Is a reliable and engaged community member</li>
              <li>Has a proven track record of generosity</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Your rank and points are a reflection of your impact, making it easier for others to trust you and for you to build meaningful connections in the community.
            </p>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to Start Giving?</h3>
              <p className="text-muted-foreground mb-6">
                Start earning points and climbing the ranks by giving items to those in need
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/give">
                  <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                    Give an Item
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    View Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

