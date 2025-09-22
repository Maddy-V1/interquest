import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserService from '../lib/userService'
import { authUtils } from '../lib/auth'
import BrandingHeader from './BrandingHeader'

function Home() {
  const navigate = useNavigate()
  const [userSession] = useState(authUtils.getUserSession())

  const [userProgress, setUserProgress] = useState({
    completedRounds: [] as number[],
    totalScore: 0,
    averageScore: 0
  })
  const [userApprovals, setUserApprovals] = useState({
    round2_approved: false,
    round3_approved: false
  })
  const [isLoading, setIsLoading] = useState(true)

  // Redirect to login if no user session
  useEffect(() => {
    if (!userSession?.userId) {
      navigate('/')
      return
    }
    loadUserProgress()
  }, [userSession, navigate])

  const { firstName, lastName, userId } = userSession || { firstName: '', lastName: '', userId: '' }

  const loadUserProgress = async () => {
    try {
      setIsLoading(true)
      const progress = await UserService.getUserProgress(userId)
      setUserProgress(progress)

      // Load user approval status
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
      console.error('Error loading user progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoundClick = async (roundNumber: number) => {
    try {
      // Check if user can access this round
      const canAccess = await UserService.canAccessRound(userId, roundNumber)

      if (!canAccess) {
        alert(`You need to complete Round ${roundNumber - 1} first!`)
        return
      }

      // Navigate to the round page
      navigate(`/round${roundNumber}`)
    } catch (error) {
      console.error('Error checking round access:', error)
      alert('Error checking round access. Please try again.')
    }
  }

  const handleLogout = () => {
    authUtils.clearAllSessions()
    navigate('/')
  }

  const roundInfo = {
    1: {
      name: 'General Knowledge',
      description: 'Test your basic knowledge across various topics',
      points: 100,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    2: {
      name: 'Science & Technology',
      description: 'Advanced questions about science and technology',
      points: 150,
      color: 'green',
      gradient: 'from-green-500 to-green-600'
    },
    3: {
      name: 'Advanced Knowledge',
      description: 'Expert-level questions for the ultimate challenge',
      points: 200,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <BrandingHeader
          subtitle={`Welcome back, ${firstName} ${lastName}!`}
        />

        {/* Progress Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold">
                Your Progress
              </div>
              <div className="text-gray-600">
                <div className="text-sm">
                  {userProgress.completedRounds.length} of 3 rounds completed
                </div>
                <div className="text-sm">
                  Total Score: {userProgress.totalScore}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {userProgress.completedRounds.length}
            </div>
            <div className="text-gray-600">Rounds Completed</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {userProgress.totalScore}
            </div>
            <div className="text-gray-600">Total Score</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {userProgress.averageScore}
            </div>
            <div className="text-gray-600">Average Score</div>
          </div>
        </div>

        {/* Round Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((round) => {
            const isCompleted = userProgress.completedRounds.includes(round)
            const isLocked = round > 1 && !userProgress.completedRounds.includes(round - 1)
            const needsApproval = (round === 2 && !userApprovals.round2_approved) || (round === 3 && !userApprovals.round3_approved)
            const roundData = roundInfo[round as keyof typeof roundInfo]

            return (
              <div
                key={round}
                className={`bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300 ${isLocked || needsApproval
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-3xl hover:-translate-y-2 cursor-pointer'
                  }`}
                onClick={() => !isLocked && !needsApproval && handleRoundClick(round)}
              >
                <div className="text-center">
                  {/* Round Status Icon */}
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isCompleted
                    ? 'bg-green-100'
                    : needsApproval
                      ? 'bg-yellow-100'
                      : isLocked
                        ? 'bg-gray-100'
                        : `bg-${roundData.color}-100`
                    }`}>
                    {isCompleted ? (
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : needsApproval ? (
                      <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : isLocked ? (
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className={`text-2xl font-bold text-${roundData.color}-600`}>
                        {round}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-2xl font-bold mb-2 ${isCompleted ? 'text-green-600' : needsApproval ? 'text-yellow-600' : isLocked ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                    Round {round}
                  </h3>

                  <h4 className={`text-lg font-semibold mb-2 ${isCompleted ? 'text-green-600' : needsApproval ? 'text-yellow-600' : isLocked ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                    {roundData.name}
                  </h4>

                  <p className={`text-sm mb-4 ${isLocked || needsApproval ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    {needsApproval ? 'Pending admin approval' : roundData.description}
                  </p>

                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${isCompleted
                    ? 'bg-green-100 text-green-800'
                    : needsApproval
                      ? 'bg-yellow-100 text-yellow-800'
                      : isLocked
                        ? 'bg-gray-100 text-gray-500'
                        : `bg-${roundData.color}-100 text-${roundData.color}-800`
                    }`}>
                    {isCompleted ? 'Completed' : needsApproval ? 'Pending Approval' : isLocked ? 'Locked' : '1 point per question'}
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    {isCompleted ? (
                      <div className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold">
                        ✓ Completed
                      </div>
                    ) : isLocked ? (
                      <div className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-semibold">
                        🔒 Locked
                      </div>
                    ) : (
                      <div className={`bg-gradient-to-r ${roundData.gradient} text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200`}>
                        Start Round {round}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home
