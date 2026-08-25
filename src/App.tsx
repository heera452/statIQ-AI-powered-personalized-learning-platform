import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowRight, BarChart3, Bell, BookOpen, Bot, BrainCircuit, Check, ChevronRight,
  Clock3, FileText, GraduationCap, LayoutDashboard, Lightbulb, LogOut, Menu,
  MoreHorizontal, Plus, Search, Settings, Sparkles, Target, TrendingUp, Upload,
  UserCircle, Users, X, Zap,
} from 'lucide-react';
import { CourseAssessment } from '@/components/CourseAssessment';
import { QuizFlow } from '@/components/QuizFlow';
import { supabase } from '@/lib/supabase';
import type {
  Profile, Competency, Course, AssessmentQuestion, Enrollment,
  AssessmentResult, UserSkill, View, Gap,
} from '@/lib/types';
import { ProfileView } from '@/components/ProfileView';
import { Results } from '@/components/Results';
import { Recommendations } from '@/components/Recommendations';
import { getMappedCompetencies } from '@/lib/skillMapping';
import { analyzeAssessment, generateLearningRecommendations } from '@/lib/aiAnalysis';
import './index.css';

const palette = ['#2f65dc', '#d89b31', '#4ca882', '#cb6b50', '#7a6bdb', '#d56b97', '#3e9ab4'];
const fallbackCompetencies: Competency[] = [
  { id: 'python', name: 'Python', description: 'Programming and data analysis', display_order: 1 },
  { id: 'ai', name: 'AI/ML', description: 'Artificial intelligence and machine learning', display_order: 2 },
  { id: 'viz', name: 'Data Visualization', description: 'Charts, dashboards, and visual analytics', display_order: 3 },
  { id: 'gis', name: 'GIS', description: 'Geographic information systems', display_order: 4 },
  { id: 'sampling', name: 'Sampling', description: 'Statistical sampling methods', display_order: 5 },
  { id: 'sql', name: 'SQL', description: 'Database querying and data manipulation', display_order: 6 },
];
const fallbackCourses: Course[] = [
  { id: 'course-python', title: 'Python for Data Analysis', description: 'Learn Python fundamentals, pandas, and data manipulation for official statistics.', competency_id: 'python', difficulty: 'beginner', duration_hours: 20, provider: 'iGOT Karmayot' },
  { id: 'course-ai', title: 'Introduction to AI/ML', description: 'Foundations of machine learning, supervised and unsupervised learning.', competency_id: 'ai', difficulty: 'intermediate', duration_hours: 25, provider: 'iGOT Karmayot' },
  { id: 'course-viz', title: 'Data Visualization with Python', description: 'Create compelling visualizations using matplotlib, seaborn, and plotly.', competency_id: 'viz', difficulty: 'intermediate', duration_hours: 18, provider: 'iGOT Karmayot' },
  { id: 'course-gis', title: 'GIS for Official Statistics', description: 'Spatial data analysis, mapping, and geographic information systems.', competency_id: 'gis', difficulty: 'intermediate', duration_hours: 22, provider: 'iGOT Karmayot' },
  { id: 'course-sampling', title: 'Sampling Methods & Survey Design', description: 'Probability sampling, stratification, and sample size determination.', competency_id: 'sampling', difficulty: 'beginner', duration_hours: 15, provider: 'iGOT Karmayot' },
];

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="loading-screen"><div className="mark"><Sparkles size={20} /></div><span>Preparing your learning workspace</span></div>;
  return session ? <Workspace session={session} /> : <AuthScreen />;
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: name, department: 'National Statistics Office', designation: 'Data Analyst' } } });
    if (result.error) setError(mode === 'login' ? 'We couldn\u2019t sign you in. Check your details and try again.' : 'We couldn\u2019t create your account. Please try another email.');
    setBusy(false);
  };
  return <main className="auth-shell">
    <section className="auth-visual">
      <div className="auth-brand"><div className="mark"><Sparkles size={20} /></div><strong>Stat<span>IQ</span></strong></div>
      <div className="visual-copy"><p className="eyebrow light">AI-Powered Personalized Learning</p><h1>Turn learning into<br /><em>measurable impact.</em></h1><p>One intelligent workspace to assess your skills, close gaps, and build a personalized learning path.</p></div>
      <div className="visual-footer"><span>Powered by AI-driven competency intelligence</span><span>01 / 04</span></div>
      <div className="orb orb-one" /><div className="orb orb-two" />
    </section>
    <section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-brand"><div className="mark"><Sparkles size={18} /></div><strong>Stat<span>IQ</span></strong></div><p className="eyebrow">Your learning workspace</p><h2>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h2><p className="auth-muted">{mode === 'login' ? 'Sign in to continue your learning journey.' : 'Start building a stronger, smarter learning path today.'}</p>
      <form onSubmit={submit} className="auth-form">{mode === 'signup' && <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bhavana Sharma" required /></label>}<label>Work email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required /></label><label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" required minLength={6} /></label>{error && <p className="form-error">{error}</p>}<button className="primary full" disabled={busy}>{busy ? 'Please wait\u2026' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form>
      <p className="switch-auth">{mode === 'login' ? 'New to StatIQ?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p><div className="auth-note"><Check size={14} /> Secure workspace for personalized learning</div>
    </div></section>
  </main>;
}

function Workspace({ session }: { session: Session }) {
  const [view, setView] = useState<View>('overview');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [competencies, setCompetencies] = useState<Competency[]>(fallbackCompetencies);
  const [courses, setCourses] = useState<Course[]>(fallbackCourses);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const [profileRes, competencyRes, courseRes, enrollmentRes, assessmentResultsRes, skillsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, role, department, designation, experience_level, years_experience, education_level, areas_of_interest, technologies_known, learning_goal').eq('id', session.user.id).maybeSingle(),
        supabase.from('competencies').select('id, name, description, display_order').order('display_order'),
        supabase.from('courses').select('id, title, description, competency_id, difficulty, duration_hours, provider').order('display_order'),
        supabase.from('enrollments').select('id, course_id, status, progress_pct').eq('user_id', session.user.id),
        supabase.from('assessment_results').select('competency_id, score_pct, taken_at').eq('user_id', session.user.id).order('taken_at', { ascending: false }),
        supabase.from('user_skills').select('id, user_id, skill_name, proficiency').eq('user_id', session.user.id),
      ]);
      if (!active) return;
      setProfile(profileRes.data as Profile | null);
      if (competencyRes.data?.length) setCompetencies(competencyRes.data as Competency[]);
      if (courseRes.data?.length) setCourses(courseRes.data as Course[]);
      if (enrollmentRes.data) setEnrollments(enrollmentRes.data as Enrollment[]);
      if (assessmentResultsRes.data) setAssessmentResults(assessmentResultsRes.data as AssessmentResult[]);
      if (skillsRes.data) setUserSkills(skillsRes.data as UserSkill[]);
    })();
    return () => { active = false; };
  }, [session.user.id, refresh]);

  const latestScores = useMemo(() => {
    const scores = new Map<string, number>();
    assessmentResults.forEach((result) => { if (!scores.has(result.competency_id)) scores.set(result.competency_id, Number(result.score_pct)); });
    return scores;
  }, [assessmentResults]);

  const gaps = useMemo<Gap[]>(() => competencies.slice(0, 6).map((item, index) => ({
    ...item,
    score: latestScores.get(item.id) ?? [35, 20, 30, 38, 74, 78][index] ?? 42,
    target: 85,
    tone: palette[index],
    icon: ['PY', 'AI', 'DV', 'GIS', 'S', 'SQL'][index] ?? 'SK',
  })), [competencies, latestScores]);

  const overallScore = Math.round(gaps.reduce((sum, gap) => sum + gap.score, 0) / Math.max(gaps.length, 1));
  const firstName = profile?.full_name?.split(' ')[0] || session.user.user_metadata?.full_name?.split(' ')[0] || 'Learner';
  const enrolledCourseIds = new Set(enrollments.map((item) => item.course_id));
  const profileComplete = !!(profile?.full_name && profile?.designation && profile?.experience_level && userSkills.length > 0);
  const completionPct = Math.round([profile?.full_name, profile?.designation, profile?.experience_level, userSkills.length > 0, profile?.education_level, profile?.learning_goal].filter(Boolean).length / 6 * 100);

  const mappedCompetencies = useMemo(() => {
    if (userSkills.length === 0) return [];
    return getMappedCompetencies(userSkills.map((s) => s.skill_name), competencies);
  }, [userSkills, competencies]);

  const enroll = async (courseId: string) => {
    const course = courses.find((item) => item.id === courseId);
    if (!course || courseId.startsWith('course-')) { setEnrollments((current) => [...current, { id: `local-${courseId}`, course_id: courseId, status: 'enrolled', progress_pct: 0 }]); return; }
    const { error } = await supabase.from('enrollments').insert({ course_id: courseId });
    if (!error) setRefresh((value) => value + 1);
  };

  const nav = (next: View) => { setView(next); setMenuOpen(false); };
  const triggerRefresh = () => setRefresh((value) => value + 1);

  const assessmentOnComplete = async (competencyId: string, questions: AssessmentQuestion[], answers: Record<string, string>) => {
    const competency = competencies.find((c) => c.id === competencyId);
    if (!competency) { triggerRefresh(); nav('overview'); return; }
    const analysis = analyzeAssessment(competency, questions, answers);

    await supabase.from('skill_analysis').delete().eq('user_id', session.user.id).eq('competency_id', competencyId);
    await supabase.from('skill_analysis').insert({
      user_id: session.user.id,
      competency_id: competencyId,
      level: analysis.level,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations: analysis.recommendations,
      score_pct: analysis.scorePct,
    });

    await supabase.from('learning_recommendations').delete().eq('user_id', session.user.id).eq('competency_id', competencyId);
    const recs = generateLearningRecommendations([analysis], competencies, profile?.experience_level ?? null);
    for (const rec of recs) {
      await supabase.from('learning_recommendations').insert({
        user_id: session.user.id,
        competency_id: rec.competencyId,
        recommendation_text: rec.text,
        priority: rec.priority,
        status: 'active',
      });
    }
    triggerRefresh();
  };

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="side-brand"><div className="mark"><Sparkles size={18} /></div><strong>Stat<span>IQ</span></strong></div>
      <div className="workspace-label">MY WORKSPACE</div>
      <nav>
        <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active={view === 'overview'} onClick={() => nav('overview')} />
        <NavItem icon={<UserCircle size={18} />} label="My Profile" active={view === 'profile'} onClick={() => nav('profile')} />
        <NavItem icon={<Target size={18} />} label="Skill Assessments" active={view === 'assessment'} onClick={() => nav('assessment')} />
        <NavItem icon={<GraduationCap size={18} />} label="Course Assessments" active={view === 'course-assessment'} onClick={() => nav('course-assessment')} />
        <NavItem icon={<BarChart3 size={18} />} label="Results" active={view === 'results'} onClick={() => nav('results')} />
        <NavItem icon={<Lightbulb size={18} />} label="Recommendations" active={view === 'recommendations'} onClick={() => nav('recommendations')} />
        <NavItem icon={<BookOpen size={18} />} label="Learning path" active={view === 'learning'} onClick={() => nav('learning')} />
        <NavItem icon={<FileText size={18} />} label="Knowledge library" active={view === 'library'} onClick={() => nav('library')} />
        <NavItem icon={<TrendingUp size={18} />} label="My analytics" active={view === 'analytics'} onClick={() => nav('analytics')} />
      </nav>
      <div className="side-spacer" />
      {profile?.role === 'admin' && <><div className="workspace-label">ADMINISTRATION</div><NavItem icon={<Users size={18} />} label="Admin dashboard" active={view === 'admin'} onClick={() => nav('admin')} /></>}
      <div className="side-bottom">
        <button className="nav-item"><Settings size={18} /> Settings</button>
        <button className="profile-mini" onClick={() => supabase.auth.signOut()}><span className="avatar">{firstName[0]}</span><span><strong>{firstName}</strong><small>{profile?.role === 'admin' ? 'Administrator' : 'Learner'}</small></span><LogOut size={15} /></button>
      </div>
    </aside>
    <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
    <main className="main-area">
      <header className="topbar">
        <div className="crumb">Workspace <ChevronRight size={14} /> <strong>{view === 'overview' ? 'Overview' : view.replace('-', ' ')}</strong></div>
        <div className="top-actions">
          <button className="icon-button"><Search size={18} /></button>
          <button className="icon-button notification"><Bell size={18} /><i /></button>
          {!profileComplete && <button className="complete-profile-btn" onClick={() => nav('profile')}><UserCircle size={15} /> Complete profile</button>}
          <div className="top-avatar">{firstName[0]}</div>
        </div>
      </header>
      <div className="content">
        {view === 'overview' && <Overview firstName={firstName} gaps={gaps} overallScore={overallScore} courses={courses} enrollments={enrollments} enrolledCourseIds={enrolledCourseIds} onNavigate={nav} onEnroll={enroll} profileComplete={profileComplete} completionPct={completionPct} userSkills={userSkills} mappedCompetencies={mappedCompetencies} assessmentResults={assessmentResults} competencies={competencies} />}
        {view === 'profile' && <ProfileView userId={session.user.id} email={session.user.email || ''} profile={profile} existingSkills={userSkills} onSaved={triggerRefresh} />}
        {view === 'assessment' && <Assessment competencies={competencies} userSkills={userSkills} profile={profile} onComplete={assessmentOnComplete} onBackToResults={() => nav('results')} />}
        {view === 'course-assessment' && <CourseAssessment userId={session.user.id} competencies={competencies} userSkills={userSkills} profile={profile} courses={courses} enrollments={enrollments} onComplete={assessmentOnComplete} onBackToResults={() => nav('results')} />}
        {view === 'results' && <Results userId={session.user.id} skills={userSkills} competencies={competencies} onNavigate={nav} />}
        {view === 'recommendations' && <Recommendations userId={session.user.id} onNavigate={nav} />}
        {view === 'learning' && <Learning courses={courses} gaps={gaps} enrolledCourseIds={enrolledCourseIds} enrollments={enrollments} onEnroll={enroll} />}
        {view === 'library' && <Library onRefresh={triggerRefresh} />}
        {view === 'analytics' && <Analytics gaps={gaps} overallScore={overallScore} />}
        {view === 'admin' && <Admin competencies={competencies} />}
      </div>
    </main>
    <button className="chat-fab" onClick={() => setShowChat(true)}><Bot size={20} /><span>Ask your learning assistant</span></button>
    {showChat && <Chat onClose={() => setShowChat(false)} />}
  </div>;
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{active && <i />}</button>;
}

