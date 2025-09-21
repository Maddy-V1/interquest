-- Update leaderboard views to show approved users (not just completed users)

-- Drop existing views
DROP VIEW IF EXISTS round_leaderboard_view;
DROP VIEW IF EXISTS overall_leaderboard_view;

-- Create Round 1 leaderboard view (all participants who completed Round 1)
CREATE OR REPLACE VIEW overall_leaderboard_view AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    COALESCE(qs.score, 0) as total_score,
    COALESCE(qs.total_questions, 0) as total_questions,
    COALESCE(qs.correct_answers, 0) as correct_answers,
    qs.completed_at,
    ROW_NUMBER() OVER (ORDER BY COALESCE(qs.score, 0) DESC, qs.completed_at ASC) as rank
FROM users u
JOIN quiz_sessions qs ON u.id = qs.user_id
WHERE qs.status = 'completed' 
    AND qs.round_number = 1
ORDER BY COALESCE(qs.score, 0) DESC, qs.completed_at ASC;

-- Create Round 2 approved users view (shows all users approved for Round 2, with their scores if completed)
CREATE OR REPLACE VIEW round_leaderboard_view AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    COALESCE(qs.score, 0) as total_score,
    COALESCE(qs.total_questions, 0) as total_questions,
    COALESCE(qs.correct_answers, 0) as correct_answers,
    qs.completed_at,
    CASE 
        WHEN qs.status = 'completed' THEN 'completed'
        ELSE 'approved'
    END as status,
    ROW_NUMBER() OVER (ORDER BY COALESCE(qs.score, 0) DESC, qs.completed_at ASC) as rank
FROM users u
LEFT JOIN quiz_sessions qs ON u.id = qs.user_id AND qs.round_number = 2 AND qs.status = 'completed'
WHERE u.round2_approved = true
ORDER BY COALESCE(qs.score, 0) DESC, qs.completed_at ASC;

-- Create a view for Round 3 approved users (similar to Round 2)
CREATE OR REPLACE VIEW round3_leaderboard_view AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    CONCAT(u.first_name, ' ', u.last_name) as full_name,
    COALESCE(qs.score, 0) as total_score,
    COALESCE(qs.total_questions, 0) as total_questions,
    COALESCE(qs.correct_answers, 0) as correct_answers,
    qs.completed_at,
    CASE 
        WHEN qs.status = 'completed' THEN 'completed'
        ELSE 'approved'
    END as status,
    ROW_NUMBER() OVER (ORDER BY COALESCE(qs.score, 0) DESC, qs.completed_at ASC) as rank
FROM users u
LEFT JOIN quiz_sessions qs ON u.id = qs.user_id AND qs.round_number = 3 AND qs.status = 'completed'
WHERE u.round3_approved = true
ORDER BY COALESCE(qs.score, 0) DESC, qs.completed_at ASC;