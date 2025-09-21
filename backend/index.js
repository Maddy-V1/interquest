const express = require('express');
const cors = require('cors');
require('dotenv').config();
const UserService = require('./services/userService');
const { supabase } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
  credentials: true
}));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'InterQuest API Server' });
});

// User routes
app.post('/api/users', async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        error: 'First name and last name are required' 
      });
    }

    const user = await UserService.createOrUpdateUser(firstName, lastName);
    
    res.status(201).json({ 
      success: true, 
      user,
      message: 'User created/updated successfully' 
    });
  } catch (error) {
    console.error('POST /api/users error:', error);
    res.status(500).json({ 
      error: 'Failed to create/update user',
      message: error.message 
    });
  }
});

// Quiz session routes
app.post('/api/quiz-sessions', async (req, res) => {
  try {
    const { userId, roundNumber } = req.body;
    
    if (!userId || !roundNumber) {
      return res.status(400).json({ 
        error: 'User ID and round number are required' 
      });
    }

    const session = await UserService.createQuizSession(userId, roundNumber);
    
    res.status(201).json({ 
      success: true, 
      session,
      message: 'Quiz session created successfully' 
    });
  } catch (error) {
    console.error('POST /api/quiz-sessions error:', error);
    res.status(500).json({ 
      error: 'Failed to create quiz session',
      message: error.message 
    });
  }
});

// Update quiz session
app.put('/api/quiz-sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const session = await UserService.updateQuizSession(id, updates);
    
    res.json({ 
      success: true, 
      session,
      message: 'Quiz session updated successfully' 
    });
  } catch (error) {
    console.error('PUT /api/quiz-sessions error:', error);
    res.status(500).json({ 
      error: 'Failed to update quiz session',
      message: error.message 
    });
  }
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const roundNumber = req.query.round ? parseInt(req.query.round) : null;
    
    const leaderboard = await UserService.getLeaderboard(roundNumber, limit);
    
    res.json({ 
      success: true, 
      leaderboard,
      roundNumber,
      message: roundNumber ? `Round ${roundNumber} leaderboard fetched successfully` : 'Overall leaderboard fetched successfully'
    });
  } catch (error) {
    console.error('GET /api/leaderboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      message: error.message 
    });
  }
});

// Get user progress
app.get('/api/users/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await UserService.getUserProgress(id);
    
    res.json({ 
      success: true, 
      progress,
      message: 'User progress fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/users/:id/progress error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user progress',
      message: error.message 
    });
  }
});

// Check round access
app.get('/api/users/:id/rounds/:round/access', async (req, res) => {
  try {
    const { id, round } = req.params;
    const roundNumber = parseInt(round);
    
    if (roundNumber < 1 || roundNumber > 3) {
      return res.status(400).json({ 
        error: 'Invalid round number. Must be 1, 2, or 3' 
      });
    }
    
    const canAccess = await UserService.canAccessRound(id, roundNumber);
    
    res.json({ 
      success: true, 
      canAccess,
      roundNumber,
      message: canAccess ? `User can access Round ${roundNumber}` : `User cannot access Round ${roundNumber}` 
    });
  } catch (error) {
    console.error('GET /api/users/:id/rounds/:round/access error:', error);
    res.status(500).json({ 
      error: 'Failed to check round access',
      message: error.message 
    });
  }
});

// Get questions for a specific round
app.get('/api/rounds/:round/questions', async (req, res) => {
  try {
    const { round } = req.params;
    const roundNumber = parseInt(round);
    
    if (roundNumber < 1 || roundNumber > 3) {
      return res.status(400).json({ 
        error: 'Invalid round number. Must be 1, 2, or 3' 
      });
    }
    
    const questions = await UserService.getRoundQuestions(roundNumber);
    
    res.json({ 
      success: true, 
      questions,
      roundNumber,
      message: `Round ${roundNumber} questions fetched successfully` 
    });
  } catch (error) {
    console.error('GET /api/rounds/:round/questions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch round questions',
      message: error.message 
    });
  }
});

// Admin question management endpoints

// Get all questions for admin (with pagination)
app.get('/api/admin/questions', async (req, res) => {
  try {
    const roundNumber = req.query.round ? parseInt(req.query.round) : null;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    let query = supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (roundNumber) {
      query = query.eq('round_number', roundNumber);
    }
    
    const { data: questions, error } = await query;
    
    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error('Failed to fetch questions');
    }
    
    res.json({ 
      success: true, 
      questions: questions || [],
      message: 'Questions fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/admin/questions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch questions',
      message: error.message 
    });
  }
});

// Add new question
app.post('/api/admin/questions', async (req, res) => {
  try {
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      round_number,
      category,
      points,
      difficulty
    } = req.body;
    
    // Validation
    if (!question_text || !option_a || !option_b || !option_c || !option_d || 
        !correct_answer || !round_number || !category || !points) {
      return res.status(400).json({ 
        error: 'All required fields must be provided' 
      });
    }
    
    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({ 
        error: 'Correct answer must be A, B, C, or D' 
      });
    }
    
    if (![1, 2, 3].includes(round_number)) {
      return res.status(400).json({ 
        error: 'Round number must be 1, 2, or 3' 
      });
    }
    
    const questionData = {
      question_text: question_text.trim(),
      option_a: option_a.trim(),
      option_b: option_b.trim(),
      option_c: option_c.trim(),
      option_d: option_d.trim(),
      correct_answer,
      round_number,
      category: category.trim(),
      points,
      difficulty: difficulty || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: question, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating question:', error);
      throw new Error('Failed to create question');
    }
    
    res.status(201).json({ 
      success: true, 
      question,
      message: 'Question created successfully' 
    });
  } catch (error) {
    console.error('POST /api/admin/questions error:', error);
    res.status(500).json({ 
      error: 'Failed to create question',
      message: error.message 
    });
  }
});

