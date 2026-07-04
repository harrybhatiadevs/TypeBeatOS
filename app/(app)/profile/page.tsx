import { redirect } from "next/navigation";

// The producer profile now lives inside Settings (left-nav → Producer profile).
// Keep this route as a permanent redirect so old links and bookmarks still work.
export default function ProfileRedirect() {
  redirect("/settings?tab=profile");
}
