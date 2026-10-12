import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up - SA Healthcare",
  description: "Create your SA Healthcare account.",
};

export default function SignupPage() {
  return <SignupForm />;
}
