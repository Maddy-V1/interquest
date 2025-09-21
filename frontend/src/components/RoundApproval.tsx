import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../lib/auth'

interface User {
  id: string
  first_name: string
  last_name: string
  round2_approved: boolean
  round3_approved: boolean
  created_at: string
}

function RoundApproval() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Check admin authentication
  useEffect(() => {
    if (!authUtils.isAdminLoggedIn()) {
      navigate('/admin/login')
      return
    }
  }, [navigate])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        setError('Failed to load users')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Error loading users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoundApprovalChange = (userId: string, round: 'round2' | 'round3', approved: boolean) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, [round]: approved }
          : user
      )
    )
  }

  const handleSaveApprovals = async () => {
    try {
      setIsSaving(true)
      setError('')
      setSuccess('')

      const round2Approvals = users.map(user => ({
        userId: user.id,
        approved: user.round2_approved
      }))

      const round3Approvals = users.map(user => ({
        userId: user.id,
        approved: user.round3_approved
      }))

      const response = await fetch('/api/admin/round-approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          round2_approvals: round2Approvals,
          round3_approvals: round3Approvals
        })
      })

      if (response.ok) {
        setSuccess('Round approvals updated successfully!')
        // Reload users to get updated data
        loadUsers()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to save approvals')
      }
    } catch (error) {
      console.error('Error saving approvals:', error)
      setError('Error saving approvals')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBackToDashboard = () => {
    navigate('/admin/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
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
              <button
                onClick={handleBackToDashboard}
                className="bg-gray-500 text-white p-2 rounded-lg mr-3 hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Round Approvals</h1>
                <p className="text-sm text-gray-500">Manage user access to Round 2 and Round 3</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 font-medium">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Check the boxes to approve users for Round 2 and Round 3</li>
            <li>• Unchecked users will be greyed out and cannot access those rounds</li>
            <li>• Click "Save Approvals" to update all changes at once</li>
            <li>• Round 1 is always accessible to all users</li>
          </ul>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">User Round Approvals</h2>
            <p className="text-sm text-gray-500 mt-1">{users.length} total users</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Round 2 Access
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Round 3 Access
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={!user.round2_approved || !user.round3_approved ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={user.round2_approved}
                          onChange={(e) => handleRoundApprovalChange(user.id, 'round2', e.target.checked)}
                          className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <span className={`ml-2 text-sm ${user.round2_approved ? 'text-green-600' : 'text-gray-400'}`}>
                          {user.round2_approved ? 'Approved' : 'Not Approved'}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={user.round3_approved}
                          onChange={(e) => handleRoundApprovalChange(user.id, 'round3', e.target.checked)}
                          className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className={`ml-2 text-sm ${user.round3_approved ? 'text-purple-600' : 'text-gray-400'}`}>
                          {user.round3_approved ? 'Approved' : 'Not Approved'}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Back to Dashboard
          </button>
          
          <button
            onClick={handleSaveApprovals}
            disabled={isSaving}
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Approvals'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoundApproval
