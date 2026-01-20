"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HelpCircle, Mail, FileText, ArrowLeft, PhoneCall } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SupportPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isScrolled, setIsScrolled] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  // Load platform settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("*")
        .single();

      setSettings(data);
    };

    loadSettings();
  }, [supabase]);

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
      scrollContainer = document.querySelector("main div.overflow-y-auto") as HTMLElement;
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
        {/* Back Button */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 border-b border-border/40 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="border-transparent hover:bg-transparent hover:border hover:border-primary/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {isScrolled && (
              <h1 className="text-lg font-semibold">Support</h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Support Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We're here to help! Get assistance with your account or platform questions.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {settings?.support_email && (
            <Card className="hover:border-primary/50 hover:shadow-lg transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                <a
                  href={`mailto:${settings.support_email}`}
                  className="text-primary hover:underline font-medium"
                >
                  {settings.support_email}
                </a>
              </CardContent>
            </Card>
          )}

          {settings?.support_phone && (
            <Card className="hover:border-primary/50 hover:shadow-lg transition-all">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <PhoneCall className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                <a
                  href={`tel:${String(settings.support_phone).replace(/\s/g, "")}`}
                  className="text-primary hover:underline font-medium"
                >
                  {settings.support_phone}
                </a>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Helpful Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Helpful Resources</CardTitle>
            <CardDescription>Learn more about Flipi</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <Link href="/about">About Flipi</Link>
            <Link href="/points">Points & Ranks</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
