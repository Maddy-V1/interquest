// Auth utilities for managing user sessions in localStorage

export interface UserSession {
  firstName: string
  lastName: string
  userId: string
  isAdmin?: boolean
  loginTime: string
}

const SESSION_KEY = 'interquest_user_session'
const ADMIN_SESSION_KEY = 'interquest_admin_session'

export const authUtils = {
  // User session management
  saveUserSession: (session: UserSession) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },

  getUserSession: (): UserSession | null => {
    try {
      const session = localStorage.getItem(SESSION_KEY)
      return session ? JSON.parse(session) : null
    } catch {
      return null
    }
  },

  clearUserSession: () => {
    localStorage.removeItem(SESSION_KEY)
  },

  isUserLoggedIn: (): boolean => {
    const session = authUtils.getUserSession()
    return !!session && !!session.userId
  },

  // Admin session management
  saveAdminSession: () => {
    const session = {
      isAdmin: true,
      loginTime: new Date().toISOString()
    }
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
  },

  getAdminSession: () => {
    try {
      const session = localStorage.getItem(ADMIN_SESSION_KEY)
      return session ? JSON.parse(session) : null
    } catch {
      return null
    }
  },

  clearAdminSession: () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
  },

  isAdminLoggedIn: (): boolean => {
    const session = authUtils.getAdminSession()
    return !!session && !!session.isAdmin
  },

  // Clear all sessions
  clearAllSessions: () => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(ADMIN_SESSION_KEY)
  }
}
