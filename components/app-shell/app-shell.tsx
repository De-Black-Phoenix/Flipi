"use client";

import { usePathname } from "next/navigation";
import { LeftSidebar } from "./left-sidebar";
import { BottomNav } from "./bottom-nav";
import { MobileSidebar, MobileSidebarProvider } from "./mobile-sidebar";
import { MobileTopBar } from "./mobile-top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide shell on auth pages and splash
  const isAuthPage =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/onboarding") ||
    pathname?.startsWith("/verify-email") ||
    pathname?.startsWith("/auth") ||
    pathname === "/splash";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <MobileSidebarProvider>
      <div className="h-screen w-screen flex justify-center overflow-hidden bg-background fixed inset-0">
        <div className="w-full md:w-[85%] md:max-w-[85vw] flex h-full overflow-hidden bg-background">
          {/* Left Sidebar - Desktop Only */}
          <LeftSidebar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
            {/* Mobile Top Bar */}
            <MobileTopBar />
            <div className="flex-1 overflow-y-auto custom-scrollbar pt-14 md:pt-0 bg-background min-h-0">
              {children}
            </div>
            {/* Bottom Navigation - Mobile Only (in flow) */}
            <BottomNav />
          </main>
        </div>

        {/* Mobile Slide-in Sidebar */}
        <MobileSidebar />
      </div>
    </MobileSidebarProvider>
  );
}

