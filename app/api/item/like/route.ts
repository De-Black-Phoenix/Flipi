import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { itemId } = await request.json();

    if (!itemId) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 }
      );
    }

    // Check if already liked (toggle behavior)
    const { data: existingLike, error: checkError } = await supabase
      .from("item_likes")
      .select("id")
      .eq("item_id", itemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to check like status" },
        { status: 500 }
      );
    }

    // If already liked, unlike it (toggle)
    if (existingLike) {
      const { error } = await supabase
        .from("item_likes")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", user.id);

      if (error) {
        // Security: Don't log sensitive error details
        return NextResponse.json(
          { message: "Failed to unlike item" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "unliked" });
    }

    // Insert like
    const { error } = await supabase
      .from("item_likes")
      .insert({
        item_id: itemId,
        user_id: user.id,
      });

    if (error) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to like item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, action: "liked" });
  } catch (error: any) {
    // Security: Don't expose internal error details
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { message: "Item ID is required" },
        { status: 400 }
      );
    }

    // Delete like
    const { error } = await supabase
      .from("item_likes")
      .delete()
      .eq("item_id", itemId)
      .eq("user_id", user.id);

    if (error) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to unlike item" },
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

