"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, Search, Heart, MessageSquare, Gift, PlusCircle } from "lucide-react";

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
    if (path === "/home") return pathname === "/home" || pathname === "/";
    if (path === "/dashboard") return pathname === "/dashboard";
    if (path === "/find") return pathname === "/find";
    if (path === "/campaigns") return pathname?.startsWith("/campaigns");
    if (path === "/my-requests") return pathname?.startsWith("/my-requests") || pathname?.startsWith("/chat");
    if (path === "/my-items") return pathname?.startsWith("/my-items");
    return pathname === path;
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/home", auth: false },
    { icon: Search, label: "Find", href: "/find", auth: false },
    { icon: Heart, label: "Campaigns", href: "/campaigns", auth: false },
    { icon: MessageSquare, label: "Requests", href: "/my-requests", auth: true, badge: unreadCount },
    { icon: Gift, label: "My Items", href: "/my-items", auth: true },
  ];

  // Give Item - stands out
  const giveItemLink = { icon: PlusCircle, label: "Give", href: "/give", auth: true, highlight: true };

  // Hide on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/onboarding")) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-16 gap-2">
        {navItems.map((item) => {
          if (item.auth && !user) return null;
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                active 
                  ? "text-primary" 
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* Give Item - Stands out with primary button styling */}
        {giveItemLink.auth && user && (
          <Link
            href={giveItemLink.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
          >
            <div className="relative bg-primary text-primary-foreground rounded-full p-2 shadow-sm">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-primary">{giveItemLink.label}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

