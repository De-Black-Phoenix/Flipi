"use client";

import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Gift, Home, Heart, Users, LogOut, MessageSquare, Menu } from "lucide-react";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  // Load user and unread count
  useEffect(() => {
    /**
     * Load unread conversations count for requester
     * 
     * Notification Badge Logic:
     * Count = number of conversations where:
     * - requester is the user (items they've requested)
     * - AND conversation has requester_unread_count > 0 OR is_read_by_requester = false
     * 
     * This includes:
     * - New conversations with messages from owner
     * - Existing conversations with new messages from owner
     * 
     * The badge shows on the "My Requests" link in the navbar
     * This should NOT include conversations where user is the owner (items they've listed)
     */
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

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Subscribe to conversation updates for real-time unread count
   * 
   * Realtime Updates:
   * - Listens for INSERT, UPDATE, DELETE events on conversations table
   * - Automatically updates notification badge count when:
   *   - New conversations are created (user requests an item)
   *   - Conversation read status changes (requester opens conversation)
   *   - Conversation status changes (accepted/rejected)
   *   - New messages arrive from item owner
   * 
   * Only tracks conversations where user is the requester (items they've requested)
   */
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`nav-unread-count-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `requester_id=eq.${user.id}`,
        },
        async () => {
          // Reload unread count when conversations change
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
  }, [user, supabase]);

  const handleSignOut = async () => {
    try {
      // Clear local state immediately for instant UI feedback
      setUser(null);
      setProfile(null);
      
      // Sign out from Supabase - this clears the session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
      }
      
      // Clear any remaining Supabase storage
      // This ensures localStorage and sessionStorage are cleared
      if (typeof window !== "undefined") {
        // Clear Supabase auth storage
        const storageKeys = Object.keys(localStorage);
        storageKeys.forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear sessionStorage as well
        const sessionKeys = Object.keys(sessionStorage);
        sessionKeys.forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      // Redirect to home page
      // Use window.location for a hard redirect to ensure cookies are cleared
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out failed:", error);
      // Ensure redirect happens even on unexpected errors
      setUser(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      } else {
        router.replace("/");
      }
    }
  };

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  if (isAuthPage) {
    return null;
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="border-b bg-white/85 backdrop-blur-xl sticky top-0 z-50 shadow-sm border-cream-200/20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Brand Logo - Far Left (Mobile & Desktop) */}
        <Link href="/home" className="text-2xl font-bold text-blue-500 font-brand">
          🐬 Flipi
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/home"
            className={`text-sm hover:text-blue-500 ${pathname === "/home" || pathname === "/" ? "text-blue-500 font-medium" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/find"
            className={`text-sm hover:text-blue-500 ${pathname === "/find" ? "text-blue-500 font-medium" : ""}`}
          >
            Find Items
          </Link>
          <Link
            href="/campaigns"
            className={`text-sm hover:text-blue-500 ${pathname?.startsWith("/campaigns") ? "text-blue-500 font-medium" : ""}`}
          >
            Campaigns
          </Link>
          {user && (
            <Link
              href="/my-requests"
              className={`relative text-sm hover:text-blue-500 flex items-center gap-2 ${pathname?.startsWith("/my-requests") || pathname?.startsWith("/chat") ? "text-blue-500 font-medium" : ""}`}
            >
              {/* Messages/Inbox Icon with Notification Badge */}
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span>My Requests</span>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm user-name">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/give" className="flex items-center">
                    <Gift className="mr-2 h-4 w-4" />
                    Give Item
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-items" className="flex items-center">
                    <Heart className="mr-2 h-4 w-4" />
                    My Items
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-requests" className="flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    My Requests
                  </Link>
                </DropdownMenuItem>
                {profile?.user_type === "ngo_admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/ngo/dashboard" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      NGO Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {profile?.user_type === "platform_admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile: Hamburger Menu - Far Right */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Modal */}
      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto md:hidden">
          <div className="space-y-1">
            <Link
              href="/home"
              className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname === "/home" || pathname === "/" ? "text-blue-500 font-medium bg-blue-50" : ""}`}
              onClick={closeMobileMenu}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/find"
              className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname === "/find" ? "text-blue-500 font-medium bg-blue-50" : ""}`}
              onClick={closeMobileMenu}
            >
              <Gift className="w-5 h-5" />
              <span>Find Items</span>
            </Link>
            <Link
              href="/campaigns"
              className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname?.startsWith("/campaigns") ? "text-blue-500 font-medium bg-blue-50" : ""}`}
              onClick={closeMobileMenu}
            >
              <Heart className="w-5 h-5" />
              <span>Campaigns</span>
            </Link>

            {user ? (
              <>
                <div className="border-t my-2" />
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname === "/dashboard" ? "text-blue-500 font-medium bg-blue-50" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <Home className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/my-requests"
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname?.startsWith("/my-requests") || pathname?.startsWith("/chat") ? "text-blue-500 font-medium bg-blue-50" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>My Requests</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/give"
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname === "/give" ? "text-blue-500 font-medium bg-blue-50" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <Gift className="w-5 h-5" />
                  <span>Give Item</span>
                </Link>
                <Link
                  href="/my-items"
                  className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname === "/my-items" ? "text-blue-500 font-medium bg-blue-50" : ""}`}
                  onClick={closeMobileMenu}
                >
                  <Heart className="w-5 h-5" />
                  <span>My Items</span>
                </Link>
                {profile?.user_type === "ngo_admin" && (
                  <Link
                    href="/ngo/dashboard"
                    className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname?.startsWith("/ngo") ? "text-blue-500 font-medium bg-blue-50" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <Users className="w-5 h-5" />
                    <span>NGO Dashboard</span>
                  </Link>
                )}
                {profile?.user_type === "platform_admin" && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors ${pathname?.startsWith("/admin") ? "text-blue-500 font-medium bg-blue-50" : ""}`}
                    onClick={closeMobileMenu}
                  >
                    <Users className="w-5 h-5" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <div className="border-t my-2" />
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleSignOut();
                  }}
                  className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-red-50 transition-colors text-red-600 w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <div className="border-t my-2" />
                <Button asChild variant="outline" className="w-full" onClick={closeMobileMenu}>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild className="w-full" onClick={closeMobileMenu}>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

