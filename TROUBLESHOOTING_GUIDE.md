# 🔧 InterQuest Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **Issue 1: Round 1 Start/Stop Button Not Working**

**Symptoms:**
- Admin clicks "Start Round 1" but nothing happens
- Button shows "Updating..." but never completes
- Console shows database errors

**Solutions:**

1. **Check Database Tables**
   ```sql
   -- Run this in Supabase SQL Editor to check if table exists
   SELECT * FROM round_config;
   ```

2. **Initialize Database (Easy Fix)**
   - Go to Admin Dashboard
   - Click "Initialize Database" button in Quick Actions
   - This will create the `round_config` table automatically

3. **Manual Database Setup**
   ```sql
   -- If Initialize Database button doesn't work, run this manually:
   CREATE TABLE IF NOT EXISTS round_config (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       round_number INTEGER NOT NULL UNIQUE,
       status VARCHAR(20) NOT NULL DEFAULT 'stopped' CHECK (status IN ('active', 'stopped')),
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   INSERT INTO round_config (round_number, status) VALUES 
   (1, 'stopped'),
   (2, 'stopped'),
   (3, 'stopped')
   ON CONFLICT (round_number) DO NOTHING;
   ```

4. **Check API Connection**
   - Open browser console (F12)
   - Look for error messages when clicking the button
   - Verify main API server is running on port 3000

### **Issue 2: Rapid Fire Start Button Not Working**

**Symptoms:**
- Admin clicks "Start Rapid Fire" but nothing happens
- Error message about connection failed
- Participants stuck in waiting room

**Solutions:**

1. **Check Rapid Fire Server**
   ```bash
   # Make sure rapid fire server is running
   cd backend
   node rapidfire-server.js
   
   # Should show:
   # 🚀 Rapid Fire Server running on http://localhost:3001
   # 📊 Loaded X questions for Round 3
   ```

2. **Verify Port 3001 is Available**
   ```bash
   # Check if port 3001 is in use
   lsof -i :3001
   
   # If something else is using it, kill the process or change port
   ```

3. **Check Questions Loaded**
   - Rapid fire needs Round 3 questions in database
   - Verify questions exist: `SELECT * FROM questions WHERE round_number = 3;`

4. **Test API Endpoint**
   ```bash
   # Test if rapid fire server is responding
   curl -X POST http://localhost:3001/api/admin/start-rapid-fire
   ```

### **Issue 3: Round 3 Leaderboard Shows Zero Participants**

**Symptoms:**
- Admin dashboard shows "0 approved" for Round 3
- Round 3 leaderboard is empty
- Users approved for Round 3 don't appear

**Solutions:**

1. **Check User Approvals**
   ```sql
   -- Check if users are actually approved for Round 3
   SELECT first_name, last_name, round3_approved FROM users WHERE round3_approved = true;
   ```

2. **Debug API Endpoint**
   - Visit: `http://localhost:3000/api/debug/round3-users`
   - Should show list of approved users

3. **Check Database Views**
   ```sql
   -- Check if Round 3 view exists
   SELECT * FROM round3_leaderboard_view;
   
   -- If error, run the database update script
   ```

4. **Manual Approval**
   ```sql
   -- Manually approve a user for testing
   UPDATE users SET round3_approved = true WHERE first_name = 'TestUser';
   ```

### **Issue 4: Socket.IO Connection Failed**

**Symptoms:**
- Rapid fire participants can't connect
- "Connection failed" errors in console
- Participants don't see each other

**Solutions:**

1. **Check CORS Settings**
   ```javascript
   // In rapidfire-server.js, verify CORS origins
   const io = socketIo(server, {
     cors: {
       origin: ["http://localhost:5173", "http://localhost:3000"],
       methods: ["GET", "POST"]
     }
   });
   ```

2. **Verify Frontend Socket Connection**
   ```javascript
   // In RapidFireQuiz.tsx, check socket URL
   const newSocket = io('http://localhost:3001', {
     query: {
       userId: userSession.userId,
       firstName: userSession.firstName,
       lastName: userSession.lastName
     }
   })
   ```

3. **Check Firewall/Network**
   - Ensure ports 3000 and 3001 are not blocked
   - Try accessing `http://localhost:3001` directly in browser

## 🛠️ **Step-by-Step Debugging Process**

### **For Round Control Issues:**

1. **Check Console Logs**
   ```bash
   # Backend console should show:
   Round control request: Round 1 -> active
   Round 1 status updated to active
   ```

2. **Test API Manually**
   ```bash
   # Test round status endpoint
   curl http://localhost:3000/api/admin/round-status/1
   
   # Test round control endpoint
   curl -X POST http://localhost:3000/api/admin/round-control/1 \
     -H "Content-Type: application/json" \
     -d '{"status":"active"}'
   ```

3. **Check Database State**
   ```sql
   SELECT * FROM round_config WHERE round_number = 1;
   ```

### **For Rapid Fire Issues:**

1. **Check Both Servers Running**
   ```bash
   # Terminal 1: Main API
   cd backend && npm start
   
   # Terminal 2: Rapid Fire
   cd backend && node rapidfire-server.js
   ```

2. **Verify Questions Exist**
   ```sql
   SELECT COUNT(*) FROM questions WHERE round_number = 3;
   -- Should return > 0
   ```

3. **Test Socket Connection**
   ```javascript
   // In browser console on rapid fire page:
   console.log('Socket connected:', socket.connected);
   ```

## 🔍 **Diagnostic Commands**

### **Database Health Check**
```sql
-- Check all required tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'questions', 'quiz_sessions', 'round_config');

-- Check sample data
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'quiz_sessions', COUNT(*) FROM quiz_sessions
UNION ALL
SELECT 'round_config', COUNT(*) FROM round_config;
```

### **API Health Check**
```bash
# Check main API
curl http://localhost:3000/

# Check rapid fire API
curl http://localhost:3001/api/admin/rapid-fire-status
```

### **Frontend Health Check**
```javascript
// In browser console:
fetch('/api/admin/round-status/1')
  .then(r => r.json())
  .then(console.log);
```

## 🚀 **Quick Fixes**

### **Reset Everything**
```bash
# Stop all servers
# Restart in this order:

# 1. Main API
cd backend && npm start

# 2. Rapid Fire (new terminal)
cd backend && node rapidfire-server.js

# 3. Frontend (new terminal)
cd frontend && npm run dev
```

### **Database Reset**
```sql
-- Reset round configurations
DELETE FROM round_config;
INSERT INTO round_config (round_number, status) VALUES 
(1, 'stopped'), (2, 'stopped'), (3, 'stopped');
```

### **Clear Browser Cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear localStorage: F12 → Application → Local Storage → Clear

## 📞 **Still Having Issues?**

1. **Check all servers are running on correct ports**
2. **Verify database tables exist**
3. **Check browser console for errors**
4. **Test API endpoints manually**
5. **Ensure Supabase connection is working**

The most common issue is the missing `round_config` table - use the "Initialize Database" button in admin dashboard to fix this quickly!