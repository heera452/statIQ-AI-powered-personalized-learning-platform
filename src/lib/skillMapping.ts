import type { Competency } from './types';

const SKILL_MAP: Record<string, string[]> = {
  python: ['python', 'py', 'django', 'flask', 'pandas', 'numpy', 'scipy'],
  'ai/ml': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning', 'neural networks', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'scikit-learn', 'sklearn'],
  sql: ['sql', 'database', 'postgresql', 'mysql', 'sqlite', 'query', 'queries'],
  'data visualization': ['data visualization', 'visualization', 'matplotlib', 'seaborn', 'plotly', 'tableau', 'powerbi', 'power bi', 'd3', 'charts'],
  gis: ['gis', 'geographic information', 'geospatial', 'mapping', 'qgis', 'arcgis', 'shapefile'],
  sampling: ['sampling', 'survey', 'survey design', 'statistics', 'statistical sampling'],
  'statistical analytics': ['statistics', 'statistical analysis', 'hypothesis testing', 'regression', 'time series', 'bayesian', 'anova'],
};

export function findCompetencyForSkill(skillName: string, competencies: Competency[]): Competency | null {
  const normalized = skillName.toLowerCase().trim();
  for (const [compName, aliases] of Object.entries(SKILL_MAP)) {
    if (aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      const match = competencies.find((c) => c.name.toLowerCase() === compName);
      if (match) return match;
    }
  }
  return null;
}

export function getMappedCompetencies(skills: string[], competencies: Competency[]): Competency[] {
  const mapped = new Map<string, Competency>();
  for (const skill of skills) {
    const comp = findCompetencyForSkill(skill, competencies);
    if (comp) mapped.set(comp.id, comp);
  }
  return Array.from(mapped.values());
}

export const SUGGESTED_SKILLS = [
  'Python', 'Java', 'JavaScript', 'Machine Learning', 'Deep Learning',
  'SQL', 'Data Structures', 'React', 'Statistics', 'Data Visualization',
  'GIS', 'Sampling', 'C++', 'R', 'Tableau', 'Power BI',
];