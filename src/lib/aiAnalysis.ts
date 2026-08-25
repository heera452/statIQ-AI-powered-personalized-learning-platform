import type { AssessmentQuestion, Competency } from './types';

export type TopicResult = {
  topic: string;
  correct: number;
  total: number;
};

export type AnalysisResult = {
  competencyId: string;
  competencyName: string;
  scorePct: number;
  level: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
};

const TOPIC_LABELS: Record<string, string> = {
  data_types: 'Data Types & Libraries',
  data_structures: 'Data Structures',
  functions: 'Functions',
  oop: 'Object-Oriented Programming',
  exception_handling: 'Exception Handling',
  loops: 'Loops & Iteration',
  conditions: 'Conditionals',
  basics: 'Python Basics',
  advanced: 'Advanced Concepts',
  select_where: 'SELECT & WHERE',
  joins: 'JOINs',
  aggregation: 'Aggregation',
  subqueries: 'Subqueries',
  fundamentals: 'ML Fundamentals',
  classification: 'Classification',
  regression: 'Regression',
  overfitting: 'Overfitting & Regularization',
  evaluation: 'Model Evaluation',
  feature_engineering: 'Feature Engineering',
  general: 'General',
};

const TOPIC_RECOMMENDATIONS: Record<string, string> = {
  data_types: 'Review Python data types and common libraries like pandas and NumPy',
  data_structures: 'Practice working with lists, tuples, dictionaries, and sets',
  functions: 'Deepen your understanding of functions, lambdas, and decorators',
  oop: 'Study advanced OOP concepts: inheritance, polymorphism, and encapsulation',
  exception_handling: 'Practice try-except blocks and custom exception handling',
  loops: 'Reinforce loop constructs and iteration patterns',
  conditions: 'Review conditional logic and branching',
  basics: 'Strengthen Python fundamentals: variables, operators, and basic I/O',
  select_where: 'Practice SELECT statements with WHERE clauses and filtering',
  joins: 'Study INNER, LEFT, RIGHT, and FULL JOINs with multi-table queries',
  aggregation: 'Master GROUP BY, HAVING, and aggregate functions',
  subqueries: 'Practice correlated and non-correlated subqueries',
  fundamentals: 'Review supervised vs unsupervised learning paradigms',
  classification: 'Study classification algorithms: logistic regression, SVM, decision trees',
  regression: 'Practice linear and logistic regression on real datasets',
  overfitting: 'Learn regularization techniques: L1/L2, dropout, and early stopping',
  evaluation: 'Master evaluation metrics: accuracy, precision, recall, F1, ROC-AUC',
  feature_engineering: 'Practice feature selection, encoding, and scaling techniques',
  general: 'Review core concepts and fundamentals',
  advanced: 'Explore advanced topics and real-world applications',
};

function scoreToLevel(score: number): string {
  if (score >= 85) return 'Advanced';
  if (score >= 60) return 'Intermediate';
  return 'Beginner';
}

export function analyzeAssessment(
  competency: Competency,
  questions: AssessmentQuestion[],
  answers: Record<string, string>,
): AnalysisResult {
  const topicResults: Record<string, TopicResult> = {};

  for (const q of questions) {
    const topic = q.topic || 'general';
    if (!topicResults[topic]) topicResults[topic] = { topic, correct: 0, total: 0 };
    topicResults[topic].total++;
    if (answers[q.id] === q.correct_answer) topicResults[topic].correct++;
  }

  const topics = Object.values(topicResults);
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  for (const tr of topics) {
    const pct = (tr.correct / tr.total) * 100;
    const label = TOPIC_LABELS[tr.topic] || tr.topic;
    if (pct >= 60) {
      strengths.push(label);
    } else {
      weaknesses.push(label);
      const rec = TOPIC_RECOMMENDATIONS[tr.topic];
      if (rec) recommendations.push(rec);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('You have a solid foundation. Explore advanced topics and real-world projects.');
  }

  const correct = questions.filter((q) => answers[q.id] === q.correct_answer).length;
  const scorePct = Math.round((correct / questions.length) * 100);

  return {
    competencyId: competency.id,
    competencyName: competency.name,
    scorePct,
    level: scoreToLevel(scorePct),
    strengths,
    weaknesses,
    recommendations,
  };
}

export function generateLearningRecommendations(
  analyses: AnalysisResult[],
  competencies: Competency[],
  experienceLevel: string | null,
): { competencyId: string | null; text: string; priority: 'high' | 'medium' | 'low' }[] {
  const recs: { competencyId: string | null; text: string; priority: 'high' | 'medium' | 'low' }[] = [];

  for (const analysis of analyses) {
    if (analysis.scorePct < 40) {
      recs.push({
        competencyId: analysis.competencyId,
        text: `Start with ${analysis.competencyName} fundamentals — your current score is ${analysis.scorePct}%. Focus on: ${analysis.weaknesses.slice(0, 2).join(', ')}.`,
        priority: 'high',
      });
    } else if (analysis.scorePct < 70) {
      recs.push({
        competencyId: analysis.competencyId,
        text: `Strengthen your ${analysis.competencyName} skills — focus on ${analysis.weaknesses.slice(0, 2).join(', ')} to reach intermediate level.`,
        priority: 'medium',
      });
    } else {
      recs.push({
        competencyId: analysis.competencyId,
        text: `Advance your ${analysis.competencyName} expertise — explore advanced topics and real-world projects.`,
        priority: 'low',
      });
    }
  }

  recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  if (experienceLevel === 'beginner' && recs.length === 0) {
    recs.push({
      competencyId: null,
      text: 'Complete a skill assessment to get personalized learning recommendations.',
      priority: 'medium',
    });
  }

  return recs;
}