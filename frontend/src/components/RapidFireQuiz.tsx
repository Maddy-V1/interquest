import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authUtils } from '../lib/auth'
import BrandingHeader from './BrandingHeader'
import io, { Socket } from 'socket.io-client'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  points: number
}

interface Participant {
  userId: string
  firstName: string
  lastName: string
  score: number
  isOnline: boolean
  participantNumber: number
}

interface QuestionResult {
  questionId: string
  winnerId: string | null
  winnerName: string
  correctAnswer: string
  participants: {
    userId: string;
    answer: string;
    timestamp: number;
    participantName?: string;
  }[]
}

function RapidFireQuiz() {
  const navigate = useNavigate()
  const [userSession, setUserSession] = useState(authUtils.getUserSession())
  const [socket, setSocket] = useState<Socket | null>(null)
  const [gameState, setGameState] = useState<'waiting' | 'active' | 'finished'>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(15)
  const [questionResult, setQuestionResult] = useState<QuestionResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [myScore, setMyScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(10)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [questionLocked, setQuestionLocked] = useState(false)
  const [approvedParticipants, setApprovedParticipants] = useState<{ id: string, name: string }[]>([])
  const socketRef = useRef<Socket | null>(null)

  const { firstName, lastName, userId } = userSession || { firstName: '', lastName: '', userId: '' }

  useEffect(() => {
    if (!userSession?.userId) {
      navigate('/')
      return
    }

    // Initialize socket connection
    const newSocket = io('http://localhost:3001')

    socketRef.current = newSocket
    setSocket(newSocket)

    // Socket event listeners
    newSocket.on('gameState', (state: {
      status: 'waiting' | 'active' | 'finished';
      participants: Participant[];
      questionNumber: number;
      totalQuestions: number;
      approvedParticipants: { id: string, name: string }[];
    }) => {
      setGameState(state.status)
      setParticipants(state.participants || [])
      setQuestionNumber(state.questionNumber || 0)
      setTotalQuestions(state.totalQuestions || 10)
      setApprovedParticipants(state.approvedParticipants || [])
    })

    newSocket.on('newQuestion', (question: Question & { questionNumber: number, totalQuestions: number }) => {
      setCurrentQuestion(question)
      setSelectedAnswer(null)
      setHasAnswered(false)
      setShowResult(false)
      setQuestionLocked(false)
      setTimeRemaining(15)
      setQuestionResult(null)
      setQuestionNumber(question.questionNumber || 0)
      setTotalQuestions(question.totalQuestions || 10)
    })

    newSocket.on('questionResult', (result: QuestionResult) => {
      setQuestionResult(result)
      setShowResult(true)

      // Update my score if I won
      if (result.winnerId === userId) {
        setMyScore(prev => prev + (currentQuestion?.points || 1))
      }
    })

    newSocket.on('participantsUpdate', (updatedParticipants: Participant[]) => {
      setParticipants(updatedParticipants)
    })

    newSocket.on('gameFinished', (finalResults: Participant[]) => {
      setGameState('finished')
      // Navigate to results page with final scores
      setTimeout(() => {
        navigate('/quiz-results', {
          state: {
            roundNumber: 3,
            score: myScore,
            correctAnswers: myScore, // In rapid fire, score = correct answers
            totalQuestions: totalQuestions,
            isRapidFire: true,
            finalResults
          }
        })
      }, 3000)
    })

    newSocket.on('timeUpdate', (time: number) => {
      setTimeRemaining(time)
    })

    newSocket.on('questionLocked', (data: { winnerId: string; winnerName: string; correctAnswer: string }) => {
      setQuestionLocked(true)
      setHasAnswered(true)
      // Show immediate feedback
      if (data.winnerId === userId) {
        setMyScore(prev => prev + (currentQuestion?.points || 1))
      }
    })

    newSocket.on('error', (error: { message?: string }) => {
      console.error('Socket error:', error)
      alert(error.message || 'An error occurred')
      navigate('/round3')
    })

    // Join the rapid fire room
    newSocket.emit('joinRapidFire', {
      userId: userSession.userId,
      firstName: userSession.firstName,
      lastName: userSession.lastName
    })

    return () => {
      newSocket.disconnect()
    }
  }, [userSession, navigate])

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (hasAnswered || !currentQuestion || gameState !== 'active' || questionLocked) return

    setSelectedAnswer(answer)
    setHasAnswered(true)

    // Send answer to server with timestamp
    socket?.emit('submitAnswer', {
      questionId: currentQuestion.id,
      answer,
      timestamp: Date.now()
    })
  }

  const getAnswerButtonClass = (option: 'A' | 'B' | 'C' | 'D') => {
    const baseClass = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 font-medium"

    if (showResult && questionResult) {
      if (option === questionResult.correctAnswer) {
        return `${baseClass} bg-green-100 border-green-500 text-green-800`
      }
      if (selectedAnswer === option && option !== questionResult.correctAnswer) {
        return `${baseClass} bg-red-100 border-red-500 text-red-800`
      }
      return `${baseClass} bg-gray-100 border-gray-300 text-gray-600`
    }

    if (questionLocked && selectedAnswer === option) {
      if (currentQuestion && option === currentQuestion.correct_answer) {
        return `${baseClass} bg-green-100 border-green-500 text-green-800`
      } else {
        return `${baseClass} bg-red-100 border-red-500 text-red-800`
      }
    }

    if (selectedAnswer === option) {
      return `${baseClass} bg-blue-100 border-blue-500 text-blue-800`
    }

    if (hasAnswered || questionLocked) {
      return `${baseClass} bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed`
    }

    return `${baseClass} bg-white border-gray-300 text-gray-800 hover:border-blue-500 hover:bg-blue-50 cursor-pointer`
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 p-8">
        <div className="max-w-4xl mx-auto">
          <BrandingHeader
            title="Round 3 - Rapid Fire"
            subtitle="Waiting for participants..."
          />

          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-6">⚡</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Rapid Fire Mode</h2>
            <p className="text-lg text-gray-600 mb-6">
              Get ready for the ultimate challenge! Answer questions as fast as you can.
            </p>

            <div className="bg-purple-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-purple-800 mb-4">How it works:</h3>
              <ul className="text-left text-purple-700 space-y-2">
                <li>• First to answer correctly gets the point</li>
                <li>• If wrong, next fastest participant gets a chance</li>
                <li>• 5 seconds per question</li>
                <li>• Live competition with all participants</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Approved Participants ({approvedParticipants.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {approvedParticipants.map((participant, index) => {
                  const isOnline = participants.some(p => p.userId === participant.id)
                  const onlineParticipant = participants.find(p => p.userId === participant.id)

                  return (
                    <div key={participant.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium">
                          {participant.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 p-8">
        <div className="max-w-4xl mx-auto">
          <BrandingHeader
            title="Round 3 Complete!"
            subtitle="Rapid Fire Results"
          />

          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Over!</h2>
            <p className="text-xl text-gray-600 mb-6">Your Score: {myScore} points</p>
            <p className="text-gray-600">Redirecting to results...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 p-8">
      <div className="max-w-6xl mx-auto">
        <BrandingHeader
          title="Round 3 - Rapid Fire"
          subtitle={`Question ${questionNumber}/${totalQuestions}`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* Timer */}
              <div className="flex justify-center mb-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${timeRemaining <= 2 ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                  {timeRemaining}
                </div>
              </div>

              {/* Question */}
              {currentQuestion && (
                <>
                  <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                    {currentQuestion.question_text}
                  </h2>

                  {/* Answer Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => handleAnswerSelect('A')}
                      className={getAnswerButtonClass('A')}
                      disabled={hasAnswered || questionLocked}
                    >
                      <span className="font-bold mr-3">A.</span>
                      {currentQuestion.option_a}
                    </button>
                    <button
                      onClick={() => handleAnswerSelect('B')}
                      className={getAnswerButtonClass('B')}
                      disabled={hasAnswered || questionLocked}
                    >
                      <span className="font-bold mr-3">B.</span>
                      {currentQuestion.option_b}
                    </button>
                    <button
                      onClick={() => handleAnswerSelect('C')}
                      className={getAnswerButtonClass('C')}
                      disabled={hasAnswered || questionLocked}
                    >
                      <span className="font-bold mr-3">C.</span>
                      {currentQuestion.option_c}
                    </button>
                    <button
                      onClick={() => handleAnswerSelect('D')}
                      className={getAnswerButtonClass('D')}
                      disabled={hasAnswered || questionLocked}
                    >
                      <span className="font-bold mr-3">D.</span>
                      {currentQuestion.option_d}
                    </button>
                  </div>

                  {/* Question Status */}
                  {questionLocked && !showResult && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-blue-600 mb-2">
                          🔒 Question Locked!
                        </p>
                        <p className="text-sm text-gray-600">
                          Someone got the correct answer. Processing results...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Question Result */}
                  {showResult && questionResult && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="text-center">
                        {questionResult.winnerId ? (
                          <div>
                            <p className="text-lg font-semibold text-green-600 mb-2">
                              🎉 {questionResult.winnerName} got it right first!
                            </p>
                            <p className="text-sm text-gray-600 mb-3">
                              Correct answer: {questionResult.correctAnswer}
                            </p>
                            {questionResult.participants.length > 0 && (
                              <div className="text-xs text-gray-500">
                                <p className="mb-1">Answer order:</p>
                                <div className="space-y-1">
                                  {questionResult.participants.slice(0, 3).map((p, index) => (
                                    <div key={p.userId} className="flex justify-between">
                                      <span>{index + 1}. {p.participantName || 'Unknown'}</span>
                                      <span>{p.answer}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg font-semibold text-red-600 mb-2">
                              ❌ No one got it right!
                            </p>
                            <p className="text-sm text-gray-600">
                              Correct answer: {questionResult.correctAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Participants Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Live Scores</h3>
              <div className="space-y-3">
                {participants
                  .sort((a, b) => b.score - a.score)
                  .map((participant, index) => (
                    <div
                      key={participant.userId}
                      className={`flex items-center justify-between p-3 rounded-lg ${participant.userId === userId
                        ? 'bg-purple-100 border-2 border-purple-300'
                        : 'bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-400 text-gray-900' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                              'bg-gray-200 text-gray-700'
                          }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            #{participant.participantNumber} {participant.firstName} {participant.lastName}
                            {participant.userId === userId && ' (You)'}
                          </p>
                          <div className={`w-2 h-2 rounded-full ${participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                        </div>
                      </div>
                      <span className="font-bold text-purple-600">
                        {participant.score}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RapidFireQuiz