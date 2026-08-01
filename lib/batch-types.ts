export const MAX_BATCH_ITEMS = 5;

export type BatchVideoStyle = "static" | "waveform";
export type BatchPrivacyStatus = "private" | "unlisted" | "public";

export type BatchDraftItem = {
  audioName: string;
  imageName: string;
};

export type CreateBatchInput = {
  items: BatchDraftItem[];
  videoStyle: BatchVideoStyle;
  autoUpload: boolean;
  autoSchedule: boolean;
  privacyStatus: BatchPrivacyStatus;
  madeForKids: boolean;
};

export function validateCreateBatchInput(value: unknown):
  | { ok: true; value: CreateBatchInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid batch settings." };
  }

  const input = value as Partial<CreateBatchInput>;
  if (!Array.isArray(input.items) || input.items.length < 2 || input.items.length > MAX_BATCH_ITEMS) {
    return { ok: false, error: `Choose between 2 and ${MAX_BATCH_ITEMS} beats.` };
  }

  const items = input.items.map((item) => ({
    audioName: typeof item?.audioName === "string" ? item.audioName.trim().slice(0, 180) : "",
    imageName: typeof item?.imageName === "string" ? item.imageName.trim().slice(0, 180) : "",
  }));
  if (items.some((item) => !item.audioName || !item.imageName)) {
    return { ok: false, error: "Every beat needs one audio file and one image." };
  }

  if (input.videoStyle !== "static" && input.videoStyle !== "waveform") {
    return { ok: false, error: "Choose a valid video style." };
  }
  if (!["private", "unlisted", "public"].includes(String(input.privacyStatus))) {
    return { ok: false, error: "Choose a valid YouTube visibility." };
  }

  return {
    ok: true,
    value: {
      items,
      videoStyle: input.videoStyle,
      autoUpload: input.autoUpload !== false,
      autoSchedule: input.autoSchedule !== false,
      privacyStatus: input.privacyStatus as BatchPrivacyStatus,
      madeForKids: input.madeForKids === true,
    },
  };
}

export const TERMINAL_BATCH_ITEM_STATUSES = new Set(["completed", "ready", "failed"]);
