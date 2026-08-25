export type Profile = {
  id: string;
  full_name: string;
  role: 'employee' | 'admin';
  department: string;
  designation: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | null;
  years_experience: number | null;
  education_level: string | null;
  areas_of_interest: strinag[] | null;
  technologies_known: string[] | null;
  learning_goal: string | null;
};

export type Competency = { id: string; name: string; description: string; display_order: number };

export type Course = {
  id: string;
  title: string;
  description: string;
  competency_id: string | null;
  difficulty: string;
  duration_hours: number;
  provider: string;
};

export type AssessmentQuestion = {
  id: string;
  competency_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  topic: string;
};

export type Enrollment = { id: string; course_id: string; status: string; progress_pct: number };
export type AssessmentResult = { competency_id: string; score_pct: number; taken_at: string };

export type UserSkill = {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
};

export type SkillAnalysis = {
  id: string;
  competency_id: string;
  level: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  score_pct: number;
  created_at: string;
};

export type LearningRecommendation = {
  id: string;
  competency_id: string | null;
  recommendation_text: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'dismissed';
  created_at: string;
};

export type View =
  | 'overview'
  | 'assessment'
  | 'course-assessment'
  | 'learning'
  | 'library'
  | 'analytics'
  | 'admin'
  | 'profile'
  | 'results'
  | 'recommendations';

export type Gap = Competency & { score: number; target: number; tone: string; icon: string };