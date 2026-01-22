"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Search,
  Heart,
  Users,
  MessageSquare,
  Gift,
  FileText,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  PlusCircle,
  HelpCircle,
  Bookmark,
} from "lucide-react";

export function LeftSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const navFontProbeRef = useRef<HTMLButtonElement>(null);
  const supabase = createClient();

  // Load user and unread count
  useEffect(() => {
    if (!navFontProbeRef.current) return;
    const computed = window.getComputedStyle(navFontProbeRef.current);
    const bodyComputed = window.getComputedStyle(document.body);
    const rootComputed = window.getComputedStyle(document.documentElement);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f26d9da2-ab06-4244-a454-eea51bd6aa25',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'left-sidebar.tsx:48',message:'desktop nav font computed',data:{fontFamily:computed.fontFamily,fontWeight:computed.fontWeight,className:navFontProbeRef.current.className},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f26d9da2-ab06-4244-a454-eea51bd6aa25',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'left-sidebar.tsx:52',message:'font vars desktop',data:{bodyVar:bodyComputed.getPropertyValue('--font-bricolage').trim(),rootVar:rootComputed.getPropertyValue('--font-bricolage').trim(),bodyFontFamily:bodyComputed.fontFamily,rootFontFamily:rootComputed.fontFamily},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    const loadUnreadCount = async (userId: string) => {
      const { count } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", userId)
        .gt("requester_unread_count", 0);
      setUnreadCount(count || 0);
    };

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
        await loadUnreadCount(user.id);
      } else {
        setUser(null);
        setProfile(null);
        setUnreadCount(0);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setUnreadCount(0);
      } else if (session?.user) {
        getUser();
      }
    });

    // Subscribe to conversation updates for real-time unread count
    if (user) {
      const channel = supabase
        .channel(`sidebar-unread-count-${user.id}`)
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
        subscription.unsubscribe();
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [user, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/home") {
      return pathname === "/home" || pathname === "/";
    }
    if (path === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (path === "/find") {
      return pathname === "/find";
    }
    if (path === "/campaigns") {
      return pathname?.startsWith("/campaigns");
    }
    if (path === "/my-requests") {
      return pathname?.startsWith("/my-requests") || pathname?.startsWith("/chat");
    }
    if (path === "/my-items") {
      return pathname?.startsWith("/my-items");
    }
    if (path === "/admin") {
      return pathname?.startsWith("/admin");
    }
    if (path === "/ngo/dashboard") {
      return pathname?.startsWith("/ngo");
    }
    return pathname === path;
  };

  const navItems = [
    { icon: Home, label: "Home", href: "/home", auth: false },
    { icon: Search, label: "Explore", href: "/find", auth: false },
    { icon: Heart, label: "Campaigns", href: "/campaigns", auth: false },
    { icon: MessageSquare, label: "My Requests", href: "/my-requests", auth: true, badge: unreadCount },
    { icon: Gift, label: "My Items", href: "/my-items", auth: true },
    { icon: Bookmark, label: "Saved", href: "/saved", auth: true },
  ];

  // Give Item button - stands out with primary styling
  const giveItemLink = { icon: PlusCircle, label: "Give Item", href: "/give", auth: true, highlight: true };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen border-r border-border bg-background sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <Link href="/home" className="text-2xl font-bold text-blue-500 font-brand">
          🐬 Flipi
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-2">
          {navItems.map((item) => {
            if (item.auth && !user) return null;
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className="block">
                <Button
                  variant="ghost"
                ref={item.href === "/home" ? navFontProbeRef : undefined}
                  className={`w-full justify-start gap-3 px-4 py-3 rounded-[24px] transition-all font-[var(--font-bricolage)] font-semibold ${
                    active 
                      ? "bg-primary/10 text-primary font-semibold hover:bg-primary/10 hover:text-primary" 
                      : "hover:bg-primary/10 hover:text-primary text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
          
          {/* Give Item - Stands out with primary button styling */}
          {giveItemLink.auth && user && (
            <Link href={giveItemLink.href} className="block">
              <Button
                className="w-full justify-start gap-3 px-4 py-3 rounded-[24px] bg-primary text-primary-foreground hover:bg-primary/90 font-[var(--font-bricolage)] font-semibold shadow-sm"
              >
                <PlusCircle className="w-5 h-5" />
                <span>{giveItemLink.label}</span>
              </Button>
            </Link>
          )}

          {/* Dashboard */}
          {user && (
            <Link href="/dashboard" className="block">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 px-4 py-3 rounded-[24px] transition-all font-[var(--font-bricolage)] font-semibold ${
                  isActive("/dashboard")
                    ? "bg-primary/10 text-primary font-semibold mb-2 hover:bg-primary/10 hover:text-primary" 
                    : "hover:bg-primary/10 hover:text-primary text-foreground"
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Button>
            </Link>
          )}

          {/* Admin Dashboard Links */}
          {profile?.user_type === "ngo_admin" && (
            <Link href="/ngo/dashboard" className="block">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 px-4 py-3 rounded-[24px] transition-all font-[var(--font-bricolage)] font-semibold ${
                  isActive("/ngo/dashboard")
                    ? "bg-primary/10 text-primary font-semibold mb-2 hover:bg-primary/10 hover:text-primary"
                    : "hover:bg-primary/10 hover:text-primary text-foreground"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>NGO Dashboard</span>
              </Button>
            </Link>
          )}
          {profile?.user_type === "platform_admin" && (
            <Link href="/admin" className="block">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-3 px-4 py-3 rounded-[24px] transition-all font-[var(--font-bricolage)] font-semibold ${
                  isActive("/admin")
                    ? "bg-primary/10 text-primary font-semibold mb-2 hover:bg-primary/10 hover:text-primary"
                    : "hover:bg-primary/10 hover:text-primary text-foreground"
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Admin Panel</span>
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* User Section */}
      {user ? (
        <div className="border-t border-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 p-2 h-auto hover:bg-primary/10 hover:text-primary text-foreground font-normal">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm truncate user-name">
                    {profile?.full_name || "User"}
                  </p>
                  {profile?.user_type === "platform_admin" ? (
                    <p className="text-xs truncate font-medium text-current">
                      Platform Admin
                    </p>
                  ) : (
                    <p className={`text-xs truncate font-medium ${
                      profile?.rank === "Champion" ? "text-yellow-600" :
                      profile?.rank === "Supporter" ? "text-blue-600" :
                      "text-green-600"
                    }`}>
                      {profile?.rank || "Helper"}
                    </p>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/support" className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Support
                </Link>
              </DropdownMenuItem>
              {profile?.user_type === "ngo_admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/ngo/dashboard" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    NGO Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="border-t border-border p-3 space-y-2">
          <Button asChild className="w-full" size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      )}
    </aside>
  );
}

