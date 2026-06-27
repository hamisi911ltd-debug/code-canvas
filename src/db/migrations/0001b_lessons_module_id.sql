-- Run once. ALTER TABLE ADD COLUMN is not idempotent in SQLite — re-running
-- this against a DB that already has the column will error with
-- "duplicate column name", which is safe to ignore.
ALTER TABLE lessons ADD COLUMN module_id TEXT REFERENCES modules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id, position);
