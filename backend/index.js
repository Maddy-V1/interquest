const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const UserService = require('./services/userService');
const { supabase } = require('./config/supabase');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
  credentials: true
}));

// Rapid Fire Game State
let gameState = {
  status: 'waiting', // 'waiting', 'active', 'finished'
  participants: new Map(),
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 10,
  questionStartTime: null,
  questionAnswers: new Map(),
  timer: null,
  questionWinner: null,
  questionLocked: false
};

// Load Round 3 questions and approved participants
let round3Questions = [];
let approvedParticipants = [];

const loadQuestions = async () => {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('round_number', 3)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading questions:', error);
      return;
    }
    
    round3Questions = questions || [];
    gameState.totalQuestions = round3Questions.length;
    console.log(`Loaded ${round3Questions.length} Round 3 questions`);
  } catch (error) {
    console.error('Error loading questions:', error);
  }
};

const loadApprovedParticipants = async () => {
  try {
    const { data: participants, error } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('round3_approved', true);
    
    if (error) {
      console.error('Error loading approved participants:', error);
      return;
    }
    
    approvedParticipants = participants || [];
    console.log(`Loaded ${approvedParticipants.length} approved Round 3 participants`);
  } catch (error) {
    console.error('Error loading approved participants:', error);
  }
};

// Rapid Fire Game Functions
const startGame = () => {
  if (gameState.status !== 'waiting' || round3Questions.length === 0) return;
  
  gameState.status = 'active';
  gameState.questionNumber = 0;
  
  // Reset all participant scores
  gameState.participants.forEach(participant => {
    participant.score = 0;
  });
  
  console.log('Game started with', gameState.participants.size, 'participants');
  nextQuestion();
};

const nextQuestion = () => {
  if (gameState.questionNumber >= round3Questions.length) {
    endGame();
    return;
  }
  
  const question = round3Questions[gameState.questionNumber];
  gameState.currentQuestion = question;
  gameState.questionNumber++;
  gameState.questionStartTime = Date.now();
  gameState.questionAnswers.clear();
  gameState.questionWinner = null;
  gameState.questionLocked = false;
  
  // Broadcast new question to all participants
  io.emit('newQuestion', {
    id: question.id,
    question_text: question.question_text,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d,
    points: question.points,
    questionNumber: gameState.questionNumber,
    totalQuestions: gameState.totalQuestions
  });
  
  // Start 15-second timer for rapid fire
  let timeLeft = 15;
  io.emit('timeUpdate', timeLeft);
  
  gameState.timer = setInterval(() => {
    timeLeft--;
    io.emit('timeUpdate', timeLeft);
    
    if (timeLeft <= 0 || gameState.questionLocked) {
      clearInterval(gameState.timer);
      if (!gameState.questionLocked) {
        processQuestionResults();
      }
    }
  }, 1000);
  
  console.log(`Question ${gameState.questionNumber}: ${question.question_text}`);
};

const processQuestionResults = () => {
  const question = gameState.currentQuestion;
  if (!question) return;
  
  // Sort answers by timestamp (fastest first)
  const sortedAnswers = Array.from(gameState.questionAnswers.values())
    .sort((a, b) => a.timestamp - b.timestamp);
  
  let winner = null;
  let winnerName = '';
  
  // Find the first correct answer
  for (const answer of sortedAnswers) {
    if (answer.answer === question.correct_answer) {
      winner = answer.userId;
      const participant = gameState.participants.get(answer.userId);
      if (participant) {
        participant.score += question.points;
        winnerName = `${participant.firstName} ${participant.lastName}`;
      }
      break;
    }
  }
  
  // Broadcast question result
  const result = {
    questionId: question.id,
    winnerId: winner,
    winnerName: winnerName,
    correctAnswer: question.correct_answer,
    participants: sortedAnswers.map(a => ({
      userId: a.userId,
      answer: a.answer,
      timestamp: a.timestamp,
      participantName: gameState.participants.get(a.userId) ? 
        `${gameState.participants.get(a.userId).firstName} ${gameState.participants.get(a.userId).lastName}` : 'Unknown'
    }))
  };
  
  io.emit('questionResult', result);
  io.emit('participantsUpdate', Array.from(gameState.participants.values()));
  
  console.log(`Question result: Winner = ${winnerName || 'None'}, Correct = ${question.correct_answer}`);
  
  // Save result to Supabase for persistence
  saveQuestionResult(question.id, winner, sortedAnswers);
  
  // Move to next question after 4 seconds
  setTimeout(() => {
    nextQuestion();
  }, 4000);
};

