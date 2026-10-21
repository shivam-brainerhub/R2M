import NotFoundView from "@/components/NotFoundView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function Page404() {
  return <NotFoundView />;
}
