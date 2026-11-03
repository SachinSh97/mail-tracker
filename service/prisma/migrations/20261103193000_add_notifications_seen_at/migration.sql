-- Notifications: remember when each user last looked at them, to count unread ones.
ALTER TABLE "users" ADD COLUMN "notifications_seen_at" TIMESTAMPTZ(3);