// Update question
app.put('/api/admin/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      round_number,
      category,
      points,
      difficulty
    } = req.body;
    
    // Validation
    if (!question_text || !option_a || !option_b || !option_c || !option_d || 
        !correct_answer || !round_number || !category || !points) {
      return res.status(400).json({ 
        error: 'All required fields must be provided' 
      });
    }
    
    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({ 
        error: 'Correct answer must be A, B, C, or D' 
      });
    }
    
    if (![1, 2, 3].includes(round_number)) {
      return res.status(400).json({ 
        error: 'Round number must be 1, 2, or 3' 
      });
    }
    
    const updateData = {
      question_text: question_text.trim(),
      option_a: option_a.trim(),
      option_b: option_b.trim(),
      option_c: option_c.trim(),
      option_d: option_d.trim(),
      correct_answer,
      round_number,
      category: category.trim(),
      points,
      difficulty: difficulty || 'medium',
      updated_at: new Date().toISOString()
    };
    
    const { data: question, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating question:', error);
      throw new Error('Failed to update question');
    }
    
    if (!question) {
      return res.status(404).json({ 
        error: 'Question not found' 
      });
    }
    
    res.json({ 
      success: true, 
      question,
      message: 'Question updated successfully' 
    });
  } catch (error) {
    console.error('PUT /api/admin/questions/:id error:', error);
    res.status(500).json({ 
      error: 'Failed to update question',
      message: error.message 
    });
  }
});

// Delete question
app.delete('/api/admin/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if question exists and get its details
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingQuestion) {
      return res.status(404).json({ 
        error: 'Question not found' 
      });
    }
    
    // Check if question is being used in any quiz sessions
    const { data: answers, error: answersError } = await supabase
      .from('quiz_answers')
      .select('id')
      .eq('question_id', id)
      .limit(1);
    
    if (answersError) {
      console.error('Error checking question usage:', answersError);
    }
    
    if (answers && answers.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete question that has been answered in quiz sessions' 
      });
    }
    
    // Delete the question
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      throw new Error('Failed to delete question');
    }
    
    res.json({ 
      success: true, 
      message: 'Question deleted successfully' 
    });
  } catch (error) {
    console.error('DELETE /api/admin/questions/:id error:', error);
    res.status(500).json({ 
      error: 'Failed to delete question',
      message: error.message 
    });
  }
});

// Get single question by ID
app.get('/api/admin/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !question) {
      return res.status(404).json({ 
        error: 'Question not found' 
      });
    }
    
    res.json({ 
      success: true, 
      question,
      message: 'Question fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/admin/questions/:id error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch question',
      message: error.message 
    });
  }
});
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPassword) {
      res.json({ 
        success: true, 
        message: 'Admin authenticated successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('POST /api/admin/login error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message 
    });
  }
});

// Admin dashboard stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Get total users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
    
    // Get total sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('quiz_sessions')
      .select('id, round_number, status, score', { count: 'exact' })
    
    if (usersError || sessionsError) {
      throw new Error('Failed to fetch stats')
    }

    // Calculate round completions
    const completedSessions = sessions?.filter(s => s.status === 'completed') || []
    const round1Completed = completedSessions.filter(s => s.round_number === 1).length
    const round2Completed = completedSessions.filter(s => s.round_number === 2).length
    const round3Completed = completedSessions.filter(s => s.round_number === 3).length
    
    // Calculate average score
    const scoresWithValues = completedSessions.filter(s => s.score !== null && s.score !== undefined)
    const avgScore = scoresWithValues.length > 0 
      ? Math.round(scoresWithValues.reduce((sum, s) => sum + s.score, 0) / scoresWithValues.length)
      : 0

    const stats = {
      totalUsers: users?.length || 0,
      totalSessions: sessions?.length || 0,
      round1Completed,
      round2Completed,
      round3Completed,
      avgScore
    }

    res.json({ 
      success: true, 
      stats,
      message: 'Admin stats fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin stats',
      message: error.message 
    });
  }
});

// Get user stats
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await UserService.getUserStats(id);
    
    res.json({ 
      success: true, 
      stats,
      message: 'User stats fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/users/:id/stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user stats',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 InterQuest API Server is running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   POST /api/users - Create/update user`);
  console.log(`   POST /api/quiz-sessions - Create quiz session`);
  console.log(`   PUT /api/quiz-sessions/:id - Update quiz session`);
  console.log(`   GET /api/leaderboard?round=1&limit=10 - Get leaderboard (overall or by round)`);
  console.log(`   GET /api/users/:id/stats - Get user stats`);
  console.log(`   GET /api/users/:id/progress - Get user progress across rounds`);
  console.log(`   GET /api/users/:id/rounds/:round/access - Check round access`);
  console.log(`   GET /api/rounds/:round/questions - Get questions for specific round`);
  console.log(`🛡️  Admin endpoints:`);
  console.log(`   POST /api/admin/login - Admin authentication`);
  console.log(`   GET /api/admin/stats - Admin dashboard statistics`);
  console.log(`   GET /api/admin/questions - Get all questions (with filtering)`);
  console.log(`   POST /api/admin/questions - Add new question`);
  console.log(`   PUT /api/admin/questions/:id - Update question`);
  console.log(`   DELETE /api/admin/questions/:id - Delete question`);
  console.log(`   GET /api/admin/questions/:id - Get single question`);
  console.log(`🎯 Supported rounds: 1, 2, 3`);
  console.log(`🔐 Admin credentials stored in environment variables`);
});