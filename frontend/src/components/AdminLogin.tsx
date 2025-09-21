import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      setError('Both email and password are required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Check credentials against environment variables
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
      const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

      if (email.trim() === adminEmail && password === adminPassword) {
        // Store admin session
        sessionStorage.setItem('adminAuthenticated', 'true')
        sessionStorage.setItem('adminLoginTime', new Date().toISOString())
        
        // Navigate to admin dashboard
        navigate('/admin/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (error) {
      console.error('Admin login error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToMain = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8">
      <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 text-lg">
            InterQuest Administration
          </p>
        </div>
        
        <form onSubmit={handleAdminLogin} className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col text-left">
            <label htmlFor="email" className="text-gray-700 font-semibold mb-2 text-base">
              Admin Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="admin@interquest.com"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col text-left">
            <label htmlFor="password" className="text-gray-700 font-semibold mb-2 text-base">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter admin password"
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !email.trim() || !password.trim()}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-none py-4 px-8 rounded-lg text-lg font-semibold cursor-pointer transition-all duration-200 mt-4 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/30 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Authenticating...</span>
              </div>
            ) : (
              'Access Admin Panel'
            )}
          </button>
          
          <button 
            type="button"
            onClick={handleBackToMain}
            disabled={isLoading}
            className="bg-gray-500 text-white border-none py-3 px-6 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Back to Main Site
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin