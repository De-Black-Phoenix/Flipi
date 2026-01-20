import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore errors in route handlers
          }
        },
      },
    }
  );

  // Handle email verification and OAuth callbacks with code exchange
  if (code) {
    try {
      // Exchange the code for a session (works for both OAuth and email verification)
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // Only log unexpected errors, not common flow issues
        if (!error.message.includes("code verifier") && 
            !error.message.includes("expired") &&
            !error.message.includes("invalid")) {
          console.error("Error exchanging code for session:", error);
        }
        // Redirect to onboarding to allow user to continue
        return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
      }

      if (data?.user) {
        // Ensure profile exists and update with user data if needed
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("onboarding_completed, full_name, email")
          .eq("id", data.user.id)
          .single();

        // If profile doesn't exist, create it (shouldn't happen due to trigger, but just in case)
        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, create it
          const userName = data.user.user_metadata?.full_name || 
                          data.user.user_metadata?.name ||
                          data.user.email?.split("@")[0] || 
                          "User";
          
          await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: userName,
            });
        } else if (profile && !profile.full_name && data.user.user_metadata) {
          // Update profile with name if missing
          const userName = data.user.user_metadata.full_name || 
                          data.user.user_metadata.name ||
                          data.user.email?.split("@")[0] || 
                          "User";
          
          await supabase
            .from("profiles")
            .update({ full_name: userName })
            .eq("id", data.user.id);
        }

        // Re-fetch profile to get updated data
        const { data: updatedProfile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", data.user.id)
          .single();

        // Redirect based on onboarding status
        if (!updatedProfile || !updatedProfile.onboarding_completed) {
          return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
        }

        // If onboarding is already completed, go to homepage with welcome modal
        return NextResponse.redirect(new URL("/home?welcome=true", requestUrl.origin));
      }
    } catch (error) {
      // Silent fail - just redirect to onboarding
      return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
    }
  }

  // Fallback: Check if user is already authenticated (for direct access)
  const { data: { user: existingUser } } = await supabase.auth.getUser();
  
  if (existingUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", existingUser.id)
      .single();

    if (!profile || !profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
    }

    return NextResponse.redirect(new URL("/home?welcome=true", requestUrl.origin));
  }

  // Default redirect to onboarding
  return NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
}
