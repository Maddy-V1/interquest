import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const adminSession = authUtils.getAdminSession()

    if (!adminSession?.isAdmin) {
      navigate('/admin/login')
      return
    }

    // Check if session is expired (24 hours)
    if (adminSession.loginTime) {
      const loginDate = new Date(adminSession.loginTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > 24) {
        authUtils.clearAdminSession()
        navigate('/admin/login')
        return
      }
    }
  }, []) // Remove navigate from dependencies as it's stable in React Router v6

  return <>{children}</>
}

export default ProtectedRoute