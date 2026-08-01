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
  const { used, limit, isAdmin } = await getPlanState(user);
  const atLimit = !isAdmin && used >= limit;

  return (
    <>
      <div className="batch-page-heading">
        <h1 className="page-title">New beat</h1>
        <Link href="/beats/batch" className="btn btn-ghost btn-sm">Upload 2–5 beats</Link>
      </div>
      <p className="page-sub">
        Fill in the beat details — TypeBeatOS generates the full YouTube upload package from them.
      </p>

      <NewBeatForm initialError={error} atLimit={atLimit} used={used} limit={limit} />
    </>
  );
}
