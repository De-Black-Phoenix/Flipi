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
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify that the user owns this item
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("owner_id, status, campaign_id")
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.owner_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (item.status !== "given") {
      return NextResponse.json(
        { error: "Item must be marked as given first" },
        { status: 400 }
      );
    }

    // Award points using the database function
    // The function handles all validation and point calculations
    const { error: awardError } = await supabase.rpc("award_item_points", {
      giver_user_id: userId,
      item_uuid: itemId,
    });

    if (awardError) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { error: "Failed to award points" },
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

