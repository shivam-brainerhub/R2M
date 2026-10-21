import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reset Password - SA Healthcare",
  description: "Set a new password for your SA Healthcare account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