function Overview({ firstName, gaps, overallScore, courses, enrollments, enrolledCourseIds, onNavigate, onEnroll, profileComplete, completionPct, userSkills, mappedCompetencies, assessmentResults, competencies }: {
  firstName: string; gaps: Gap[]; overallScore: number; courses: Course[]; enrollments: Enrollment[]; enrolledCourseIds: Set<string>;
  onNavigate: (view: View) => void; onEnroll: (id: string) => void; profileComplete: boolean; completionPct: number;
  userSkills: UserSkill[]; mappedCompetencies: Competency[]; assessmentResults: AssessmentResult[]; competencies: Competency[];
}) {
  const totalProgress = enrollments.length ? Math.round(enrollments.reduce((sum, item) => sum + Number(item.progress_pct), 0) / enrollments.length) : 0;
  const nextGap = [...gaps].sort((left, right) => left.score - right.score)[0];
  const latestScoresMap = new Map<string, number>();
  assessmentResults.forEach((r) => { if (!latestScoresMap.has(r.competency_id)) latestScoresMap.set(r.competency_id, Number(r.score_pct)); });

  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1>Good morning, {firstName}<span className="heading-dot">.</span></h1>
        <p className="subheading">Here\u2019s your capability snapshot for this week.</p>
      </div>
      <button className="outline-button" onClick={() => onNavigate('assessment')}><Zap size={16} /> Take assessment</button>
    </div>

    {!profileComplete && (
      <div className="profile-prompt">
        <div className="profile-prompt-icon"><UserCircle size={20} /></div>
        <div><strong>Complete your profile to get personalized skill assessments.</strong><span>Your profile helps us tailor assessments and recommendations to your skills.</span></div>
        <button className="primary" onClick={() => onNavigate('profile')}>Complete profile <ArrowRight size={15} /></button>
      </div>
    )}

    <section className="hero-banner">
      <div>
        <span className="banner-label"><Sparkles size={14} /> AI INSIGHT</span>
        <h2>Your next growth area is<br /><strong>{nextGap.name}.</strong></h2>
        <p>You\u2019re {Math.max(nextGap.target - nextGap.score, 0)} points away from your target. A focused learning path can close this gap in 6 weeks.</p>
        <button className="banner-button" onClick={() => onNavigate('learning')}>View recommended path <ArrowRight size={16} /></button>
      </div>
      <div className="hero-graphic">
        <div className="ring ring-back" /><div className="ring ring-front" />
        <div className="hero-score"><strong>{nextGap.score}</strong><span>/ 100</span><small>current level</small></div>
        <div className="graphic-tag tag-one">{nextGap.name} <b>\u2212{Math.max(nextGap.target - nextGap.score, 0)}</b></div>
        <div className="graphic-tag tag-two">Target <b>85</b></div>
      </div>
    </section>

    <div className="stats-grid">
      <Stat label="Capability score" value={`${overallScore}`} suffix="/ 100" trend="Live from assessments" icon={<Target size={17} />} />
      <Stat label="Learning progress" value={`${totalProgress}`} suffix="%" trend="On track" icon={<TrendingUp size={17} />} />
      <Stat label="Profile completion" value={`${completionPct}`} suffix="%" trend={profileComplete ? 'Complete' : 'Action needed'} icon={<UserCircle size={17} />} />
      <Stat label="Skills tracked" value={`${userSkills.length}`} suffix="" trend={mappedCompetencies.length > 0 ? `${mappedCompetencies.length} assessments ready` : 'Add skills to start'} icon={<BrainCircuit size={17} />} />
    </div>

    {userSkills.length > 0 && (
      <>
        <div className="section-head"><div><p className="eyebrow">MY SKILLS</p><h2>Your skill inventory</h2></div><button className="text-button" onClick={() => onNavigate('profile')}>Edit skills <ArrowRight size={15} /></button></div>
        <div className="skill-tags-overview">
          {userSkills.map((skill) => (
            <div className="skill-tag-overview" key={skill.id}>
              <strong>{skill.skill_name}</strong>
              <span className={`prof-dot prof-${skill.proficiency}`}>{skill.proficiency}</span>
            </div>
          ))}
        </div>
      </>
    )}

    {mappedCompetencies.length > 0 && (
      <>
        <div className="section-head learning-head"><div><p className="eyebrow">RECOMMENDED ASSESSMENTS</p><h2>Based on your skills</h2></div><button className="text-button" onClick={() => onNavigate('assessment')}>See all <ArrowRight size={15} /></button></div>
        <div className="assessment-grid">
          {mappedCompetencies.map((comp, index) => {
            const score = latestScoresMap.get(comp.id);
            return (
              <button className="assessment-domain" key={comp.id} onClick={() => onNavigate('assessment')}>
                <span className="domain-number">0{index + 1}</span>
                <span className="domain-icon" style={{ color: palette[index % palette.length] }}>{comp.name.slice(0, 2).toUpperCase()}</span>
                <strong>{comp.name} Assessment</strong>
                <small>{comp.description}</small>
                {score !== undefined && <span className="assessment-score-badge">{score}%</span>}
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>
      </>
    )}

    {assessmentResults.length > 0 && (
      <>
        <div className="section-head learning-head"><div><p className="eyebrow">ASSESSMENT RESULTS</p><h2>Your latest scores</h2></div><button className="text-button" onClick={() => onNavigate('results')}>View analysis <ArrowRight size={15} /></button></div>
        <div className="results-strip">
          {Array.from(latestScoresMap.entries()).map(([compId, score]) => {
            const comp = competencies.find((c) => c.id === compId);
            if (!comp) return null;
            return <div className="result-pill" key={compId}><strong>{comp.name}</strong><span>{score}%</span><div className="bar"><i style={{ width: `${score}%` }} /></div></div>;
          })}
        </div>
      </>
    )}

    <div className="section-head learning-head"><div><p className="eyebrow">CURATED FOR YOU</p><h2>Recommended learning</h2></div><button className="text-button" onClick={() => onNavigate('learning')}>See all courses <ArrowRight size={15} /></button></div>
    <div className="course-grid">{courses.slice(0, 3).map((course, index) => <CourseCard key={course.id} course={course} tone={palette[index]} enrolled={enrolledCourseIds.has(course.id)} onEnroll={onEnroll} />)}</div>
    <div className="impact-strip"><div className="impact-icon"><Sparkles size={19} /></div><div><strong>Keep your momentum going</strong><span>Completing one course this week will move your scores up and unlock new recommendations.</span></div><button onClick={() => onNavigate('learning')}>Continue learning <ArrowRight size={15} /></button></div>
  </>;
}

function Stat({ label, value, suffix, trend, icon }: { label: string; value: string; suffix: string; trend: string; icon: React.ReactNode }) {
  return <div className="card stat-card"><div className="stat-icon">{icon}</div><span className="stat-label">{label}</span><div className="stat-value">{value}<small>{suffix}</small></div><span className="stat-trend">{trend}</span></div>;
}

function GapRow({ gap }: { gap: Gap }) {
  return <div className="gap-row"><div className="gap-icon" style={{ background: `${gap.tone}18`, color: gap.tone }}>{gap.icon}</div><div className="gap-info"><strong>{gap.name}</strong><div className="bar"><i style={{ width: `${gap.score}%`, background: gap.tone }} /></div></div><div className="gap-number"><strong>{gap.score}%</strong><span>target {gap.target}%</span></div></div>;
}

function CourseCard({ course, tone, enrolled, onEnroll }: { course: Course; tone: string; enrolled: boolean; onEnroll: (id: string) => void }) {
  return <article className="course-card"><div className="course-cover" style={{ background: `linear-gradient(135deg, ${tone}, ${tone}bb)` }}><span>{course.competency_id?.slice(0, 3).toUpperCase() || 'SKILL'}</span><GraduationCap size={48} strokeWidth={1.2} /><div className="course-cover-dots" /></div><div className="course-body"><div className="course-meta"><span>{course.difficulty}</span><span><Clock3 size={13} /> {course.duration_hours}h</span></div><h3>{course.title}</h3><p>{course.description}</p><button className={enrolled ? 'enrolled-button' : 'course-action'} onClick={() => onEnroll(course.id)}>{enrolled ? <><Check size={15} /> Enrolled</> : <>Start course <ArrowRight size={15} /></>}</button></div></article>;
}

function Assessment({ competencies, userSkills, profile, onComplete, onBackToResults }: {
  competencies: Competency[]; userSkills: UserSkill[]; profile: Profile | null;
  onComplete: (competencyId: string, questions: AssessmentQuestion[], answers: Record<string, string>) => void;
  onBackToResults: () => void;
}) {
  const [selected, setSelected] = useState<Competency | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const mappedCompetencies = useMemo(() => {
    if (userSkills.length === 0) return competencies;
    return getMappedCompetencies(userSkills.map((s) => s.skill_name), competencies);
  }, [userSkills, competencies]);

  const begin = async (competency: Competency) => {
    setSelected(competency); setLoading(true);
    const difficultyFilter = profile?.experience_level === 'advanced' ? 'hard' : profile?.experience_level === 'intermediate' ? 'medium' : 'easy';
    const { data } = await supabase.from('assessment_questions').select('*').eq('competency_id', competency.id).order('difficulty').limit(10);
    let filtered = data as AssessmentQuestion[] || [];
    if (filtered.length === 0) {
      filtered = Array.from({ length: 5 }, (_, index) => ({
        id: `${competency.id}-${index}`, competency_id: competency.id, topic: 'general',
        question_text: `How confident are you applying ${competency.name} in your day-to-day work?`,
        option_a: 'I am just getting started', option_b: 'I can follow examples',
        option_c: 'I can work independently', option_d: 'I can coach others', correct_answer: 'c', difficulty: 'easy',
      }));
    } else if (profile?.experience_level) {
      const preferred = filtered.filter((q) => q.difficulty === difficultyFilter);
      if (preferred.length >= 5) filtered = preferred.slice(0, 10);
      else filtered = filtered.slice(0, 10);
    }
    setQuestions(filtered);
    setLoading(false);
  };

  if (loading) return <div className="loading-card">Building your assessment\u2026</div>;

  if (selected && questions.length > 0) {
    return (
      <QuizFlow
        userId={''}
        competency={selected}
        questions={questions}
        experienceLevel={profile?.experience_level ?? null}
        sourceLabel="skill"
        onBack={() => { setSelected(null); setQuestions([]); }}
        onComplete={onComplete}
        onBackToResults={onBackToResults}
      />
    );
  }

  const showMapped = userSkills.length > 0 && mappedCompetencies.length > 0;
  return <>
    <div className="page-heading">
      <div>
        <p className="eyebrow">SKILL ASSESSMENT</p>
        <h1>Measure your capability</h1>
        <p className="subheading">{showMapped ? 'Assessments recommended based on your profile skills.' : 'Choose a domain to get a focused snapshot of your current level.'}</p>
      </div>
    </div>
    {showMapped && (
      <div className="assessment-intro">
        <div className="intro-icon"><BrainCircuit size={26} /></div>
        <div><h2>Personalized for your skills</h2><p>These assessments are based on the skills you added to your profile{profile?.experience_level ? `, calibrated for your ${profile.experience_level} level` : ''}.</p></div>
        <div className="intro-time"><Clock3 size={16} /> 5-10 min</div>
      </div>
    )}
    <div className="assessment-grid">
      {(showMapped ? mappedCompetencies : competencies).map((item, index) => (
        <button className="assessment-domain" key={item.id} onClick={() => begin(item)}>
          <span className="domain-number">0{index + 1}</span>
          <span className="domain-icon" style={{ color: palette[index % palette.length] }}>{item.name.slice(0, 2).toUpperCase()}</span>
          <strong>{item.name}</strong>
          <small>{item.description}</small>
          <ChevronRight size={18} />
        </button>
      ))}
    </div>
  </>;
}

function Learning({ courses, gaps, enrolledCourseIds, enrollments, onEnroll }: { courses: Course[]; gaps: Gap[]; enrolledCourseIds: Set<string>; enrollments: Enrollment[]; onEnroll: (id: string) => void }) {
  return <>
    <div className="page-heading">
      <div><p className="eyebrow">YOUR LEARNING PATH</p><h1>Designed around your gaps</h1><p className="subheading">A focused sequence that turns your assessment into practical capability.</p></div>
      <div className="path-progress"><span>PATH PROGRESS</span><strong>{enrollments.filter((item) => item.status === 'completed').length} <small>/ {courses.length}</small></strong></div>
    </div>
    <div className="path-banner">
      <div className="path-banner-copy"><span className="banner-label"><Target size={14} /> RECOMMENDED SEQUENCE</span><h2>Build your data fluency</h2><p>Start with Python, then layer in visualization and AI/ML. Each step compounds the last.</p></div>
      <div className="path-steps">{gaps.slice(0, 4).map((gap, index) => <div className="path-step" key={gap.id}><span style={{ background: gap.tone }}>{index + 1}</span><small>{gap.name}</small></div>)}</div>
    </div>
    <div className="section-head"><div><p className="eyebrow">NEXT BEST ACTION</p><h2>Keep moving forward</h2></div><div className="course-filter"><button className="filter-active">All courses</button><button>In progress</button><button>Completed</button></div></div>
    <div className="course-grid large">{courses.map((course, index) => <CourseCard key={course.id} course={course} tone={palette[index % palette.length]} enrolled={enrolledCourseIds.has(course.id)} onEnroll={onEnroll} />)}</div>
  </>;
}

function Library({ onRefresh }: { onRefresh: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const handleUpload = async () => {
    if (!file) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    await supabase.from('uploaded_documents').insert({ filename: file.name, file_type: file.name.split('.').pop() || 'pdf', file_size: file.size, storage_path: path, title: file.name.replace(/\.[^/.]+$/, ''), status: error ? 'failed' : 'processed' });
    setUploaded(!error); onRefresh();
  };
  return <>
    <div className="page-heading"><div><p className="eyebrow">KNOWLEDGE LIBRARY</p><h1>Turn content into capability</h1><p className="subheading">Upload a PDF or presentation and generate a practice assessment from it.</p></div><button className="outline-button"><Search size={16} /> Search library</button></div>
    <div className="upload-card"><div className="upload-symbol"><Upload size={24} /></div><h2>Generate an AI practice quiz</h2><p>Drop a PDF or PowerPoint here. StatIQ will identify key concepts and create an assessment you can take immediately.</p>
      <label className="dropzone"><input type="file" accept=".pdf,.ppt,.pptx" onChange={(event) => setFile(event.target.files?.[0] || null)} /><FileText size={22} /><strong>{file ? file.name : 'Choose a file or drag it here'}</strong><span>PDF, PPT, PPTX up to 20 MB</span></label>
      {file && <button className="primary" onClick={handleUpload}><Sparkles size={16} /> Generate practice quiz</button>}
      {uploaded && <p className="upload-success"><Check size={15} /> Your practice quiz is ready. Open it from your generated assessments.</p>}
    </div>
    <div className="empty-state small"><div className="empty-icon"><FileText size={22} /></div><h2>Your generated quizzes will appear here</h2><p>Upload your first learning document to create a personalized practice session.</p></div>
  </>;
}

function Analytics({ gaps, overallScore }: { gaps: Gap[]; overallScore: number }) {
  return <>
    <div className="page-heading"><div><p className="eyebrow">PERSONAL ANALYTICS</p><h1>Your growth in numbers</h1><p className="subheading">A clearer view of the habits building your capability.</p></div><button className="outline-button"><MoreHorizontal size={16} /> Export report</button></div>
    <div className="analytics-top">
      <div className="card score-card"><span className="stat-label">OVERALL CAPABILITY</span><div className="big-score">{overallScore}<small>/ 100</small></div><div className="score-line"><i /></div><p>Calculated from your latest capability results</p></div>
      <div className="card streak-card"><div className="streak-head"><span className="stat-label">LEARNING STREAK</span><Zap size={18} /></div><strong>12 <small>days</small></strong><p>Best streak: 18 days</p><div className="week-dots">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => <span key={`${day}-${i}`} className={i < 5 ? 'filled' : ''}>{day}</span>)}</div></div>
      <div className="card hours-card"><span className="stat-label">HOURS INVESTED</span><strong>18.5h</strong><div className="mini-bars">{[35, 48, 42, 61, 53, 76, 68, 85].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><p>+4.2h this month</p></div>
    </div>
    <div className="card analytics-table"><div className="card-top"><span>CAPABILITY TRAJECTORY</span><span className="table-note">Last updated today</span></div>{gaps.map((gap) => <GapRow key={gap.id} gap={gap} />)}</div>
    <div className="insight-card"><Sparkles size={19} /><div><strong>One insight worth acting on</strong><p>Your strongest adjacent skill is Sampling. Pairing it with Python will make your next analytics project significantly easier.</p></div><button>View pathway <ArrowRight size={15} /></button></div>
  </>;
}

function Admin({ competencies }: { competencies: Competency[] }) {
  return <>
    <div className="page-heading"><div><p className="eyebrow">ADMINISTRATION</p><h1>Workforce overview</h1><p className="subheading">Monitor capability growth across your organization.</p></div><button className="primary"><Plus size={16} /> Add learning content</button></div>
    <div className="stats-grid admin-stats">
      <Stat label="Active learners" value="248" suffix="" trend="+12% this month" icon={<Users size={17} />} />
      <Stat label="Avg. capability score" value="61" suffix="/ 100" trend="+6 points" icon={<Target size={17} />} />
      <Stat label="Courses completed" value="1,284" suffix="" trend="This quarter" icon={<GraduationCap size={17} />} />
      <Stat label="Skill gaps closed" value="74" suffix="%" trend="+9% this quarter" icon={<TrendingUp size={17} />} />
    </div>
    <div className="admin-grid">
      <div className="card department-card"><div className="card-top"><span>CAPABILITY BY DOMAIN</span><MoreHorizontal size={17} /></div>{competencies.slice(0, 6).map((item, index) => <div className="department-row" key={item.id}><span>{item.name}</span><div className="bar"><i style={{ width: `${[72, 48, 65, 38, 81, 76][index]}%`, background: palette[index] }} /></div><strong>{[72, 48, 65, 38, 81, 76][index]}%</strong></div>)}</div>
      <div className="card activity-card"><div className="card-top"><span>RECENT ACTIVITY</span><span className="live-dot">Live</span></div>{['Priya completed Python for Data Analysis', 'Rahul started Introduction to AI/ML', 'Meera took a capability assessment', 'Arjun closed a GIS skill gap'].map((item, i) => <div className="activity-row" key={item}><span className="avatar small-avatar">{item[0]}</span><div><strong>{item.split(' ')[0]} {item.split(' ')[1]}</strong><p>{item.slice(item.indexOf(' ') + 1)}</p></div><small>{i + 1}h ago</small></div>)}</div>
    </div>
    <div className="admin-callout"><div><span className="banner-label"><Sparkles size={14} /> SYSTEM RECOMMENDATION</span><h2>AI/ML is your organization\u2019s largest capability gap.</h2><p>42% of learners are below the target level. Consider a cohort-based learning sprint.</p></div><button className="banner-button">Build a cohort <ArrowRight size={16} /></button></div>
  </>;
}

function Chat({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! I\u2019m here to help you make sense of your capability map. Ask me about a skill gap, course, or learning path.' }]);
  const send = () => {
    if (!message.trim()) return;
    const question = message;
    setMessages((items) => [...items, { role: 'user', content: question }, { role: 'assistant', content: question.toLowerCase().includes('python') ? 'Python is your strongest next step. Start with Python for Data Analysis, then move to Data Visualization once you are comfortable with pandas.' : 'Based on your latest snapshot, AI/ML is the clearest opportunity. I\u2019d recommend a small assessment first, followed by the Introduction to AI/ML course.' }]);
    setMessage('');
  };
  return <div className="chat-panel">
    <div className="chat-header"><div><span className="assistant-orb"><Bot size={17} /></span><div><strong>Learning assistant</strong><small>Grounded in your capability map</small></div></div><button onClick={onClose}><X size={18} /></button></div>
    <div className="chat-messages">{messages.map((item, i) => <div className={`chat-message ${item.role}`} key={`${item.role}-${i}`}>{item.content}</div>)}</div>
    <div className="chat-input"><input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && send()} placeholder="Ask anything about your learning\u2026" /><button onClick={send}><ArrowRight size={17} /></button></div>
  </div>;
}

export default App;