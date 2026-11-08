-- Server-side sign-out: tokens carry this number; bumping it invalidates all of a user's sessions.
ALTER TABLE "users" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
