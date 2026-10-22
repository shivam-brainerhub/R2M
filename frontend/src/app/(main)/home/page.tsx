import { permanentRedirect } from "next/navigation";

export default function HomeLegacyRedirect() {
  permanentRedirect("/");
}
