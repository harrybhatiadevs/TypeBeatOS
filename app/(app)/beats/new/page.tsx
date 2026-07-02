import NewBeatForm from "./NewBeatForm";
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
      <p className="eyebrow">
        <span className="eyebrow-dot" aria-hidden="true" />
        Step 1 of 2 · beat details
      </p>
      <h1 className="page-title">New beat</h1>
      <p className="page-sub">
        Fill in the beat details — TypeBeatOS generates the full YouTube upload package from them.
      </p>

      <NewBeatForm initialError={error} atLimit={atLimit} used={used} limit={limit} />
    </>
  );
}
