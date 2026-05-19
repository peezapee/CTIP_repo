// App.jsx
// Think of this as the "traffic controller" of your app.
// It decides which PAGE to show based on the URL.

import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import RegisterPage from './pages/RegisterPage'
import AssessmentPage from './pages/AssessmentPage'

function App() {
  // useState = a way to "remember" something in React
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {

  let timeout

  const resetTimer = () => {

    clearTimeout(timeout)

    timeout = setTimeout(() => {

      localStorage.clear()

      alert(
        'Session expired due to inactivity.'
      )

      setCurrentUser(null)

      window.location.href = '/'

    }, 15 * 60 * 1000)

  }

  window.addEventListener(
    'mousemove',
    resetTimer
  )

  window.addEventListener(
    'keydown',
    resetTimer
  )

  resetTimer()

  return () => {

    clearTimeout(timeout)

    window.removeEventListener(
      'mousemove',
      resetTimer
    )

    window.removeEventListener(
      'keydown',
      resetTimer
    )
  }

}, [])

  return (
    // BrowserRouter = enables page routing (URL-based navigation)
    <BrowserRouter>
      <Routes>
        {/* Route = "when the URL is X, show component Y" */}

        {/* If nobody is logged in, show Login. If logged in, go to dashboard */}
        <Route
          path="/"
          element={
            currentUser
              ? <Navigate to="/dashboard" replace />
              : <LoginPage onLogin={setCurrentUser} />
          }
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/assessment"
          element={<AssessmentPage />}
        />

        {/* Dashboard is only accessible if logged in */}
        <Route
          path="/dashboard"
          element={
            currentUser
              ? <DashboardPage user={currentUser} onLogout={() => setCurrentUser(null)} />
              : <Navigate to="/" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

