"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HelpCircle, Mail, FileText, PhoneCall } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SupportPage() {
  const router = useRouter();
  const supabase = createClient();

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-3 md:pt-8 pb-20 md:pb-12">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 mb-3 md:mb-4">
            <HelpCircle className="w-7 h-7 md:w-8 md:h-8 text-primary" />
          </div>
          <h1 className="text-lg md:text-3xl font-bold mb-3 md:mb-4">Support Center</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            We're here to help! Get assistance with your account or platform questions.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
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
            <CardTitle className="text-lg md:text-2xl">Helpful Resources</CardTitle>
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
