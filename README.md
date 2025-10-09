# 🎯 InterQuest - Multi-Round Quiz Application

A comprehensive quiz application featuring three progressive rounds with real-time rapid-fire competition, admin controls, and leaderboard management. Built with React, Node.js, and Supabase.

![Quiz App](https://img.shields.io/badge/Quiz-Application-blue)
![React](https://img.shields.io/badge/React-19.1.1-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Supabase](https://img.shields.io/badge/Supabase-Database-orange)

## 🌟 Features

### 🎮 Multi-Round Quiz System
- **Round 1**: General Knowledge Quiz (100 points per question)
- **Round 2**: Science & Technology Quiz (150 points per question) 
- **Round 3**: Advanced Knowledge Rapid-Fire Competition (200 points per question)

### 👨‍💼 Admin Dashboard ( /admin )
- Start/Stop quiz rounds
- User approval system for Round 2 & 3
- Real-time leaderboard monitoring
- Question management system
- Round control and timing

### 🏆 Leaderboard System
- Individual round leaderboards
- Overall combined scores
- Real-time updates during rapid-fire
- Sidebar leaderboard in results

### ⚡ Real-Time Features
- Live rapid-fire competition
- WebSocket-based real-time updates
- Participant waiting room
- Instant score updates

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/quiz-app.git
cd quiz-app
```

### 2. Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the database schema:
```bash
# Copy and paste the contents of database/schema.sql
```

### 3. Environment Configuration

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Backend (.env)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
PORT=3000
RAPIDFIRE_PORT=3001 (round 3 not working properly)
```

### 4. Installation & Running

#### Backend Setup
```bash
cd backend
npm install
npm start
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Rapid Fire Server (Terminal 3)  (not working properly)
```bash
cd backend
node rapidfire-server.js
```

## 🏗️ Project Structure

```
quiz-app/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── Quiz.tsx
│   │   │   ├── RapidFireQuiz.tsx
│   │   │   └── ...
│   │   ├── lib/             # Utility libraries
│   │   └── utils/           # Helper functions
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── services/            # Business logic
│   ├── config/              # Configuration files
│   └── index.js             # Main server file
├── database/                # Database schema and migrations
│   ├── schema.sql           # Main database schema
│   └── update_leaderboard_views.sql
└── README.md
```

## 🎯 User Flow

### 1. User Registration
- Users enter first name and last name
- System creates user profile in database
- Access to Round 1 is granted

### 2. Round Progression
- **Round 1**: Always accessible to all users
- **Round 2**: Requires admin approval after Round 1 completion
- **Round 3**: Requires admin approval after Round 2 completion

### 3. Quiz Experience
- Multiple choice questions with 4 options
- Progressive scoring system (100/150/200 points)
- Real-time feedback and results
- Leaderboard updates after each round

### 4. Rapid Fire Competition
- Multiple users compete simultaneously
- First-correct-answer-wins system
- Live leaderboard updates
- 5-second countdown between questions

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Socket.IO Client** - Real-time communication
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **CORS** - Cross-origin resource sharing

### Database
- **Supabase** - PostgreSQL database
- **Row Level Security (RLS)** - Data protection
- **Real-time subscriptions** - Live updates

## 📊 Database Schema

### Core Tables
- **users** - User profiles and approval status
- **quiz_sessions** - Quiz attempts and scores
- **quiz_answers** - Detailed answer tracking
- **questions** - Quiz questions by round
- **round_config** - Admin round control

### Views
- **leaderboard_view** - Individual session rankings
- **overall_leaderboard_view** - Combined scores
- **round_leaderboard_view** - Round-specific rankings

## 🔧 API Endpoints

### User Management
- `POST /api/users` - Create/update user
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:id/progress` - Get user progress

### Quiz Management
- `POST /api/quiz-sessions` - Create quiz session
- `PUT /api/quiz-sessions/:id` - Update quiz session
- `GET /api/rounds/:round/questions` - Get questions for round

### Leaderboards
- `GET /api/leaderboard?round=1&limit=10` - Get leaderboard data
- `GET /api/users/:id/rounds/:round/access` - Check round access

### Admin Controls
- `POST /api/admin/start-round` - Start quiz round
- `POST /api/admin/stop-round` - Stop quiz round
- `POST /api/admin/approve-users` - Approve users for next round

## 🎨 UI Components

### User Interface
- **Login** - User registration and authentication
- **Home** - Round selection and progress overview
- **Quiz Components** - Round-specific quiz interfaces
- **Results** - Score display with sidebar leaderboard
- **Leaderboard** - Comprehensive ranking system

### Admin Interface
- **Admin Dashboard** - Round control and monitoring
- **Question Management** - Add/edit quiz questions
- **Round Approval** - User approval system
- **Round Control** - Start/stop quiz rounds

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting platform
```

### Backend (Render/Heroku)
```bash
cd backend
# Deploy with package.json and index.js
# Set environment variables in hosting platform
```

### Environment Variables for Production
- Update CORS settings for production domains
- Use production Supabase keys
- Configure SSL for WebSocket connections
- Set up proper error logging

## 🧪 Testing

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Round 1 quiz completion
- [ ] Admin round control (start/stop)
- [ ] User approval for Round 2/3
- [ ] Rapid fire real-time competition
- [ ] Leaderboard updates
- [ ] Mobile responsiveness

### Performance Testing
- [ ] Concurrent user load testing
- [ ] Database query optimization
- [ ] WebSocket connection stability
- [ ] Real-time update latency

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **Environment variable protection** for sensitive keys
- **CORS configuration** for API endpoints
- **Input validation** on frontend and backend
- **Admin authentication** for sensitive operations

## 📈 Performance Optimizations

- Database indexes for fast queries
- Connection pooling for database
- Efficient WebSocket message handling
- Optimized React component rendering
- CDN-ready static assets

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Restart development servers after adding .env files
   - Verify file names (.env, not .env.example)

2. **CORS Errors**
   - Check frontend URL in backend CORS configuration
   - Verify backend is running on correct port

3. **Database Connection Issues**
   - Verify Supabase URL and keys in .env files
   - Check Supabase project status

4. **Socket.IO Connection Failed**
   - Ensure rapid fire server is running on port 3001
   - Check firewall settings for WebSocket connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- GGSIPU and IETE for branding and support
- Supabase for the excellent database platform
- React and Node.js communities for amazing tools

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the troubleshooting guide
- Review the deployment documentation

---

**Made with ❤️ for educational quiz competitions**
