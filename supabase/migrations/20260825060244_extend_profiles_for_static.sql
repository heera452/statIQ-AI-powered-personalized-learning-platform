/*
# Extend profiles for StatIQ personalization

## Overview
Adds learning-profile fields to the existing profiles table: experience level, years of experience,
education level, areas of interest, technologies known, and career/learning goal.
These fields power the personalized skill assessment and recommendation engine.

## Modified Tables
- `profiles`: adds experience_level, years_experience, education_level, areas_of_interest,
  technologies_known, learning_goal columns. All nullable — existing rows are unaffected.

## Security
- The new columns are user-editable. The existing column-level UPDATE grant on profiles
  (full_name, department, designation, avatar_url) is extended to include the new columns.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS experience_level text DEFAULT NULL CHECK (experience_level IS NULL OR experience_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS years_experience numeric(4,1) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS education_level text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS areas_of_interest text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS technologies_known text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS learning_goal text DEFAULT NULL;

REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (full_name, department, designation, avatar_url, experience_level, years_experience, education_level, areas_of_interest, technologies_known, learning_goal) ON profiles TO authenticated;