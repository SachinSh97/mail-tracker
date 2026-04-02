-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "hit_outcome" AS ENUM ('COUNTED_AS_OPEN', 'ALREADY_OPENED', 'IGNORED_GRACE_PERIOD', 'IGNORED_OWNER', 'IGNORED_BOT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sign_in_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trackers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email_subject" TEXT,
    "recipient_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "collection_id" TEXT,
    "creator_ip" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMPTZ(3),

    CONSTRAINT "trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hits" (
    "id" TEXT NOT NULL,
    "tracker_id" TEXT NOT NULL,
    "outcome" "hit_outcome" NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "collections_user_id_created_at_idx" ON "collections"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "trackers_user_id_created_at_idx" ON "trackers"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "trackers_collection_id_idx" ON "trackers"("collection_id");

-- CreateIndex
CREATE INDEX "hits_tracker_id_created_at_idx" ON "hits"("tracker_id", "created_at");

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trackers" ADD CONSTRAINT "trackers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trackers" ADD CONSTRAINT "trackers_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hits" ADD CONSTRAINT "hits_tracker_id_fkey" FOREIGN KEY ("tracker_id") REFERENCES "trackers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

