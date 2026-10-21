import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - SA Healthcare",
  description: "Reset your SA Healthcare account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
