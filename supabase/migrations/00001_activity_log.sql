-- Activity Log table for admin action tracking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'login', 'invite', 'status_change', 'publish')),
  entity TEXT NOT NULL,          -- e.g. 'lead', 'project', 'blog', 'team_member', 'expense'
  entity_id TEXT,                -- ID of the affected row (nullable for general actions)
  details TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries ordered by time
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log (created_at DESC);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read activity logs
CREATE POLICY "Authenticated users can view activity log"
  ON activity_log FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert activity logs
CREATE POLICY "Authenticated users can insert activity log"
  ON activity_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Auto-cleanup: keep only last 500 entries (run periodically or via trigger)
-- Optional: uncomment if you want automatic pruning
-- CREATE OR REPLACE FUNCTION prune_activity_log()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   DELETE FROM activity_log
--   WHERE id NOT IN (
--     SELECT id FROM activity_log ORDER BY created_at DESC LIMIT 500
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- 
-- CREATE TRIGGER trigger_prune_activity_log
--   AFTER INSERT ON activity_log
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION prune_activity_log();
