// components/TrainingModuleManager.jsx
// Admin panel to create, edit, and manage training modules

import React, { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import styles from './Dashboard.module.css'

function TrainingModuleManager() {
  const [modules, setModules] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'conservation', // conservation, biodiversity, eco-tourism, legislation, safety
    duration: 30, // in minutes
    videoUrl: '',
    content: '',
    passingScore: 70, // percentage to pass
  })

  // Fetch modules
  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'trainingModules'))
      const moduleList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setModules(moduleList)
    } catch (error) {
      console.error('Error fetching modules:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'duration' || name === 'passingScore' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        // Update existing module in Firestore
        const moduleRef = doc(db, 'trainingModules', editingId)
        await updateDoc(moduleRef, {
          ...formData,
          updatedAt: new Date().toISOString(),
        })
        alert('✅ Module updated successfully')
      } else {
        // Create new module in Firestore
        await addDoc(collection(db, 'trainingModules'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        alert('✅ Module created successfully')
      }

      setFormData({
        title: '',
        description: '',
        category: 'conservation',
        duration: 30,
        videoUrl: '',
        content: '',
        passingScore: 70,
      })
      setEditingId(null)
      setShowForm(false)
      fetchModules()
    } catch (error) {
      console.error('Error saving module:', error)
      alert('❌ Error saving module')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (module) => {
    setFormData({
      title: module.title,
      description: module.description,
      category: module.category,
      duration: module.duration,
      videoUrl: module.videoUrl,
      content: module.content,
      passingScore: module.passingScore,
    })
    setEditingId(module.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this module?')) return

    try {
      await deleteDoc(doc(db, 'trainingModules', id))
      alert('✅ Module deleted')
      fetchModules()
    } catch (error) {
      console.error('Error deleting module:', error)
      alert('❌ Error deleting module')
    }
  }

  const categoryEmoji = {
    conservation: '🌍',
    biodiversity: '🦋',
    'eco-tourism': '🌿',
    legislation: '⚖️',
    safety: '🦺',
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>📚 Training Modules</h2>
        <p className={styles.pageSub}>Create and manage training modules</p>
      </div>

      {/* Create button */}
      {!showForm && (
        <button
          className={styles.primaryBtn}
          onClick={() => setShowForm(true)}
          style={{ marginBottom: '20px' }}
        >
          ➕ Create New Module
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className={styles.formCard}>
          <h3>{editingId ? 'Edit Module' : 'Create New Module'}</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Module Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Biodiversity Basics"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="conservation">Conservation</option>
                  <option value="biodiversity">Biodiversity</option>
                  <option value="eco-tourism">Eco-Tourism</option>
                  <option value="legislation">Legislation</option>
                  <option value="safety">Safety</option>
                </select>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="5"
                  max="300"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Passing Score (%) *</label>
                <input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the module..."
                rows="3"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Video URL</label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>Content (HTML/Markdown) *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Module content..."
                rows="6"
                required
              />
            </div>

            <div className={styles.formActions}>
              <button type="submit" disabled={loading} className={styles.primaryBtn}>
                {loading ? '⏳ Saving...' : editingId ? '✏️ Update Module' : '✅ Create Module'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({
                    title: '',
                    description: '',
                    category: 'conservation',
                    duration: 30,
                    videoUrl: '',
                    content: '',
                    passingScore: 70,
                  })
                }}
                className={styles.secondaryBtn}
              >
                ✖️ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules List */}
      <div className={styles.modulesList}>
        {modules.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No modules yet. Create one to get started!
          </p>
        ) : (
          modules.map((module) => (
            <div key={module.id} className={styles.moduleCard}>
              <div className={styles.moduleHeader}>
                <h4>
                  {categoryEmoji[module.category]} {module.title}
                </h4>
                <span className={styles.badge}>{module.category}</span>
              </div>
              <p className={styles.moduleDesc}>{module.description}</p>
              <div className={styles.moduleFooter}>
                <span>⏱️ {module.duration} min</span>
                <span>📊 Pass: {module.passingScore}%</span>
                <div>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleEdit(module)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(module.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TrainingModuleManager
