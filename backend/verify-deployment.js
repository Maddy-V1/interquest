#!/usr/bin/env node

// Simple script to verify deployment configuration
require('dotenv').config();

console.log('🔍 Deployment Verification');
console.log('========================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Not Set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not Set');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'Set' : 'Not Set');

console.log('\n🌍 CORS Configuration:');
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://interquest-omega.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

allowedOrigins.forEach((origin, index) => {
  console.log(`${index + 1}. ${origin}`);
});

console.log('\n✅ Verification complete');