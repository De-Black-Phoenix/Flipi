"use client";

import Link from "next/link";
import { Instagram, Twitter, Music, Globe } from "lucide-react";
import { usePlatformSettings } from "@/hooks/use-platform-settings";

export function Footer() {
  const { settings } = usePlatformSettings();

  const socialLinks = [
    { key: "instagram_link", icon: Instagram, label: "Instagram" },
    { key: "twitter_link", icon: Twitter, label: "Twitter" },
    { key: "tiktok_link", icon: Music, label: "TikTok" },
    { key: "website_link", icon: Globe, label: "Website" },
  ].filter((link) => settings[link.key as keyof typeof settings]);

  return (
    <footer className="hidden md:flex flex-shrink-0 border-t border-border px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link href="/find" className="hover:text-foreground">Find Items</Link>
          <Link href="/campaigns" className="hover:text-foreground">Campaigns</Link>
          <Link href="/points" className="hover:text-foreground">How Points & Ranks Work</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/terms" className="hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          
          {/* Social Links */}
          {socialLinks.map((link) => {
            const Icon = link.icon;
            const url = settings[link.key as keyof typeof settings] as string;
            if (!url || typeof url !== "string") return null;
            return (
              <a
                key={link.key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1"
                aria-label={link.label}
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            );
          })}

          <div className="text-muted-foreground font-brand">
            © {new Date().getFullYear()} Flipi
          </div>
        </div>
      </div>
    </footer>
  );
}

