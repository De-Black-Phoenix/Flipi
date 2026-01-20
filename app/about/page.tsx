"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Heart, Users, Gift, Target, ArrowRight, ArrowLeft, Mail, PhoneCall } from "lucide-react";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

export default function AboutPage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const { settings, loading: settingsLoading } = usePlatformSettings();

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
                About Flipi
              </h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">About Flipi</h1>
          {settingsLoading ? (
            <div className="h-6 bg-muted animate-pulse rounded max-w-2xl mx-auto" />
          ) : (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto whitespace-pre-line">
              {settings.about_us || "A friendly community where kindness flows. Give what you don't need, find what you can't afford."}
            </p>
          )}
        </div>

        {/* Mission */}
        {settingsLoading ? (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                <div className="h-4 bg-muted animate-pulse rounded w-full" />
                <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
              </div>
            </CardContent>
          </Card>
        ) : settings.about_us ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">About Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {settings.about_us}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
              <CardDescription>
                Building a community-driven platform that connects generosity with need
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Flipi is a community platform designed to make giving and receiving easier, more meaningful, and more accessible. 
                We believe that everyone has something to give, and everyone has something they need. By connecting givers with receivers, 
                we're building a network of kindness that strengthens communities and reduces waste.
              </p>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">How It Works</h2>
            <p className="text-muted-foreground">
              Simple steps to make a difference
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Give</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  List items you no longer need and want to give away to someone who can use them.
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Find</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Browse items available in your community and request what you need.
                </p>
              </CardContent>
            </Card>
            <Card className="group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Connect</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chat with givers and receivers to coordinate pickup and build community connections.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Our Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Generosity</h3>
                <p className="text-sm text-muted-foreground">
                  We believe in the power of giving without expecting anything in return, creating a culture of kindness and mutual support.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Community</h3>
                <p className="text-sm text-muted-foreground">
                  We're building connections between neighbors, strengthening local communities, and fostering a sense of belonging.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sustainability</h3>
                <p className="text-sm text-muted-foreground">
                  By giving items a second life, we're reducing waste and promoting a more sustainable way of living.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Join the Flipi Community</h3>
              <p className="text-muted-foreground mb-6">
                Start giving, start receiving, and be part of a movement that's making a difference
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/signup">
                  <button className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                    Get Started
                  </button>
                </Link>
                <Link href="/find">
                  <button className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
                    Browse Items
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

