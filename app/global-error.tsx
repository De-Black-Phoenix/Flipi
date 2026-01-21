"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for monitoring (in production, send to error tracking service)
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
