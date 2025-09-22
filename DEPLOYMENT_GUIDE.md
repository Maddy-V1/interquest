# 🚀 InterQuest Deployment & Testing Guide

## 📋 **Prerequisites**
- Node.js (v16 or higher)
- Supabase account and project
- Two terminal windows for running servers

## 🛠️ **Setup Instructions**

### **1. Database Setup**
Run this SQL in your Supabase SQL Editor:

```sql
-- Copy and paste the entire content from database/update_leaderboard_views.sql
-- This will create:
-- - Updated leaderboard views
-- - round_config table for admin control
-- - Default round configurations
```

### **2. Install Dependencies**

```bash
# Frontend dependencies
cd frontend
npm install socket.io-client

# Backend dependencies  
cd ../backend
npm install socket.io
```

### **3. Environment Variables**
Ensure your `.env` files are properly configured:

**Backend `.env`:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
PORT=3000
RAPIDFIRE_PORT=3001
```

### **4. Start the Servers**

**Terminal 1 - Main API Server:**
```bash
cd backend
npm start
# Should run on http://localhost:3000
```

**Terminal 2 - Rapid Fire Server:**
```bash
cd backend
node rapidfire-server.js
# Should run on http://localhost:3001
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Should run on http://localhost:5173
```

## 🧪 **Testing Guide**

### **Phase 1: Basic Functionality**

1. **User Registration & Login**
   - Go to `http://localhost:5173`
   - Register with first name and last name
   - Verify branding header shows GGSIPU and IETE logos
   - Check that "IETE" is highlighted in orange

2. **Admin Dashboard**
   - Go to `http://localhost:5173/admin/login`
   - Login with admin credentials
   - Verify branding header appears
   - Check Round 1 Control panel shows "🔴 Stopped"

### **Phase 2: Round 1 Admin Control**

1. **Before Starting Round 1**
   - As user: Try to access Round 1 → Should be blocked
   - Home page should show Round 1 as unavailable

2. **Start Round 1**
   - As admin: Click "Start Round 1" in dashboard
   - Status should change to "🟢 Active"
   - As user: Refresh home page → Round 1 should now be accessible

3. **Complete Round 1**
   - As user: Complete Round 1 quiz
   - Check results page has sidebar leaderboard
   - Verify branding appears on results page

4. **Stop Round 1**
   - As admin: Click "Stop Round 1"
   - New users should not be able to start Round 1
   - Users in progress should see "Time Over" message

### **Phase 3: Round 2 Approval System**

1. **Admin Approval**
   - In admin dashboard, Round 1 leaderboard should show completed users
   - Click "Add" button in Round 2 section
   - Select users with checkboxes
   - Click "Approve X Users"
   - Users should appear in Round 2 leaderboard

2. **User Access**
   - Approved users should see Round 2 as accessible on home page
   - Non-approved users should see "Pending Approval"

### **Phase 4: Round 3 Rapid Fire**

1. **Setup**
   - Approve multiple users for Round 3
   - Have multiple users navigate to Round 3

2. **Waiting Room**
   - Users should see "Waiting for participants..." screen
   - Participant list should show all joined users
   - Online status indicators should work

3. **Start Rapid Fire**
   - As admin: Click "Start Rapid Fire" in dashboard
   - All participants should see the first question simultaneously
   - 5-second countdown should appear

4. **Competition Flow**
   - First user to answer correctly gets the point
   - Result shows winner for 3 seconds
   - Next question appears automatically
   - Live leaderboard updates in real-time

5. **Game Completion**
   - After all questions, final results appear
   - Users redirect to results page with rapid fire data

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Socket.IO Connection Failed**
   ```bash
   # Check if rapid fire server is running on port 3001
   curl http://localhost:3001
   ```

2. **Database Views Not Found**
   ```sql
   -- Re-run the database update script
   -- Check if views exist:
   SELECT * FROM information_schema.views WHERE table_name LIKE '%leaderboard%';
   ```

3. **Round Control Not Working**
   ```sql
   -- Check round_config table exists:
   SELECT * FROM round_config;
   ```

4. **Branding Not Showing**
   - Check if BrandingHeader component is imported
   - Verify Tailwind CSS classes are loading

### **Performance Optimization**

1. **Database Indexes**
   ```sql
   -- Add indexes for better performance
   CREATE INDEX IF NOT EXISTS idx_quiz_sessions_round_status ON quiz_sessions(round_number, status);
   CREATE INDEX IF NOT EXISTS idx_users_approvals ON users(round2_approved, round3_approved);
   ```

2. **Socket.IO Scaling**
   - For production, consider Redis adapter for multiple server instances
   - Implement connection pooling for database queries

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**
- Concurrent users in rapid fire
- Question response times
- User completion rates per round
- Admin control usage

### **Logs to Monitor**
- Rapid fire server console for game events
- Main API server for user actions
- Database query performance

## 🎯 **Success Criteria**

✅ **Branding**: GGSIPU + IETE logos visible on all pages  
✅ **Round Control**: Admin can start/stop Round 1  
✅ **Approvals**: Admin can approve users for Round 2/3  
✅ **Rapid Fire**: Real-time competition works smoothly  
✅ **Leaderboards**: Sidebar layout in results  
✅ **Responsive**: Works on mobile and desktop  

## 🚀 **Production Deployment**

### **Environment Setup**
1. Deploy main API server to your hosting platform
2. Deploy rapid fire server separately (different port)
3. Update frontend build with production API URLs
4. Configure database connection strings
5. Set up SSL certificates for secure WebSocket connections

### **Security Considerations**
- Enable CORS only for your domain
- Use environment variables for all secrets
- Implement rate limiting for API endpoints
- Add authentication middleware for admin routes

The system is now ready for full deployment and testing! 🎉