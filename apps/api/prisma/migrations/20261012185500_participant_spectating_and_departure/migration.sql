-- AlterTable
ALTER TABLE "participants" ADD COLUMN "left_at" TIMESTAMPTZ(3);

ALTER TABLE "participants" ADD COLUMN "spectating" BOOLEAN;

UPDATE "participants" SET "spectating" = false;

ALTER TABLE "participants" ALTER COLUMN "spectating" SET NOT NULL;
