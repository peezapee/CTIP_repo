// pages/LoginPage.jsx
import React, { useState } from 'react'
import styles from './LoginPage.module.css'

// Firebase imports
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = userCredential.user

      console.log("Logged in:", user)

      // 🔥 GET DATA FROM FIRESTORE
      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const userData = docSnap.data()

        console.log("Firestore data:", userData)

        // ✅ send FULL user data
        onLogin({
          uid: user.uid,
          email: user.email,
          name: userData.name,
          role: userData.role
        })

      } else {
        console.error("No Firestore user found")
        setError("User data not found in database.")
      }

    } catch (err) {
      console.error(err.message)
      setError("Invalid email or password.")
    }

    setLoading(false)
  }

  return (
    <div className={styles.page}>
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

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome back</h2>
            <p className={styles.formSub}>Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Email address</label>
              <input
                type="email"
                className={styles.input}
                placeholder="yourname@sfc.gov.my"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Password</label>
              <input
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className={styles.errorBox}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className={styles.hint}>
            <p className={styles.hintTitle}>Test Account:</p>
            <p>admin@sfc.gov.my / admin123</p>
            <p>admin2@sfc.gov.my / admin123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage