import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPlanState } from "@/lib/billing";
import BatchUploader from "./BatchUploader";
import { MAX_BATCH_ITEMS } from "@/lib/batch-types";

export default async function BatchUploadPage() {
  const user = await requireUser();
  const [plan, youtube] = await Promise.all([
    getPlanState(user),
    db.youTubeAccount.findUnique({ where: { userId: user.id }, select: { channelTitle: true } }),
  ]);

  return (
    <>
      <h1 className="page-title">Batch upload</h1>
      <p className="page-sub">
        Pair up to {MAX_BATCH_ITEMS} beats with {MAX_BATCH_ITEMS} images, apply shared settings, and queue the whole release run at once.
      </p>
      <BatchUploader
        planId={plan.planId}
        isAdmin={plan.isAdmin}
        remaining={plan.isAdmin ? 999 : plan.remaining}
        connectedChannel={youtube?.channelTitle || ""}
        profileDefaults={{
          storeLink: user.profile?.storeUrl || "",
          scheduleTime: user.profile?.scheduleTime || "18:00",
        }}
      />
    </>
  );
}
