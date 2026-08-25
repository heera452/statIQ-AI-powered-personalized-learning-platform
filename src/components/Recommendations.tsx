import { useEffect, useState } from 'react';
import { ArrowRight, Check, Sparkles, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LearningRecommendation } from '@/lib/types';

type Props = {
  userId: string;
  onNavigate: (view: 'assessment' | 'learning') => void;
};

export function Recommendations({ userId, onNavigate }: Props) {
  const [recs, setRecs] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from('learning_recommendations').select('*').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false });
      if (active) { setRecs(data as LearningRecommendation[] || []); setLoading(false); }
    })();
    return () => { active = false; };
  }, [userId]);

  const dismiss = async (id: string) => {
    await supabase.from('learning_recommendations').update({ status: 'dismissed' }).eq('id', id);
    setRecs(recs.filter((r) => r.id !== id));
  };

  const complete = async (id: string) => {
    await supabase.from('learning_recommendations').update({ status: 'completed' }).eq('id', id);
    setRecs(recs.filter((r) => r.id !== id));
  };

  if (loading) return <div className="loading-card">Loading recommendations…</div>;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AI LEARNING RECOMMENDATIONS</p>
          <h1>Your personalized learning path</h1>
          <p className="subheading">Generated from your profile, skills, and assessment results.</p>
        </div>
        <button className="outline-button" onClick={() => onNavigate('assessment')}><Target size={16} /> Take assessment</button>
      </div>

      {recs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Sparkles size={22} /></div>
          <p className="eyebrow">NO RECOMMENDATIONS YET</p>
          <h2>Complete an assessment to unlock recommendations</h2>
          <p>Take a skill assessment and our AI will generate a personalized learning path based on your results.</p>
          <button className="primary" onClick={() => onNavigate('assessment')}>Start assessment <ArrowRight size={16} /></button>
        </div>
      ) : (
        <div className="rec-list-container">
          {recs.map((rec, i) => (
            <div className={`card rec-card priority-${rec.priority}`} key={rec.id}>
              <div className="rec-priority-badge">{rec.priority}</div>
              <div className="rec-body">
                <span className="rec-number">0{i + 1}</span>
                <p>{rec.recommendation_text}</p>
              </div>
              <div className="rec-actions">
                <button className="rec-action complete" onClick={() => complete(rec.id)}><Check size={14} /> Done</button>
                <button className="rec-action dismiss" onClick={() => dismiss(rec.id)}>Dismiss</button>
                <button className="rec-action explore" onClick={() => onNavigate('learning')}>Explore <ArrowRight size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}