import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../lib/auth'

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    round1Completed: 0,
    round2Completed: 0,
    round3Completed: 0,
    avgScore: 0
  })
  const [round1Leaderboard, setRound1Leaderboard] = useState([])
  const [round2Leaderboard, setRound2Leaderboard] = useState([])
  const [round3Leaderboard, setRound3Leaderboard] = useState([])
  const [showRound2Approval, setShowRound2Approval] = useState(false)
  const [showRound3Approval, setShowRound3Approval] = useState(false)
  const [selectedForRound2, setSelectedForRound2] = useState<string[]>([])
  const [selectedForRound3, setSelectedForRound3] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const navigate = useNavigate()

  // Check admin authentication
  useEffect(() => {
    if (!authUtils.isAdminLoggedIn()) {
      navigate('/admin/login')
      return
    }
  }, [navigate])

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch admin stats
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }
      
      // Fetch all leaderboards
      await Promise.all([
        loadRound1Leaderboard(),
        loadRound2Leaderboard(),
        loadRound3Leaderboard()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setStats({
        totalUsers: 0,
        totalSessions: 0,
        round1Completed: 0,
        round2Completed: 0,
        round3Completed: 0,
        avgScore: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadRound1Leaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard/round/1?limit=50')
      if (response.ok) {
        const data = await response.json()
        setRound1Leaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Error loading Round 1 leaderboard:', error)
    }
  }

  const loadRound2Leaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard/round/2?limit=50')
      if (response.ok) {
        const data = await response.json()
        setRound2Leaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Error loading Round 2 leaderboard:', error)
    }
  }

  const loadRound3Leaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard/round/3?limit=50')
      if (response.ok) {
        const data = await response.json()
        setRound3Leaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Error loading Round 3 leaderboard:', error)
    }
  }

  const handleLogout = () => {
    authUtils.clearAdminSession()
    navigate('/admin/login')
  }

  const handleShowRound2Approval = () => {
    setShowRound2Approval(true)
    setSelectedForRound2([])
  }

  const handleShowRound3Approval = () => {
    setShowRound3Approval(true)
    setSelectedForRound3([])
  }

  const handleUserSelection = (userId: string, roundNumber: number) => {
    if (roundNumber === 2) {
      setSelectedForRound2(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      )
    } else if (roundNumber === 3) {
      setSelectedForRound3(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      )
    }
  }

  const handleApproveUsers = async (roundNumber: number) => {
    try {
      setIsApproving(true)
      const selectedUsers = roundNumber === 2 ? selectedForRound2 : selectedForRound3
      
      if (selectedUsers.length === 0) {
        alert('Please select at least one user to approve.')
        return
      }

      // Approve selected users
      const approvals = selectedUsers.map(userId => ({
        userId,
        approved: true
      }))

      const approvalData = roundNumber === 2 
        ? { round2_approvals: approvals }
        : { round3_approvals: approvals }

      const response = await fetch('/api/admin/round-approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData)
      })

      if (response.ok) {
        alert(`Successfully approved ${selectedUsers.length} users for Round ${roundNumber}!`)
        
        // Refresh leaderboards
        if (roundNumber === 2) {
          await loadRound2Leaderboard()
          setShowRound2Approval(false)
          setSelectedForRound2([])
        } else {
          await loadRound3Leaderboard()
          setShowRound3Approval(false)
          setSelectedForRound3([])
        }
      } else {
        throw new Error('Failed to approve users')
      }
    } catch (error) {
      console.error('Error approving users:', error)
      alert('Failed to approve users. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  const handleCancelApproval = (roundNumber: number) => {
    if (roundNumber === 2) {
      setShowRound2Approval(false)
      setSelectedForRound2([])
    } else {
      setShowRound3Approval(false)
      setSelectedForRound3([])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-2 rounded-lg mr-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">InterQuest Admin</h1>
                <p className="text-sm text-gray-500">Dashboard & Control Panel</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">{stats.avgScore}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Round Control & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/admin/questions')}
                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Manage Questions</h3>
                    <p className="text-sm text-gray-500">Add, edit, and delete quiz questions</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Export Data</h3>
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Round Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Round Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Round 1 Completed</span>
                <span className="font-semibold text-blue-600">{stats.round1Completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Round 2 Completed</span>
                <span className="font-semibold text-green-600">{stats.round2Completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Round 3 Completed</span>
                <span className="font-semibold text-purple-600">{stats.round3Completed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Round Leaderboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Round 1 Leaderboard */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blue-600">Round 1 Leaderboard</h2>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {round1Leaderboard.length} participants
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {round1Leaderboard.length > 0 ? (
                round1Leaderboard.map((user: any, index) => (
                  <div key={user.user_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.correct_answers}/{user.total_questions} correct</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{user.total_score}</p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No participants yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Round 2 Leaderboard */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-green-600">Round 2 Leaderboard</h2>
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {round2Leaderboard.length} approved
                </div>
                <button
                  onClick={handleShowRound2Approval}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            
            {showRound2Approval ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3">Select Round 1 participants for Round 2:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {round1Leaderboard.map((user: any) => (
                      <label key={user.user_id} className="flex items-center gap-3 p-2 hover:bg-green-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedForRound2.includes(user.user_id)}
                          onChange={() => handleUserSelection(user.user_id, 2)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-600">Score: {user.total_score}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleApproveUsers(2)}
                      disabled={isApproving || selectedForRound2.length === 0}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApproving ? 'Approving...' : `Approve ${selectedForRound2.length} Users`}
                    </button>
                    <button
                      onClick={() => handleCancelApproval(2)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {round2Leaderboard.length > 0 ? (
                  round2Leaderboard.map((user: any, index) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.correct_answers}/{user.total_questions} correct</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{user.total_score}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No approved participants yet</p>
                    <p className="text-sm">Click "Add" to approve users</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Round 3 Leaderboard */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-purple-600">Round 3 Leaderboard</h2>
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  {round3Leaderboard.length} approved
                </div>
                <button
                  onClick={handleShowRound3Approval}
                  className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            
            {showRound3Approval ? (
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-3">Select Round 2 participants for Round 3:</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {round2Leaderboard.map((user: any) => (
                      <label key={user.user_id} className="flex items-center gap-3 p-2 hover:bg-purple-100 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedForRound3.includes(user.user_id)}
                          onChange={() => handleUserSelection(user.user_id, 3)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-600">Score: {user.total_score}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleApproveUsers(3)}
                      disabled={isApproving || selectedForRound3.length === 0}
                      className="bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApproving ? 'Approving...' : `Approve ${selectedForRound3.length} Users`}
                    </button>
                    <button
                      onClick={() => handleCancelApproval(3)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {round3Leaderboard.length > 0 ? (
                  round3Leaderboard.map((user: any, index) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.correct_answers}/{user.total_questions} correct</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{user.total_score}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No approved participants yet</p>
                    <p className="text-sm">Click "Add" to approve users</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard