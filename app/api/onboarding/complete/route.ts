import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
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

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { avatar_url, region, town, onboarding_responses } = body;

    if (!avatar_url || !region || !town || !onboarding_responses) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Input validation (security: prevent abuse)
    const MAX_TEXT_LENGTH = 200;
    const MAX_URL_LENGTH = 500;

    if (region.length > MAX_TEXT_LENGTH || town.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Region and town must be ${MAX_TEXT_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (avatar_url.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { error: "Invalid avatar URL length" },
        { status: 400 }
      );
    }

    // Basic URL validation for avatar_url (security: prevent SSRF)
    try {
      if (avatar_url && !avatar_url.startsWith('http://') && !avatar_url.startsWith('https://')) {
        return NextResponse.json(
          { error: "Avatar URL must be a valid HTTP(S) URL" },
          { status: 400 }
        );
      }
      // Only allow Cloudinary URLs (security: SSRF prevention)
      if (avatar_url && !avatar_url.includes('cloudinary.com') && !avatar_url.startsWith('data:image/')) {
        return NextResponse.json(
          { error: "Avatar must be from Cloudinary or a data URL" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid avatar URL format" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url,
        region,
        town,
        onboarding_completed: true,
        onboarding_responses,
      })
      .eq("id", userId);

    if (updateError) {
      // Security: Don't expose internal error details
      return NextResponse.json(
        { error: "Failed to complete onboarding" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Security: Don't expose internal error details
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
