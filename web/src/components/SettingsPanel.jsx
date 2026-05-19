import React, { useEffect, useState } from 'react'

import {
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore'

import {
  updatePassword
} from 'firebase/auth'

import { db, auth } from '../firebase'

import styles from './Dashboard.module.css'

export default function SettingsPanel({ user }) {

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {

    const ref =
      doc(db, 'users', user.uid)

    const snap =
      await getDoc(ref)

    if (snap.exists()) {

      const data = snap.data()
      setName(data.name || '')
      setEmail(data.email || '')
      setRole(data.role || 'guide')
    }
  }

  const saveChanges = async () => {

    setLoading(true)

    try {

      // Update Firestore
      await updateDoc(
        doc(db, 'users', user.uid),
        {
          name
        }
      )

      // Update password if entered
      if (password.trim() !== '') {

        await updatePassword(
          auth.currentUser,
          password
        )
      }

      setSuccess(
        '✅ Profile updated successfully.'
      )

      setPassword('')

    } catch (error) {

      console.error(error)

      setSuccess(
        '❌ Failed to update profile.'
      )
    }

    setLoading(false)
  }

  return (

    <div className={styles.settingsWrapper}>

      <div className={styles.settingsCard}>

        <div className={styles.settingsHeader}>

          <div className={styles.settingsAvatar}>
            {name.charAt(0)}
          </div>

          <div>

            <h2>
              Settings
            </h2>

            <p>
              Manage your account information
            </p>

          </div>

        </div>

        <div className={styles.settingsForm}>

          <div className={styles.inputGroup}>
            <label>Name</label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              disabled
            />
          </div>

          <div className={styles.inputGroup}>
            <label>New Password</label>

            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </div>

       <div className={styles.accountSection}>

        <h3 className={styles.sectionTitle}>
            Account Information
        </h3>

        <div className={styles.accountGrid}>

            <div className={styles.accountItem}>

            <span className={styles.accountLabel}>
                Role
            </span>

            <span className={styles.roleBadge}>

            {role === 'admin'
                ? 'Administrator'
                : 'Park Guide'}

            </span>

            </div>

            <div className={styles.accountItem}>

            <span className={styles.accountLabel}>
                Member Since
            </span>

            <span className={styles.accountValue}>
                May 2026
            </span>

            </div>

            <div className={styles.accountItem}>

            <span className={styles.accountLabel}>
                Last Login
            </span>

            <span className={styles.accountValue}>
                {new Date().toLocaleString()}
            </span>

            </div>

        </div>

        </div>

        <div className={styles.systemSection}>

        <h3 className={styles.sectionTitle}>
            System Information
        </h3>

        <div className={styles.systemInfo}>

            <p>
            SFC Digital Park Guide
            Training Platform
            </p>

            <span>
            Version 1.0
            </span>

        </div>

        </div>

          <button
            className={styles.saveBtn}
            onClick={saveChanges}
            disabled={loading}
          >

            {
              loading
                ? 'Saving...'
                : 'Save Changes'
            }

          </button>

          {success && (
            <p className={styles.successMessage}>
              {success}
            </p>
          )}

        </div>

      </div>

    </div>
  )
}