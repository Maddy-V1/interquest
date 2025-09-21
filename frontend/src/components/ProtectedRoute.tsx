import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated')
    const loginTime = sessionStorage.getItem('adminLoginTime')
    
    if (!isAuthenticated) {
      navigate('/admin/login')
      return
    }

    // Check if session is expired (24 hours)
    if (loginTime) {
      const loginDate = new Date(loginTime)
      const now = new Date()
      const hoursDiff = (now.getTime() - loginDate.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        sessionStorage.removeItem('adminAuthenticated')
        sessionStorage.removeItem('adminLoginTime')
        navigate('/admin/login')
        return
      }
    }
  }, [navigate])

  return <>{children}</>
}

export default ProtectedRoute