import { useState } from 'react';
import { ArrowRight, Check, ChevronRight, Clock3, TrendingUp } from 'lucide-react';
import type { AssessmentQuestion, Competency } from '@/lib/types';
import { analyzeAssessment } from '@/lib/aiAnalysis';
import { supabase } from '@/lib/supabase';

type AnalysisSummary = { score: number; level: string; strengths: string[]; weaknesses: string[] };

type Props = {
  userId: string;
  competency: Competency;
  questions: AssessmentQuestion[];
  experienceLevel: string | null;
  sourceLabel: string;
  onBack: () => void;
  onComplete: (competencyId: string, questions: AssessmentQuestion[], answers: Record<string, string>) => void;
  onBackToResults: () => void;
};

export function QuizFlow({ userId, competency, questions, experienceLevel, sourceLabel, onBack, onComplete, onBackToResults }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary | null>(null);

  const finish = async () => {
    const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
    const scorePct = Math.round((correct / questions.length) * 100);
    await supabase.from('assessment_results').insert({
      competency_id: competency.id,
      total_questions: questions.length,
      correct_answers: correct,
      score_pct: scorePct,
    });
    const analysis = analyzeAssessment(competency, questions, answers);
    setAnalysisSummary({ score: scorePct, level: analysis.level, strengths: analysis.strengths, weaknesses: analysis.weaknesses });
    await onComplete(competency.id, questions, answers);
    setDone(true);
  };

  if (done && analysisSummary) {
    return (
      <div className="empty-state success-state">
        <div className="success-mark"><Check size={28} /></div>
        <p className="eyebrow">ASSESSMENT COMPLETE</p>
        <h1>{competency.name} Skill Analysis</h1>
        <div className="analysis-summary-grid">
          <div className="analysis-summary-score">
            <strong>{analysisSummary.score}%</strong>
            <span>{analysisSummary.level} level</span>
          </div>
          <div className="analysis-summary-sections">
            <div className="analysis-summary-section">
              <span className="analysis-label"><Check size={13} /> STRENGTHS</span>
              <div className="tag-list">
                {analysisSummary.strengths.length > 0
                  ? analysisSummary.strengths.map((s) => <span className="strength-tag" key={s}>{s}</span>)
                  : <span className="empty-text">Keep practicing to build strengths.</span>}
              </div>
            </div>
            <div className="analysis-summary-section">
              <span className="analysis-label"><TrendingUp size={13} /> NEEDS IMPROVEMENT</span>
              <div className="tag-list">
                {analysisSummary.weaknesses.length > 0
                  ? analysisSummary.weaknesses.map((s) => <span className="weakness-tag" key={s}>{s}</span>)
                  : <span className="empty-text">No weak areas detected.</span>}
              </div>
            </div>
          </div>
        </div>
        <p>Your results and AI analysis have been saved. Your learning recommendations have been updated.</p>
        <div className="success-actions">
          <button className="primary" onClick={() => { setDone(false); setAnalysisSummary(null); onBack(); }}>
            Take another assessment <ArrowRight size={16} />
          </button>
          <button className="outline-button" onClick={onBackToResults}>View full results <ArrowRight size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-shell">
      <div className="quiz-top">
        <button className="back-button" onClick={onBack}><ChevronRight size={16} className="rotate-180" /> Choose another {sourceLabel}</button>
        <span>Question {step + 1} of {questions.length}</span>
      </div>
      <div className="quiz-progress"><i style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div>
      {questions[step] && (
        <div className="question-card">
          <span className="question-kicker">{competency.name} / {questions[step].topic?.toUpperCase() || 'GENERAL'}</span>
          <h1>{questions[step].question_text}</h1>
          <div className="options">
            {(['a', 'b', 'c', 'd'] as const).map((key) => (
              <button
                key={key}
                className={answers[questions[step].id] === key ? 'option selected' : 'option'}
                onClick={() => setAnswers({ ...answers, [questions[step].id]: key })}
              >
                <span>{key.toUpperCase()}</span>{questions[step][`option_${key}`]}
              </button>
            ))}
          </div>
          <div className="question-actions">
            <span>Choose the answer that best reflects your knowledge.</span>
            <button
              className="primary"
              disabled={!answers[questions[step].id]}
              onClick={() => (step === questions.length - 1 ? finish() : setStep(step + 1))}
            >
              {step === questions.length - 1 ? 'Submit assessment' : 'Next question'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}