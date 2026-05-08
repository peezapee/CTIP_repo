import React, { useState } from 'react'
import styles from './LoginPage.module.css'

import { useNavigate } from 'react-router-dom'

import {
  createUserWithEmailAndPassword
} from 'firebase/auth'

import {
  auth,
  db
} from '../firebase'

import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore'

const MODULE_OPTIONS = [
  'Biodiversity Basics',
  'Wildlife Safety Protocols',
  'Eco-Tourism Best Practices'
]

function RegisterPage() {

  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedModules, setSelectedModules] = useState([])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const toggleModule = (module) => {

  setSelectedModules((current) => {

    if (current.includes(module)) {
      return current.filter((m) => m !== module)
    }

    return [...current, module]
  })
}
  

  const handleRegister = async (e) => {

    e.preventDefault()

    if (!name.trim()) {
        setError('Name is required')
        return
    }

    setError('')

    const nameRegex = /^[A-Za-z\s]+$/

    if (!nameRegex.test(name)) {
    setError(
        'Name must contain letters only'
    )
    return
    }

    const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
    setError(
        'Invalid email format'
    )
    return
    }

    if (password.length < 6) {
    setError(
        'Password must be at least 6 characters'
    )
    return
    }

    if (selectedModules.length === 0) {
    setError(
        'Please select at least one course'
    )
    return
    }

    setMessage('')
    setLoading(true)

    try {

        const q = query(
            collection(db, 'users'),
            where('name', '==', name)
        )

        const snapshot = await getDocs(q)

        if (!snapshot.empty) {

        setError(
            'This username already exists'
        )

        setLoading(false)

        return
        }

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        )

      const user = credential.user

      await setDoc(
        doc(db, 'users', user.uid),
        {
          name,
          email,

          role: 'pending',

          requestedModules: selectedModules,

          createdAt: serverTimestamp()
        }
      )

      setMessage(
        'Registration submitted successfully. Please wait for administrator approval.'
      )

      setTimeout(() => {
        navigate('/')
      }, 2500)

    } catch (err) {

      console.error(err)

      setError(
        'Failed to create account.'
      )
    }

    setLoading(false)
  }

  return (
    <div className={styles.page}>

      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>

          <div className={styles.logo}>
            🌿
          </div>

          <h1 className={styles.brandTitle}>
            SFC Park Guide
          </h1>

          <p className={styles.brandSubtitle}>
            Create your member account
          </p>

        </div>
      </div>

      <div className={styles.formPanel}>

        <div className={styles.formCard}>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              Create Account
            </h2>

            <p className={styles.formSub}>
              Register to request guide access
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className={styles.form}
          >

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Full Name
              </label>

              <input
                type="text"
                className={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Email Address
              </label>

              <input
                type="email"
                className={styles.input}
                placeholder="your@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            <div className={styles.fieldGroup}>

            <label className={styles.label}>
                Preferred Training Courses 
            </label>

            <p className={styles.formHint}>
                Select one or more courses you are interested in.
            </p>

            <div className={styles.moduleGrid}>

                {MODULE_OPTIONS.map((module) => (

                <label
                    key={module}
                    className={styles.moduleOption}
                >

                    <input
                    type="checkbox"
                    checked={selectedModules.includes(module)}
                    onChange={() => toggleModule(module)}
                    />

                    <span>{module}</span>

                </label>
                ))}

            </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Password
              </label>

              <input
                type="password"
                className={styles.input}
                placeholder="Create password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />
            </div>

            {error && (
              <div className={styles.errorBox}>
                ⚠️ {error}
              </div>
            )}

            {message && (
              <div className={styles.successBox}>
                ✅ {message}
              </div>
            )}

            <button
              type="submit"
              className={styles.loginBtn}
              disabled={loading}
            >
              {loading
                ? 'Creating Account...'
                : 'Register'}
            </button>

            <button
              type="button"
              className={styles.signupBtn}
              onClick={() => navigate('/')}
            >
              Back to Login
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage