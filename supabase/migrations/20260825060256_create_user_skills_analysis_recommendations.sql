/*
# Create user_skills, skill_analysis, learning_recommendations tables

## Overview
- `user_skills`: stores multiple skills per user with proficiency level.
- `skill_analysis`: stores AI-generated analysis of a user's assessment results (strengths, weaknesses, recommendations).
- `learning_recommendations`: stores personalized learning recommendations derived from profile + assessment results.

## New Tables
1. user_skills — user_id, skill_name, proficiency
2. skill_analysis — user_id, competency_id, level, strengths[], weaknesses[], recommendations[], score_pct
3. learning_recommendations — user_id, competency_id, recommendation_text, priority, status

## Security
- All tables are owner-scoped via auth.uid() with full CRUD policies for the authenticated user.
*/

-- ============================================================
-- 1. USER_SKILLS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  proficiency text NOT NULL DEFAULT 'beginner' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name)
);

ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_skills_select_own" ON user_skills;
CREATE POLICY "user_skills_select_own" ON user_skills FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_skills_insert_own" ON user_skills;
CREATE POLICY "user_skills_insert_own" ON user_skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_skills_update_own" ON user_skills;
CREATE POLICY "user_skills_update_own" ON user_skills FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "user_skills_delete_own" ON user_skills;
CREATE POLICY "user_skills_delete_own" ON user_skills FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);

-- ============================================================
-- 2. SKILL_ANALYSIS
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'beginner',
  strengths text[] NOT NULL DEFAULT '{}',
  weaknesses text[] NOT NULL DEFAULT '{}',
  recommendations text[] NOT NULL DEFAULT '{}',
  score_pct numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE skill_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_analysis_select_own" ON skill_analysis;
CREATE POLICY "skill_analysis_select_own" ON skill_analysis FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "skill_analysis_insert_own" ON skill_analysis;
CREATE POLICY "skill_analysis_insert_own" ON skill_analysis FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "skill_analysis_update_own" ON skill_analysis;
CREATE POLICY "skill_analysis_update_own" ON skill_analysis FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "skill_analysis_delete_own" ON skill_analysis;
CREATE POLICY "skill_analysis_delete_own" ON skill_analysis FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_skill_analysis_user ON skill_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_analysis_competency ON skill_analysis(competency_id);

-- ============================================================
-- 3. LEARNING_RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id uuid REFERENCES competencies(id) ON DELETE SET NULL,
  recommendation_text text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learning_recommendations_select_own" ON learning_recommendations;
CREATE POLICY "learning_recommendations_select_own" ON learning_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "learning_recommendations_insert_own" ON learning_recommendations;
CREATE POLICY "learning_recommendations_insert_own" ON learning_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "learning_recommendations_update_own" ON learning_recommendations;
CREATE POLICY "learning_recommendations_update_own" ON learning_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "learning_recommendations_delete_own" ON learning_recommendations;
CREATE POLICY "learning_recommendations_delete_own" ON learning_recommendations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user ON learning_recommendations(user_id);