-- Catch-up migration for environments whose local D1 was created before the
-- module-gating feature (modules/module_unlocks/module_tests) shipped in schema.sql.
-- Safe to re-run: every statement is additive and guarded.

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 1,
  token_cost INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS module_unlocks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, module_id)
);

CREATE TABLE IF NOT EXISTS module_tests (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  module_id TEXT NOT NULL UNIQUE REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions TEXT NOT NULL DEFAULT '[]',
  pass_score INTEGER NOT NULL DEFAULT 80,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS module_test_results (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  score INTEGER,
  passed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id, position);
CREATE INDEX IF NOT EXISTS idx_module_unlocks_user ON module_unlocks(user_id);
