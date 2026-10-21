"use client";

import ServerErrorView from "@/components/ServerErrorView";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fatal global layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font, @next/next/google-font-display */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col justify-center">
        <ServerErrorView error={error} reset={reset} />
      </body>
    </html>
  );
}
