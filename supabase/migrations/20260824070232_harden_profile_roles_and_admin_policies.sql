/*
# Harden profile roles and admin write policies

## Overview
Prevents signed-in users from assigning themselves the admin role through signup metadata or profile updates.
Admin-only tables now use separate CRUD policies rather than a broad FOR ALL policy.

## Modified Tables
- `profiles`: signup-created profiles always start as employees; authenticated users can update only user-editable profile fields.
- `competencies`: separate admin-only INSERT, UPDATE, and DELETE policies.
- `assessment_questions`: separate admin-only INSERT, UPDATE, and DELETE policies.
- `courses`: separate admin-only INSERT, UPDATE, and DELETE policies.

## Security
- Role is no longer accepted from user-controlled signup metadata.
- The `role` column cannot be changed through the browser data API.
- Admin checks are based on the existing profile role in the database.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, department, designation)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'employee',
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'designation', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, department, designation, avatar_url) ON profiles TO authenticated;

DROP POLICY IF EXISTS "competencies_modify_admin" ON competencies;
DROP POLICY IF EXISTS "competencies_insert_admin" ON competencies;
DROP POLICY IF EXISTS "competencies_update_admin" ON competencies;
DROP POLICY IF EXISTS "competencies_delete_admin" ON competencies;
CREATE POLICY "competencies_insert_admin" ON competencies FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "competencies_update_admin" ON competencies FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "competencies_delete_admin" ON competencies FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "assessment_questions_modify_admin" ON assessment_questions;
DROP POLICY IF EXISTS "assessment_questions_insert_admin" ON assessment_questions;
DROP POLICY IF EXISTS "assessment_questions_update_admin" ON assessment_questions;
DROP POLICY IF EXISTS "assessment_questions_delete_admin" ON assessment_questions;
CREATE POLICY "assessment_questions_insert_admin" ON assessment_questions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "assessment_questions_update_admin" ON assessment_questions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "assessment_questions_delete_admin" ON assessment_questions FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "courses_modify_admin" ON courses;
DROP POLICY IF EXISTS "courses_insert_admin" ON courses;
DROP POLICY IF EXISTS "courses_update_admin" ON courses;
DROP POLICY IF EXISTS "courses_delete_admin" ON courses;
CREATE POLICY "courses_insert_admin" ON courses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "courses_update_admin" ON courses FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "courses_delete_admin" ON courses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM authenticated;