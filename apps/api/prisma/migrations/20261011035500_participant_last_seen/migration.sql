-- AlterTable
ALTER TABLE "participants" ADD COLUMN "last_seen_at" TIMESTAMPTZ(3);

UPDATE "participants" SET "last_seen_at" = "joined_at";

ALTER TABLE "participants" ALTER COLUMN "last_seen_at" SET NOT NULL;
