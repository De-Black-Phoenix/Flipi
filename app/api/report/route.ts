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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { reportedItemId, reportedUserId, reason, details } = await request.json();

    if (!reason || !REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ message: "Invalid reason" }, { status: 400 });
    }

    if (!reportedItemId && !reportedUserId) {
      return NextResponse.json({ message: "Missing report target" }, { status: 400 });
    }

    if (reason === "Other" && (!details || !String(details).trim())) {
      return NextResponse.json({ message: "Details required" }, { status: 400 });
    }

    // Prevent duplicate item reports (same reporter + same item)
    if (reportedItemId) {
      const { data: existing } = await supabase
        .from("reports")
        .select("id")
        .eq("reported_item_id", reportedItemId)
        .eq("reporter_id", user.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true });
      }
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_item_id: reportedItemId ?? null,
      reported_user_id: reportedUserId ?? null,
      reason: reason.trim(),
      details: details ? String(details).trim() : null,
    });

    if (error) {
      return NextResponse.json({ message: "Failed to report" }, { status: 500 });
    }

    // Silent success response
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
