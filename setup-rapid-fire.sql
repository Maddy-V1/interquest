-- Run this SQL in your Supabase SQL editor to set up rapid fire functionality

-- Create tables for rapid fire functionality

-- Game state table to track rapid fire status
CREATE TABLE IF NOT EXISTS game_state (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'waiting',
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rapid fire results table
CREATE TABLE IF NOT EXISTS rapid_fire_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id),
    winner_id UUID REFERENCES users(id),
    answers JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    target_users UUID[] DEFAULT '{}',
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Insert initial game state
INSERT INTO game_state (id, status) 
VALUES ('rapid_fire', 'waiting') 
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rapid_fire_results_question_id ON rapid_fire_results(question_id);
CREATE INDEX IF NOT EXISTS idx_rapid_fire_results_winner_id ON rapid_fire_results(winner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_users ON notifications USING GIN(target_users);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically clean up expired notifications
CREATE OR REPLACE FUNCTION trigger_cleanup_notifications()
RETURNS trigger AS $$
BEGIN
    PERFORM cleanup_old_notifications();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs cleanup when new notifications are inserted
DROP TRIGGER IF EXISTS cleanup_notifications_trigger ON notifications;
CREATE TRIGGER cleanup_notifications_trigger
    AFTER INSERT ON notifications
    EXECUTE FUNCTION trigger_cleanup_notifications();

COMMENT ON TABLE game_state IS 'Tracks the current state of rapid fire games';
COMMENT ON TABLE rapid_fire_results IS 'Stores results of each rapid fire question';
COMMENT ON TABLE notifications IS 'Real-time notifications for users';

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;