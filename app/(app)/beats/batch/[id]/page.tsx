import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import BatchProgress from "./BatchProgress";

export default async function BatchProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const batch = await db.uploadBatch.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!batch) notFound();

  return (
    <>
      <h1 className="page-title">Batch progress</h1>
      <p className="page-sub">You can leave this page. Rendering and YouTube uploads continue in the background.</p>
      <BatchProgress batchId={id} />
    </>
  );
}
