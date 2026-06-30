import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { updateBeatFromForm } from "@/lib/beat-create";

// Beat edit (incl. replacing audio) runs as a plain multipart POST, not a React
// Server Action — the Server Action flight decoder fails on file uploads in this
// standalone deployment. See app/api/beats/route.ts for the create counterpart.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const redirectTo = (path: string) =>
    new NextResponse(null, { status: 303, headers: { Location: path } });

  const user = await getUser();
  if (!user) return redirectTo("/login");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectTo(`/beats/${id}/edit?error=` + encodeURIComponent("Upload failed — please try again."));
  }

  const result = await updateBeatFromForm(user, id, formData);
  if ("error" in result) {
    return redirectTo(`/beats/${id}/edit?error=` + encodeURIComponent(result.error));
  }
  return redirectTo("/beats");
}
