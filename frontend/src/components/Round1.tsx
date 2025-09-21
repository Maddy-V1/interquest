import { useLocation, useNavigate } from 'react-router-dom'

interface LocationState {
  firstName: string
  lastName: string
  userId: string
  sessionId: string
}

function Round1() {
  const location = useLocation()
  const navigate = useNavigate()
  const { firstName, lastName, userId, sessionId } = (location.state as LocationState) || { 
    firstName: '', 
    lastName: '', 
    userId: '', 
    sessionId: '' 
  }

  // Redirect to login if no user data
  if (!firstName || !lastName || !userId || !sessionId) {
    navigate('/')
    return null
  }

  const handleStartRound1 = () => {
    navigate('/round1-quiz', { 
      state: { 
        firstName, 
        lastName,
        userId,
        sessionId
      } 
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
                InterQuest
              </h1>
              <p className="text-gray-600 mt-2">
                Welcome, {firstName} {lastName}!
              </p>
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
                <div className="text-3xl font-bold text-blue-600 mb-2">5</div>
                <div className="text-gray-700 font-semibold">Questions</div>
                <div className="text-sm text-gray-500 mt-1">Multiple Choice</div>
              </div>
              
              <div className="bg-white border-2 border-green-200 p-6 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">100</div>
                <div className="text-gray-700 font-semibold">Points Each</div>
                <div className="text-sm text-gray-500 mt-1">Maximum Score: 500</div>
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
          
          {/* Start Button - This will be replaced by admin functionality later */}
          <button 
            onClick={handleStartRound1}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-xl text-xl font-bold hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform"
          >
            Start Round 1
            <span className="ml-2">→</span>
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            This button will be replaced with admin controls in the final version
          </p>
        </div>
      </div>
    </div>
  )
}

export default Round1