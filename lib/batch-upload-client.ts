"use client";

import { VIDEO_HEIGHT, VIDEO_WIDTH } from "./video-format";

export function imageToThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = VIDEO_WIDTH;
      canvas.height = VIDEO_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Could not prepare this image."));

      // Contain, not cover — ThumbnailBuilder (the single-beat path) uses
      // Math.min, so it letterboxes the whole artwork onto black. Cropping here
      // instead made batch videos frame the art differently from every video
      // rendered through the normal flow.
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      canvas.toBlob(
        (blob) => blob
          ? resolve(new File([blob], "thumbnail.png", { type: "image/png" }))
          : reject(new Error("Could not prepare this image.")),
        "image/png",
        0.92,
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Could not read ${file.name}.`));
    };
    image.src = objectUrl;
  });
}

export function uploadForm(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ packageId: string }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.responseType = "json";
    request.timeout = 120000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      const response = request.response as { packageId?: string; error?: string } | null;
      if (request.status >= 200 && request.status < 300 && response?.packageId) {
        resolve({ packageId: response.packageId });
      } else {
        const message = request.status === 413
          ? "The server rejected this file as too large. Choose a smaller audio file."
          : request.status === 401
            ? "Your session expired. Sign in again before retrying."
            : `Upload interrupted (HTTP ${request.status}). Retry this file.`;
        reject(new Error(response?.error || message));
      }
    };
    request.onerror = () => reject(new Error("Network error while uploading this beat."));
    request.ontimeout = () => reject(new Error("The upload timed out. Retry this file."));
    request.onabort = () => reject(new Error("The upload was cancelled. Retry this file."));
    request.send(formData);
  });
}

export async function runTwoAtATime(tasks: Array<() => Promise<void>>) {
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      await task();
    }
  };
  await Promise.all([worker(), worker()]);
}
