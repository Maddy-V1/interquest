# CORS Fix Instructions

## Root Cause
The CORS error is occurring because:
1. The backend on Render hasn't been redeployed with the updated CORS configuration
2. Missing `GET /api/users/:id` route that the frontend is trying to call
3. Environment variables might not be properly set on Render

## Changes Made
1. **Enhanced CORS Configuration**: Added debugging and more robust origin checking
2. **Added Missing Route**: `GET /api/users/:id` route was missing
3. **Added UserService Method**: `getUserById` method was missing
4. **Added Debugging**: Server startup now logs CORS configuration
5. **Added Test Endpoint**: `/api/cors-test` to verify CORS is working

## Steps to Fix

### 1. Commit and Push Changes
```bash
git add .
git commit -m "Fix CORS configuration and add missing user routes"
git push
```

### 2. Verify Render Environment Variables
Go to your Render dashboard and ensure these environment variables are set:
- `FRONTEND_URL=https://interquest-omega.vercel.app` (no trailing slash)
- `NODE_ENV=production`
- `SUPABASE_URL=https://boiguwzuymwckitujqjj.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `ADMIN_EMAIL=admin@internquest.com`
- `ADMIN_PASSWORD=admin123`

### 3. Redeploy on Render
- Either wait for automatic deployment or manually trigger redeploy
- Check the deployment logs for the new debug messages

### 4. Test CORS
Once deployed, test the CORS endpoint:
```bash
curl -H "Origin: https://interquest-omega.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://interquest.onrender.com/api/cors-test
```

### 5. Check Server Logs
Look for these messages in Render logs:
- `🔗 Frontend URL: https://interquest-omega.vercel.app`
- `🔒 CORS Origins: [array of allowed origins]`
- `CORS Check - Origin: https://interquest-omega.vercel.app`

## If Still Not Working
1. Check Render environment variables are exactly as specified
2. Verify the deployment completed successfully
3. Check if there are any build errors in Render logs
4. Try accessing the test endpoint directly: `https://interquest.onrender.com/api/cors-test`

## Expected Result
After these changes, the frontend should be able to:
- Load user data via `GET /api/users/:id`
- Load user progress via `GET /api/users/:id/progress`
- Load round questions via `GET /api/rounds/1/questions`
- All without CORS errors