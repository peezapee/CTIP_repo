// src/screens/guide/GuideCoursesScreen.js
// Guide browses their enrolled courses and takes quizzes.
// Mirrors GuideCourseList.jsx and QuizComponent.jsx from the web app.
// Uses collections: enrollments, trainingModules

import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert
} from 'react-native'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/firebase'
import { COLORS, CATEGORY, SHADOW } from '../../components/shared'

// ── DEFAULT QUIZ QUESTIONS (same as web QuizComponent) ──
const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: 'What is biodiversity?',
    options: ['The variety of all living things in an area', 'A type of plant disease', 'The number of animals in a region', 'A conservation method'],
    correctAnswer: 0,
  },
  {
    id: 2,
    question: 'Which practice helps protect wildlife?',
    options: ['Habitat destruction', 'Responsible eco-tourism', 'Excessive hunting', 'Pollution'],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: 'What is the primary goal of a park guide?',
    options: ['To maximize profit', 'To educate visitors about nature and conservation', 'To minimize visitor numbers', 'To harvest resources'],
    correctAnswer: 1,
  },
  {
    id: 4,
    question: 'Which of these is a protected species?',
    options: ['Domestic chicken', 'Orangutan', 'Common pigeon', 'House rat'],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: 'What is sustainable eco-tourism?',
    options: ['Tourism that harms the environment', 'Tourism that minimizes environmental impact and benefits locals', 'Tourism with no visitors', 'Tourism that only targets rich visitors'],
    correctAnswer: 1,
  },
]

