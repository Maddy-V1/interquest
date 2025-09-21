import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import UserService from '../lib/userService'
import { authUtils } from '../lib/auth'

interface LocationState {
  sessionId: string
}

interface Question {
  id: string
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

interface QuizAnswer {
  questionId: string
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null
  isCorrect: boolean
}

interface QuizProps {
  roundNumber: number
}

function Quiz({ roundNumber }: QuizProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId } = (location.state as LocationState) || { sessionId: '' }
  const [userSession, setUserSession] = useState(authUtils.getUserSession())

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes in seconds
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Redirect to login if no user session or session ID
  useEffect(() => {
    if (!userSession?.userId || !sessionId) {
      navigate('/')
      return
    }
  }, [userSession, sessionId, navigate])

  const { firstName, lastName, userId } = userSession || { firstName: '', lastName: '', userId: '' }
  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    loadQuestions()
  }, [])

  // Update selected answer when question changes
  useEffect(() => {
    if (currentQuestion && answers.length > 0) {
      const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)
      setSelectedAnswer(currentAnswer?.selectedAnswer || null)
    }
  }, [currentQuestionIndex, currentQuestion, answers])

  useEffect(() => {
    // Load existing answer for current question
    const existingAnswer = answers.find(a => a.questionId === currentQuestion?.id)
    setSelectedAnswer(existingAnswer?.selectedAnswer || null)
  }, [currentQuestionIndex, answers, currentQuestion])

  useEffect(() => {
    // Timer countdown
    if (timeRemaining > 0 && !quizCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && !quizCompleted) {
      handleSubmitQuiz()
    }
  }, [timeRemaining, quizCompleted])

  const loadQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/rounds/${roundNumber}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || [])
        
        // Initialize answers array
        const initialAnswers = (data.questions || []).map((q: Question) => ({
          questionId: q.id,
          selectedAnswer: null,
          isCorrect: false
        }))
        setAnswers(initialAnswers)
      } else {
        alert('Failed to load questions. Please try again.')
        navigate('/home', { state: { firstName, lastName, userId } })
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      alert('Error loading questions. Please try again.')
      navigate('/home', { state: { firstName, lastName, userId } })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    setSelectedAnswer(answer)
    
    // Update answers array
    const updatedAnswers = answers.map(a => 
      a.questionId === currentQuestion.id 
        ? { 
            ...a, 
            selectedAnswer: answer,
            isCorrect: answer === currentQuestion.correct_answer
          }
        : a
    )
    setAnswers(updatedAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSkipQuestion = () => {
    // Mark as skipped (no answer selected)
    const updatedAnswers = answers.map(a => 
      a.questionId === currentQuestion.id 
        ? { ...a, selectedAnswer: null, isCorrect: false }
        : a
    )
    setAnswers(updatedAnswers)
    setSelectedAnswer(null)
    
    // Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleUnmarkAnswer = () => {
    // Clear the selected answer
    const updatedAnswers = answers.map(a => 
      a.questionId === currentQuestion.id 
        ? { ...a, selectedAnswer: null, isCorrect: false }
        : a
    )
    setAnswers(updatedAnswers)
    setSelectedAnswer(null)
  }

  const handleSubmitQuiz = async () => {
    try {
      setIsSubmitting(true)
      setQuizCompleted(true)

      // Calculate score (1 point per correct answer)
      const correctAnswers = answers.filter(a => a.isCorrect).length
      const totalScore = correctAnswers

      // Update quiz session
      await UserService.updateQuizSession(sessionId, {
        status: 'completed',
        score: totalScore,
        total_questions: questions.length,
        correct_answers: correctAnswers,
        completed_at: new Date().toISOString()
      })

      // Save individual answers to database
      for (const answer of answers) {
        if (answer.selectedAnswer) {
          await fetch('/api/quiz-answers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
              question_id: answer.questionId,
              selected_answer: answer.selectedAnswer,
              correct_answer: questions.find(q => q.id === answer.questionId)?.correct_answer,
              is_correct: answer.isCorrect
            })
          })
        }
      }

      // Navigate to results page
      navigate('/quiz-results', {
        state: {
          roundNumber,
          score: totalScore,
          correctAnswers,
          totalQuestions: questions.length
        }
      })
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error submitting quiz. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getRoundInfo = (round: number) => {
    switch (round) {
      case 1: return { name: 'General Knowledge', color: 'blue', gradient: 'from-blue-500 to-blue-600' }
      case 2: return { name: 'Science & Technology', color: 'green', gradient: 'from-green-500 to-green-600' }
      case 3: return { name: 'Advanced Knowledge', color: 'purple', gradient: 'from-purple-500 to-purple-600' }
      default: return { name: 'Quiz', color: 'gray', gradient: 'from-gray-500 to-gray-600' }
    }
  }

  const roundInfo = getRoundInfo(roundNumber)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading quiz questions...</p>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Submitting your answers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${roundInfo.gradient} p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                InterQuest
              </h1>
              <p className="text-gray-600 mt-2">
                {firstName} {lastName} - {roundInfo.name}
              </p>
            </div>
            <div className="text-right">
              <div className={`bg-gradient-to-r ${roundInfo.gradient} text-white px-6 py-3 rounded-full font-semibold mb-2`}>
                Round {roundNumber}
              </div>
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <div className="flex justify-center items-center">
            <div className={`${timeRemaining < 60 ? 'bg-red-100 border-red-200' : 'bg-blue-100 border-blue-200'} border rounded-lg px-6 py-3`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className={`${timeRemaining < 60 ? 'text-red-700' : 'text-blue-700'} font-semibold`}>
                  Time Remaining: {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {currentQuestion && (
            <>
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`bg-${roundInfo.color}-100 text-${roundInfo.color}-800 text-sm font-medium px-2.5 py-0.5 rounded`}>
                    Q{currentQuestionIndex + 1}
                  </span>
                  <span className={`bg-${currentQuestion.difficulty === 'easy' ? 'green' : currentQuestion.difficulty === 'medium' ? 'yellow' : 'red'}-100 text-${currentQuestion.difficulty === 'easy' ? 'green' : currentQuestion.difficulty === 'medium' ? 'yellow' : 'red'}-800 text-sm font-medium px-2.5 py-0.5 rounded capitalize`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {currentQuestion.category}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {currentQuestion.points} pts
                  </span>
                </div>
                
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  {currentQuestion.question_text}
                </h2>

                {/* Answer Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option as 'A' | 'B' | 'C' | 'D')}
                      className={`text-left p-4 border-2 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-${roundInfo.color}-100 ${
                        selectedAnswer === option
                          ? `border-${roundInfo.color}-500 bg-${roundInfo.color}-50`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedAnswer === option
                            ? `bg-${roundInfo.color}-500 text-white`
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {option}
                        </span>
                        <span className="text-gray-700">
                          {currentQuestion[`option_${option.toLowerCase()}` as keyof Question]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex gap-4">
                  {selectedAnswer ? (
                    <button
                      onClick={handleUnmarkAnswer}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Unmark Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleSkipQuestion}
                      className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                    >
                      Skip Question
                    </button>
                  )}
                  
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={handleNextQuestion}
                      className={`bg-gradient-to-r ${roundInfo.gradient} text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200`}
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={isSubmitting}
                      className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{currentQuestionIndex + 1} of {questions.length} questions</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`bg-gradient-to-r ${roundInfo.gradient} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quiz
