import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, ChevronLeft, Plus, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, UserSkill } from '@/lib/types';
import { SUGGESTED_SKILLS } from '@/lib/skillMapping';

type Props = {
  userId: string;
  email: string;
  profile: Profile | null;
  existingSkills: UserSkill[];
  onSaved: () => void;
};

export function ProfileView({ userId, email, profile, existingSkills, onSaved }: Props) {
  const [editing, setEditing] = useState(!profile?.full_name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [role, setRole] = useState(profile?.designation || '');
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || 'beginner');
  const [yearsExp, setYearsExp] = useState(profile?.years_experience?.toString() || '');
  const [education, setEducation] = useState(profile?.education_level || '');
  const [interests, setInterests] = useState((profile?.areas_of_interest || []).join(', '));
  const [technologies, setTechnologies] = useState((profile?.technologies_known || []).join(', '));
  const [goal, setGoal] = useState(profile?.learning_goal || '');

  const [skills, setSkills] = useState<UserSkill[]>(existingSkills);
  const [newSkill, setNewSkill] = useState('');
  const [newProficiency, setNewProficiency] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRole(profile.designation || '');
      setExperienceLevel(profile.experience_level || 'beginner');
      setYearsExp(profile.years_experience?.toString() || '');
      setEducation(profile.education_level || '');
      setInterests((profile.areas_of_interest || []).join(', '));
      setTechnologies((profile.technologies_known || []).join(', '));
      setGoal(profile.learning_goal || '');
    }
  }, [profile]);

  useEffect(() => {
    setSkills(existingSkills);
  }, [existingSkills]);

  const addSkill = () => {
    const name = newSkill.trim();
    if (!name) return;
    if (skills.some((s) => s.skill_name.toLowerCase() === name.toLowerCase())) return;
    setSkills([...skills, { id: `temp-${Date.now()}`, user_id: userId, skill_name: name, proficiency: newProficiency }]);
    setNewSkill('');
  };

  const removeSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s.skill_name !== skillName));
  };

  const updateProficiency = (skillName: string, proficiency: 'beginner' | 'intermediate' | 'advanced') => {
    setSkills(skills.map((s) => (s.skill_name === skillName ? { ...s, proficiency } : s)));
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error: profileError } = await supabase.from('profiles').update({
      full_name: fullName,
      designation: role,
      experience_level: experienceLevel,
      years_experience: yearsExp ? parseFloat(yearsExp) : null,
      education_level: education || null,
      areas_of_interest: interests.split(',').map((s) => s.trim()).filter(Boolean),
      technologies_known: technologies.split(',').map((s) => s.trim()).filter(Boolean),
      learning_goal: goal || null,
    }).eq('id', userId);

    if (profileError) { setError('Could not save your profile. Please try again.'); setSaving(false); return; }

    const existingNames = existingSkills.map((s) => s.skill_name);
    const toDelete = existingNames.filter((n) => !skills.some((s) => s.skill_name === n));
    const toInsert = skills.filter((s) => !existingNames.includes(s.skill_name));
    const toUpdate = skills.filter((s) => {
      const existing = existingSkills.find((e) => e.skill_name === s.skill_name);
      return existing && existing.proficiency !== s.proficiency;
    });

    if (toDelete.length) await supabase.from('user_skills').delete().eq('user_id', userId).in('skill_name', toDelete);
    if (toInsert.length) await supabase.from('user_skills').insert(toInsert.map((s) => ({ user_id: userId, skill_name: s.skill_name, proficiency: s.proficiency })));
    for (const s of toUpdate) {
      await supabase.from('user_skills').update({ proficiency: s.proficiency }).eq('user_id', userId).eq('skill_name', s.skill_name);
    }

    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
    onSaved();
  };

  const profileComplete = !!(fullName && role && experienceLevel && skills.length > 0);
  const completionPct = Math.round(
    [fullName, role, experienceLevel, skills.length > 0, education, goal].filter(Boolean).length / 6 * 100
  );

  if (!editing && profile?.full_name) {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">MY PROFILE</p>
            <h1>{fullName || 'Your profile'}</h1>
            <p className="subheading">Your learning profile and skill inventory.</p>
          </div>
          <button className="primary" onClick={() => setEditing(true)}>Edit profile</button>
        </div>

        {saved && <div className="toast-success"><Check size={16} /> Profile saved successfully.</div>}

        <div className="profile-display-grid">
          <div className="card profile-section">
            <div className="card-top"><span>BASIC INFORMATION</span></div>
            <div className="profile-field"><label>Full Name</label><strong>{fullName || 'Not set'}</strong></div>
            <div className="profile-field"><label>Email</label><strong>{email}</strong></div>
            <div className="profile-field"><label>Role</label><strong>{role || 'Not set'}</strong></div>
            <div className="profile-field"><label>Experience Level</label><span className="badge-exp">{experienceLevel}</span></div>
            <div className="profile-field"><label>Years of Experience</label><strong>{yearsExp || 'Not specified'}</strong></div>
            <div className="profile-field"><label>Education Level</label><strong>{education || 'Not specified'}</strong></div>
          </div>

          <div className="card profile-section">
            <div className="card-top"><span>SKILLS</span></div>
            {skills.length === 0 ? (
              <p className="empty-text">No skills added yet. Click "Edit profile" to add skills.</p>
            ) : (
              <div className="skill-tags-display">
                {skills.map((skill) => (
                  <div className="skill-tag-display" key={skill.id}>
                    <strong>{skill.skill_name}</strong>
                    <span className={`prof-dot prof-${skill.proficiency}`}>{skill.proficiency}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card profile-section">
            <div className="card-top"><span>LEARNING INFORMATION</span></div>
            <div className="profile-field"><label>Areas of Interest</label>
              <div className="tag-list">{(profile?.areas_of_interest || []).map((t) => <span className="info-tag" key={t}>{t}</span>)}</div>
            </div>
            <div className="profile-field"><label>Technologies Known</label>
              <div className="tag-list">{(profile?.technologies_known || []).map((t) => <span className="info-tag" key={t}>{t}</span>)}</div>
            </div>
            <div className="profile-field"><label>Learning Goal</label><strong>{goal || 'Not specified'}</strong></div>
          </div>
        </div>

        <div className="profile-completion-bar">
          <div className="completion-head"><span>Profile Completion</span><strong>{completionPct}%</strong></div>
          <div className="bar large"><i style={{ width: `${completionPct}%` }} /></div>
          {!profileComplete && <p className="completion-hint">Complete your profile to unlock personalized skill assessments.</p>}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{profile?.full_name ? 'EDIT PROFILE' : 'COMPLETE YOUR PROFILE'}</p>
          <h1>{profile?.full_name ? 'Edit your profile' : 'Set up your learning profile'}</h1>
          <p className="subheading">This helps us personalize your skill assessments and learning recommendations.</p>
        </div>
        {profile?.full_name && <button className="text-button" onClick={() => setEditing(false)}><ChevronLeft size={15} /> Back to profile</button>}
      </div>

      {error && <div className="toast-error">{error}</div>}

      <form onSubmit={save} className="profile-form">
        <div className="form-section">
          <h2 className="form-section-title">Basic Information</h2>
          <div className="form-grid-2">
            <label className="form-label">Full Name<input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Bhavana Sharma" required /></label>
            <label className="form-label">Email (from your account)<input value={email} disabled /></label>
            <label className="form-label">Role / Current Role<input value={role} onChange={(e) => setRole(e.target.value)} placeholder="AI/ML Student" required /></label>
            <label className="form-label">Years of Experience<input value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} type="number" step="0.5" min="0" placeholder="2.5" /></label>
            <label className="form-label">Experience Level
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label className="form-label">Education Level<input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="Postgraduate" /></label>
          </div>
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Skills</h2>
          <p className="form-hint">Add the skills you know. We'll generate assessments based on these.</p>
          <div className="skill-add-row">
            <input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Type a skill and press Enter" />
            <select value={newProficiency} onChange={(e) => setNewProficiency(e.target.value as 'beginner' | 'intermediate' | 'advanced')}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button type="button" className="primary" onClick={addSkill}><Plus size={15} /> Add</button>
          </div>
          <div className="suggested-skills">
            <span className="suggested-label">Suggested:</span>
            {SUGGESTED_SKILLS.filter((s) => !skills.some((sk) => sk.skill_name.toLowerCase() === s.toLowerCase())).slice(0, 8).map((s) => (
              <button type="button" key={s} className="suggest-chip" onClick={() => setSkills([...skills, { id: `temp-${Date.now()}-${s}`, user_id: userId, skill_name: s, proficiency: 'beginner' }])}>{s}</button>
            ))}
          </div>
          {skills.length > 0 && (
            <div className="skill-list-edit">
              {skills.map((skill) => (
                <div className="skill-edit-row" key={skill.id}>
                  <strong>{skill.skill_name}</strong>
                  <select value={skill.proficiency} onChange={(e) => updateProficiency(skill.skill_name, e.target.value as 'beginner' | 'intermediate' | 'advanced')}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <button type="button" className="remove-skill" onClick={() => removeSkill(skill.skill_name)}><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="form-section-title">Learning Information</h2>
          <div className="form-grid-2">
            <label className="form-label">Areas of Interest (comma-separated)<input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Artificial Intelligence, Machine Learning" /></label>
            <label className="form-label">Technologies Already Known (comma-separated)<input value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="Python, TensorFlow, SQL" /></label>
          </div>
          <label className="form-label full-width">Career / Learning Goal<input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Become an AI/ML engineer" /></label>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary" disabled={saving}><Sparkles size={16} /> {saving ? 'Saving…' : 'Save profile'}</button>
          {profile?.full_name && <button type="button" className="text-button" onClick={() => setEditing(false)}>Cancel</button>}
        </div>
      </form>
    </>
  );
}