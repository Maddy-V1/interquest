import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserService from '../lib/userService'
import { authUtils } from '../lib/auth'

function Round1() {
  const navigate = useNavigate()
  const [userSession] = useState(authUtils.getUserSession())


  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [roundScore, setRoundScore] = useState(0)
  const [roundQuestions, setRoundQuestions] = useState<any[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)
  // Removed roundStatus and statusLoading - Round 1 is always available

  // Extract userId for easier access
  const { firstName, lastName, userId } = userSession || { firstName: '', lastName: '', userId: '' }

  // Redirect to login if no user session
  useEffect(() => {
    if (!userSession?.userId) {
      navigate('/')
      return
    }
    checkRoundCompletion()
    fetchRoundQuestions()
    // Remove checkRoundStatus() - Round 1 is always available
  }, [userSession?.userId]) // Remove navigate from dependencies as it's stable in React Router v6

  const checkRoundCompletion = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/progress`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const round1Completed = data.progress.completedRounds.includes(1)
          if (round1Completed) {
            setIsCompleted(true)
            // Get the score for Round 1
            const round1Session = data.progress.sessions.find((s: any) => s.round_number === 1)
            if (round1Session) {
              setRoundScore(round1Session.score)
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
      const response = await fetch('/api/rounds/1/questions')
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

  // Removed checkRoundStatus - Round 1 is always available

  const handleStartRound1 = async () => {
    // Round 1 is always available - no admin check needed
    try {
      setIsLoading(true)

      // Create a quiz session for Round 1
      const session = await UserService.createQuizSession(userId, 1)

      if (!session) {
        alert('Failed to create quiz session. Please try again.')
        return
      }

      // Navigate to quiz with session ID
      navigate('/round1-quiz', {
        state: {
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
        roundNumber: 1,
        score: roundScore,
        correctAnswers: roundScore, // Since each question is 1 point
        totalQuestions: roundQuestions.length || 5
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8">
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
                <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                  InterQuest
                </h1>
                <p className="text-gray-600 mt-2">
                  {firstName} {lastName} - Round 1
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold">
                Round 1
              </div>
            </div>
          </div>
        </div>

        {/* Round 1 Details */}
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h2 className="text-6xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-8">
            ROUND 1
          </h2>

          <div className="space-y-6 mb-12">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                General Knowledge Quiz
              </h3>
              <p className="text-lg text-gray-600 leading-relaxed">
                Test your knowledge with 5 carefully selected questions covering various topics including geography, science, history, and current affairs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-blue-200 p-6 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {questionsLoading ? '...' : roundQuestions.length}
                </div>
                <div className="text-gray-700 font-semibold">Questions</div>
                <div className="text-sm text-gray-500 mt-1">Multiple Choice</div>
              </div>

              <div className="bg-white border-2 border-green-200 p-6 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {questionsLoading ? '...' : roundQuestions.length > 0 ? roundQuestions[0].points : 1}
                </div>
                <div className="text-gray-700 font-semibold">Points Each</div>
                <div className="text-sm text-gray-500 mt-1">
                  Maximum Score: {questionsLoading ? '...' : roundQuestions.length * (roundQuestions.length > 0 ? roundQuestions[0].points : 1)}
                </div>
              </div>

              <div className="bg-white border-2 border-purple-200 p-6 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">5</div>
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
                    <li>• Read each question carefully before selecting your answer</li>
                    <li>• You can skip questions and return to them later</li>
                    <li>• Once you submit, you cannot change your answers</li>
                    <li>• Make sure you have a stable internet connection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

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
                    <h3 className="text-2xl font-bold text-green-800">Round 1 Completed!</h3>
                    <p className="text-green-600">Your Score: {roundScore} points</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSeeResults}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-12 py-4 rounded-xl text-xl font-bold hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/30 transition-all duration-300 transform"
              >
                See Results & Leaderboard
                <span className="ml-2">📊</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Round 1 is always available - removed admin check message */}

              <button
                onClick={handleStartRound1}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-xl text-xl font-bold hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Starting Quiz...</span>
                  </div>
                ) : (
                  <>
                    Start Round 1
                    <span className="ml-2">→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Round1