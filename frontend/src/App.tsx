import './utils/fetchInterceptor' // Import fetch interceptor first
import './utils/envCheck' // Import environment check
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Home from './components/Home'
import Round1 from './components/Round1'
import Round2 from './components/Round2'
import Round3 from './components/Round3'
import Round1Quiz from './components/Round1Quiz'
import Round2Quiz from './components/Round2Quiz'
import Round3Quiz from './components/Round3Quiz'
import RapidFireQuiz from './components/RapidFireQuiz'
import QuizResults from './components/QuizResults'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import QuestionManagement from './components/QuestionManagement'
import RoundApproval from './components/RoundApproval'
import ProtectedRoute from './components/ProtectedRoute'
import UserProtectedRoute from './components/UserProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        {/* Main App Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<UserProtectedRoute><Home /></UserProtectedRoute>} />
        <Route path="/round1" element={<UserProtectedRoute><Round1 /></UserProtectedRoute>} />
        <Route path="/round2" element={<UserProtectedRoute><Round2 /></UserProtectedRoute>} />
        <Route path="/round3" element={<UserProtectedRoute><Round3 /></UserProtectedRoute>} />
        <Route path="/round1-quiz" element={<UserProtectedRoute><Round1Quiz /></UserProtectedRoute>} />
        <Route path="/round2-quiz" element={<UserProtectedRoute><Round2Quiz /></UserProtectedRoute>} />
        <Route path="/round3-quiz" element={<UserProtectedRoute><Round3Quiz /></UserProtectedRoute>} />
        <Route path="/rapid-fire" element={<UserProtectedRoute><RapidFireQuiz /></UserProtectedRoute>} />
        <Route path="/quiz-results" element={<UserProtectedRoute><QuizResults /></UserProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/questions" 
          element={
            <ProtectedRoute>
              <QuestionManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/round-approvals" 
          element={
            <ProtectedRoute>
              <RoundApproval />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
