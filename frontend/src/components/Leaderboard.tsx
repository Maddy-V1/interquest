import { useState, useEffect } from 'react'

interface LeaderboardEntry {
  user_id: string
  first_name: string
  last_name: string
  full_name: string
  total_score: number
  total_questions: number
  correct_answers: number
  completed_at: string
  rank: number
}

interface LeaderboardProps {
  roundNumber: number
  title?: string
  className?: string
  currentUserId?: string
}

function Leaderboard({ roundNumber, title, className = "", currentUserId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [roundNumber])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/leaderboard/round/${roundNumber}`)
      
      const data = await response.json()
      
      if (data.success) {
        setLeaderboard(data.leaderboard || [])
      } else {
        setError('Failed to fetch leaderboard')
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError('Failed to load leaderboard')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoundColors = (round: number) => {
    switch (round) {
      case 1:
        return {
          gradient: 'from-blue-500 to-purple-600',
          border: 'border-blue-200',
          text: 'text-blue-600',
          bg: 'bg-blue-50',
          accent: 'bg-blue-500'
        }
      case 2:
        return {
          gradient: 'from-green-500 to-teal-600',
          border: 'border-green-200',
          text: 'text-green-600',
          bg: 'bg-green-50',
          accent: 'bg-green-500'
        }
      case 3:
        return {
          gradient: 'from-purple-500 to-indigo-600',
          border: 'border-purple-200',
          text: 'text-purple-600',
          bg: 'bg-purple-50',
          accent: 'bg-purple-500'
        }
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          border: 'border-gray-200',
          text: 'text-gray-600',
          bg: 'bg-gray-50',
          accent: 'bg-gray-500'
        }
    }
  }

  const colors = getRoundColors(roundNumber)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRankDisplay = (index: number) => {
    if (index === 0) return { emoji: '🏆', text: '1st', class: 'text-yellow-600 bg-yellow-100' }
    if (index === 1) return { emoji: '🥈', text: '2nd', class: 'text-gray-600 bg-gray-100' }
    if (index === 2) return { emoji: '🥉', text: '3rd', class: 'text-orange-600 bg-orange-100' }
    return { emoji: '', text: `${index + 1}`, class: 'text-gray-700 bg-gray-50' }
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-8 ${className}`}>
      <div className="text-center mb-8">
        <h2 className={`text-4xl font-bold text-transparent bg-gradient-to-r ${colors.gradient} bg-clip-text mb-4`}>
          {title || `Round ${roundNumber} Leaderboard`}
        </h2>
        <p className="text-gray-600">
          {leaderboard.length === 0 ? 'No participants yet' : `${leaderboard.length} participant${leaderboard.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-8 text-center`}>
          <div className={`${colors.text} mb-4`}>
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className={`text-xl font-semibold ${colors.text} mb-2`}>No Results Yet</h3>
          <p className="text-gray-600">Be the first to complete Round {roundNumber}!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const rankInfo = getRankDisplay(index)
            const isCurrentUser = currentUserId === entry.user_id
            
            return (
              <div
                key={entry.user_id}
                className={`relative flex items-center p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  isCurrentUser
                    ? `bg-gradient-to-r ${colors.gradient} text-white border-transparent shadow-lg`
                    : index === 0
                    ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
                    : `bg-white ${colors.border} hover:${colors.bg}`
                }`}
              >
                {/* Current User Indicator */}
                {isCurrentUser && (
                  <div className="absolute -top-2 -right-2 bg-white text-xs px-2 py-1 rounded-full shadow-md">
                    <span className="text-gray-700 font-semibold">You</span>
                  </div>
                )}
                
                {/* Rank */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg mr-4 ${
                  isCurrentUser
                    ? 'bg-white/20 text-white'
                    : rankInfo.class
                }`}>
                  {rankInfo.emoji || rankInfo.text}
                </div>
                
                {/* User Avatar */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm mr-4 ${
                  isCurrentUser
                    ? 'bg-white/20 text-white'
                    : `${colors.accent} text-white`
                }`}>
                  {getInitials(entry.first_name, entry.last_name)}
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold text-lg ${
                      isCurrentUser ? 'text-white' : 'text-gray-800'
                    }`}>
                      {entry.full_name}
                    </h3>
                    {index < 3 && !isCurrentUser && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        index === 0 ? 'bg-yellow-200 text-yellow-800' :
                        index === 1 ? 'bg-gray-200 text-gray-800' :
                        'bg-orange-200 text-orange-800'
                      }`}>
                        {rankInfo.text} Place
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <p className={`text-sm ${
                      isCurrentUser ? 'text-white/90' : 'text-gray-600'
                    }`}>
                      {entry.correct_answers}/{entry.total_questions} correct
                    </p>
                    <p className={`text-xs ${
                      isCurrentUser ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      Completed: {new Date(entry.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {/* Score */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${
                    isCurrentUser ? 'text-white' : colors.text
                  }`}>
                    {entry.total_score}
                  </div>
                  <div className={`text-sm ${
                    isCurrentUser ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    points
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={fetchLeaderboard}
          className={`px-6 py-3 bg-gradient-to-r ${colors.gradient} text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200`}
        >
          Refresh Leaderboard
        </button>
      </div>
    </div>
  )
}

export default Leaderboard