export default function GuideCoursesScreen({ user }) {
  const [enrollments, setEnrollments] = useState([])
  const [modules, setModules]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)

  // Quiz state
  const [activeEnrollment, setActiveEnrollment] = useState(null)
  const [currentQ, setCurrentQ]                 = useState(0)
  const [answers, setAnswers]                   = useState({})
  const [quizDone, setQuizDone]                 = useState(false)
  const [quizResult, setQuizResult]             = useState(null)
  const [submitting, setSubmitting]             = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [enrollSnap, modulesSnap] = await Promise.all([
        getDocs(collection(db, 'enrollments')),
        getDocs(collection(db, 'trainingModules')),
      ])
      const myEnrolls = enrollSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(e => e.guideId === user.uid)
      setEnrollments(myEnrolls)
      setModules(modulesSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
    setRefreshing(false)
  }

  const getModule = (moduleId) => modules.find(m => m.id === moduleId)

  // Start quiz for an enrollment
  const startQuiz = (enrollment) => {
    setActiveEnrollment(enrollment)
    setCurrentQ(0)
    setAnswers({})
    setQuizDone(false)
    setQuizResult(null)
  }

  // Exit quiz and go back to course list
  const exitQuiz = () => {
    setActiveEnrollment(null)
    setQuizDone(false)
    setQuizResult(null)
    setAnswers({})
  }

  // Select answer for current question
  const selectAnswer = (optionIndex) => {
    setAnswers({ ...answers, [currentQ]: optionIndex })
  }

  // Submit quiz — same logic as web QuizComponent
  const submitQuiz = async () => {
    const total   = DEFAULT_QUESTIONS.length
    const correct = DEFAULT_QUESTIONS.reduce((acc, q, i) => {
      return answers[i] === q.correctAnswer ? acc + 1 : acc
    }, 0)
    const score      = Math.round((correct / total) * 100)
    const mod        = getModule(activeEnrollment.moduleId)
    const passMark   = mod?.passingScore || 70
    const passed     = score >= passMark

    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'enrollments', activeEnrollment.id), {
        progress:    passed ? 100 : 50,
        status:      passed ? 'passed' : 'failed',
        score:       score,
        completedAt: new Date().toISOString(),
      })
      setQuizResult({ score, passed, correct, total, passMark })
      setQuizDone(true)
      await loadData() // refresh list
    } catch (err) {
      Alert.alert('Error', 'Failed to save quiz result.')
    }
    setSubmitting(false)
  }

  // ── QUIZ VIEW ──
  if (activeEnrollment) {
    const mod = getModule(activeEnrollment.moduleId)

    // Result screen
    if (quizDone && quizResult) {
      return (
        <View style={styles.quizScreen}>
          <ScrollView contentContainerStyle={styles.resultContainer}>
            <Text style={styles.resultEmoji}>{quizResult.passed ? '🎉' : '😞'}</Text>
            <Text style={styles.resultTitle}>
              {quizResult.passed ? 'You Passed!' : 'Not Quite'}
            </Text>
            <Text style={styles.resultScore}>{quizResult.score}%</Text>
            <Text style={styles.resultSub}>
              {quizResult.correct} of {quizResult.total} correct
            </Text>
            <Text style={styles.resultMsg}>
              {quizResult.passed
                ? `Great work! You scored above the ${quizResult.passMark}% passing mark.`
                : `You need ${quizResult.passMark}% to pass. Review the material and try again.`
              }
            </Text>

            <TouchableOpacity style={styles.doneBtn} onPress={exitQuiz} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>
                {quizResult.passed ? 'Back to Courses' : 'Review & Retry'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )
    }

    // Quiz questions
    const question = DEFAULT_QUESTIONS[currentQ]
    const progress = ((currentQ + 1) / DEFAULT_QUESTIONS.length) * 100
    const allAnswered = DEFAULT_QUESTIONS.every((_, i) => answers[i] !== undefined)

    return (
      <View style={styles.quizScreen}>
        {/* Quiz header */}
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={exitQuiz}>
            <Text style={styles.quizBack}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.quizTitle}>{mod?.title || 'Quiz'}</Text>
          <Text style={styles.quizCounter}>
            {currentQ + 1}/{DEFAULT_QUESTIONS.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.quizProgressTrack}>
          <View style={[styles.quizProgressFill, { width: `${progress}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.quizBody}>
          <Text style={styles.questionText}>{question.question}</Text>

          {question.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.optionBtn, answers[currentQ] === i && styles.optionSelected]}
              onPress={() => selectAnswer(i)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionLetter,
                answers[currentQ] === i && styles.optionLetterSelected
              ]}>
                <Text style={[styles.optionLetterText,
                  answers[currentQ] === i && { color: 'white' }
                ]}>
                  {['A','B','C','D'][i]}
                </Text>
              </View>
              <Text style={[styles.optionText,
                answers[currentQ] === i && { color: COLORS.greenDark, fontWeight: '600' }
              ]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.quizNav}>
          <TouchableOpacity
            style={[styles.navBtn, currentQ === 0 && styles.navBtnDisabled]}
            onPress={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
          >
            <Text style={styles.navBtnText}>← Prev</Text>
          </TouchableOpacity>

          {currentQ < DEFAULT_QUESTIONS.length - 1 ? (
            <TouchableOpacity
              style={styles.navBtnPrimary}
              onPress={() => setCurrentQ(currentQ + 1)}
              disabled={answers[currentQ] === undefined}
              activeOpacity={0.8}
            >
              <Text style={styles.navBtnPrimaryText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navBtnPrimary, (!allAnswered || submitting) && styles.navBtnDisabled]}
              onPress={submitQuiz}
              disabled={!allAnswered || submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="white" size="small" />
                : <Text style={styles.navBtnPrimaryText}>Submit ✓</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  // ── COURSE LIST VIEW ──
  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.greenMid} />
    </View>
  )

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadData() }}
          tintColor={COLORS.greenMid}
        />
      }
    >
      <Text style={styles.title}>📖 My Courses</Text>
      <Text style={styles.sub}>Your enrolled training modules</Text>

      {enrollments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No courses assigned yet. Contact your admin to enroll.</Text>
        </View>
      ) : (
        enrollments.map(enrollment => {
          const mod = getModule(enrollment.moduleId)
          if (!mod) return null
          const cat = CATEGORY[mod.category] || { emoji: '📖', color: COLORS.greenMid }
          const isPassed = enrollment.status === 'passed'

          return (
            <View key={enrollment.id} style={styles.courseCard}>
              {/* Header */}
              <View style={styles.courseHeader}>
                <Text style={styles.courseEmoji}>{cat.emoji}</Text>
                <View style={styles.courseHeaderText}>
                  <Text style={styles.courseTitle}>{mod.title}</Text>
                  <View style={[styles.catBadge, { backgroundColor: cat.color + '22' }]}>
                    <Text style={[styles.catText, { color: cat.color }]}>{mod.category}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.courseDesc} numberOfLines={2}>{mod.description}</Text>

              {/* Stats */}
              <View style={styles.courseStats}>
                <Text style={styles.stat}>⏱️ {mod.duration} min</Text>
                <Text style={styles.stat}>📊 Pass: {mod.passingScore}%</Text>
                {enrollment.score != null && (
                  <Text style={styles.stat}>🏆 Score: {enrollment.score}%</Text>
                )}
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${enrollment.progress || 0}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{enrollment.progress || 0}% complete</Text>

              {/* Status + action */}
              <View style={styles.courseFooter}>
                <View style={[styles.statusBadge,
                  { backgroundColor: isPassed ? COLORS.greenPale : '#fff7ed' }
                ]}>
                  <Text style={[styles.statusText,
                    { color: isPassed ? COLORS.greenMid : '#c2410c' }
                  ]}>
                    {isPassed ? '✅ Passed' : enrollment.status || 'enrolled'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.startBtn, isPassed && styles.startBtnDisabled]}
                  onPress={() => startQuiz(enrollment)}
                  disabled={isPassed}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startBtnText}>
                    {isPassed ? 'Completed' : enrollment.progress > 0 ? 'Continue' : 'Start Quiz'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: COLORS.grayLight },
  container: { padding: 20, paddingBottom: 40 },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.grayLight },

  title: { fontSize: 22, fontWeight: '700', color: COLORS.greenDark, marginBottom: 4 },
  sub:   { fontSize: 13, color: COLORS.grayMid, marginBottom: 20 },

  empty:     { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { color: COLORS.grayMid, textAlign: 'center', lineHeight: 20 },

  courseCard: {
    backgroundColor: 'white', borderRadius: 16,
    padding: 18, marginBottom: 16, ...SHADOW,
    borderLeftWidth: 4, borderLeftColor: COLORS.greenLight,
  },
  courseHeader:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  courseEmoji:      { fontSize: 26 },
  courseHeaderText: { flex: 1 },
  courseTitle:      { fontSize: 15, fontWeight: '700', color: COLORS.greenDark, marginBottom: 6 },
  catBadge:         { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  catText:          { fontSize: 11, fontWeight: '700' },
  courseDesc:       { fontSize: 13, color: COLORS.grayMid, lineHeight: 19, marginBottom: 12 },
  courseStats:      { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  stat:             { fontSize: 12, color: COLORS.grayMid },

  progressTrack: { height: 6, backgroundColor: COLORS.greenPale, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill:  { height: '100%', backgroundColor: COLORS.greenLight, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: COLORS.grayMid, marginBottom: 12 },

  courseFooter:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusText:       { fontSize: 12, fontWeight: '700' },
  startBtn: {
    backgroundColor: COLORS.greenMid, borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  startBtnDisabled: { backgroundColor: COLORS.greenPale },
  startBtnText:     { color: 'white', fontSize: 13, fontWeight: '700' },

  // ── QUIZ STYLES ──
  quizScreen: { flex: 1, backgroundColor: COLORS.grayLight },
  quizHeader: {
    backgroundColor: COLORS.greenDark,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, paddingTop: 20,
  },
  quizBack:    { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  quizTitle:   { color: 'white', fontSize: 14, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  quizCounter: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  quizProgressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', backgroundColor: COLORS.greenPale },
  quizProgressFill:  { height: '100%', backgroundColor: COLORS.greenMid },

  quizBody:     { padding: 20, paddingBottom: 40 },
  questionText: { fontSize: 17, fontWeight: '700', color: COLORS.greenDark, marginBottom: 20, lineHeight: 26 },

  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'white', borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 2, borderColor: COLORS.greenPale,
    ...SHADOW,
  },
  optionSelected:       { borderColor: COLORS.greenMid, backgroundColor: COLORS.greenPale },
  optionLetter: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetterSelected: { backgroundColor: COLORS.greenMid },
  optionLetterText:     { fontSize: 13, fontWeight: '700', color: COLORS.grayMid },
  optionText:           { flex: 1, fontSize: 14, color: COLORS.textDark },

  quizNav: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 16, backgroundColor: 'white',
    borderTopWidth: 1, borderTopColor: COLORS.greenPale,
    gap: 12,
  },
  navBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.greenPale,
    alignItems: 'center',
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText:     { fontSize: 14, fontWeight: '700', color: COLORS.grayMid },
  navBtnPrimary: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: COLORS.greenMid, alignItems: 'center',
  },
  navBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: 'white' },

  // ── RESULT STYLES ──
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resultEmoji: { fontSize: 60, marginBottom: 16 },
  resultTitle: { fontSize: 26, fontWeight: '700', color: COLORS.greenDark, marginBottom: 8 },
  resultScore: { fontSize: 52, fontWeight: '700', color: COLORS.greenMid, marginBottom: 8 },
  resultSub:   { fontSize: 14, color: COLORS.grayMid, marginBottom: 12 },
  resultMsg: {
    fontSize: 14, color: COLORS.grayMid, textAlign: 'center',
    lineHeight: 22, marginBottom: 32, maxWidth: 300,
  },
  doneBtn: {
    backgroundColor: COLORS.greenMid, borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 16,
  },
  doneBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
})
