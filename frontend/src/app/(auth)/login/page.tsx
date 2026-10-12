import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login - SA Healthcare",
  description: "Sign in to access your SA Healthcare account or administrative console.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-3 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
