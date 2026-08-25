import { useMemo, useState } from 'react';
import { BrainCircuit, Check, ChevronRight, Clock3, GraduationCap, Zap } from 'lucide-react';
import type { AssessmentQuestion, Competency, Course, Enrollment, Profile, UserSkill } from '@/lib/types';
import { getMappedCompetencies } from '@/lib/skillMapping';
import { supabase } from '@/lib/supabase';
import { QuizFlow } from '@/components/QuizFlow';

type Props = {
  userId: string;
  competencies: Competency[];
  userSkills: UserSkill[];
  profile: Profile | null;
  courses: Course[];
  enrollments: Enrollment[];
  onComplete: (competencyId: string, questions: AssessmentQuestion[], answers: Record<string, string>) => void;
  onBackToResults: () => void;
};

export function CourseAssessment({ userId, competencies, userSkills, profile, courses, enrollments, onComplete, onBackToResults }: Props) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const enrolledCourses = useMemo(
    () => courses.filter((c) => enrollments.some((e) => e.course_id === c.id)),
    [courses, enrollments],
  );

  const begin = async (course: Course) => {
    setSelectedCourse(course);
    const competency = competencies.find((c) => c.id === course.competency_id);
    if (!competency) return;
    setSelectedCompetency(competency);
    setLoading(true);

    const difficultyFilter = profile?.experience_level === 'advanced' ? 'hard' : profile?.experience_level === 'intermediate' ? 'medium' : 'easy';
    const { data } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('competency_id', competency.id)
      .order('difficulty')
      .limit(10);

    let filtered = (data as AssessmentQuestion[]) || [];
    if (filtered.length === 0) {
      filtered = Array.from({ length: 5 }, (_, index) => ({
        id: `${competency.id}-${index}`,
        competency_id: competency.id,
        topic: 'general',
        question_text: `How confident are you applying ${competency.name} concepts from "${course.title}"?`,
        option_a: 'I am just getting started',
        option_b: 'I can follow examples',
        option_c: 'I can work independently',
        option_d: 'I can coach others',
        correct_answer: 'c',
        difficulty: 'easy',
      }));
    } else if (profile?.experience_level) {
      const preferred = filtered.filter((q) => q.difficulty === difficultyFilter);
      if (preferred.length >= 5) filtered = preferred.slice(0, 10);
      else filtered = filtered.slice(0, 10);
    }
    setQuestions(filtered);
    setLoading(false);
  };

  if (loading) {
    return <div className="loading-card">Building your course assessment…</div>;
  }

  if (selectedCourse && selectedCompetency && questions.length > 0) {
    return (
      <QuizFlow
        userId={userId}
        competency={selectedCompetency}
        questions={questions}
        experienceLevel={profile?.experience_level ?? null}
        sourceLabel="course"
        onBack={() => { setSelectedCourse(null); setSelectedCompetency(null); setQuestions([]); }}
        onComplete={onComplete}
        onBackToResults={onBackToResults}
      />
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">COURSE ASSESSMENTS</p>
            <h1>Test what you've learned</h1>
            <p className="subheading">Enroll in a course first, then take its assessment to check your understanding.</p>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon"><GraduationCap size={22} /></div>
          <p className="eyebrow">NO ENROLLED COURSES</p>
          <h2>Enroll in a course to unlock assessments</h2>
          <p>Once you enroll in a course from the Learning path, you can take a course-specific assessment here.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">COURSE ASSESSMENTS</p>
          <h1>Test your course knowledge</h1>
          <p className="subheading">Assessments for courses you're enrolled in. Check your understanding after learning.</p>
        </div>
      </div>
      <div className="assessment-intro">
        <div className="intro-icon"><GraduationCap size={26} /></div>
        <div>
          <h2>Course-based assessments</h2>
          <p>These assessments test the skills covered in your enrolled courses. Take them after studying to reinforce what you've learned.</p>
        </div>
        <div className="intro-time"><Clock3 size={16} /> 5-10 min</div>
      </div>
      <div className="course-assessment-grid">
        {enrolledCourses.map((course, index) => {
          const competency = competencies.find((c) => c.id === course.competency_id);
          const enrollment = enrollments.find((e) => e.course_id === course.id);
          return (
            <button
              className="assessment-domain course-assessment-card"
              key={course.id}
              onClick={() => begin(course)}
            >
              <span className="domain-number">0{index + 1}</span>
              <span className="domain-icon" style={{ color: ['#2f65dc', '#d89b31', '#4ca882', '#cb6b50', '#7a6bdb'][index % 5] }}>
                {competency?.name.slice(0, 2).toUpperCase() || 'CO'}
              </span>
              <strong>{course.title}</strong>
              <small>{course.description}</small>
              <div className="course-assessment-meta">
                <span><Check size={12} /> Enrolled</span>
                {enrollment && <span>{enrollment.progress_pct}% complete</span>}
              </div>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>
    </>
  );
}