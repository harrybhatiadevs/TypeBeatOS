CREATE TABLE "UploadBatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'creating',
    "videoStyle" TEXT NOT NULL DEFAULT 'static',
    "autoUpload" BOOLEAN NOT NULL DEFAULT true,
    "autoSchedule" BOOLEAN NOT NULL DEFAULT true,
    "privacyStatus" TEXT NOT NULL DEFAULT 'private',
    "madeForKids" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UploadBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UploadBatchItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "packageId" TEXT,
    "position" INTEGER NOT NULL,
    "audioName" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UploadBatchItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UploadBatchItem_packageId_key" ON "UploadBatchItem"("packageId");
CREATE UNIQUE INDEX "UploadBatchItem_batchId_position_key" ON "UploadBatchItem"("batchId", "position");
CREATE INDEX "UploadBatch_userId_createdAt_idx" ON "UploadBatch"("userId", "createdAt");
CREATE INDEX "UploadBatch_status_idx" ON "UploadBatch"("status");
CREATE INDEX "UploadBatchItem_batchId_status_idx" ON "UploadBatchItem"("batchId", "status");

ALTER TABLE "UploadBatch" ADD CONSTRAINT "UploadBatch_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UploadBatchItem" ADD CONSTRAINT "UploadBatchItem_batchId_fkey"
    FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UploadBatchItem" ADD CONSTRAINT "UploadBatchItem_packageId_fkey"
    FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
