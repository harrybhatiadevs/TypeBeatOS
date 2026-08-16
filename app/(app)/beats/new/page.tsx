import NewBeatForm from "./NewBeatForm";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPlanState } from "@/lib/billing";

export default async function NewBeatPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireUser();
  const { used, limit, isAdmin, planId } = await getPlanState(user);
  const atLimit = !isAdmin && used >= limit;
  const batchUploadLocked = !isAdmin && planId === "free";

  return (
    <>
      <div className="batch-page-heading">
        <h1 className="page-title">New beat</h1>
        <Link href="/beats/batch" className="btn btn-ghost btn-sm batch-pro-link">
          Batch upload
          {batchUploadLocked ? <span className="batch-pro-pill">Pro</span> : null}
        </Link>
      </div>
      <p className="page-sub">
        Fill in the beat details — TypeBeatOS generates the full YouTube upload package from them.
      </p>

      <NewBeatForm initialError={error} atLimit={atLimit} used={used} limit={limit} />
    </>
  );
}
