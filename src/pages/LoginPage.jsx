// pages/LoginPage.jsx
import React, { useState } from 'react'
import styles from './LoginPage.module.css'

// Fake user accounts for testing (later you'll connect to a real backend)
const FAKE_USERS = [
  { email: 'admin@sfc.gov.my',    password: 'admin123',  name: 'Admin User',  role: 'admin' },
  { email: 'guide@sfc.gov.my',    password: 'guide123',  name: 'Ahmad Razif', role: 'guide' },
]

function LoginPage({ onLogin }) {
  // These "states" store what the user types in the input fields
  const [email, setEmail]       = useState('')       // stores email input
  const [password, setPassword] = useState('')       // stores password input
  const [error, setError]       = useState('')       // stores error message if login fails
  const [loading, setLoading]   = useState(false)   // shows a spinner while "logging in"

  // This runs when the user clicks the Login button
  const handleLogin = async (e) => {
    e.preventDefault()  // stops the page from refreshing (default form behavior)

    setError('')         // clear old errors
    setLoading(true)    // show loading state

    // Simulate a network delay (like a real API call)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Check if the email + password match any fake user
    const user = FAKE_USERS.find(
      u => u.email === email && u.password === password
    )

    if (user) {
      onLogin(user)  // tell App.jsx "this person is now logged in"
    } else {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      {/* Left panel — decorative branding side */}
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>🌿</div>
          <h1 className={styles.brandTitle}>SFC Park Guide</h1>
          <p className={styles.brandSubtitle}>
            Digital Training & Monitoring Platform
          </p>
          <div className={styles.brandBadge}>Sarawak Forestry Corporation</div>
          <div className={styles.decorCircle1} />
          <div className={styles.decorCircle2} />
        </div>
      </div>

      {/* Right panel — the actual login form */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome back</h2>
            <p className={styles.formSub}>Sign in to your account to continue</p>
          </div>

          {/* The login form */}
          {/* onSubmit = runs handleLogin when form is submitted */}
          <form onSubmit={handleLogin} className={styles.form}>

            {/* Email field */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="yourname@sfc.gov.my"
                value={email}                          // controlled input — React tracks this value
                onChange={e => setEmail(e.target.value)} // update state when user types
                required
              />
            </div>

            {/* Password field */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Show error message if login failed */}
            {error && (
              <div className={styles.errorBox}>
                ⚠️ {error}
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}  // can't click again while loading
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Test credentials hint — remove this in production! */}
          <div className={styles.hint}>
            <p className={styles.hintTitle}>Test Accounts:</p>
            <p>Admin: admin@sfc.gov.my / admin123</p>
            <p>Guide: guide@sfc.gov.my / guide123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage