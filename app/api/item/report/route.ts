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

    const { itemId, reason, details } = await request.json();

    if (!itemId || !reason) {
      return NextResponse.json(
        { message: "Item ID and reason are required" },
        { status: 400 }
      );
    }

    // Validate input lengths (security: prevent abuse)
    const MAX_REASON_LENGTH = 100;
    const MAX_DETAILS_LENGTH = 1000;

    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { message: `Reason must be ${MAX_REASON_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    if (details && details.length > MAX_DETAILS_LENGTH) {
      return NextResponse.json(
        { message: `Details must be ${MAX_DETAILS_LENGTH} characters or less` },
        { status: 400 }
      );
    }

    // Prevent duplicate reports (security: abuse prevention)
    const { data: existingReport, error: checkError } = await supabase
      .from("item_reports")
      .select("id")
      .eq("item_id", itemId)
      .eq("reporter_id", user.id)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to check report status" },
        { status: 500 }
      );
    }

    if (existingReport) {
      return NextResponse.json(
        { message: "You have already reported this item" },
        { status: 400 }
      );
    }

    // Insert report
    const { error } = await supabase
      .from("item_reports")
      .insert({
        item_id: itemId,
        reporter_id: user.id,
        reason: reason.trim(),
        details: details ? details.trim() : null,
      });

    if (error) {
      // Security: Don't log sensitive error details
      return NextResponse.json(
        { message: "Failed to report item" },
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

