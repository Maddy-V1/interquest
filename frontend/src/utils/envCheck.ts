// Environment check utility
export const checkEnvironment = () => {
  console.log('🔍 Environment Check:');
  console.log('- NODE_ENV:', import.meta.env.MODE);
  console.log('- PROD:', import.meta.env.PROD);
  console.log('- DEV:', import.meta.env.DEV);
  console.log('- VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('- Base URL will be:', import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || 'https://interquest.onrender.com')
    : 'proxy');
};

// Call this on app startup
if (typeof window !== 'undefined') {
  checkEnvironment();
}