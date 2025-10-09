# InterQuest - Supabase Integration Setup

## 🚀 Quick Setup Guide

### 1. Supabase Project Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)
2. **Run the database schema**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Execute the SQL commands

### 2. Environment Configuration

#### Frontend (.env)
```bash
# Copy your Supabase project URL and anon key from Settings > API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Backend (.env)
```bash
# Copy your Supabase project URL and service role key from Settings > API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=3000
```

### 3. Installation & Running

#### Backend
```bash
cd backend
npm install
npm start
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture Overview

### Database Schema

#### Tables:
- **users** - Store user information (first_name, last_name)
- **quiz_sessions** - Track quiz attempts and scores for each round
- **quiz_answers** - Detailed answer tracking
- **questions** - Quiz questions organized by rounds (1, 2, 3)

#### Views:
- **leaderboard_view** - Individual session rankings
- **overall_leaderboard_view** - Combined scores across all rounds
- **round_leaderboard_view** - Round-specific rankings

#### Features:
- ✅ **3 Quiz Rounds Support** (Round 1, 2, 3)
- ✅ **Progressive Round Access** (must complete previous round)
- ✅ **Multiple Leaderboards** (overall + per round)
- ✅ **Automatic user creation/update**
- ✅ **Quiz session tracking**
- ✅ **Row Level Security (RLS)**
- ✅ **Performance indexes**
- ✅ **Sample questions for all rounds**

### API Endpoints

#### Backend (Port 3000)
- `POST /api/users` - Create/update user
- `POST /api/quiz-sessions` - Create quiz session
- `PUT /api/quiz-sessions/:id` - Update quiz session
- `GET /api/leaderboard?round=1&limit=10` - Get leaderboard (overall or by round)
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:id/progress` - Get user progress across rounds
- `GET /api/users/:id/rounds/:round/access` - Check round access
- `GET /api/rounds/:round/questions` - Get questions for specific round

### Frontend Services

#### UserService (Frontend)
- `createOrUpdateUser()` - Save user to database
- `createQuizSession()` - Start new quiz session
- `updateQuizSession()` - Update session progress
- `getLeaderboard(roundNumber?, limit)` - Get leaderboard data
- `getUserProgress(userId)` - Get user's progress across rounds
- `canAccessRound(userId, roundNumber)` - Check round access eligibility

## 🔄 User Flow with Database

1. **Login** - User enters name → Saved to `users` table
2. **Round Selection** - Check round access via `canAccessRound()`
3. **Quiz Session** - Session created in `quiz_sessions` table for specific round
4. **Quiz Progress** - Answers saved to `quiz_answers` table
5. **Completion** - Session updated with final score
6. **Round Progression** - Access to next round unlocked
7. **Leaderboards** - Data displayed from multiple leaderboard views

### Round Access Rules:
- **Round 1**: Always accessible to all users
- **Round 2**: Requires completion of Round 1
- **Round 3**: Requires completion of Round 2

## 🛡️ Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Public policies** for quiz functionality
- **Environment variables** for sensitive keys
- **CORS protection** for API endpoints
- **Input validation** on both frontend and backend

## 📊 Sample Data

The schema includes sample questions for all 3 rounds:

### Round 1 (General Knowledge - 100 points each):
- Geography: Capital of France
- Science: Red Planet identification
- Art: Mona Lisa painter
- Geography: Largest ocean
- History: World War II end date

### Round 2 (Science & Technology - 150 points each):
- Science: Chemical symbol for gold
- Science: Theory of relativity developer
- Technology: CPU definition
- Science: Speed of light
- Technology: Python programming language creator

### Round 3 (Advanced Knowledge - 200 points each):
- Science: Smallest unit of matter
- Literature: Author of "1984"
- Mathematics: Mathematical constant e
- History: Lighthouse of Alexandria
- Science: Photosynthesis definition

## 🔧 Customization

### Adding Questions
```sql
-- Add question to Round 2
INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer, round_number, category, points)
VALUES ('Your question?', 'Option A', 'Option B', 'Option C', 'Option D', 'C', 2, 'category', 150);
```

### Viewing Leaderboards
```sql
-- Overall leaderboard (sum of all rounds)
SELECT * FROM overall_leaderboard_view LIMIT 10;

-- Round-specific leaderboard
SELECT * FROM round_leaderboard_view WHERE round_number = 1 LIMIT 10;

-- Individual session leaderboard
SELECT * FROM leaderboard_view WHERE round_number = 2 LIMIT 10;
```

### Check User Progress
```sql
-- Get user's completed rounds
SELECT DISTINCT round_number 
FROM quiz_sessions 
WHERE user_id = 'user-uuid' AND status = 'completed'
ORDER BY round_number;
```

## 🐛 Troubleshooting

### Common Issues:

1. **Environment variables not loading**
   - Restart development servers after adding .env files
   - Check file names (.env, not .env.example)

2. **CORS errors**
   - Verify frontend URL in backend CORS configuration
   - Check if backend is running on correct port

3. **Database connection issues**
   - Verify Supabase URL and keys in .env files
   - Check Supabase project status

4. **RLS policy errors**
   - Ensure all policies are created as shown in schema.sql
   - Check Supabase logs for policy violations

## 🚀 Production Deployment

### Environment Variables for Production:
- Update frontend URLs in backend CORS settings
- Use production Supabase keys
- Set appropriate row-level security policies
- Enable Supabase backups

### Performance Optimizations:
- Database indexes are already included
- Connection pooling in production
- CDN for static assets
- Caching strategies for leaderboard

## 📈 Future Enhancements

- [ ] Real-time leaderboard updates
- [ ] User authentication with Supabase Auth
- [ ] Multiple quiz rounds
- [ ] Advanced statistics
- [ ] Admin dashboard
- [ ] Question categories and difficulty levels