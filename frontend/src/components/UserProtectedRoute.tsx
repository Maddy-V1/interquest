import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../lib/auth'

interface UserProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

function UserProtectedRoute({ children, requireAdmin = false }: UserProtectedRouteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const userSession = authUtils.getUserSession()
    const adminSession = authUtils.getAdminSession()

    if (requireAdmin) {
      // For admin routes, check if admin is logged in
      if (!adminSession?.isAdmin) {
        navigate('/admin/login')
        return
      }
    } else {
      // For user routes, check if user is logged in
      if (!userSession?.userId) {
        navigate('/')
        return
      }
    }
  }, [requireAdmin]) // Remove navigate from dependencies as it's stable in React Router v6

  // If we reach here, user is authenticated
  return <>{children}</>
}

export default UserProtectedRoute
