/*
# Competency Assessment & Learning Platform Schema

## Overview
Creates the full database schema for a competency assessment and AI-driven learning platform
inspired by the iGOT Karmayot problem statement. Employees take competency assessments,
the system visualizes skill gaps, recommends learning paths, generates AI MCQs from uploaded
content, and tracks course completion.

## New Tables

1. **profiles** — extends auth.users with display name, role (employee/admin), department, designation
2. **competencies** — skill domains (Python, AI/ML, GIS, Data Visualization, Sampling, SQL, etc.) with description and category
3. **assessment_questions** — MCQ bank for competency assessments, linked to a competency
4. **assessment_results** — stores a user's score per competency assessment attempt
5. **courses** — course catalog with title, description, competency, difficulty, duration, provider
6. **enrollments** — tracks a user's enrollment and progress in a course
7. **learning_paths** — recommended sequence of courses for a user, generated after assessment
8. **uploaded_documents** — PDF/PPT files uploaded by admin/employee for MCQ generation
9. **generated_quizzes** — AI-generated MCQ quizzes from uploaded documents
10. **quiz_questions** — individual questions within a generated quiz
11. **quiz_attempts** — a user's attempt at a generated quiz, with score
12. **chat_sessions** — RAG chatbot conversation sessions
13. **chat_messages** — individual messages in a chat session

## Security
- RLS enabled on ALL tables.
- Profiles: users can read all profiles (for admin/employee views), update only their own.
- All other tables: owner-scoped via user_id with auth.uid() checks.
- Admin-only tables (courses, competencies, assessment_questions): authenticated users can SELECT;
  only users with role='admin' in profiles can INSERT/UPDATE/DELETE (enforced via policy subquery).
- Uploaded documents: any authenticated user can upload; only the uploader or admin can read/delete.
*/

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  department text NOT NULL DEFAULT '',
  designation text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all profiles (needed for admin views, leaderboards)
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Users can update only their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Users can insert only their own profile
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. COMPETENCIES
-- ============================================================
CREATE TABLE IF NOT EXISTS competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'technical',
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "competencies_select_all" ON competencies;
CREATE POLICY "competencies_select_all" ON competencies FOR SELECT
  TO authenticated USING (true);

-- Only admins can modify competencies
DROP POLICY IF EXISTS "competencies_modify_admin" ON competencies;
CREATE POLICY "competencies_modify_admin" ON competencies FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- 3. ASSESSMENT QUESTIONS (MCQ bank for competency assessments)
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_questions_select_all" ON assessment_questions;
CREATE POLICY "assessment_questions_select_all" ON assessment_questions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "assessment_questions_modify_admin" ON assessment_questions;
CREATE POLICY "assessment_questions_modify_admin" ON assessment_questions FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- 4. ASSESSMENT RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id uuid NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  score_pct numeric(5,2) NOT NULL DEFAULT 0,
  total_questions int NOT NULL DEFAULT 0,
  correct_answers int NOT NULL DEFAULT 0,
  taken_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_results_select_own" ON assessment_results;
CREATE POLICY "assessment_results_select_own" ON assessment_results FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "assessment_results_insert_own" ON assessment_results;
CREATE POLICY "assessment_results_insert_own" ON assessment_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assessment_results_update_own" ON assessment_results;
CREATE POLICY "assessment_results_update_own" ON assessment_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "assessment_results_delete_own" ON assessment_results;
CREATE POLICY "assessment_results_delete_own" ON assessment_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assessment_results_user ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_competency ON assessment_results(competency_id);

-- ============================================================
-- 5. COURSES
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  competency_id uuid REFERENCES competencies(id) ON DELETE SET NULL,
  difficulty text NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_hours numeric(5,1) NOT NULL DEFAULT 10,
  provider text NOT NULL DEFAULT 'iGOT Karmayot',
  course_url text,
  thumbnail_url text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_all" ON courses;
CREATE POLICY "courses_select_all" ON courses FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "courses_modify_admin" ON courses;
CREATE POLICY "courses_modify_admin" ON courses FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- ============================================================
-- 6. ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
  progress_pct numeric(5,2) NOT NULL DEFAULT 0,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (user_id, course_id)
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
CREATE POLICY "enrollments_select_own" ON enrollments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
CREATE POLICY "enrollments_insert_own" ON enrollments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
CREATE POLICY "enrollments_update_own" ON enrollments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_delete_own" ON enrollments;
CREATE POLICY "enrollments_delete_own" ON enrollments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);

