// components/QuizComponent.jsx
// Quiz/test component for guides to complete after a module

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import styles from './Dashboard.module.css'

const getDefaultQuestionsByModule = (moduleTitle) => {
  const questionSets = {
    'Biodiversity Basics': [
      {
        id: 1,
        question: 'What are the three main layers of a tropical rainforest?',
        options: ['Canopy, understory, forest floor', 'Surface, middle, deep', 'Upper, middle, lower', 'Top, bottom, middle'],
        correctAnswer: 0,
      },
      {
        id: 2,
        question: 'Which of these is a protected species?',
        options: ['Domestic chicken', 'Orangutan', 'Common pigeon', 'House rat'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'Why is biodiversity important for conservation?',
        options: ['It provides stability to ecosystems', 'It creates jobs', 'It increases revenue', 'All of the above'],
        correctAnswer: 0,
      },
      {
        id: 4,
        question: 'What is an endemic species?',
        options: ['A species found in only one location', 'An endangered species', 'A migrating species', 'A common species'],
        correctAnswer: 0,
      },
      {
        id: 5,
        question: 'How do ecological roles contribute to biodiversity?',
        options: ['They create competition', 'They fill different niches preventing competition', 'They have no effect', 'They reduce species'],
        correctAnswer: 1,
      },
    ],
    'Plant Conservation & Identification': [
      {
        id: 1,
        question: 'What is the main purpose of plant identification?',
        options: ['Decoration', 'Conservation and research', 'Food only', 'Commercial sale'],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'Why are endemic plants particularly important to protect?',
        options: ['They are common', 'They exist nowhere else', 'They are invasive', 'They don\'t need protection'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'What is the difference between rare and endangered plants?',
        options: ['They are the same', 'Rare are uncommon; endangered face extinction', 'No difference exists', 'Endangered are rare'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'How should conservation protocols address habitat loss?',
        options: ['Ignore it', 'Protect remaining habitat and restore areas', 'Build roads', 'Extract resources'],
        correctAnswer: 1,
      },
      {
        id: 5,
        question: 'What is seed banking?',
        options: ['Storing money', 'Storing seeds for preservation', 'Planting seeds', 'Selling seeds'],
        correctAnswer: 1,
      },
    ],
    'Wildlife Safety Protocols': [
      {
        id: 1,
        question: 'What is the safe observation distance for large predators?',
        options: ['As close as possible', 'At least 50-100 meters', 'Distance doesn\'t matter', 'Only 10 meters'],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'How should you react if you encounter a venomous snake?',
        options: ['Attack it', 'Stop, back away, alert group', 'Run toward it', 'Ignore it'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'What are three essential safety items a guide should carry?',
        options: ['Only camera', 'First aid kit, communication device, emergency supplies', 'Nothing', 'Only food'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'When should you advise visitors NOT to enter?',
        options: ['Never restrict', 'During breeding seasons and extreme weather', 'Only weekends', 'Never'],
        correctAnswer: 1,
      },
      {
        id: 5,
        question: 'What is the proper way to handle a wildlife encounter?',
        options: ['Get close for photos', 'Remain calm, don\'t approach, guide to safe distance', 'Make noise', 'Run away'],
        correctAnswer: 1,
      },
    ],
    'Eco-Tourism Best Practices': [
      {
        id: 1,
        question: 'What is the primary goal of eco-tourism?',
        options: ['Maximum profit', 'Generate revenue while minimizing environmental impact', 'Attract all visitors', 'Exploit resources'],
        correctAnswer: 1,
      },
      {
        id: 2,
        question: 'Which practice helps protect wildlife?',
        options: ['Habitat destruction', 'Responsible eco-tourism', 'Excessive hunting', 'Pollution'],
        correctAnswer: 1,
      },
      {
        id: 3,
        question: 'How should tour groups minimize their ecological footprint?',
        options: ['Cut new paths', 'Stay on trails, take waste away, limit group size', 'Leave garbage', 'Capture wildlife'],
        correctAnswer: 1,
      },
      {
        id: 4,
        question: 'What is the primary goal of a park guide?',
        options: ['Maximize profit', 'Educate visitors about nature and conservation', 'Minimize visitors', 'Harvest resources'],
        correctAnswer: 1,
      },
      {
        id: 5,
        question: 'What is sustainable eco-tourism?',
        options: ['Tourism that harms environment', 'Tourism minimizing impact and benefiting locals', 'Tourism with no visitors', 'Tourism for rich only'],
        correctAnswer: 1,
      },
    ],
  };

  // Return module-specific questions if available, otherwise return generic ones
  return questionSets[moduleTitle] || questionSets['Eco-Tourism Best Practices'];
}

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
  const [questions, setQuestions] = useState(() => getDefaultQuestionsByModule(moduleTitle))

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
