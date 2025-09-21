-- InterQuest Database Schema for Supabase
-- Run these SQL commands in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    round2_approved BOOLEAN DEFAULT FALSE,
    round3_approved BOOLEAN DEFAULT FALSE,
    winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add unique constraint on name combination
    CONSTRAINT unique_user_name UNIQUE (first_name, last_name)
);

-- Quiz sessions table
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    option_a VARCHAR(200) NOT NULL,
    option_b VARCHAR(200) NOT NULL,
    option_c VARCHAR(200) NOT NULL,
    option_d VARCHAR(200) NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    round_number INTEGER NOT NULL DEFAULT 1,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    category VARCHAR(50) DEFAULT 'general',
    points INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz answers table (for detailed tracking)
CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_name ON users(first_name, last_name);
CREATE INDEX idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_status ON quiz_sessions(status);
CREATE INDEX idx_quiz_sessions_round ON quiz_sessions(round_number);
CREATE INDEX idx_quiz_sessions_score ON quiz_sessions(score DESC);
CREATE INDEX idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_questions_round ON questions(round_number);
CREATE INDEX idx_questions_category ON questions(category);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_sessions_updated_at 
    BEFORE UPDATE ON quiz_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample questions for Round 1 (General Knowledge)
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, round_number, category, points) VALUES
('What is the capital city of France?', 'London', 'Berlin', 'Paris', 'Madrid', 'C', 1, 'geography', 1),
('Which planet is known as the Red Planet?', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'B', 1, 'science', 1),
('Who painted the Mona Lisa?', 'Pablo Picasso', 'Vincent van Gogh', 'Leonardo da Vinci', 'Michelangelo', 'C', 1, 'art', 1),
('What is the largest ocean on Earth?', 'Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean', 'D', 1, 'geography', 1),
('In which year did World War II end?', '1944', '1945', '1946', '1947', 'B', 1, 'history', 1);

-- Insert sample questions for Round 2 (Science & Technology)
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, round_number, category, points) VALUES
('What is the chemical symbol for gold?', 'Go', 'Gd', 'Au', 'Ag', 'C', 2, 'science', 1),
('Who developed the theory of relativity?', 'Isaac Newton', 'Albert Einstein', 'Galileo Galilei', 'Stephen Hawking', 'B', 2, 'science', 1),
('What does CPU stand for in computing?', 'Central Processing Unit', 'Computer Personal Unit', 'Central Program Unit', 'Computer Processing Unit', 'A', 2, 'technology', 1),
('What is the speed of light in vacuum?', '300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s', 'A', 2, 'science', 1),
('Which programming language was developed by Guido van Rossum?', 'Java', 'Python', 'C++', 'JavaScript', 'B', 2, 'technology', 1);

-- Insert sample questions for Round 3 (Advanced Knowledge)
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, round_number, category, points) VALUES
('What is the smallest unit of matter?', 'Molecule', 'Atom', 'Electron', 'Proton', 'B', 3, 'science', 1),
('Who wrote the novel "1984"?', 'Aldous Huxley', 'Ray Bradbury', 'George Orwell', 'H.G. Wells', 'C', 3, 'literature', 1),
('What is the mathematical constant e approximately equal to?', '2.718', '3.142', '1.618', '2.236', 'A', 3, 'mathematics', 1),
('Which ancient wonder of the world was located in Alexandria?', 'Hanging Gardens', 'Colossus of Rhodes', 'Lighthouse of Alexandria', 'Temple of Artemis', 'C', 3, 'history', 1),
('What is the process by which plants convert sunlight into energy?', 'Respiration', 'Photosynthesis', 'Transpiration', 'Germination', 'B', 3, 'science', 1);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to users for leaderboard
CREATE POLICY "Allow public read access to users" ON users
    FOR SELECT USING (true);

-- Allow public insert/update for users
CREATE POLICY "Allow public insert/update for users" ON users
    FOR ALL USING (true);

-- Allow public access to quiz sessions for leaderboard
CREATE POLICY "Allow public access to quiz sessions" ON quiz_sessions
    FOR ALL USING (true);

-- Allow public access to quiz answers
CREATE POLICY "Allow public access to quiz answers" ON quiz_answers
    FOR ALL USING (true);

-- Allow public read access to questions
CREATE POLICY "Allow public read access to questions" ON questions
    FOR SELECT USING (true);

-- Allow admin full access to questions (for question management)
CREATE POLICY "Allow admin full access to questions" ON questions
    FOR ALL USING (true);

-- Create views for leaderboard (overall and per round)
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
    qs.id,
    qs.score,
    qs.total_questions,
    qs.correct_answers,
    qs.round_number,
    qs.completed_at,
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    ROW_NUMBER() OVER (ORDER BY qs.score DESC, qs.completed_at ASC) as overall_rank,
    ROW_NUMBER() OVER (PARTITION BY qs.round_number ORDER BY qs.score DESC, qs.completed_at ASC) as round_rank
FROM quiz_sessions qs
JOIN users u ON qs.user_id = u.id
WHERE qs.status = 'completed' 
    AND qs.score IS NOT NULL
ORDER BY qs.score DESC, qs.completed_at ASC;

-- Create Round 1 leaderboard view (using overall_leaderboard_view)
CREATE OR REPLACE VIEW overall_leaderboard_view AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    qs.score as total_score,
    qs.total_questions,
    qs.correct_answers,
    qs.completed_at,
    ROW_NUMBER() OVER (ORDER BY qs.score DESC, qs.completed_at ASC) as rank
FROM users u
JOIN quiz_sessions qs ON u.id = qs.user_id
WHERE qs.status = 'completed' 
    AND qs.score IS NOT NULL
    AND qs.round_number = 1
ORDER BY qs.score DESC, qs.completed_at ASC;

-- Create Round 2 leaderboard view (using round_leaderboard_view)
CREATE OR REPLACE VIEW round_leaderboard_view AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    qs.score as total_score,
    qs.total_questions,
    qs.correct_answers,
    qs.completed_at,
    ROW_NUMBER() OVER (ORDER BY qs.score DESC, qs.completed_at ASC) as rank
FROM users u
JOIN quiz_sessions qs ON u.id = qs.user_id
WHERE qs.status = 'completed' 
    AND qs.score IS NOT NULL
    AND qs.round_number = 2
ORDER BY qs.score DESC, qs.completed_at ASC;