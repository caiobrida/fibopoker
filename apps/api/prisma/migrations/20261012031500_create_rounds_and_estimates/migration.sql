-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "title" TEXT,
    "opened_at" TIMESTAMPTZ(3) NOT NULL,
    "revealed_at" TIMESTAMPTZ(3),

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "round_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "cast_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("round_id","participant_id")
);

-- CreateIndex
CREATE INDEX "rounds_room_id_idx" ON "rounds"("room_id");

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
