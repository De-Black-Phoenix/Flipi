import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const REPORT_REASONS = [
  "Fake or misleading item",
  "Stolen item",
  "Scam or fraud attempt",
  "Inappropriate content",
  "Hate or harassment",
  "Dangerous or illegal item",
  "Duplicate or spam listing",
  "Impersonation",
  "Other",
];

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

    if (!itemId || !reason || !REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ message: "Invalid report" }, { status: 400 });
    }

    if (reason === "Other" && (!details || !String(details).trim())) {
      return NextResponse.json({ message: "Details required" }, { status: 400 });
    }

    // Prevent duplicate reports (same user + same item)
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id")
      .eq("reported_item_id", itemId)
      .eq("reporter_id", user.id)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json({ success: true });
    }

    // Insert report
    const { error } = await supabase.from("reports").insert({
      reported_item_id: itemId,
      reporter_id: user.id,
      reason: reason.trim(),
      details: details ? String(details).trim() : null,
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

