import React, {
  useEffect,
  useState
} from 'react'

import styles from './Dashboard.module.css'

import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  where,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'

import { db, auth } from '../firebase'

function GuideManagementPanel() {

  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [message, setMessage] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  // ===== LOAD USERS =====
  const fetchUsers = async () => {

    try {

      const querySnapshot =
        await getDocs(collection(db, 'users'))

      const userList = []

      querySnapshot.forEach((doc) => {

        userList.push({
          uid: doc.id,
          ...doc.data()
        })
      })

      setUsers(userList)

    } catch (error) {
      console.error(error)
    }
  }

  // ===== LOAD USERS ON START =====
  useEffect(() => {
    fetchUsers()
  }, [])

  // ===== LOAD LOGS =====
  useEffect(() => {

    const q = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {

        const logList = []

        snapshot.forEach((doc) => {

          logList.push({
            id: doc.id,
            ...doc.data()
          })
        })

        setLogs(logList)
      }
    )

    return () => unsubscribe()

  }, [])

useEffect(() => {

  const q = query(
    collection(db, 'users'),
    where('role', '==', 'pending')
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {

      const users = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      }))

      setPendingUsers(users)
    }
  )

  return () => unsubscribe()

}, [])

  // ===== DELETE GUIDE =====
  const handleDelete = async (uid) => {

    try {

      const user = auth.currentUser

      const token =
        await user.getIdToken()

      const res = await fetch(
        `http://localhost:3000/delete-guide/${uid}`,
        {
          method: 'DELETE',

          headers: {
            'Authorization':
              `Bearer ${token}`
          }
        }
      )

      const data = await res.json()

      if (data.success) {

        setMessage('✅ Guide deleted!')

        fetchUsers()

      } else {

        setMessage(
          '❌ ' + data.error
        )
      }

    } catch (error) {

      console.error(error)

      setMessage(
        '❌ Delete failed'
      )
    }
  }

const approveUser = async (uid, userData) => {

  try {

    // approve account
    await updateDoc(
      doc(db, 'users', uid),
      {
        role: 'guide',

        enrolledModules:
          userData.requestedModules || []
      }
    )

    // load training modules
    const modulesSnapshot =
      await getDocs(
        collection(db, 'trainingModules')
      )

    const modules =
      modulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))

    // auto create enrollments
    for (
      const moduleName of
      userData.requestedModules || []
    ) {

      const moduleDoc = modules.find(
        (m) => m.title === moduleName
      )

      if (!moduleDoc) continue

      await addDoc(
        collection(db, 'enrollments'),
        {
          guideId: uid,

          moduleId: moduleDoc.id,

          enrolledAt:
            new Date().toISOString(),

          progress: 0,

          status: 'in-progress',

          score: null,

          completedAt: null
        }
      )
    }

    // activity log
    await addDoc(
      collection(db, 'logs'),
      {
        action: 'approve_guide',

        adminName:
          auth.currentUser.email,

        targetEmail:
          userData.email,

        timestamp:
          serverTimestamp()
      }
    )

    fetchUsers()

    setMessage(
      '✅ User approved successfully!'
    )

  } catch (error) {

    console.error(error)

    setMessage(
      '❌ Failed to approve user'
    )
  }
}

  // ===== FILTER USERS =====
  const guides =
    users.filter(
      u => u.role === 'guide'
    )

  const admins =
    users.filter(
      u => u.role === 'admin'
    )

  return (
    <div>

      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>
          Manage Users
        </h2>
      </div>

      <div className={styles.section}>

  <h3 className={styles.sectionTitle}>
    Pending Registrations
  </h3>

  {pendingUsers.length === 0 ? (

    <p className={styles.monitorNote}>
      No pending registrations.
    </p>

  ) : (

    <div className={styles.tableWrapper}>

      <table className={styles.table}>

        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Requested Courses</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {pendingUsers.map((user) => (

            <tr key={user.uid}>

              <td>{user.name}</td>

              <td>{user.email}</td>

              <td>
                {(user.requestedModules || []).join(', ')}
              </td>

              <td>

                <button
                  className={styles.createBtn}
                  onClick={() =>
                    approveUser(user.uid, user)
                  }
                >
                  ✅ Approve
                </button>

              </td>

            </tr>
          ))}

        </tbody>
      </table>
    </div>
  )}
</div>

      {/* USERS TABLE */}
      <div className={styles.section}>

        <div className={styles.tableWrapper}>

          <table className={styles.table}>

            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              <tr>
                <td colSpan="4">
                  <strong>
                    🛡️ Admins ({admins.length})
                  </strong>
                </td>
              </tr>

              {admins.map((u) => (

                <tr key={u.uid}>

                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>

                  <td>
                    <button
                      disabled
                      className={styles.disabledBtn}
                    >
                      🔒 Protected
                    </button>
                  </td>

                </tr>
              ))}

              <tr>
                <td colSpan="4">
                  <strong>
                    👤 Guides ({guides.length})
                  </strong>
                </td>
              </tr>

              {guides.map((u) => (

                <tr key={u.uid}>

                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>

                  <td>

                    <button
                      className={styles.deleteBtn}
                      onClick={() =>
                        setDeleteId(u.uid)
                      }
                    >
                      🗑 Delete
                    </button>

                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className={styles.section}>

        <h3>Recent Activity</h3>

        {logs.length === 0 ? (

          <p>No recent activity</p>

        ) : (

          <ul className={styles.logList}>

            {logs.slice(0, 5).map((log) => (

              <li key={log.id}>

                {log.action === 'delete_guide' &&
                  `🗑 ${log.adminName} deleted ${log.targetEmail}`}

                {log.action === 'approve_guide' &&
                    `✅ ${log.adminName} approved ${log.targetEmail}`}

              </li>
            ))}

          </ul>
        )}
      </div>

      {/* CONFIRM DELETE */}
      {deleteId && (

        <div className={styles.confirmBox}>

          <p>
            Are you sure you want to delete this guide?
          </p>

          <button
            className={styles.cancelBtn}
            onClick={() =>
              setDeleteId(null)
            }
          >
            Cancel
          </button>

          <button
            className={styles.deleteBtn}
            onClick={() => {

              handleDelete(deleteId)

              setDeleteId(null)
            }}
          >
            Delete
          </button>

        </div>
      )}

    </div>
  )
}

export default GuideManagementPanel