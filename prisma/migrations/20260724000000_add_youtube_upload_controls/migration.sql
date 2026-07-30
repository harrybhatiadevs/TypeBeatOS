ALTER TABLE "Package"
ADD COLUMN "youtubePrivacyStatus" TEXT NOT NULL DEFAULT 'private',
ADD COLUMN "youtubeMadeForKids" BOOLEAN NOT NULL DEFAULT false;
