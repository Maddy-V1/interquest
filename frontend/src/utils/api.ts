// API utility to handle different environments
const getApiUrl = () => {
  // In production (Vercel), use the environment variable
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://interquest.onrender.com';
  }
  // In development, use the proxy
  return '';
};

export const API_BASE_URL = getApiUrl();

// Helper function to make API calls
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = import.meta.env.PROD 
    ? `${API_BASE_URL}${endpoint}` 
    : endpoint; // In dev, use proxy
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
};