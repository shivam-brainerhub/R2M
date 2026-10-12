import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailContent from "@/components/auth/VerifyEmailContent";

export const metadata: Metadata = {
  title: "Verify Email - SA Healthcare",
  description: "Confirm your email address to activate your SA Healthcare account.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
