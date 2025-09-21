import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Question {
  id?: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  round_number: number
  category: string
  points: number
  difficulty: 'easy' | 'medium' | 'hard'
}

function QuestionManagement() {
  const [selectedRound, setSelectedRound] = useState(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const [formData, setFormData] = useState<Question>({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    round_number: 1,
    category: '',
    points: 100,
    difficulty: 'medium'
  })

  // Check admin authentication
  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated')
    if (!isAuthenticated) {
      navigate('/admin/login')
      return
    }
  }, [navigate])

  // Load questions when round changes
  useEffect(() => {
    loadQuestions()
  }, [selectedRound])

  const loadQuestions = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/rounds/${selectedRound}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
      } else {
        setError('Failed to load questions')
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      setError('Error loading questions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddQuestion = () => {
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      round_number: selectedRound,
      category: '',
      points: selectedRound === 1 ? 100 : selectedRound === 2 ? 150 : 200,
      difficulty: 'medium'
    })
    setEditingQuestion(null)
    setShowAddForm(true)
  }

  const handleEditQuestion = (question: Question) => {
    setFormData({ ...question })
    setEditingQuestion(question)
    setShowAddForm(true)
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.question_text.trim() || !formData.option_a.trim() || 
        !formData.option_b.trim() || !formData.option_c.trim() || 
        !formData.option_d.trim() || !formData.category.trim()) {
      setError('All fields are required')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      const url = editingQuestion 
        ? `/api/admin/questions/${editingQuestion.id}` 
        : '/api/admin/questions'
      
      const method = editingQuestion ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess(editingQuestion ? 'Question updated successfully!' : 'Question added successfully!')
        setShowAddForm(false)
        loadQuestions()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to save question')
      }
    } catch (error) {
      console.error('Error saving question:', error)
      setError('Error saving question')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Question deleted successfully!')
        loadQuestions()
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to delete question')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      setError('Error deleting question')
    } finally {
      setIsLoading(false)
    }
  }

  const roundInfo = {
    1: { name: 'General Knowledge', defaultPoints: 100, color: 'blue' },
    2: { name: 'Science & Technology', defaultPoints: 150, color: 'green' },
    3: { name: 'Advanced Knowledge', defaultPoints: 200, color: 'purple' }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="bg-gray-500 text-white p-2 rounded-lg mr-3 hover:bg-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Question Management</h1>
                <p className="text-sm text-gray-500">Add, edit, and delete quiz questions</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Round Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Round</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((round) => (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedRound === round
                    ? `border-${roundInfo[round as keyof typeof roundInfo].color}-500 bg-${roundInfo[round as keyof typeof roundInfo].color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Round {round}</h3>
                  <p className="text-sm text-gray-600">{roundInfo[round as keyof typeof roundInfo].name}</p>
                  <p className="text-xs text-gray-500">{roundInfo[round as keyof typeof roundInfo].defaultPoints} points each</p>
                </div>
              </button>
            ))}
          </div>
        </div>

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

        {/* Add Question Button */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Round {selectedRound} Questions ({questions.length})
            </h2>
            <button
              onClick={handleAddQuestion}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Question
            </button>
          </div>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first question for Round {selectedRound}</p>
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                        Q{index + 1}
                      </span>
                      <span className={`bg-${question.difficulty === 'easy' ? 'green' : question.difficulty === 'medium' ? 'yellow' : 'red'}-100 text-${question.difficulty === 'easy' ? 'green' : question.difficulty === 'medium' ? 'yellow' : 'red'}-800 text-sm font-medium px-2.5 py-0.5 rounded capitalize`}>
                        {question.difficulty}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
                        {question.category}
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded">
                        {question.points} pts
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id!)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 112 0v4a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v4a1 1 0 11-2 0V9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{question.question_text}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div
                        key={option}
                        className={`p-3 rounded-lg border ${
                          question.correct_answer === option
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                            question.correct_answer === option
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {option}
                          </span>
                          <span className="text-gray-700">
                            {question[`option_${option.toLowerCase()}` as keyof Question]}
                          </span>
                          {question.correct_answer === option && (
                            <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitQuestion} className="space-y-6">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter the question..."
                    required
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <div key={option}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option {option} *
                      </label>
                      <input
                        type="text"
                        value={formData[`option_${option.toLowerCase()}` as keyof Question] as string}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          [`option_${option.toLowerCase()}`]: e.target.value 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Enter option ${option}...`}
                        required
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <select
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>

                {/* Category, Points, Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Geography"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuestionManagement