"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Settings } from "lucide-react";
import { useMobileSidebar } from "./mobile-sidebar";

export function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [chatAvatarUrl, setChatAvatarUrl] = useState<string | null>(null);
  const [chatAvatarInitial, setChatAvatarInitial] = useState("F");
  const supabase = createClient();
  const { setIsOpen } = useMobileSidebar();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    };

    getUser();
  }, [supabase]);

  useEffect(() => {
    const loadChatAvatar = async () => {
      if (!pathname?.startsWith("/chat") || !user) {
        setChatAvatarUrl(null);
        setChatAvatarInitial("F");
        return;
      }

      const conversationId = pathname.split("/")[2];
      if (!conversationId) return;

      const { data: convData } = await supabase
        .from("conversations")
        .select("owner_id, requester_id")
        .eq("id", conversationId)
        .maybeSingle();

      if (!convData) return;

      const otherUserId = convData.owner_id === user.id ? convData.requester_id : convData.owner_id;
      if (!otherUserId) return;

      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", otherUserId)
        .maybeSingle();

      if (otherProfile) {
        setChatAvatarUrl(otherProfile.avatar_url ?? null);
        setChatAvatarInitial(otherProfile.full_name?.charAt(0) || "F");
      }
    };

    loadChatAvatar();
  }, [pathname, supabase, user]);

  // Hide on auth pages
  if (
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/verify-email") ||
    pathname?.startsWith("/auth") ||
    pathname === "/splash"
  ) {
    return null;
  }

  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === "/home") return "Home";
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/admin") return "Admin Panel";
    if (pathname === "/admin/settings") return "Platform Settings";
    if (pathname === "/find") return "Explore";
    if (pathname === "/give") return "Give Item";
    if (pathname?.startsWith("/campaigns")) return "Campaigns";
    if (pathname?.startsWith("/my-requests")) return "My Requests";
    if (pathname?.startsWith("/chat")) return "Flipi Team";
    if (pathname?.startsWith("/my-items")) return "My Items";
    if (pathname === "/saved") return "Saved";
    if (pathname === "/profile") return "Profile";
    if (pathname === "/settings") return "Settings";
    if (pathname === "/support") return "Support";
    if (pathname?.startsWith("/user/")) return "Profile";
    if (pathname?.startsWith("/items/")) return "Item Details";
    return "Flipi";
  };

  const pageTitle = getPageTitle();
  const isHomePage = pathname === "/home";
  const isDashboard = pathname === "/dashboard";
  const isChatPage = pathname?.startsWith("/chat");
  const showBackButton =
    pathname?.startsWith("/items/") ||
    pathname?.startsWith("/chat") ||
    pathname?.startsWith("/my-items") ||
    pathname === "/settings" ||
    pathname === "/support" ||
    pathname === "/profile" ||
    pathname === "/saved" ||
    pathname === "/dashboard" ||
    pathname === "/admin" ||
    pathname === "/admin/settings";

  const showAdminSettings = pathname === "/admin";

  const greetingText = (() => {
    if (!isDashboard) return "";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "";
    return firstName ? `${greeting} ${firstName}` : greeting;
  })();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-30 safe-area-inset-top">
      <div className="flex items-center justify-between px-4 h-12">
        <div className={`flex items-center min-w-0 ${showBackButton ? "gap-1" : "gap-2"}`}>
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          {isDashboard ? (
            <h1 className="text-[17px] font-bold text-foreground truncate">{greetingText}</h1>
          ) : isHomePage ? (
            <Link href="/home" className="text-[17px] font-bold text-primary font-brand">
              🐬 Flipi
            </Link>
          ) : isChatPage ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-6 h-6">
                <AvatarImage src={chatAvatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {chatAvatarInitial}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-[17px] font-bold text-foreground truncate">{pageTitle}</h1>
            </div>
          ) : (
            <h1 className="text-[17px] font-bold text-foreground truncate">{pageTitle}</h1>
          )}
        </div>
        {showAdminSettings ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/settings")}
            className="h-9 w-9"
            aria-label="Platform settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        ) : !showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-9 w-9"
            aria-label="Open menu"
          >
            <Avatar className="w-7 h-7">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        ) : (
          <div className="w-9" />
        )}
      </div>
    </div>
  );
}
