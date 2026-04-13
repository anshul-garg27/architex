-- =============================================================================
-- CUSTOM CONSTRAINTS & FEATURES
-- =============================================================================
-- These constraints cannot be expressed in Drizzle's declarative schema.
-- Apply after the initial schema generation via `drizzle-kit migrate`.

-- ---------------------------------------------------------------------------
-- 1. Self-referencing FK on diagrams (forked_from_id)
-- ---------------------------------------------------------------------------
ALTER TABLE diagrams
  ADD CONSTRAINT diagrams_forked_from_fk
  FOREIGN KEY (forked_from_id) REFERENCES diagrams(id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2. Self-referencing FK on comments (parent_id for threading)
-- ---------------------------------------------------------------------------
ALTER TABLE comments
  ADD CONSTRAINT comments_parent_fk
  FOREIGN KEY (parent_id) REFERENCES comments(id)
  ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. updated_at auto-update trigger
--    Automatically sets updated_at = NOW() on any UPDATE.
--    Applied to tables that have an updated_at column.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Diagrams
CREATE TRIGGER trg_diagrams_updated_at
  BEFORE UPDATE ON diagrams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Templates
CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Challenges
CREATE TRIGGER trg_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Progress
CREATE TRIGGER trg_progress_updated_at
  BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Comments
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Check constraints for data integrity
-- ---------------------------------------------------------------------------

-- Mastery score must be 0-100
ALTER TABLE progress
  ADD CONSTRAINT progress_mastery_score_range
  CHECK (mastery_score >= 0 AND mastery_score <= 100);

-- FSRS stability must be non-negative
ALTER TABLE progress
  ADD CONSTRAINT progress_stability_range
  CHECK (stability >= 0);

-- FSRS difficulty must be 0-10
ALTER TABLE progress
  ADD CONSTRAINT progress_difficulty_range
  CHECK (difficulty >= 0 AND difficulty <= 10);

-- Challenge attempt score must be 0-100
ALTER TABLE challenge_attempts
  ADD CONSTRAINT attempts_score_range
  CHECK (score IS NULL OR (score >= 0 AND score <= 100));

-- Hints used must be non-negative
ALTER TABLE challenge_attempts
  ADD CONSTRAINT attempts_hints_range
  CHECK (hints_used >= 0);

-- XP must be non-negative
ALTER TABLE users
  ADD CONSTRAINT users_xp_non_negative
  CHECK (xp >= 0);

-- Streak must be non-negative
ALTER TABLE users
  ADD CONSTRAINT users_streak_non_negative
  CHECK (streak_current >= 0 AND streak_longest >= 0);

-- Denormalized counters must be non-negative
ALTER TABLE diagrams
  ADD CONSTRAINT diagrams_counters_non_negative
  CHECK (
    view_count >= 0
    AND upvote_count >= 0
    AND comment_count >= 0
    AND fork_count >= 0
  );

-- ---------------------------------------------------------------------------
-- 5. Partial indexes for hot query paths
-- ---------------------------------------------------------------------------

-- Public diagrams only (gallery feed)
CREATE INDEX IF NOT EXISTS diagrams_public_created_idx
  ON diagrams (created_at DESC)
  WHERE visibility = 'public';

-- Public diagrams by upvotes (popular tab)
CREATE INDEX IF NOT EXISTS diagrams_public_upvotes_idx
  ON diagrams (upvote_count DESC)
  WHERE visibility = 'public';

-- Published challenges only (challenge list)
CREATE INDEX IF NOT EXISTS challenges_published_idx
  ON challenges (difficulty, sort_order)
  WHERE status = 'published';

-- Published templates only (template gallery)
CREATE INDEX IF NOT EXISTS templates_published_category_idx
  ON templates (category, sort_order)
  WHERE is_published = true;

-- Active collaboration sessions
CREATE INDEX IF NOT EXISTS collab_sessions_active_idx
  ON collab_sessions (diagram_id)
  WHERE status = 'active';