-- ============================================================
-- 7. LEARNING PATHS
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  step_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended', 'enrolled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learning_paths_select_own" ON learning_paths;
CREATE POLICY "learning_paths_select_own" ON learning_paths FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "learning_paths_insert_own" ON learning_paths;
CREATE POLICY "learning_paths_insert_own" ON learning_paths FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "learning_paths_update_own" ON learning_paths;
CREATE POLICY "learning_paths_update_own" ON learning_paths FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "learning_paths_delete_own" ON learning_paths;
CREATE POLICY "learning_paths_delete_own" ON learning_paths FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id);

-- ============================================================
-- 8. UPLOADED DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_type text NOT NULL DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'ppt', 'pptx', 'doc', 'docx')),
  file_size bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE uploaded_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uploaded_documents_select_own" ON uploaded_documents;
CREATE POLICY "uploaded_documents_select_own" ON uploaded_documents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "uploaded_documents_insert_own" ON uploaded_documents;
CREATE POLICY "uploaded_documents_insert_own" ON uploaded_documents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "uploaded_documents_update_own" ON uploaded_documents;
CREATE POLICY "uploaded_documents_update_own" ON uploaded_documents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "uploaded_documents_delete_own" ON uploaded_documents;
CREATE POLICY "uploaded_documents_delete_own" ON uploaded_documents FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_uploaded_documents_user ON uploaded_documents(user_id);

-- ============================================================
-- 9. GENERATED QUIZZES
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES uploaded_documents(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE generated_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "generated_quizzes_select_own" ON generated_quizzes;
CREATE POLICY "generated_quizzes_select_own" ON generated_quizzes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "generated_quizzes_insert_own" ON generated_quizzes;
CREATE POLICY "generated_quizzes_insert_own" ON generated_quizzes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "generated_quizzes_update_own" ON generated_quizzes;
CREATE POLICY "generated_quizzes_update_own" ON generated_quizzes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "generated_quizzes_delete_own" ON generated_quizzes;
CREATE POLICY "generated_quizzes_delete_own" ON generated_quizzes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_generated_quizzes_user ON generated_quizzes(user_id);

-- ============================================================
-- 10. QUIZ QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES generated_quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  explanation text NOT NULL DEFAULT '',
  display_order int NOT NULL DEFAULT 0
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_questions_select_own" ON quiz_questions;
CREATE POLICY "quiz_questions_select_own" ON quiz_questions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM generated_quizzes WHERE generated_quizzes.id = quiz_id AND generated_quizzes.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "quiz_questions_insert_own" ON quiz_questions;
CREATE POLICY "quiz_questions_insert_own" ON quiz_questions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM generated_quizzes WHERE generated_quizzes.id = quiz_id AND generated_quizzes.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "quiz_questions_delete_own" ON quiz_questions;
CREATE POLICY "quiz_questions_delete_own" ON quiz_questions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM generated_quizzes WHERE generated_quizzes.id = quiz_id AND generated_quizzes.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);

-- ============================================================
-- 11. QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES generated_quizzes(id) ON DELETE CASCADE,
  score_pct numeric(5,2) NOT NULL DEFAULT 0,
  total_questions int NOT NULL DEFAULT 0,
  correct_answers int NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}',
  taken_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_attempts_select_own" ON quiz_attempts;
CREATE POLICY "quiz_attempts_select_own" ON quiz_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_attempts_insert_own" ON quiz_attempts;
CREATE POLICY "quiz_attempts_insert_own" ON quiz_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_attempts_delete_own" ON quiz_attempts;
CREATE POLICY "quiz_attempts_delete_own" ON quiz_attempts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);

-- ============================================================
-- 12. CHAT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_sessions_select_own" ON chat_sessions;
CREATE POLICY "chat_sessions_select_own" ON chat_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_sessions_insert_own" ON chat_sessions;
CREATE POLICY "chat_sessions_insert_own" ON chat_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_sessions_update_own" ON chat_sessions;
CREATE POLICY "chat_sessions_update_own" ON chat_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_sessions_delete_own" ON chat_sessions;
CREATE POLICY "chat_sessions_delete_own" ON chat_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- ============================================================
-- 13. CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select_own" ON chat_messages;
CREATE POLICY "chat_messages_select_own" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_insert_own" ON chat_messages;
CREATE POLICY "chat_messages_insert_own" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_messages_delete_own" ON chat_messages;
CREATE POLICY "chat_messages_delete_own" ON chat_messages FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, department, designation)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'designation', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA: Competencies
-- ============================================================
INSERT INTO competencies (name, description, category, display_order) VALUES
  ('Python', 'Programming and data analysis with Python', 'technical', 1),
  ('SQL', 'Database querying and data manipulation', 'technical', 2),
  ('Data Visualization', 'Creating charts, dashboards, and visual analytics', 'technical', 3),
  ('AI/ML', 'Artificial intelligence and machine learning concepts', 'technical', 4),
  ('GIS', 'Geographic Information Systems and spatial analysis', 'technical', 5),
  ('Sampling', 'Statistical sampling methods and survey design', 'statistical', 6),
  ('Statistical Analytics', 'Advanced statistical methods and inference', 'statistical', 7)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- SEED DATA: Courses
