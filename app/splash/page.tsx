"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SplashPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const checkAuthAndRedirect = async () => {
      // Wait 1.5 seconds first
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!mounted) return;
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // User is authenticated, check if onboarding is completed
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .single();
        
        if (profile?.onboarding_completed) {
          router.replace("/home");
        } else {
          router.replace("/onboarding");
        }
      } else {
        // User not authenticated, go to signup
        router.replace("/signup");
      }
    };

    checkAuthAndRedirect();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
        {/* Dolphin Emoji/Logo */}
        <div className="text-8xl animate-bounce" style={{ animationDuration: "2s" }}>
          🐬
        </div>
        
        {/* Brand Name */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
            Flipi
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Need it? Flipi.
          </p>
        </div>

      </div>
    </div>
  );
}

