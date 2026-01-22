"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Account suspended</h1>
        <p className="text-sm text-muted-foreground">
          Your account has been temporarily suspended due to a moderation action. If you believe this is a mistake,
          please contact support.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button asChild variant="outline">
            <Link href="/support">Contact support</Link>
          </Button>
          <Button asChild>
            <Link href="/login">Return to login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
