-- Add sample Round 3 questions for testing
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, round_number, category, points, difficulty, created_at, updated_at) VALUES
('What is the capital of Australia?', 'Sydney', 'Melbourne', 'Canberra', 'Perth', 'C', 3, 'Geography', 1, 'medium', NOW(), NOW()),
('Which programming language was created by Guido van Rossum?', 'Java', 'Python', 'C++', 'JavaScript', 'B', 3, 'Technology', 1, 'medium', NOW(), NOW()),
('What is the largest planet in our solar system?', 'Earth', 'Saturn', 'Jupiter', 'Neptune', 'C', 3, 'Science', 1, 'easy', NOW(), NOW()),
('Who wrote the novel "1984"?', 'Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells', 'B', 3, 'Literature', 1, 'medium', NOW(), NOW()),
('What is the chemical symbol for gold?', 'Go', 'Gd', 'Au', 'Ag', 'C', 3, 'Science', 1, 'medium', NOW(), NOW());