import SignupForm from "@/components/auth/SignupForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - SA Healthcare",
  description: "Create your SA Healthcare account.",
};

export default function SignupPage() {
  return <SignupForm />;
}
