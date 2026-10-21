import ServerErrorView from "@/components/ServerErrorView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Internal Server Error",
};

export default function Page500() {
  return <ServerErrorView />;
}
