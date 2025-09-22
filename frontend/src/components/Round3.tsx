import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import UserService from '../lib/userService'
import { authUtils } from '../lib/auth'
import { supabase } from '../lib/supabase'

interface LocationState {
  firstName: string
  lastName: string
  userId: string
}

function Round3() {
  const location = useLocation()
  const navigate = useNavigate()
  const [userSession, setUserSession] = useState(authUtils.getUserSession())
  
  // Extract user data for easier access
  const { firstName, lastName, userId } = (location.state as LocationState) || userSession || { 
    firstName: '', 
    lastName: '', 
    userId: '' 
  }

  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [roundScore, setRoundScore] = useState(0)
  const [roundQuestions, setRoundQuestions] = useState<any[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  const [isApproved, setIsApproved] = useState(false)
  const [rapidFireActive, setRapidFireActive] = useState(false)

  // Redirect to login if no user data
  useEffect(() => {
    if (!firstName || !lastName || !userId) {
      navigate('/')
      return
    }
    checkRoundCompletion()
    fetchRoundQuestions()
    checkRound3Approval()
    checkRapidFireStatus()
    
    // Set up realtime subscription for rapid fire notifications
    const channel = supabase
      .channel('rapid_fire_notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.new.type === 'rapid_fire_started' && 
              payload.new.target_users?.includes(userId)) {
            setRapidFireActive(true)
            // Auto-redirect to rapid fire after 3 seconds
            setTimeout(() => {
              navigate('/rapid-fire')
            }, 3000)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [firstName, lastName, userId]) // Remove navigate from dependencies as it's stable in React Router v6

  const checkRoundCompletion = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/progress`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const round3Completed = data.progress.completedRounds.includes(3)
          if (round3Completed) {
            setIsCompleted(true)
            // Get the score for Round 3
            const round3Session = data.progress.sessions.find((s: any) => s.round_number === 3)
            if (round3Session) {
              setRoundScore(round3Session.score)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking round completion:', error)
    }
  }

  const fetchRoundQuestions = async () => {
    try {
      setQuestionsLoading(true)
      const response = await fetch('/api/rounds/3/questions')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRoundQuestions(data.questions || [])
        }
      }
    } catch (error) {
      console.error('Error fetching round questions:', error)
    } finally {
      setQuestionsLoading(false)
    }
  }

  const checkRound3Approval = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('round3_approved')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        setIsApproved(data.round3_approved || false)
      }
    } catch (error) {
      console.error('Error checking Round 3 approval:', error)
    }
  }

  const checkRapidFireStatus = async () => {
    try {
      const response = await fetch('/api/admin/rapid-fire-status')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.gameState.status === 'active') {
          setRapidFireActive(true)
        }
      }
    } catch (error) {
      console.error('Error checking rapid fire status:', error)
    }
  }

  if (!firstName || !lastName || !userId) {
    return null
  }

  const handleStartRound3 = async () => {
    if (rapidFireActive) {
      navigate('/rapid-fire')
      return
    }
    
    try {
      setIsLoading(true)
      
      // Create a quiz session for Round 3
      const session = await UserService.createQuizSession(userId, 3)
      
      if (!session) {
        alert('Failed to create quiz session. Please try again.')
        return
      }
      
      // Navigate to quiz with user data and session ID
      navigate('/round3-quiz', { 
        state: { 
          firstName, 
          lastName,
          userId,
          sessionId: session.id
        } 
      })
    } catch (error) {
      console.error('Error starting quiz:', error)
      alert('Error starting quiz. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate('/home')
  }

  const handleSeeResults = () => {
    navigate('/quiz-results', {
      state: {
        roundNumber: 3,
        score: roundScore,
        correctAnswers: roundScore, // Since each question is 1 point
        totalQuestions: roundQuestions.length || 5
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={handleBackToHome}
                className="bg-gray-500 text-white p-2 rounded-lg mr-4 hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text">
                  InterQuest
                </h1>
                <p className="text-gray-600 mt-2">
                  {firstName} {lastName} - Round 3
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-full font-semibold">
                Round 3
              </div>
            </div>
          </div>
        </div>

        {/* Round 3 Details */}
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h2 className="text-6xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text mb-8">
            ROUND 3
          </h2>
          
          <div className="space-y-6 mb-12">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Advanced Knowledge Quiz
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Face the ultimate challenge with 5 expert-level questions covering advanced topics in science, literature, mathematics, and specialized knowledge.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-purple-200 p-6 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {questionsLoading ? '...' : roundQuestions.length}
                </div>
                <div className="text-gray-700 font-semibold">Questions</div>
                <div className="text-sm text-gray-500 mt-1">Expert Level</div>
              </div>
              
              <div className="bg-white border-2 border-violet-200 p-6 rounded-xl">
                <div className="text-3xl font-bold text-violet-600 mb-2">
                  {questionsLoading ? '...' : roundQuestions.length > 0 ? roundQuestions[0].points : 1}
                </div>
                <div className="text-gray-700 font-semibold">Points Each</div>
                <div className="text-sm text-gray-500 mt-1">
                  Maximum Score: {questionsLoading ? '...' : roundQuestions.length * (roundQuestions.length > 0 ? roundQuestions[0].points : 1)}
                </div>
              </div>
              
              <div className="bg-white border-2 border-indigo-200 p-6 rounded-xl">
                <div className="text-3xl font-bold text-indigo-600 mb-2">10</div>
                <div className="text-gray-700 font-semibold">Minutes</div>
                <div className="text-sm text-gray-500 mt-1">Time Limit</div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-xl">
              <div className="flex items-start">
                <div className="text-yellow-600 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-yellow-800 mb-1">Instructions</h4>
                  <ul className="text-yellow-700 space-y-1 text-left">
                    <li>• These are the most challenging questions in InterQuest</li>
                    <li>• Covering advanced topics across multiple disciplines</li>
                    <li>• Take your time and think carefully</li>
                    <li>• Complete Round 3 to finish the entire quiz!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Messages */}
          {!isApproved && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="bg-yellow-500 text-white p-3 rounded-full">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-800">Waiting for Approval</h3>
                  <p className="text-yellow-600">You need to be approved by admin to participate in Round 3</p>
                </div>
              </div>
            </div>
          )}

          {rapidFireActive && isApproved && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="bg-purple-500 text-white p-3 rounded-full animate-pulse">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-800">Rapid Fire Active!</h3>
                  <p className="text-purple-600">Round 3 Rapid Fire is now live. Join the competition!</p>
                </div>
              </div>
            </div>
          )}

          {/* Start Button or See Results */}
          {isCompleted ? (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="bg-green-500 text-white p-3 rounded-full">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-800">Round 3 Completed!</h3>
                    <p className="text-green-600">Your Score: {roundScore} points</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleSeeResults}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-12 py-4 rounded-xl text-xl font-bold hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform"
              >
                See Results & Leaderboard
                <span className="ml-2">📊</span>
              </button>
            </div>
          ) : isApproved ? (
            <button 
              onClick={handleStartRound3}
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-12 py-4 rounded-xl text-xl font-bold hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Starting Quiz...</span>
              </div>
              ) : rapidFireActive ? (
                <>
                  Join Rapid Fire ⚡
                  <span className="ml-2">→</span>
                </>
              ) : (
                <>
                  Start Round 3
                  <span className="ml-2">→</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-center text-gray-500">
              <p>Please wait for admin approval to participate in Round 3</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Round3
