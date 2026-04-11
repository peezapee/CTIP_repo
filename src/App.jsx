// App.jsx
// Think of this as the "traffic controller" of your app.
// It decides which PAGE to show based on the URL.

import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

function App() {
  // useState = a way to "remember" something in React
  const [currentUser, setCurrentUser] = useState(null)

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