-- ============================================================
INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Python for Data Analysis', 'Learn Python fundamentals, pandas, and data manipulation for official statistics.',
  c.id, 'beginner', 20, 'iGOT Karmayot', 1
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Advanced Python Programming', 'Object-oriented programming, APIs, and automation with Python.',
  c.id, 'intermediate', 15, 'iGOT Karmayot', 2
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'SQL for Data Professionals', 'Master SQL queries, joins, aggregations, and window functions.',
  c.id, 'beginner', 12, 'iGOT Karmayot', 1
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Data Visualization with Python', 'Create compelling visualizations using matplotlib, seaborn, and plotly.',
  c.id, 'intermediate', 18, 'iGOT Karmayot', 1
FROM competencies c WHERE c.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Dashboard Design Principles', 'Design effective dashboards for decision-making and public communication.',
  c.id, 'beginner', 10, 'iGOT Karmayot', 2
FROM competencies c WHERE c.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Introduction to AI/ML', 'Foundations of machine learning, supervised and unsupervised learning.',
  c.id, 'intermediate', 25, 'iGOT Karmayot', 1
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Deep Learning Essentials', 'Neural networks, NLP, and computer vision applications.',
  c.id, 'advanced', 30, 'iGOT Karmayot', 2
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'GIS for Official Statistics', 'Spatial data analysis, mapping, and geographic information systems.',
  c.id, 'intermediate', 22, 'iGOT Karmayot', 1
FROM competencies c WHERE c.name = 'GIS'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Sampling Methods & Survey Design', 'Probability sampling, stratification, and sample size determination.',
  c.id, 'beginner', 15, 'iGOT Karmayot', 1
FROM competencies c WHERE c.name = 'Sampling'
ON CONFLICT DO NOTHING;

INSERT INTO courses (title, description, competency_id, difficulty, duration_hours, provider, display_order)
SELECT 'Advanced Statistical Analytics', 'Hypothesis testing, regression, time series, and Bayesian methods.',
  c.id, 'advanced', 28, 'iGOT Karmayot', 1
FROM competencies c WHERE c.name = 'Statistical Analytics'
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA: Assessment Questions (5 per competency)
-- ============================================================
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which Python library is primarily used for data manipulation and analysis?',
  'NumPy', 'Pandas', 'Matplotlib', 'Scikit-learn', 'b', 'easy'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What does the pandas method df.head() return?',
  'Last 5 rows', 'First 5 rows', 'All rows', 'A summary of the dataframe', 'b', 'easy'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which data structure in Python is ordered and mutable?',
  'Tuple', 'Set', 'List', 'Dictionary', 'c', 'easy'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is a decorator in Python?',
  'A design pattern for UI', 'A function that modifies another function', 'A type of variable', 'A loop construct', 'b', 'medium'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which statement correctly creates a virtual environment in Python 3?',
  'python -m venv myenv', 'pip create venv myenv', 'python venv create myenv', 'conda venv myenv', 'a', 'medium'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

-- SQL questions
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which SQL clause is used to filter results?',
  'ORDER BY', 'WHERE', 'GROUP BY', 'HAVING', 'b', 'easy'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What does the SQL JOIN clause do?',
  'Combines rows from two or more tables', 'Filters data', 'Sorts results', 'Aggregates data', 'a', 'easy'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which SQL function counts the number of rows?',
  'COUNT()', 'SUM()', 'TOTAL()', 'NUMBER()', 'a', 'easy'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is the difference between WHERE and HAVING in SQL?',
  'No difference', 'WHERE filters before grouping, HAVING filters after', 'HAVING is faster', 'WHERE is only for joins', 'b', 'medium'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which type of join returns all rows from the left table and matched rows from the right?',
  'INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL JOIN', 'c', 'medium'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

-- Data Visualization questions
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which chart type is best for showing the distribution of a continuous variable?',
  'Bar chart', 'Histogram', 'Pie chart', 'Line chart', 'b', 'easy'
FROM competencies c WHERE c.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is the primary purpose of a dashboard?',
  'To store data', 'To present key metrics and KPIs at a glance', 'To replace reports', 'To write code', 'b', 'easy'
FROM competencies c WHERE c.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which color scheme is recommended for accessible visualizations?',
  'Red and green only', 'Colorblind-friendly palettes', 'Random colors', 'Grayscale only', 'b', 'medium'
FROM competencies c WHERE c.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is a choropleth map used for?',
  'Showing routes', 'Coloring geographic regions by a data value', 'Showing point locations', 'Showing 3D terrain', 'b', 'medium'
