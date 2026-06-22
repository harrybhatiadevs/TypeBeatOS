import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth-server";

// Mounts every Better-Auth REST endpoint (sign-up, sign-in, sign-out,
// session lookup, verify, reset, etc.) under /api/auth/*.
export const { POST, GET } = toNextJsHandler(auth);
