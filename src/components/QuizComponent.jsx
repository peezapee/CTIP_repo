// components/QuizComponent.jsx
// Quiz/test component for guides to complete after a module

import React, { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: 'What is biodiversity?',
    options: [
      'The variety of all living things in an area',
      'A type of plant disease',
      'The number of animals in a region',
      'A conservation method',
    ],
    correctAnswer: 0,
  },
  {
    id: 2,
    question: 'Which practice helps protect wildlife?',
    options: [
      'Habitat destruction',
      'Responsible eco-tourism',
      'Excessive hunting',
      'Pollution',
    ],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: 'What is the primary goal of a park guide?',
    options: [
      'To maximize profit',
      'To educate visitors about nature and conservation',
      'To minimize visitor numbers',
      'To harvest resources',
    ],
    correctAnswer: 1,
  },
  {
    id: 4,
    question: 'Which of these is a protected species?',
    options: [
      'Domestic chicken',
      'Orangutan',
      'Common pigeon',
      'House rat',
    ],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: 'What is sustainable eco-tourism?',
    options: [
      'Tourism that harms the environment',
      'Tourism that minimizes environmental impact and benefits locals',
      'Tourism with no visitors',
      'Tourism that only targets rich visitors',
    ],
    correctAnswer: 1,
  },
]

function QuizComponent({ enrollmentId, moduleId, moduleTitle, passingScore = 70, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS)

  const handleSelectAnswer = (optionIndex) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = optionIndex

    // Check if correct
    if (optionIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1)
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
    const finalScore = Math.round((score / questions.length) * 100)
    const passed = finalScore >= passingScore
    setQuizCompleted(true)

    // Call parent callback with results
    if (onComplete) {
      onComplete({
        enrollmentId,
        moduleId,
        score: finalScore,
        passed,
        completedAt: new Date(),
      })
    }
  }

  const finalScore = Math.round((score / questions.length) * 100)
  const passed = finalScore >= passingScore

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
              <button className={styles.primaryBtn} onClick={() => window.location.reload()}>
                🔄 Retake Quiz
              </button>
            </div>
          )}

          {passed && (
            <div className={styles.certificateInfo}>
              <p>✅ You are now eligible for a certificate in {moduleTitle}!</p>
              <button className={styles.primaryBtn} onClick={() => window.location.reload()}>
                ← Back to Dashboard
              </button>
            </div>
          )}
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
