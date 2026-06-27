-- Platform-wide certificate (awarded once a learner completes all 6 published
-- courses), the 80% pass-score bump, and a slot to cache an AI-generated
-- illustration per lesson. Additive + idempotent except the bare UPDATEs,
-- which are safe to re-run (they just no-op once values already match).

CREATE TABLE IF NOT EXISTS platform_certificates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  courses_completed INTEGER NOT NULL,
  issued_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE lessons ADD COLUMN ai_image_url TEXT;

UPDATE module_tests SET pass_score = 80 WHERE pass_score < 80;
UPDATE module_exams SET pass_score = 80 WHERE pass_score < 80;
