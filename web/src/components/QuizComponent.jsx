// components/QuizComponent.jsx
// Quiz/test component for guides to complete after a module

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import styles from './Dashboard.module.css'

function QuizComponent({ enrollmentId, moduleId, moduleTitle, passingScore = 70, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [finalScore, setFinalScore] = useState(0)
  const [passed, setPassed] = useState(false)

  // Fetch module questions from Firestore if available
  useEffect(() => {
    const fetchModuleQuestions = async () => {
      try {
        const q = query(collection(db, 'trainingModules'), where('title', '==', moduleTitle))
        const snapshot = await getDocs(q)
        
        if (snapshot.docs.length > 0) {
          const module = snapshot.docs[0].data()
          if (module.questions) {
            try {
              // Parse JSON questions if they exist
              const parsedQuestions = typeof module.questions === 'string' 
                ? JSON.parse(module.questions)
                : module.questions
              
              if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                setQuestions(parsedQuestions)
              }
            } catch (e) {
              console.warn('Could not parse questions from module, using defaults:', e)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching module questions:', error)
      }
    }
    
    if (moduleTitle) {
      fetchModuleQuestions()
    }
  }, [moduleTitle])

  const handleSelectAnswer = (
    optionIndex
  ) => {

    if (
      answers[currentQuestion] !==
      undefined
    ) {
      return
    }

    const newAnswers = [...answers]

    newAnswers[currentQuestion] =
      optionIndex

    if (
      optionIndex ===
      questions[currentQuestion]
        .correctAnswer
    ) {

      setScore((prev) => prev + 1)
    }

    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      completeQuiz()
    }
  }

  const completeQuiz = () => {

    const calculatedScore = Math.min(
      Math.round(
        (score / questions.length) * 100
      ),
      100
    )

    const quizPassed =
      calculatedScore >= passingScore

    setFinalScore(calculatedScore)
    setPassed(quizPassed)
    setQuizCompleted(true)

    // Call parent callback with results
    if (onComplete) {

      onComplete({
        enrollmentId,
        moduleId,
        score: calculatedScore,
        passed: quizPassed,
        completedAt: new Date(),
      })
    }
  }

  if (quizCompleted) {
    return (
      <div className={styles.quizResult}>
        <div className={styles.resultCard}>
          <h2>{passed ? '🎉 Congratulations!' : '📚 Keep Learning'}</h2>
          <p className={styles.resultMessage}>
            {passed
              ? `You passed with a score of ${finalScore}%`
              : `You scored ${finalScore}%. You need ${passingScore}% to pass.`}
          </p>

          <div className={styles.scoreDisplay}>
            <div className={styles.scoreCircle} style={{ color: passed ? '#06a77d' : '#e63946' }}>
              {finalScore}%
            </div>
          </div>

          <p className={styles.resultDetail}>
            You answered {score} out of {questions.length} questions correctly.
          </p>

          {!passed && (
            <div className={styles.retakeInfo}>
              <p>💡 Review the module content and try again to improve your score.</p>
              <button
                className={styles.primaryBtn}

                onClick={() => {

                  setQuizCompleted(false)

                  setCurrentQuestion(0)

                  setScore(0)

                  setAnswers([])

                  setFinalScore(0)

                  setPassed(false)
                }}
              >
                🔄 Retake Quiz
              </button>
            </div>
          )}

          {passed && (
            <div className={styles.badgeInfo}>
              <p>✅ You are now eligible for a badge in {moduleTitle}!</p>
              <button className={styles.primaryBtn} onClick={() => window.location.reload()}>
                ← Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!questions || questions.length === 0) {

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizCard}>
        <h2>Loading quiz...</h2>
      </div>
    </div>
  )
}

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className={styles.quizContainer}>
      <div className={styles.quizCard}>
        <div className={styles.quizHeader}>
          <h2>{moduleTitle} — Quiz</h2>
          <p>Question {currentQuestion + 1} of {questions.length}</p>
        </div>

        <div className={styles.progressBar} style={{ width: `${progress}%` }} />

        <div className={styles.quizContent}>
          <h3 className={styles.questionText}>
            {questions[currentQuestion].question}
          </h3>

          <div className={styles.optionsGrid}>
            {questions[currentQuestion].options.map((option, index) => (
              <button
                key={index}
                className={`${styles.optionButton} ${
                  answers[currentQuestion] === index ? styles.selected : ''
                }`}
                onClick={() => handleSelectAnswer(index)}
              >
                <span className={styles.optionLetter}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className={styles.optionText}>{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.quizFooter}>
          <button
            className={styles.secondaryBtn}
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            ← Previous
          </button>

          <button className={styles.primaryBtn} onClick={handleNext}>
            {currentQuestion === questions.length - 1 ? '✅ Submit Quiz' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizComponent
