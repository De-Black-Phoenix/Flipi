"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  redirectTo?: string;
}

export function useAuthGuard({ requireAuth = true, redirectTo }: UseAuthGuardOptions = {}) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    // Use getUser() which is faster and cached
    const checkAuth = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (mounted) {
          setUser(currentUser ?? null);

          if (error || !currentUser) {
            if (requireAuth) {
              router.replace(redirectTo || "/login");
            }
          } else if (!requireAuth) {
            router.replace(redirectTo || "/find");
          }
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          if (requireAuth) {
            router.replace(redirectTo || "/login");
          }
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (requireAuth && !currentUser) {
          router.replace(redirectTo || "/login");
        } else if (!requireAuth && currentUser) {
          router.replace(redirectTo || "/find");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireAuth, redirectTo]);

  // Return loading: false to maintain API compatibility but not block rendering
  return { user, loading: false };
}