const saveQuestionResult = async (questionId, winnerId, answers) => {
  try {
    // Save the rapid fire question result
    const { error } = await supabase
      .from('rapid_fire_results')
      .insert({
        question_id: questionId,
        winner_id: winnerId,
        answers: answers,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error saving question result:', error);
    }
  } catch (error) {
    console.error('Error saving question result:', error);
  }
};

const endGame = () => {
  gameState.status = 'finished';
  
  const finalResults = Array.from(gameState.participants.values())
    .sort((a, b) => b.score - a.score);
  
  io.emit('gameFinished', finalResults);
  
  console.log('Game finished. Final results:', finalResults);
  
  // Reset game state after 10 seconds
  setTimeout(() => {
    gameState.status = 'waiting';
    gameState.questionNumber = 0;
    gameState.currentQuestion = null;
    gameState.participants.clear();
  }, 10000);
};

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
    
    // Handle Round 3 using the new view
    if (roundNumber === 3) {
      const { data: leaderboard, error } = await supabase
        .from('round3_leaderboard_view')
        .select('*')
        .limit(limit);
      
      if (error) {
        console.error('Error fetching round 3 leaderboard:', error);
        throw new Error('Failed to fetch round 3 leaderboard');
      }
      
      return res.json({ 
        success: true, 
        leaderboard: leaderboard || [],
        roundNumber,
        message: `Round ${roundNumber} leaderboard fetched successfully`
      });
    }
    
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

// Get round-specific leaderboard using views
app.get('/api/leaderboard/round/:roundNumber', async (req, res) => {
  try {
    const { roundNumber } = req.params;
    const { limit = 50 } = req.query;
    
    let viewName;
    if (roundNumber === '1') {
      viewName = 'overall_leaderboard_view';
    } else if (roundNumber === '2') {
      viewName = 'round_leaderboard_view';
    } else if (roundNumber === '3') {
      // For Round 3, try the view first, then fallback to direct query
      try {
        const { data: leaderboard, error } = await supabase
          .from('round3_leaderboard_view')
          .select('*')
          .limit(parseInt(limit));
        
        if (!error) {
          return res.json({ 
            success: true, 
            leaderboard: leaderboard || [],
            message: `Round ${roundNumber} leaderboard fetched successfully` 
          });
        }
        
        // If view doesn't exist, use direct query
        console.log('Round 3 view not found, using direct query');
        const { data: directLeaderboard, error: directError } = await supabase
          .from('users')
          .select(`
            id as user_id,
            first_name,
            last_name,
            round3_approved
          `)
          .eq('round3_approved', true);
        
        if (directError) {
          throw directError;
        }
        
        // Transform to match expected format
        const transformedLeaderboard = (directLeaderboard || []).map((user, index) => ({
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name} ${user.last_name}`,
          total_score: 0,
          total_questions: 0,
          correct_answers: 0,
          completed_at: null,
          status: 'approved',
          rank: index + 1
        }));
        
        return res.json({ 
          success: true, 
          leaderboard: transformedLeaderboard,
          message: `Round ${roundNumber} leaderboard fetched successfully (direct query)` 
        });
        
      } catch (round3Error) {
        console.error('Error with Round 3 leaderboard:', round3Error);
        return res.json({ 
          success: true, 
          leaderboard: [],
          message: `Round ${roundNumber} leaderboard is empty` 
        });
      }
    } else {
      return res.status(400).json({ 
        error: 'Invalid round number. Use 1, 2, or 3.' 
      });
    }
    
    const { data: leaderboard, error } = await supabase
      .from(viewName)
      .select('*')
      .limit(parseInt(limit));
    
    if (error) {
      console.error('Error fetching round leaderboard:', error);
      console.error('View name:', viewName);
      console.error('Error details:', error);
      
      // If it's Round 3 and the view doesn't exist, return empty array
      if (roundNumber === '3' && error.code === 'PGRST106') {
        return res.json({ 
          success: true, 
          leaderboard: [],
          message: `Round ${roundNumber} leaderboard is empty (view not found)` 
        });
      }
      
      throw new Error('Failed to fetch round leaderboard');
    }
    
    res.json({ 
      success: true, 
      leaderboard: leaderboard || [],
      message: `Round ${roundNumber} leaderboard fetched successfully` 
    });
  } catch (error) {
    console.error('GET /api/leaderboard/round/:roundNumber error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch round leaderboard',
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

// Save quiz answer
app.post('/api/quiz-answers', async (req, res) => {
  try {
    const { session_id, question_id, selected_answer, correct_answer, is_correct } = req.body;
    
    if (!session_id || !question_id || !selected_answer || !correct_answer) {
      return res.status(400).json({ 
        error: 'Session ID, question ID, selected answer, and correct answer are required' 
      });
    }

    const answerData = {
      session_id,
      question_id,
      selected_answer,
      correct_answer,
      is_correct: is_correct || false,
      answered_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    const { data: answer, error } = await supabase
      .from('quiz_answers')
      .insert([answerData])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving quiz answer:', error);
      throw new Error('Failed to save quiz answer');
    }
    
    res.status(201).json({ 
      success: true, 
      answer,
      message: 'Quiz answer saved successfully' 
    });
  } catch (error) {
    console.error('POST /api/quiz-answers error:', error);
    res.status(500).json({ 
      error: 'Failed to save quiz answer',
      message: error.message 
    });
  }
});

// Get all users for admin round approval
app.get('/api/admin/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
    
    res.json({ 
      success: true, 
      users: users || [],
      message: 'Users fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: error.message 
    });
  }
});

// Update user round approvals
app.put('/api/admin/users/:id/round-approval', async (req, res) => {
  try {
    const { id } = req.params;
    const { round2_approved, round3_approved } = req.body;
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (round2_approved !== undefined) {
      updateData.round2_approved = round2_approved;
    }
    if (round3_approved !== undefined) {
      updateData.round3_approved = round3_approved;
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating user round approval:', error);
      throw new Error('Failed to update user round approval');
    }
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user,
      message: 'User round approval updated successfully' 
    });
  } catch (error) {
    console.error('PUT /api/admin/users/:id/round-approval error:', error);
    res.status(500).json({ 
      error: 'Failed to update user round approval',
      message: error.message 
    });
  }
});

// Bulk update round approvals
app.post('/api/admin/round-approvals', async (req, res) => {
  try {
    const { round2_approvals, round3_approvals } = req.body;
    
    const updates = [];
    
    // Process Round 2 approvals
    if (round2_approvals && Array.isArray(round2_approvals)) {
      for (const approval of round2_approvals) {
        updates.push(
          supabase
            .from('users')
            .update({ 
              round2_approved: approval.approved,
              updated_at: new Date().toISOString()
            })
            .eq('id', approval.userId)
        );
      }
    }
    
    // Process Round 3 approvals
    if (round3_approvals && Array.isArray(round3_approvals)) {
      for (const approval of round3_approvals) {
        updates.push(
          supabase
            .from('users')
            .update({ 
              round3_approved: approval.approved,
              updated_at: new Date().toISOString()
            })
            .eq('id', approval.userId)
        );
      }
    }
    
    // Execute all updates
    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Some updates failed:', errors);
      throw new Error('Some updates failed');
    }
    
    res.json({ 
      success: true, 
      message: 'Round approvals updated successfully' 
    });
  } catch (error) {
    console.error('POST /api/admin/round-approvals error:', error);
    res.status(500).json({ 
      error: 'Failed to update round approvals',
      message: error.message 
    });
  }
});

// Mark Round 3 winner
app.post('/api/admin/mark-winner', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    // First, clear all existing winners
    await supabase
      .from('users')
      .update({ winner: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all users

    // Mark the specified user as winner
    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        winner: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Error marking winner:', error);
      throw new Error('Failed to mark winner');
    }
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user,
      message: 'Winner marked successfully' 
    });
  } catch (error) {
    console.error('POST /api/admin/mark-winner error:', error);
    res.status(500).json({ 
      error: 'Failed to mark winner',
      message: error.message 
    });
  }
});

// Round control endpoints
app.get('/api/admin/round-status/:roundNumber', async (req, res) => {
  try {
    const { roundNumber } = req.params;
    
    console.log(`Fetching status for Round ${roundNumber}`);
    
    // Check if round_config table exists
    const { data: roundConfig, error } = await supabase
      .from('round_config')
      .select('*')
      .eq('round_number', parseInt(roundNumber))
      .single();
    
    if (error) {
      console.log('Round config error:', error);
      
      if (error.code === 'PGRST106') {
        // Table doesn't exist
        return res.json({ 
          success: true, 
          status: 'stopped',
          message: 'Round config table does not exist, defaulting to stopped' 
        });
      } else if (error.code === 'PGRST116') {
        // No row found for this round
        return res.json({ 
          success: true, 
          status: 'stopped',
          message: 'No config found for this round, defaulting to stopped' 
        });
      } else {
        // Other error
        console.error('Error fetching round status:', error);
        return res.json({ 
          success: true, 
          status: 'stopped',
          message: 'Error fetching status, defaulting to stopped' 
        });
      }
    }
    
    console.log(`Round ${roundNumber} status: ${roundConfig?.status || 'stopped'}`);
    
    res.json({ 
      success: true, 
      status: roundConfig?.status || 'stopped',
      message: 'Round status fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/admin/round-status error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch round status',
      message: error.message 
    });
  }
});

app.post('/api/admin/round-control/:roundNumber', async (req, res) => {
  try {
    const { roundNumber } = req.params;
    const { status } = req.body;
    
    console.log(`Round control request: Round ${roundNumber} -> ${status}`);
    
    if (!['active', 'stopped'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid status. Use "active" or "stopped".' 
      });
    }
    
    // Check if round_config table exists, if not create it
    const { error: tableError } = await supabase
      .from('round_config')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === 'PGRST106') {
      console.log('round_config table does not exist, creating it...');
      return res.status(500).json({ 
        success: false,
        error: 'Database table round_config does not exist. Please run the database update script.' 
      });
    }
    
    // First try to update existing record
    const { data: updateResult, error: updateError } = await supabase
      .from('round_config')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('round_number', parseInt(roundNumber))
      .select()
      .single();
    
    let roundConfig = updateResult;
    let error = updateError;
    
    // If no record exists, insert a new one
    if (updateError && updateError.code === 'PGRST116') {
      console.log(`No existing config for round ${roundNumber}, creating new one`);
      const { data: insertResult, error: insertError } = await supabase
        .from('round_config')
        .insert({
          round_number: parseInt(roundNumber),
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      roundConfig = insertResult;
      error = insertError;
    }
    
    if (error) {
      console.error('Error updating round status:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Database error: ' + error.message 
      });
    }
    
    console.log(`Round ${roundNumber} status updated to ${status}`);
    
    res.json({ 
      success: true, 
      roundConfig,
      message: `Round ${roundNumber} ${status} successfully` 
    });
  } catch (error) {
    console.error('POST /api/admin/round-control error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update round status',
      message: error.message 
    });
  }
});

// Initialize database tables if they don't exist
app.post('/api/admin/init-database', async (req, res) => {
  try {
    console.log('Initializing database tables...');
    
    // Check if records already exist
    const { data: existingRecords, error: checkError } = await supabase
      .from('round_config')
      .select('round_number');
    
    if (checkError && checkError.code !== 'PGRST106') {
      console.error('Error checking existing records:', checkError);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to check existing database records',
        message: checkError.message 
      });
    }
    
    // If table doesn't exist (PGRST106) or no records exist
    if (checkError?.code === 'PGRST106' || !existingRecords || existingRecords.length === 0) {
      console.log('Creating round_config records...');
      
      // Insert default records one by one to avoid conflicts
      const rounds = [1, 2, 3];
      for (const roundNum of rounds) {
        const { error: insertError } = await supabase
          .from('round_config')
          .insert({
            round_number: roundNum,
            status: 'stopped',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError && !insertError.message.includes('duplicate key')) {
          console.error(`Error inserting round ${roundNum}:`, insertError);
        }
      }
    } else {
      console.log('Round config records already exist, skipping initialization');
    }
    
    // Verify final state
    const { data: finalRecords } = await supabase
      .from('round_config')
      .select('round_number, status')
      .order('round_number');
    
    res.json({ 
      success: true, 
      message: 'Database initialized successfully',
      records: finalRecords || []
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to initialize database',
      message: error.message 
    });
  }
});

// Debug endpoint to check round config state
app.get('/api/debug/round-config', async (req, res) => {
  try {
    const { data: roundConfigs, error } = await supabase
      .from('round_config')
      .select('*')
      .order('round_number');
    
    if (error) {
      console.error('Error fetching round configs:', error);
      return res.json({ 
        success: false,
        error: error.message,
        tableExists: false
      });
    }
    
    res.json({ 
      success: true, 
      roundConfigs: roundConfigs || [],
      count: roundConfigs?.length || 0,
      tableExists: true,
      message: 'Round configurations fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/debug/round-config error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch round configurations',
      message: error.message 
    });
  }
});

// Debug endpoint to check Round 3 approved users
app.get('/api/debug/round3-users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, round3_approved')
      .eq('round3_approved', true);
    
    if (error) {
      console.error('Error fetching Round 3 users:', error);
      throw new Error('Failed to fetch Round 3 users');
    }
    
    res.json({ 
      success: true, 
      users: users || [],
      count: users?.length || 0,
      message: 'Round 3 approved users fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/debug/round3-users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Round 3 users',
      message: error.message 
    });
  }
});

// Get user data
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user data');
    }
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user,
      message: 'User data fetched successfully' 
    });
  } catch (error) {
    console.error('GET /api/users/:userId error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user data',
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

// Socket.IO connection handling for Rapid Fire
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinRapidFire', (userData) => {
    const { userId, firstName, lastName } = userData;
    
    // Check if user is approved for Round 3
    const isApproved = approvedParticipants.some(p => p.id === userId);
    if (!isApproved) {
      socket.emit('error', { message: 'You are not approved for Round 3' });
      return;
    }
    
    // Add participant to game with participant number
    const participantNumber = gameState.participants.size + 1;
    gameState.participants.set(userId, {
      userId,
      firstName,
      lastName,
      score: 0,
      isOnline: true,
      socketId: socket.id,
      participantNumber
    });
    
    socket.userId = userId;
    
    // Send current game state to the new participant
    socket.emit('gameState', {
      status: gameState.status,
      participants: Array.from(gameState.participants.values()),
      questionNumber: gameState.questionNumber,
      totalQuestions: gameState.totalQuestions,
      approvedParticipants: approvedParticipants.map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`
      }))
    });
    
    // If game is active and there's a current question, send it
    if (gameState.status === 'active' && gameState.currentQuestion) {
      socket.emit('newQuestion', {
        id: gameState.currentQuestion.id,
        question_text: gameState.currentQuestion.question_text,
        option_a: gameState.currentQuestion.option_a,
        option_b: gameState.currentQuestion.option_b,
        option_c: gameState.currentQuestion.option_c,
        option_d: gameState.currentQuestion.option_d,
        points: gameState.currentQuestion.points,
        questionNumber: gameState.questionNumber,
        totalQuestions: gameState.totalQuestions
      });
    }
    
    // Broadcast updated participants list
    io.emit('participantsUpdate', Array.from(gameState.participants.values()));
    
    console.log(`${firstName} ${lastName} (Participant #${participantNumber}) joined the rapid fire game`);
  });
  
  socket.on('submitAnswer', (answerData) => {
    const { questionId, answer, timestamp } = answerData;
    const userId = socket.userId;
    
    if (!userId || !gameState.currentQuestion || gameState.currentQuestion.id !== questionId || gameState.questionLocked) {
      return;
    }
    
    // Store the answer if not already submitted by this user
    if (!gameState.questionAnswers.has(userId)) {
      gameState.questionAnswers.set(userId, {
        userId,
        answer,
        timestamp,
        socketId: socket.id
      });
      
      const participant = gameState.participants.get(userId);
      console.log(`Answer received from ${participant?.firstName} ${participant?.lastName}: ${answer} at ${timestamp}`);
      
      // Check if this is the correct answer and first correct answer
      if (answer === gameState.currentQuestion.correct_answer && !gameState.questionWinner) {
        gameState.questionWinner = userId;
        gameState.questionLocked = true;
        
        // Award points immediately
        if (participant) {
          participant.score += gameState.currentQuestion.points;
        }
        
        // Clear timer and process results immediately
        if (gameState.timer) {
          clearInterval(gameState.timer);
        }
        
        // Notify all participants that question is locked
        io.emit('questionLocked', {
          winnerId: userId,
          winnerName: `${participant?.firstName} ${participant?.lastName}`,
          correctAnswer: answer
        });
        
        // Process results after a short delay
        setTimeout(() => {
          processQuestionResults();
        }, 2000);
      }
    }
  });
  
  socket.on('disconnect', () => {
    const userId = socket.userId;
    if (userId && gameState.participants.has(userId)) {
      gameState.participants.get(userId).isOnline = false;
      io.emit('participantsUpdate', Array.from(gameState.participants.values()));
      console.log(`User ${userId} disconnected`);
    }
  });
});

