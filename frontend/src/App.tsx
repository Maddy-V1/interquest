import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Round1 from './components/Round1'
import Round1Quiz from './components/Round1Quiz'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import QuestionManagement from './components/QuestionManagement'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        {/* Main App Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/round1" element={<Round1 />} />
        <Route path="/round1-quiz" element={<Round1Quiz />} />
        
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
      </Routes>
    </Router>
  )
}

export default App
