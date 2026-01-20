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

    // Check if already shared (toggle behavior)
    const { data: existingShare, error: checkError } = await supabase
      .from("item_shares")
      .select("id")
      .eq("item_id", itemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to check share status" },
        { status: 500 }
      );
    }

    // If already shared, unshare it (toggle)
    if (existingShare) {
      const { error } = await supabase
        .from("item_shares")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", user.id);

      if (error) {
        // Security: Don't log sensitive error details
        return NextResponse.json(
          { message: "Failed to unshare item" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "unshared" });
    }

    // Insert share
    const { error } = await supabase
      .from("item_shares")
      .insert({
        item_id: itemId,
        user_id: user.id,
      });

    if (error) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to share item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, action: "shared" });
  } catch (error: any) {
    // Security: Don't expose internal error details
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
