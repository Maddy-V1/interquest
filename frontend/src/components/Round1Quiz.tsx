import { useLocation, useNavigate } from 'react-router-dom'

interface LocationState {
  firstName: string
  lastName: string
  userId: string
  sessionId: string
}

function Round1Quiz() {
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
                {firstName} {lastName} - Round 1 Quiz
              </p>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold">
                Round 1
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Question 1 of 5
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              General Knowledge Quiz
            </h2>
            <p className="text-lg text-gray-600">
              Answer all questions to complete Round 1
            </p>
          </div>

          {/* Sample Question */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Question 1 of 5
              </h3>
              <p className="text-lg text-gray-700">
                What is the capital city of France?
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {['A) London', 'B) Berlin', 'C) Paris', 'D) Madrid'].map((option, index) => (
                <button
                  key={index}
                  className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <button className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors">
                Previous
              </button>
              
              <div className="flex gap-4">
                <button className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                  Skip Question
                </button>
                <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200">
                  Next Question
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>1 of 5 questions</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-gray-600">Total Questions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-gray-600">Answered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">0</div>
              <div className="text-gray-600">Skipped</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">100</div>
              <div className="text-gray-600">Points Each</div>
            </div>
          </div>
        </div>

        {/* Timer (dummy for now) */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-8">
          <div className="flex justify-center items-center">
            <div className="bg-red-100 border border-red-200 rounded-lg px-6 py-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 font-semibold">Time Remaining: 04:32</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Round1Quiz