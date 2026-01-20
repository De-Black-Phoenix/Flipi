"use client";

export default function GlobalError({ error }: { error: Error }) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl font-semibold mb-4">Critical Error</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </body>
    </html>
  );
}


