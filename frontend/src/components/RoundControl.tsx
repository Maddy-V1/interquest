import { useState, useEffect } from 'react'

interface RoundControlProps {
  roundNumber: number
  onStatusChange?: (status: 'stopped' | 'active') => void
}

function RoundControl({ roundNumber, onStatusChange }: RoundControlProps) {
  const [roundStatus, setRoundStatus] = useState<'stopped' | 'active'>('stopped')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadRoundStatus()
  }, [roundNumber])

  const loadRoundStatus = async () => {
    try {
      const response = await fetch(`/api/admin/round-status/${roundNumber}`)
      if (response.ok) {
        const data = await response.json()
        setRoundStatus(data.status || 'stopped')
      }
    } catch (error) {
      console.error('Error loading round status:', error)
    }
  }

  const handleToggleRound = async () => {
    try {
      setIsLoading(true)
      const newStatus = roundStatus === 'active' ? 'stopped' : 'active'

      console.log(`Attempting to ${newStatus} Round ${roundNumber}`)

      const response = await fetch(`/api/admin/round-control/${roundNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      console.log('Round control response:', data)

      if (response.ok && data.success) {
        setRoundStatus(newStatus)
        onStatusChange?.(newStatus)
        alert(`Round ${roundNumber} ${newStatus === 'active' ? 'started' : 'stopped'} successfully!`)
      } else {
        console.error('Round control failed:', data)
        throw new Error(data.error || 'Failed to update round status')
      }
    } catch (error) {
      console.error('Error toggling round:', error)
      alert(`Failed to update round status: ${(error as Error).message}. Check console for details.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Round {roundNumber} Control</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${roundStatus === 'active'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
          }`}>
          {roundStatus === 'active' ? '🟢 Active' : '🔴 Stopped'}
        </div>
      </div>

      <p className="text-gray-600 mb-4">
        {roundStatus === 'active'
          ? 'Participants can start and submit Round 1 quizzes.'
          : 'Round 1 is currently stopped. Participants cannot start or submit quizzes.'
        }
      </p>

      <button
        onClick={handleToggleRound}
        disabled={isLoading}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${roundStatus === 'active'
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Updating...</span>
          </div>
        ) : (
          <>
            {roundStatus === 'active' ? 'Stop Round 1' : 'Start Round 1'}
          </>
        )}
      </button>
    </div>
  )
}

export default RoundControl