"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Mail, Phone, FileText, Instagram, Twitter, Globe, Music } from "lucide-react";

interface PlatformSetting {
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, PlatformSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: true });

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

  useEffect(() => {
    if (!user) return;

    const checkAdminAccess = async () => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, user_type")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile?.role !== "platform_admin" && profile?.user_type !== "platform_admin") {
          router.push("/");
          return;
        }

        loadSettings();
      } catch (err) {
        console.error("Error checking admin access:", err);
        router.push("/");
      }
    };

    checkAdminAccess();
  }, [user, supabase, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/platform-settings");
      if (!response.ok) throw new Error("Failed to load settings");

      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      console.error("Error loading settings:", err);
      toast({
        title: "Error",
        description: "Failed to load platform settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string, value: string) => {
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await fetch("/api/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }

      // Reload settings to get updated timestamp
      await loadSettings();
      
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save setting",
        variant: "destructive",
      });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const SettingField = ({
    keyName,
    label,
    icon: Icon,
    type = "text",
    placeholder,
  }: {
    keyName: string;
    label: string;
    icon: any;
    type?: "text" | "textarea";
    placeholder?: string;
  }) => {
    const setting = settings[keyName];
    const [value, setValue] = useState(setting?.value || "");

    useEffect(() => {
      if (setting) {
        setValue(setting.value || "");
      }
    }, [setting]);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">{label}</CardTitle>
            </div>
            {setting?.updated_at && (
              <p className="text-xs text-muted-foreground">
                Last updated: {formatDate(setting.updated_at)}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === "textarea" ? (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              rows={10}
              className="min-h-[200px]"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
            />
          )}
          <div className="flex justify-end">
            <Button
              onClick={() => handleSave(keyName, value)}
              disabled={saving[keyName] || value === (setting?.value || "")}
              className="w-auto"
            >
              {saving[keyName] ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

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
                Platform Settings
              </h1>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold mb-2">Platform Settings</h1>
          <p className="text-muted-foreground">
            Manage platform-wide content and information
          </p>
        </div>

        {/* Contact Information */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold">Contact Information</h2>
          <SettingField
            keyName="support_email"
            label="Support Email"
            icon={Mail}
            placeholder="support@flipi.com"
          />
          <SettingField
            keyName="support_phone"
            label="Support Phone"
            icon={Phone}
            placeholder="+233 XX XXX XXXX"
          />
        </div>

        {/* Content Pages */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold">Content Pages</h2>
          <SettingField
            keyName="about_us"
            label="About Us"
            icon={FileText}
            type="textarea"
            placeholder="Enter about us content..."
          />
          <SettingField
            keyName="privacy_policy"
            label="Privacy Policy"
            icon={FileText}
            type="textarea"
            placeholder="Enter privacy policy content..."
          />
          <SettingField
            keyName="terms_of_service"
            label="Terms of Service"
            icon={FileText}
            type="textarea"
            placeholder="Enter terms of service content..."
          />
        </div>

        {/* Social Links */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Social Links</h2>
          <SettingField
            keyName="instagram_link"
            label="Instagram"
            icon={Instagram}
            placeholder="https://instagram.com/flipi"
          />
          <SettingField
            keyName="twitter_link"
            label="Twitter"
            icon={Twitter}
            placeholder="https://twitter.com/flipi"
          />
          <SettingField
            keyName="tiktok_link"
            label="TikTok"
            icon={Music}
            placeholder="https://tiktok.com/@flipi"
          />
          <SettingField
            keyName="website_link"
            label="Website"
            icon={Globe}
            placeholder="https://flipi.com"
          />
        </div>
      </div>
    </div>
  );
}

