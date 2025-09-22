import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authUtils } from '../lib/auth'
import Leaderboard from './Leaderboard'
import BrandingHeader from './BrandingHeader'

interface LocationState {
  roundNumber: number
  score: number
  correctAnswers: number
  totalQuestions: number
}

function QuizResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const { roundNumber, score, correctAnswers, totalQuestions } = (location.state as LocationState) || { 
    roundNumber: 1,
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0
  }
  const [userSession, setUserSession] = useState(authUtils.getUserSession())
  const [userApprovals, setUserApprovals] = useState({
    round2_approved: false,
    round3_approved: false
  })

  // Redirect to login if no user session
  useEffect(() => {
    if (!userSession?.userId) {
      navigate('/')
      return
    }
    loadUserApprovals()
  }, [userSession, navigate])

  const { firstName, lastName, userId } = userSession || { firstName: '', lastName: '', userId: '' }

  const loadUserApprovals = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUserApprovals({
            round2_approved: data.user.round2_approved || false,
            round3_approved: data.user.round3_approved || false
          })
        }
      }
    } catch (error) {
      console.error('Error loading user approvals:', error)
    }
  }

  const percentage = Math.round((correctAnswers / totalQuestions) * 100)
  const pointsPerQuestion = 1 // All questions are worth 1 point now
  const maxScore = totalQuestions * pointsPerQuestion

  const getRoundInfo = (round: number) => {
    switch (round) {
      case 1: return { 
        name: 'General Knowledge', 
        color: 'blue', 
        gradient: 'from-blue-500 to-blue-600',
        bgGradient: 'from-blue-500 via-indigo-500 to-purple-600'
      }
      case 2: return { 
        name: 'Science & Technology', 
        color: 'green', 
        gradient: 'from-green-500 to-green-600',
        bgGradient: 'from-green-500 via-emerald-500 to-teal-600'
      }
      case 3: return { 
        name: 'Advanced Knowledge', 
        color: 'purple', 
        gradient: 'from-purple-500 to-purple-600',
        bgGradient: 'from-purple-500 via-violet-500 to-indigo-600'
      }
      default: return { 
        name: 'Quiz', 
        color: 'gray', 
        gradient: 'from-gray-500 to-gray-600',
        bgGradient: 'from-gray-500 to-gray-600'
      }
    }
  }

  const roundInfo = getRoundInfo(roundNumber)

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { message: "Outstanding! You're a quiz master!", emoji: "🏆", color: "text-green-600" }
    if (percentage >= 80) return { message: "Excellent work! Well done!", emoji: "🎉", color: "text-green-600" }
    if (percentage >= 70) return { message: "Good job! Keep it up!", emoji: "👍", color: "text-blue-600" }
    if (percentage >= 60) return { message: "Not bad! Room for improvement.", emoji: "👌", color: "text-yellow-600" }
    return { message: "Keep practicing! You'll get better!", emoji: "💪", color: "text-orange-600" }
  }

  const performance = getPerformanceMessage(percentage)

  const handleBackToHome = () => {
    navigate('/home')
  }

  const handleNextRound = () => {
    if (roundNumber < 3) {
      const nextRound = roundNumber + 1
      if (nextRound === 2 && !userApprovals.round2_approved) {
        alert('Round 2 is pending admin approval. Please wait for approval.')
        return
      }
      if (nextRound === 3 && !userApprovals.round3_approved) {
        alert('Round 3 is pending admin approval. Please wait for approval.')
        return
      }
      navigate(`/round${nextRound}`)
    } else {
      // All rounds completed
      navigate('/home')
    }
  }

  const getNextRoundStatus = () => {
    if (roundNumber >= 3) return null
    
    const nextRound = roundNumber + 1
    if (nextRound === 2) {
      return userApprovals.round2_approved ? 'available' : 'pending_approval'
    }
    if (nextRound === 3) {
      return userApprovals.round3_approved ? 'available' : 'pending_approval'
    }
    return 'available'
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${roundInfo.bgGradient} p-4 lg:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <BrandingHeader 
          subtitle={`${firstName} ${lastName} - Round ${roundNumber} Results`}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results Content */}
          <div className="lg:col-span-2">

        {/* Results Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{performance.emoji}</div>
            <h2 className={`text-3xl font-bold ${performance.color} mb-4`}>
              {performance.message}
            </h2>
            <p className="text-lg text-gray-600">
              You completed {roundInfo.name} with flying colors!
            </p>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-4xl font-bold text-blue-600 mb-2">{score}</div>
              <div className="text-gray-600">Total Score</div>
              <div className="text-sm text-gray-500">out of {maxScore}</div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-4xl font-bold text-green-600 mb-2">{correctAnswers}</div>
              <div className="text-gray-600">Correct Answers</div>
              <div className="text-sm text-gray-500">out of {totalQuestions}</div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-4xl font-bold text-purple-600 mb-2">{percentage}%</div>
              <div className="text-gray-600">Accuracy</div>
              <div className="text-sm text-gray-500">Performance</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Performance</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`bg-gradient-to-r ${roundInfo.gradient} h-4 rounded-full transition-all duration-1000`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Round Details */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Round {roundNumber} Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Round Name:</span>
                <span className="font-medium">{roundInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Questions:</span>
                <span className="font-medium">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Points per Question:</span>
                <span className="font-medium">{pointsPerQuestion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Correct Answers:</span>
                <span className="font-medium text-green-600">{correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incorrect Answers:</span>
                <span className="font-medium text-red-600">{totalQuestions - correctAnswers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Final Score:</span>
                <span className="font-medium text-blue-600">{score}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleBackToHome}
              className="bg-gray-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </button>
            
            {roundNumber < 3 && (() => {
              const nextRoundStatus = getNextRoundStatus()
              if (nextRoundStatus === 'pending_approval') {
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-yellow-800 font-semibold">Round {roundNumber + 1} Pending Approval</span>
                    </div>
                    <p className="text-yellow-700 text-sm">Please wait for admin approval to access Round {roundNumber + 1}</p>
                  </div>
                )
              }
              return (
                <button
                  onClick={handleNextRound}
                  className={`bg-gradient-to-r ${roundInfo.gradient} text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200`}
                >
                  Continue to Round {roundNumber + 1}
                </button>
              )
            })()}
          </div>
        </div>

            {/* Achievement Badge */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Achievement Unlocked!</h3>
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-lg text-gray-600 mb-4">
                You've successfully completed Round {roundNumber} of InterQuest!
              </p>
              {roundNumber < 3 && (
                <p className="text-sm text-gray-500">
                  Round {roundNumber + 1} is now available for you to attempt.
                </p>
              )}
            </div>
          </div>
          
          {/* Sidebar Leaderboard */}
          <div className="lg:col-span-1">
            <Leaderboard 
              roundNumber={roundNumber} 
              currentUserId={userId}
              title={`Round ${roundNumber} Leaderboard`}
              className="sticky top-4"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizResults
