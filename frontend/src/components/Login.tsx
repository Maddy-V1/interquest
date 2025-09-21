import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserService from '../lib/userService'
import { authUtils } from '../lib/auth'

function Login() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Check if user is already logged in
  useEffect(() => {
    if (authUtils.isUserLoggedIn()) {
      navigate('/home')
    }
  }, [navigate])

  const handleProceedToQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure both fields are filled and not just whitespace
    if (!firstName.trim() || !lastName.trim()) {
      setError('Both first name and last name are required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Save user to Supabase
      const user = await UserService.createOrUpdateUser(
        firstName.trim(), 
        lastName.trim()
      )

      if (!user) {
        setError('Failed to save user information. Please try again.')
        setIsLoading(false)
        return
      }

      // Create a quiz session for Round 1
      const session = await UserService.createQuizSession(user.id!, 1)

      if (!session) {
        setError('Failed to create quiz session. Please try again.')
        setIsLoading(false)
        return
      }

      // Save user session to localStorage
      authUtils.saveUserSession({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userId: user.id,
        loginTime: new Date().toISOString()
      })

      // Navigate to Home page
      navigate('/home')
    } catch (error) {
      console.error('Login error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-5xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text mb-2">
          InterQuest
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Welcome to the Interactive Quiz Experience
        </p>
        
        <form onSubmit={handleProceedToQuiz} className="flex flex-col gap-6">
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
            <label htmlFor="firstName" className="text-gray-700 font-semibold mb-2 text-base">
              First Name:
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Your first name..."
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="flex flex-col text-left">
            <label htmlFor="lastName" className="text-gray-700 font-semibold mb-2 text-base">
              Last Name:
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="px-4 py-3.5 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Your last name..."
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !firstName.trim() || !lastName.trim()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none py-4 px-8 rounded-lg text-lg font-semibold cursor-pointer transition-all duration-200 mt-4 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/30 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Proceed to Quiz'
            )}
          </button>
        </form>
        
        {/* Admin Access Link */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors underline"
          >
            Admin Access
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login