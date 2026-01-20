"use client";

import { usePathname } from "next/navigation";
import { LeftSidebar } from "./left-sidebar";
import { BottomNav } from "./bottom-nav";

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
    <div className="h-screen w-screen flex justify-center overflow-hidden bg-background fixed inset-0">
      <div className="w-full md:w-[85%] md:max-w-[85vw] flex h-full overflow-hidden bg-background">
        {/* Left Sidebar - Desktop Only */}
        <LeftSidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-background">
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-16 md:pb-0 bg-background min-h-0">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile Only (fixed to viewport) */}
      <BottomNav />
    </div>
  );
}

