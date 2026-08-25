/*
# Add topic column and expanded assessment questions

## Overview
- Adds a `topic` column to assessment_questions for topic-level AI analysis.
- Seeds additional topic-tagged questions for Python, SQL, and AI/ML.

## Modified Tables
- `assessment_questions`: adds `topic` text column (default 'general').
*/

ALTER TABLE assessment_questions
  ADD COLUMN IF NOT EXISTS topic text NOT NULL DEFAULT 'general';

-- Update existing Python questions with topics
UPDATE assessment_questions SET topic = 'data_types' WHERE question_text = 'Which Python library is primarily used for data manipulation and analysis?';
UPDATE assessment_questions SET topic = 'data_structures' WHERE question_text = 'Which data structure in Python is ordered and mutable?';
UPDATE assessment_questions SET topic = 'functions' WHERE question_text = 'What does the pandas method df.head() return?';
UPDATE assessment_questions SET topic = 'advanced' WHERE question_text = 'What is a decorator in Python?';
UPDATE assessment_questions SET topic = 'basics' WHERE question_text = 'Which statement correctly creates a virtual environment in Python 3?';

-- Update existing SQL questions with topics
UPDATE assessment_questions SET topic = 'select_where' WHERE question_text = 'Which SQL clause is used to filter results?';
UPDATE assessment_questions SET topic = 'joins' WHERE question_text = 'What does the SQL JOIN clause do?';
UPDATE assessment_questions SET topic = 'aggregation' WHERE question_text = 'Which SQL function counts the number of rows?';
UPDATE assessment_questions SET topic = 'advanced' WHERE question_text = 'What is the difference between WHERE and HAVING in SQL?';
UPDATE assessment_questions SET topic = 'joins' WHERE question_text = 'Which type of join returns all rows from the left table and matched rows from the right?';

-- Update existing AI/ML questions with topics
UPDATE assessment_questions SET topic = 'fundamentals' WHERE question_text = 'What is supervised learning?';
UPDATE assessment_questions SET topic = 'classification' WHERE question_text = 'Which algorithm is commonly used for classification?';
UPDATE assessment_questions SET topic = 'overfitting' WHERE question_text = 'What does overfitting mean in machine learning?';
UPDATE assessment_questions SET topic = 'evaluation' WHERE question_text = 'What is the purpose of cross-validation?';
UPDATE assessment_questions SET topic = 'feature_engineering' WHERE question_text = 'Which technique is used to reduce the dimensionality of data?';

-- ============================================================
-- Additional Python questions (topic-tagged)
-- ============================================================
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which keyword is used to define a function in Python?', 'func', 'def', 'function', 'lambda', 'b', 'easy', 'functions'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What is the output of: print(type([])) in Python?', 'class tuple', 'class list', 'class array', 'class dict', 'b', 'easy', 'data_structures'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which statement correctly handles an exception in Python?', 'try-catch', 'try-except', 'catch-throw', 'do-while', 'b', 'medium', 'exception_handling'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What is the correct way to create a class in Python?', 'class MyClass:', 'create MyClass:', 'def MyClass:', 'object MyClass:', 'a', 'medium', 'oop'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which loop is used to iterate over a sequence in Python?', 'for', 'foreach', 'loop', 'iterate', 'a', 'easy', 'loops'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What does the len() function return for a string "hello"?', '4', '5', '6', 'Error', 'b', 'easy', 'basics'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which keyword is used for conditional statements in Python?', 'when', 'if', 'case', 'switch', 'b', 'easy', 'conditions'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What is a lambda function in Python?', 'A recursive function', 'An anonymous inline function', 'A class method', 'A loop construct', 'b', 'medium', 'functions'
FROM competencies c WHERE c.name = 'Python'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Additional SQL questions (topic-tagged)
-- ============================================================
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which SQL statement is used to retrieve data from a database?', 'GET', 'SELECT', 'FETCH', 'RETRIEVE', 'b', 'easy', 'select_where'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which SQL clause is used to group rows that have the same values?', 'ORDER BY', 'GROUP BY', 'SORT BY', 'DISTINCT', 'b', 'easy', 'aggregation'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What is a subquery in SQL?', 'A query inside another query', 'A backup query', 'A deleted query', 'A cached query', 'a', 'medium', 'subqueries'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which SQL keyword is used to sort the result set?', 'SORT', 'ORDER BY', 'ARRANGE', 'GROUP BY', 'b', 'easy', 'select_where'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What does the DISTINCT keyword do in SQL?', 'Removes duplicate rows', 'Sorts results', 'Counts rows', 'Joins tables', 'a', 'medium', 'select_where'
FROM competencies c WHERE c.name = 'SQL'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Additional AI/ML questions (topic-tagged)
-- ============================================================
INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which type of ML algorithm groups data without labels?', 'Supervised', 'Unsupervised', 'Reinforcement', 'Semi-supervised', 'b', 'easy', 'fundamentals'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which metric is used to evaluate a regression model?', 'Accuracy', 'Mean Squared Error', 'F1-score', 'Precision', 'b', 'medium', 'evaluation'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What is the train/test split used for?', 'To speed up training', 'To evaluate model performance on unseen data', 'To increase accuracy', 'To reduce dataset size', 'b', 'medium', 'evaluation'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'Which algorithm is used for predicting continuous values?', 'Classification', 'Regression', 'Clustering', 'Association', 'b', 'medium', 'regression'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;

INSERT INTO assessment_questions (competency_id, question_text, option_a, option_b, option_c, option_d, correct_answer, difficulty, topic)
SELECT c.id, 'What is feature engineering?', 'Building physical features', 'Creating new input features from existing data', 'A type of model', 'A visualization technique', 'b', 'medium', 'feature_engineering'
FROM competencies c WHERE c.name = 'AI/ML'
ON CONFLICT DO NOTHING;