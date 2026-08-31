/**
 * One source of truth for the video frame size.
 *
 * Thumbnails are *authored* in a 1280×720 design space — the saved
 * thumbnailConfig stores font sizes and offsets in those units, so changing it
 * would silently resize every existing producer's text. Instead the output
 * canvas is the design space multiplied by THUMB_SCALE, which keeps old configs
 * valid while rasterizing text and effects at the full output resolution.
 */

/** Coordinate system every thumbnail is composed in. Do not change. */
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

/** Delivered frame size: 1080p. */
export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;

/** Factor between the design space and the delivered frame. */
export const THUMB_SCALE = VIDEO_WIDTH / DESIGN_WIDTH;
