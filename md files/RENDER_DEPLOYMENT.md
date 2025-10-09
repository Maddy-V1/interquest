# Render Deployment Guide

## Backend Deployment Steps

### 1. Prepare Your Repository
- Ensure your backend code is in the `backend/` directory
- The `package.json` has been updated with proper build and start scripts
- CORS configuration includes production URLs

### 2. Deploy on Render

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `interquest-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

3. **Environment Variables**
   Set these in Render's Environment Variables section:
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ADMIN_EMAIL=your_admin_email
   ADMIN_PASSWORD=your_secure_admin_password
   FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your backend will be available at: `https://your-service-name.onrender.com`

### 3. Update Frontend Configuration
After deployment, update your frontend's API URL to point to your Render backend URL.

### 4. Test Deployment
- Visit `https://your-service-name.onrender.com` - should return: `{"message": "InterQuest API Server"}`
- Test API endpoints like `/api/leaderboard`

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check that `package.json` is in the `backend/` directory
   - Ensure all dependencies are listed in `dependencies`, not `devDependencies`

2. **Service Won't Start**
   - Verify the start command is `npm start`
   - Check that `PORT` environment variable is set to `10000`

3. **CORS Errors**
   - Make sure `FRONTEND_URL` environment variable is set correctly
   - Update CORS origins in `index.js` if needed

4. **Database Connection Issues**
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
   - Check Supabase project settings

### Logs
- View logs in Render dashboard under "Logs" tab
- Look for startup errors or runtime issues

## Performance Notes
- Render free tier may have cold starts
- Consider upgrading to paid plan for production use
- Monitor response times and resource usage