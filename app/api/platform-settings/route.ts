import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("key", { ascending: true });

    if (error) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to fetch settings" },
        { status: 500 }
      );
    }

    // Convert array to object for easier access
    const settings: Record<string, { value: string; updated_at: string; updated_by: string | null }> = {};
    data?.forEach((setting) => {
      settings[setting.key] = {
        value: setting.value || "",
        updated_at: setting.updated_at,
        updated_by: setting.updated_by,
      };
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    // Security: Don't expose internal error details
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is platform admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, user_type")
      .eq("id", user.id)
      .single();

    if (profileError || (profile?.role !== "platform_admin" && profile?.user_type !== "platform_admin")) {
      return NextResponse.json(
        { message: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { message: "Key is required" },
        { status: 400 }
      );
    }

    // Update or insert setting
    const { error: updateError } = await supabase
      .from("platform_settings")
      .upsert({
        key,
        value: value || "",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key",
      });

    if (updateError) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to update setting" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Security: Don't expose internal error details
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

