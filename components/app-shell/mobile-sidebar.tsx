"use client";

import { useEffect, useState, useRef, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Search,
  Heart,
  MessageSquare,
  Gift,
  Bookmark,
  LayoutDashboard,
  PlusCircle,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Users,
} from "lucide-react";

const MobileSidebarContext = createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({ isOpen: false, setIsOpen: () => {} });

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MobileSidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, setIsOpen } = useMobileSidebar();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showMoreLinks, setShowMoreLinks] = useState(false);
  const navFontProbeRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load user and profile
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

        const { count } = await supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("requester_id", user.id)
          .gt("requester_unread_count", 0);
        setUnreadCount(count || 0);
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

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
    setShowMoreLinks(false);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f26d9da2-ab06-4244-a454-eea51bd6aa25',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mobile-sidebar.tsx:109',message:'sidebar route change',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
  }, [pathname]);

  // Swipe gesture handling
  useEffect(() => {
    if (typeof window === "undefined") return;

    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchStartX - touchEndX;

      // Swipe from left edge to open
      if (touchStartX < 20 && swipeDistance < -minSwipeDistance && !isOpen) {
        setIsOpen(true);
      }

      // Swipe to close
      if (isOpen && swipeDistance > minSwipeDistance) {
        setIsOpen(false);
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      setIsOpen(false);
    }
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f26d9da2-ab06-4244-a454-eea51bd6aa25',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mobile-sidebar.tsx:161',message:'sidebar open state',data:{isOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !navFontProbeRef.current) return;
    const computed = window.getComputedStyle(navFontProbeRef.current);
    const bodyComputed = window.getComputedStyle(document.body);
    const rootComputed = window.getComputedStyle(document.documentElement);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f26d9da2-ab06-4244-a454-eea51bd6aa25',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mobile-sidebar.tsx:178',message:'mobile nav font computed',data:{fontFamily:computed.fontFamily,fontWeight:computed.fontWeight,className:navFontProbeRef.current.className},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f26d9da2-ab06-4244-a454-eea51bd6aa25',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mobile-sidebar.tsx:182',message:'font vars',data:{bodyVar:bodyComputed.getPropertyValue('--font-bricolage').trim(),rootVar:rootComputed.getPropertyValue('--font-bricolage').trim(),bodyFontFamily:bodyComputed.fontFamily,rootFontFamily:rootComputed.fontFamily},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
  }, [isOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push("/");
  };

  const isActive = (path: string) => {
    if (path === "/home") return pathname === "/home" || pathname === "/" || pathname === "/dashboard";
    if (path === "/find") return pathname === "/find";
    if (path === "/campaigns") return pathname?.startsWith("/campaigns");
    if (path === "/my-requests") return pathname?.startsWith("/my-requests") || pathname?.startsWith("/chat");
    if (path === "/my-items") return pathname?.startsWith("/my-items");
    if (path === "/saved") return pathname === "/saved";
    if (path === "/profile") return pathname === "/profile";
    if (path === "/settings") return pathname === "/settings";
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

  const giveItemLink = { icon: PlusCircle, label: "Give Item", href: "/give", auth: true };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          ref={backdropRef}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-background border-r border-border z-50 md:hidden transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ willChange: "transform" }}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <Link href="/home" className="text-[15px] font-semibold text-primary font-brand" onClick={() => setIsOpen(false)}>
              🐬 Flipi
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-9 w-9"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Profile Card */}
          {user && profile && (
            <>
              <div className="px-3 py-2.5 border-b border-border">
                <Link
                  href={`/user/${user.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate user-name">
                      {profile.full_name || "User"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {profile.rank || "Helper"}
                    </p>
                  </div>
                </Link>
              </div>
            </>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-4">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                if (item.auth && !user) return null;
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block"
                  >
                    <Button
                      variant="ghost"
                      ref={item.href === "/home" ? navFontProbeRef : undefined}
                      className={`w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[13px]">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </Button>
                  </Link>
                );
              })}

              {/* Give Item */}
              {giveItemLink.auth && user && (
                <Link href={giveItemLink.href} onClick={() => setIsOpen(false)} className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold text-foreground"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="text-[13px]">{giveItemLink.label}</span>
                  </Button>
                </Link>
              )}

              {/* Dashboard */}
              {user && (
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold ${
                      isActive("/dashboard")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-[13px]">Dashboard</span>
                  </Button>
                </Link>
              )}

              {/* Admin Links */}
              {profile?.user_type === "ngo_admin" && (
                <Link href="/ngo/dashboard" onClick={() => setIsOpen(false)} className="block">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold ${
                      isActive("/ngo/dashboard")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-[13px]">NGO Dashboard</span>
                  </Button>
                </Link>
              )}
              {profile?.user_type === "platform_admin" && (
                <Link href="/admin" onClick={() => setIsOpen(false)} className="block">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold ${
                      isActive("/admin")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-[13px]">Admin Panel</span>
                  </Button>
                </Link>
              )}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="border-t border-border px-2 py-2 space-y-0.5">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setShowMoreLinks(true)}
                  className="w-full justify-start gap-2.5 px-2 py-2 h-auto rounded-lg text-foreground font-[var(--font-bricolage)] font-semibold"
                >
                  <span className="text-[13px] font-[var(--font-bricolage)] font-semibold">More</span>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="w-full" size="sm">
                  <Link href="/login" onClick={() => setIsOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href="/signup" onClick={() => setIsOpen(false)}>Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>
      {showMoreLinks && user && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
            onClick={() => setShowMoreLinks(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
            <div className="bg-background border-t border-border rounded-t-[40px] rounded-b-none px-4 pt-4 pb-6 shadow-lg animate-sheet-bounce">
              <div className="space-y-1">
                <Link href="/profile" onClick={() => setIsOpen(false)} className="block">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold ${
                      isActive("/profile")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="text-[13px] font-[var(--font-bricolage)] font-semibold">Profile</span>
                  </Button>
                </Link>
                <Link href="/settings" onClick={() => setIsOpen(false)} className="block">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold ${
                      isActive("/settings")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-[13px] font-[var(--font-bricolage)] font-semibold">Settings</span>
                  </Button>
                </Link>
                <Link href="/support" onClick={() => setIsOpen(false)} className="block">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg font-[var(--font-bricolage)] font-semibold ${
                      isActive("/support")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground"
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span className="text-[13px] font-[var(--font-bricolage)] font-semibold">Support</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start gap-2.5 px-3 py-2.5 h-auto rounded-lg text-red-600 hover:bg-red-50 font-[var(--font-bricolage)] font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-[13px] font-[var(--font-bricolage)] font-semibold">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

