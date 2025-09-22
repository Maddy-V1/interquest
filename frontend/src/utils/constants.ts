// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL || 'https://interquest.onrender.com')
    : '', // Use proxy in development
  
  ENDPOINTS: {
    // User endpoints
    USERS: '/api/users',
    USER_PROGRESS: (userId: string) => `/api/users/${userId}/progress`,
    USER_STATS: (userId: string) => `/api/users/${userId}/stats`,
    
    // Quiz endpoints
    QUIZ_SESSIONS: '/api/quiz-sessions',
    QUIZ_ANSWERS: '/api/quiz-answers',
    ROUND_QUESTIONS: (round: number) => `/api/rounds/${round}/questions`,
    
    // Leaderboard endpoints
    LEADERBOARD: '/api/leaderboard',
    ROUND_LEADERBOARD: (round: number) => `/api/leaderboard/round/${round}`,
    
    // Admin endpoints
    ADMIN_LOGIN: '/api/admin/login',
    ADMIN_STATS: '/api/admin/stats',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_QUESTIONS: '/api/admin/questions',
    ADMIN_ROUND_STATUS: (round: number) => `/api/admin/round-status/${round}`,
    ADMIN_ROUND_CONTROL: (round: number) => `/api/admin/round-control/${round}`,
    ADMIN_ROUND_APPROVALS: '/api/admin/round-approvals',
    ADMIN_START_RAPID_FIRE: '/api/admin/start-rapid-fire',
    ADMIN_RAPID_FIRE_STATUS: '/api/admin/rapid-fire-status',
    ADMIN_INIT_DATABASE: '/api/admin/init-database',
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return import.meta.env.PROD 
    ? `${API_CONFIG.BASE_URL}${endpoint}`
    : endpoint;
};