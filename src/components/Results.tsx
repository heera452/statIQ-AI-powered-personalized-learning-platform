import { useEffect, useState } from 'react';
import { ArrowRight, Check, ChevronRight, Sparkles, Target, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Competency, SkillAnalysis, UserSkill } from '@/lib/types';
import { getMappedCompetencies } from '@/lib/skillMapping';

type Props = {
  userId: string;
  skills: UserSkill[];
  competencies: Competency[];
  onNavigate: (view: 'assessment') => void;
};

export function Results({ userId, skills, competencies, onNavigate }: Props) {
  const [analyses, setAnalyses] = useState<SkillAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('skill_analysis').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (active) { setAnalyses(data as SkillAnalysis[] || []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [userId]);

  const latestAnalyses = new Map<string, SkillAnalysis>();
  analyses.forEach((a) => { if (!latestAnalyses.has(a.competency_id)) latestAnalyses.set(a.competency_id, a); });

  const mappedCompetencies = skills.length > 0 ? getMappedCompetencies(skills.map((s) => s.skill_name), competencies) : [];

  if (loading) return <div className="loading-card">Loading your results…</div>;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ASSESSMENT RESULTS</p>
          <h1>Your skill analysis</h1>
          <p className="subheading">AI-generated insights from your assessment performance.</p>
        </div>
        <button className="primary" onClick={() => onNavigate('assessment')}><Zap size={16} /> Take new assessment</button>
      </div>

      {latestAnalyses.size === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Target size={22} /></div>
          <p className="eyebrow">NO RESULTS YET</p>
          <h2>Take an assessment to see your AI analysis</h2>
          <p>Complete a skill assessment and we'll analyze your strengths, weaknesses, and recommend what to learn next.</p>
          <button className="primary" onClick={() => onNavigate('assessment')}>Start assessment <ArrowRight size={16} /></button>
        </div>
      ) : (
        <div className="results-grid">
          {Array.from(latestAnalyses.values()).map((analysis) => {
            const competency = competencies.find((c) => c.id === analysis.competency_id);
            return (
              <article className="card analysis-card" key={analysis.id}>
                <div className="analysis-header">
                  <div className="analysis-icon">{competency?.name.slice(0, 2).toUpperCase() || 'SK'}</div>
                  <div>
                    <h3>{competency?.name || 'Skill'} Analysis</h3>
                    <span className="analysis-score">{analysis.score_pct}% · {analysis.level}</span>
                  </div>
                </div>
                <div className="analysis-score-bar"><i style={{ width: `${analysis.score_pct}%` }} /></div>
                <div className="analysis-section">
                  <span className="analysis-label"><Check size={13} /> STRENGTHS</span>
                  {analysis.strengths.length > 0 ? (
                    <div className="tag-list">{analysis.strengths.map((s) => <span className="strength-tag" key={s}>{s}</span>)}</div>
                  ) : <p className="empty-text">Keep practicing to build strengths.</p>}
                </div>
                <div className="analysis-section">
                  <span className="analysis-label"><TrendingUp size={13} /> NEEDS IMPROVEMENT</span>
                  {analysis.weaknesses.length > 0 ? (
                    <div className="tag-list">{analysis.weaknesses.map((s) => <span className="weakness-tag" key={s}>{s}</span>)}</div>
                  ) : <p className="empty-text">No weak areas detected.</p>}
                </div>
                <div className="analysis-section">
                  <span className="analysis-label"><Sparkles size={13} /> RECOMMENDED LEARNING</span>
                  <ol className="rec-list">{analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ol>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {mappedCompetencies.length > 0 && (
        <div className="section-head" style={{ marginTop: 40 }}>
          <div><p className="eyebrow">SKILLS FROM YOUR PROFILE</p><h2>Assessments available for your skills</h2></div>
        </div>
      )}
      {mappedCompetencies.length > 0 && (
        <div className="assessment-grid">
          {mappedCompetencies.map((comp, i) => (
            <button className="assessment-domain" key={comp.id} onClick={() => onNavigate('assessment')}>
              <span className="domain-number">0{i + 1}</span>
              <span className="domain-icon">{comp.name.slice(0, 2).toUpperCase()}</span>
              <strong>{comp.name}</strong>
              <small>{comp.description}</small>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}