// Rapid Fire Admin endpoints
app.post('/api/admin/start-rapid-fire', async (req, res) => {
  try {
    // Reload approved participants before starting
    await loadApprovedParticipants();
    
    if (approvedParticipants.length === 0) {
      return res.status(400).json({ 
        error: 'Cannot start game', 
        reason: 'No approved participants for Round 3'
      });
    }
    
    if (gameState.status === 'waiting') {
      // Update game status in Supabase
      await supabase
        .from('game_state')
        .upsert({
          id: 'rapid_fire',
          status: 'active',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      startGame();
      
      // Notify all approved users via Supabase realtime
      await supabase
        .from('notifications')
        .insert({
          type: 'rapid_fire_started',
          message: 'Round 3 Rapid Fire has started! Join now!',
          target_users: approvedParticipants.map(p => p.id),
          created_at: new Date().toISOString()
        });
      
      res.json({ success: true, message: 'Rapid fire game started!' });
    } else {
      res.status(400).json({ 
        error: 'Cannot start game', 
        reason: 'Game already in progress'
      });
    }
  } catch (error) {
    console.error('Error starting rapid fire:', error);
    res.status(500).json({ 
      error: 'Failed to start rapid fire game',
      message: error.message 
    });
  }
});

app.get('/api/admin/rapid-fire-status', (req, res) => {
  res.json({
    success: true,
    gameState: {
      status: gameState.status,
      participantCount: gameState.participants.size,
      questionNumber: gameState.questionNumber,
      totalQuestions: gameState.totalQuestions
    }
  });
});

// Initialize rapid fire data on server start
const initializeRapidFire = async () => {
  await loadQuestions();
  await loadApprovedParticipants();
  
  // Set up Supabase realtime subscription for game state changes
  const gameStateChannel = supabase
    .channel('game_state_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'game_state' },
      (payload) => {
        console.log('Game state changed:', payload);
        if (payload.new?.status === 'stopped') {
          // Reset game if admin stops it
          gameState.status = 'waiting';
          gameState.participants.clear();
          io.emit('gameReset');
        }
      }
    )
    .subscribe();
};

// Start server with Socket.IO
server.listen(PORT, async () => {
  console.log(`🚀 InterQuest Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO enabled for rapid fire functionality`);
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
  console.log(`⚡ Rapid Fire endpoints:`);
  console.log(`   POST /api/admin/start-rapid-fire - Start rapid fire game`);
  console.log(`   GET /api/admin/rapid-fire-status - Get rapid fire status`);
  console.log(`🎯 Supported rounds: 1, 2, 3`);
  console.log(`🔐 Admin credentials stored in environment variables`);
  console.log(`⚠️  Note: Backend running on port ${PORT} to avoid conflicts`);
  
  // Initialize rapid fire functionality
  await initializeRapidFire();
  console.log(`📊 Loaded ${round3Questions.length} questions for Round 3`);
  console.log(`👥 Loaded ${approvedParticipants.length} approved participants`);
});