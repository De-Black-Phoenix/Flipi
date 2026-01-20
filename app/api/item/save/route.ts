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

    // Check if already saved (toggle behavior)
    const { data: existingSave, error: checkError } = await supabase
      .from("saved_items")
      .select("id")
      .eq("item_id", itemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to check save status" },
        { status: 500 }
      );
    }

    // If already saved, unsave it (toggle)
    if (existingSave) {
      const { error } = await supabase
        .from("saved_items")
        .delete()
        .eq("item_id", itemId)
        .eq("user_id", user.id);

      if (error) {
        // Security: Don't log sensitive error details
        return NextResponse.json(
          { message: "Failed to unsave item" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, action: "unsaved" });
    }

    // Insert save
    const { error } = await supabase
      .from("saved_items")
      .insert({
        item_id: itemId,
        user_id: user.id,
      });

    if (error) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to save item" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, action: "saved" });
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

    // Delete save
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("item_id", itemId)
      .eq("user_id", user.id);

    if (error) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to unsave item" },
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

