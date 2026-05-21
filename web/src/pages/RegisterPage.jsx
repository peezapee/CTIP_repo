import React, {
  useState,
  useEffect
} from 'react'
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
  getDocs,
  addDoc
} from 'firebase/firestore'

function RegisterPage() {

  const navigate = useNavigate()

  const [assessmentScore, setAssessmentScore] = useState('')
  
  const [documentFile, setDocumentFile] =
  useState(null)
  
useEffect(() => {

  const savedScore =
    sessionStorage.getItem(
      'assessmentScore'
    )

  if (savedScore) {
    setAssessmentScore(savedScore)
  }

  const savedName =
    sessionStorage.getItem(
      'registerName'
    )

  if (savedName) {
    setName(savedName)
  }

  const savedEmail =
    sessionStorage.getItem(
      'registerEmail'
    )

  if (savedEmail) {
    setEmail(savedEmail)
  }

  const savedEducation =
    sessionStorage.getItem(
      'educationLevel'
    )

  if (savedEducation) {
    setEducationLevel(savedEducation)
  }

  const savedExperience =
    sessionStorage.getItem(
      'experienceLevel'
    )

  if (savedExperience) {
    setExperienceLevel(savedExperience)
  }

  const savedArea =
    sessionStorage.getItem(
      'preferredArea'
    )

  if (savedArea) {
    setPreferredArea(savedArea)
  }

}, [])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [educationLevel, setEducationLevel] =
    useState('')

  const [experienceLevel, setExperienceLevel] =
    useState('')

  const [preferredArea, setPreferredArea] =
    useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const convertToBase64 = (file) => {

  return new Promise((resolve, reject) => {

    const reader = new FileReader()

    reader.readAsDataURL(file)

    reader.onload = () =>
      resolve(reader.result)

    reader.onerror = (error) =>
      reject(error)
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

    if (!educationLevel) {

      setError(
        'Please select education level'
      )

      return
    }

    if (!experienceLevel) {

      setError(
        'Please select experience level'
      )

      return
    }

    if (!preferredArea) {

      setError(
        'Please select preferred area'
      )

      return
    }

    if (!assessmentScore) {

      setError(
        'Please enter assessment score'
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

      let documentURL = null

      if (documentFile) {

        const formData =
          new FormData()

        formData.append(
          'certificate',
          documentFile
        )

        const response =
          await fetch(
            'http://localhost:3000/upload-certificates',
            {
              method: 'POST',
              body: formData
            }
          )

        const data =
          await response.json()

        documentURL =
          data.filePath
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          name,
          email,

          educationLevel,
          experienceLevel,
          preferredArea,

          assessmentScore,

          supportingDocument:
            documentURL,

          role: 'pending',

          paymentStatus: 'pending',

          accountStatus: 'pending approval',

          createdAt: serverTimestamp()
        }
      )

      const moduleSnapshot =
        await getDocs(
          collection(db, 'trainingModules')
        )

      const generalModule =
        moduleSnapshot.docs.find(
          doc =>
            doc.data().required === true
        )

      if (generalModule) {

        try {

          await addDoc(
            collection(db, 'enrollments'),
            {

              guideId: user.uid,

              moduleId:
                generalModule.id,

              progress: 0,

              status: 'in-progress',

              enrolledAt:
                new Date().toISOString()
            }
          )

        } catch (err) {

          console.error(
            'Auto enrollment failed:',
            err
          )
        }
      }

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
                onChange={(e) => {

                  setName(e.target.value)

                  sessionStorage.setItem(
                    'registerName',
                    e.target.value
                  )
                }}
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
                onChange={(e) => {

                  setEmail(e.target.value)

                  sessionStorage.setItem(
                    'registerEmail',
                    e.target.value
                  )
                }}
                required
              />

            </div>

            <div className={styles.fieldGroup}>

              <label className={styles.label}>
                Education Level
              </label>

              <select
                className={styles.input}
                value={educationLevel}
                onChange={(e) => {

                  setEducationLevel(e.target.value)

                  sessionStorage.setItem(
                    'educationLevel',
                    e.target.value
                  )
                }}
                required
              >

                <option value="">
                  Select Education Level
                </option>

                <option value="High School">
                  High School
                </option>

                <option value="Diploma">
                  Diploma
                </option>

                <option value="Degree">
                  Degree
                </option>

              </select>

            </div>

            <div className={styles.fieldGroup}>

              <label className={styles.label}>
                Guiding Experience
              </label>

              <select
                className={styles.input}
                value={experienceLevel}
                onChange={(e) => {

                  setExperienceLevel(e.target.value)

                  sessionStorage.setItem(
                    'experienceLevel',
                    e.target.value
                  )
                }}
                required
              >

                <option value="">
                  Select Experience Level
                </option>

                <option value="Beginner">
                  Beginner
                </option>

                <option value="1-2 Years">
                  1-2 Years
                </option>

                <option value="3+ Years">
                  3+ Years
                </option>

              </select>

            </div>

            <div className={styles.fieldGroup}>

              <label className={styles.label}>
                Preferred Protected Area
              </label>

              <select
                className={styles.input}
                value={preferredArea}
                onChange={(e) => {

                  setPreferredArea(e.target.value)

                  sessionStorage.setItem(
                    'preferredArea',
                    e.target.value
                  )
                }}
                required
              >

                <option value="">
                  Select Preferred Area
                </option>

                <option value="Bako National Park">
                  Bako National Park
                </option>

                <option value="Semenggoh">
                  Semenggoh
                </option>

                <option value="Gua Niah">
                  Gua Niah
                </option>

                <option value=" Miri Coastal & Marine">
                  Miri Coastal & Marine
                </option>

                <option value="Kubah Rainforest">
                  Kubah Rainforest
                </option>

              </select>

            </div>

            <div className={styles.noticeBox}>

            <h4>📝 General Pre-Registration Assessment</h4>

            <p>
              All applicants must complete the general assessment test before registration.
            </p>

            <p>
              The assessment covers wildlife safety, eco-tourism ethics, emergency response, and environmental awareness.
            </p>

            <button
              type="button"
              className={styles.signupBtn}
              onClick={() =>
                navigate('/assessment')
              }
            >
              🌐 Take Assessment Test
            </button>

          </div>

          <div className={styles.fieldGroup}>

          <label className={styles.label}>
            🧠 Assessment Score (Only the highest score will be used)
            </label>

          <input
            type="number"
            className={styles.input}
            value={assessmentScore}
            readOnly
          />

        </div>

            <div className={styles.fieldGroup}>

            <label className={styles.label}>
              📄 Supporting Documents (Optional)
            </label>

            <p className={styles.formHint}>
              Upload certificates or training proof if available.
            </p>

            <input
              type="file"
              className={styles.input}
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) =>
                setDocumentFile(e.target.files[0])
              }
            />

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

            <div className={styles.noticeBox}>

            <h4>💳 Training Fee Notice</h4>

            <p>
              General training modules are free for all newly approved park guides.
            </p>

            <ul>
              <li>
                🌿 Protected Area Guiding Course (Semenggoh) - RM50
              </li>

              <li>
                🪨 Protected Area Guiding Course (Gua Niah) - RM80
              </li>

              <li>
                🦧 Wildlife Protection Advanced Training - RM40
              </li>
            </ul>

            <p>
              ⚠️ Payment is required only after administrator approval.
            </p>

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