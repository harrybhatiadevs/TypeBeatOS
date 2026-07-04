-- Producer's IANA time zone for the default upload schedule (e.g. "America/New_York").
-- Empty string means "fall back to the browser's detected zone / UTC".
ALTER TABLE "Profile" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT '';