FROM competencies c WHERE c.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which Python library is most commonly used for interactive visualizations?',
  'Plotly', 'OS', 'Requests', 'BeautifulSoup', 'a', 'easy'
FROM competencies c WHERE c.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

-- AI/ML questions
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is supervised learning?',
  'Learning without data', 'Learning from labeled training data', 'Learning without labels', 'Learning by observation', 'b', 'easy'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which algorithm is commonly used for classification?',
  'K-Means', 'PCA', 'Random Forest', 'DBSCAN', 'c', 'easy'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What does overfitting mean in machine learning?',
  'The model is too simple', 'The model memorizes training data but generalizes poorly', 'The model has too little data', 'The model uses too few features', 'b', 'medium'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is the purpose of cross-validation?',
  'To speed up training', 'To assess model performance on unseen data', 'To increase accuracy', 'To reduce model size', 'b', 'medium'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which technique is used to reduce the dimensionality of data?',
  'Gradient Descent', 'PCA (Principal Component Analysis)', 'Backpropagation', 'Dropout', 'b', 'hard'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

-- GIS questions
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What does GIS stand for?',
  'Global Information System', 'Geographic Information System', 'Geospatial Integration System', 'General Information Service', 'b', 'easy'
FROM competencies c WHERE c.name = 'GIS'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which file format is commonly used for vector geospatial data?',
  'JPEG', 'Shapefile', 'MP4', 'CSV', 'b', 'easy'
FROM competencies c WHERE c.name = 'GIS'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is a coordinate reference system (CRS) used for?',
  'File compression', 'Defining how coordinates map to locations on Earth', 'Data encryption', 'Network routing', 'b', 'medium'
FROM competencies c WHERE c.name = 'GIS'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which Python library is widely used for geospatial analysis?',
  'GeoPandas', 'Flask', 'Django', 'Requests', 'a', 'medium'
FROM competencies c WHERE c.name = 'GIS'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is spatial interpolation used for?',
  'Compressing images', 'Estimating values at unmeasured locations', 'Routing networks', 'Encrypting data', 'b', 'hard'
FROM competencies c WHERE c.name = 'GIS'
ON CONFLICT DO NOTHING;

-- Sampling questions
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is simple random sampling?',
  'Every member has equal chance of selection', 'Only specific groups are selected', 'Samples are taken at intervals', 'Only volunteers are selected', 'a', 'easy'
FROM competencies c WHERE c.name = 'Sampling'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is stratified sampling?',
  'Sampling only the first 100', 'Dividing population into strata and sampling from each', 'Sampling at regular intervals', 'Sampling whoever is available', 'b', 'easy'
FROM competencies c WHERE c.name = 'Sampling'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What does the sample size formula primarily depend on?',
  'Budget alone', 'Confidence level, margin of error, and population size', 'Time available', 'Number of researchers', 'b', 'medium'
FROM competencies c WHERE c.name = 'Sampling'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is sampling bias?',
  'When the sample is too large', 'When certain members are systematically over/under-represented', 'When samples are random', 'When the sample is too small', 'b', 'medium'
FROM competencies c WHERE c.name = 'Sampling'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which sampling method is best for a geographically dispersed population?',
  'Simple random', 'Cluster sampling', 'Convenience sampling', 'Snowball sampling', 'b', 'hard'
FROM competencies c WHERE c.name = 'Sampling'
ON CONFLICT DO NOTHING;

-- Statistical Analytics questions
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What does a p-value of 0.03 indicate?',
  'Result is not significant', 'Result is significant at the 5% level', 'Result is significant at the 1% level', 'Result is invalid', 'b', 'medium'
FROM competencies c WHERE c.name = 'Statistical Analytics'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What is the central limit theorem?',
  'All data is normally distributed', 'Sample means approach normal distribution as sample size grows', 'Variance is always 1', 'Mean equals median', 'b', 'medium'
FROM competencies c WHERE c.name = 'Statistical Analytics'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which regression model is used for binary outcomes?',
  'Linear regression', 'Logistic regression', 'Poisson regression', 'Polynomial regression', 'b', 'medium'
FROM competencies c WHERE c.name = 'Statistical Analytics'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'What does R-squared measure in regression?',
  'Error rate', 'Proportion of variance explained by the model', 'Number of variables', 'Sample size', 'b', 'hard'
FROM competencies c WHERE c.name = 'Statistical Analytics'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty)
SELECT c.id, 'Which test compares means across more than two groups?',
  'T-test', 'ANOVA', 'Chi-square', 'Z-test', 'b', 'hard'
FROM competencies c WHERE c.name = 'Statistical Analytics'
ON CONFLICT DO NOTHING;