"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, Search, Heart, MessageSquare, PlusCircle } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { count } = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("requester_id", user.id)
          .gt("requester_unread_count", 0);
        setUnreadCount(count || 0);
      }
    };

    getUser();

    if (user) {
      const channel = supabase
        .channel(`bottom-nav-unread-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
            filter: `requester_id=eq.${user.id}`,
          },
          async () => {
            const { count } = await supabase
              .from("conversations")
              .select("id", { count: "exact", head: true })
              .eq("requester_id", user.id)
              .gt("requester_unread_count", 0);
            setUnreadCount(count || 0);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, supabase]);

  const isActive = (path: string) => {
    if (path === "/home") return pathname === "/home" || pathname === "/" || pathname === "/dashboard";
    if (path === "/find") return pathname === "/find";
    if (path === "/give") return pathname === "/give";
    if (path === "/campaigns") return pathname?.startsWith("/campaigns");
    if (path === "/my-requests") return pathname?.startsWith("/my-requests") || pathname?.startsWith("/chat");
    return pathname === path;
  };

  // Exactly 5 nav items for mobile
  const navItems = [
    { icon: Home, label: "Home", href: "/home", auth: false },
    { icon: Search, label: "Find", href: "/find", auth: false },
    { icon: PlusCircle, label: "Give", href: "/give", auth: true },
    { icon: Heart, label: "Campaigns", href: "/campaigns", auth: false },
    { icon: MessageSquare, label: "Requests", href: "/my-requests", auth: true, badge: unreadCount },
  ];

  const visiblePaths = ["/home", "/dashboard", "/find", "/give", "/campaigns", "/my-requests"];
  const shouldShowNav = pathname ? visiblePaths.includes(pathname) : false;

  // Hide on auth pages and any non-main pages
  if (
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/onboarding") ||
    !shouldShowNav
  ) {
    return null;
  }

  return (
    <nav className="md:hidden w-full bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-14 px-2 pb-safe">
        {navItems.map((item) => {
          if (item.auth && !user) return null;
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] transition-colors ${
                active 
                  ? "text-primary" 
                  : "text-muted-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="w-[22px] h-[22px]" />
              </div>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

