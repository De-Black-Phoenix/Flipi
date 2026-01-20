"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function VerifyEmailPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const { user, loading: authLoading } = useAuthGuard({ requireAuth: false });
  
  // Redirect if already verified and onboarded
  useEffect(() => {
    if (!user || authLoading) return;

    const checkStatus = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser?.email_confirmed_at) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", currentUser.id)
          .single();

        if (profile?.onboarding_completed) {
          // Redirect to homepage with welcome modal
          router.replace("/home?welcome=true");
        } else {
          router.replace("/onboarding");
        }
      }
    };

    checkStatus();
  }, [user, authLoading, supabase, router]);

  useEffect(() => {
    const getUserEmail = async () => {
      // Try multiple methods to get the email
      if (user?.email) {
        setEmail(user.email);
      } else {
        // Try to get email from session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
        } else {
          // Try to get from URL params (if coming from signup)
          const urlParams = new URLSearchParams(window.location.search);
          const emailParam = urlParams.get("email");
          if (emailParam) {
            setEmail(emailParam);
          }
        }
      }
    };

    getUserEmail();

    // Listen for email verification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Check if email is verified
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (currentUser?.email_confirmed_at) {
          // Email is verified, check onboarding status
          const { data: profile } = await supabase
            .from("profiles")
            .select("onboarding_completed")
            .eq("id", currentUser.id)
            .single();

          if (profile?.onboarding_completed) {
            // Redirect to homepage with welcome modal
            router.replace("/home?welcome=true");
          } else {
            router.replace("/onboarding");
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [user, supabase, router]);

  const handleResend = async () => {
    if (!email) return;

    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Resend error:", error);
    }

    setResending(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-blue-50 to-white animate-in fade-in duration-300">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl">Check your email 📩</CardTitle>
          <CardDescription className="text-base mt-2">
            We&apos;ve sent a confirmation link to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Email sent to:</p>
              <p className="font-medium text-blue-900">{email}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Click the link in the email to verify your account and continue.
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full"
                disabled={resending || !email}
              >
                {resending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </div>
                ) : (
                  "Resend verification email"
                )}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link href="/signup" className="flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to signup
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Didn&apos;t receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

