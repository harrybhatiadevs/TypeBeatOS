import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createBeatPackage } from "@/lib/beat-create";
import { canGeneratePackage } from "@/lib/billing";

// Beat creation runs as a normal multipart POST (not a React Server Action) so
// the audio file is parsed by `request.formData()` — the Server Action "flight"
// decoder drops/fails file blobs in this standalone deployment, which made every
// upload-with-audio silently fail. A plain route handler is the robust path.
export async function POST(request: Request) {
  // 303 keeps a relative Location, which the browser resolves against the public
  // origin — avoids leaking the internal container host that an absolute redirect
  // built from request.url would expose behind the proxy.
  const redirectTo = (path: string) =>
    new NextResponse(null, { status: 303, headers: { Location: path } });

  const user = await getUser();
  if (!user) return redirectTo("/login");

  // Paywall: block generating another pack once the plan's monthly quota is hit
  // (admins bypass). Checked before parsing the upload so we don't ingest a file
  // we're going to reject.
  const quota = await canGeneratePackage(user);
  if (!quota.ok) return redirectTo("/billing?upgrade=quota");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectTo("/beats/new?error=" + encodeURIComponent("Upload failed — please try again."));
  }

  const result = await createBeatPackage(user, formData);
  if ("error" in result) {
    return redirectTo("/beats/new?error=" + encodeURIComponent(result.error));
  }
  return redirectTo(`/packages/${result.packageId}`);
}
