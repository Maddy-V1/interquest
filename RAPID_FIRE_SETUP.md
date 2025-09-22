# Rapid Fire Setup Guide

This guide explains how to set up and use the Round 3 Rapid Fire functionality.

## Database Setup

1. **Run the SQL setup script** in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of setup-rapid-fire.sql
   ```

2. **Verify tables were created**:
   - `game_state` - Tracks rapid fire game status
   - `rapid_fire_results` - Stores question results
   - `notifications` - Real-time notifications

## Server Setup

The rapid fire functionality is now integrated into the main backend server (no separate server needed).

1. **Install dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```

2. **Start the server**:
   ```bash
   npm run dev
   ```

The server will now include:
- Socket.IO for real-time communication
- Rapid fire game logic
- Admin endpoints for game control

**Note**: The backend server runs on port 3001 to avoid conflicts with other services.

## How It Works

### Admin Flow
1. Admin approves users for Round 3 in the dashboard
2. Admin clicks "Start Rapid Fire" button
3. Game begins and approved users are notified

### User Flow
1. User must be approved for Round 3
2. When rapid fire starts, user sees notification in Round 3 page
3. User clicks to join rapid fire
4. User competes in real-time quiz

### Game Mechanics
- **15 seconds per question**
- **First correct answer wins**
- **Question locks immediately** when someone answers correctly
- **Real-time scoring** and leaderboard updates
- **Participant numbers** shown for each user

## Key Features

### ✅ Fixed Issues
- ✅ Connection error resolved (integrated into main server)
- ✅ Selected Round 3 members shown in quiz screen
- ✅ Participant names and numbers displayed
- ✅ First correct answer wins logic
- ✅ Question locking after correct answer
- ✅ Real-time synchronization with Supabase

### 🎮 Game Features
- Real-time multiplayer quiz
- Instant feedback on answers
- Live participant list with online status
- Automatic game progression
- Results persistence in database

### 🔧 Admin Features
- Start/stop rapid fire games
- View game status and participant count
- Approve participants for Round 3
- Monitor game progress

## API Endpoints

### Rapid Fire Endpoints (Port 3001)
- `POST http://localhost:3001/api/admin/start-rapid-fire` - Start rapid fire game
- `GET http://localhost:3001/api/admin/rapid-fire-status` - Get current game status

### Socket.IO Events
- `joinRapidFire` - User joins the game
- `submitAnswer` - User submits an answer
- `newQuestion` - New question broadcast
- `questionLocked` - Question locked after correct answer
- `questionResult` - Question results
- `participantsUpdate` - Participant list update
- `gameFinished` - Game completion

## Troubleshooting

### Common Issues

1. **"You are not approved for Round 3"**
   - Admin needs to approve the user in the dashboard
   - Check Round 3 leaderboard section

2. **Connection issues**
   - Ensure main server is running on port 3001
   - Check browser console for Socket.IO errors

3. **Game not starting**
   - Verify approved participants exist
   - Check Round 3 questions are available
   - Review server logs for errors

### Debug Endpoints
- `GET /api/debug/round3-users` - List approved Round 3 users
- `GET /api/admin/rapid-fire-status` - Current game state

## Development Notes

- Game state is stored in memory (resets on server restart)
- Results are persisted to Supabase
- Real-time updates use Socket.IO
- Notifications use Supabase realtime
- Participant numbers assigned on join order

## Testing

1. Create test users and approve them for Round 3
2. Add Round 3 questions via admin panel
3. Start rapid fire from admin dashboard
4. Test with multiple browser tabs/users
5. Verify real-time updates and scoring

## Production Considerations

- Consider Redis for game state persistence
- Implement rate limiting for Socket.IO events
- Add monitoring for game performance
- Set up proper error handling and logging
- Consider horizontal scaling for multiple game instances