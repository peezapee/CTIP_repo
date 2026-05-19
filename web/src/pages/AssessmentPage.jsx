import React, { useState } from 'react'
import styles from './LoginPage.module.css'
import { useNavigate } from 'react-router-dom'

function AssessmentPage() {

  const navigate = useNavigate()

  const [answers, setAnswers] = useState({})

  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const questions = [

    {
      id: 1,
      question:
        'What should a guide do if tourists feed wildlife?',

      options: [
        'Ignore the situation',
        'Encourage tourists',
        'Politely stop the tourists',
        'Take photos only'
      ],

      correct:
        'Politely stop the tourists'
    },

    {
      id: 2,
      question:
        'Why is conservation important in protected areas?',

      options: [
        'To increase noise',
        'To protect wildlife and nature',
        'To allow hunting',
        'To build more roads'
      ],

      correct:
        'To protect wildlife and nature'
    },

    {
      id: 3,
      question:
        'What is the first step during an emergency?',

      options: [
        'Run away immediately',
        'Stay calm and assess the situation',
        'Ignore the emergency',
        'Continue the tour'
      ],

      correct:
        'Stay calm and assess the situation'
    },

    {
      id: 4,
      question:
        'Why should visitors stay on designated trails?',

      options: [
        'To damage plants',
        'To protect the environment',
        'To get lost',
        'To disturb wildlife'
      ],

      correct:
        'To protect the environment'
    },

    {
      id: 5,
      question:
        'What is an important responsibility of a park guide?',

      options: [
        'Disturb wildlife',
        'Promote unsafe behaviour',
        'Ensure visitor safety',
        'Ignore park rules'
      ],

      correct:
        'Ensure visitor safety'
    }

  ]

  const handleChange = (
    questionId,
    answer
  ) => {

    setAnswers({
      ...answers,
      [questionId]: answer
    })
  }

  const handleSubmit = (e) => {

    e.preventDefault()

    if (
      Object.keys(answers).length
      !== questions.length
    ) {

      setError(
        'Please answer all questions.'
      )

      return
    }

    let correctCount = 0

    questions.forEach((q) => {

      if (
        answers[q.id] === q.correct
      ) {

        correctCount++
      }
    })

    const score =
      (correctCount / questions.length) * 100

    sessionStorage.setItem(
    'assessmentScore',
    score
    )

    setResult(
    `Assessment completed successfully! Your score is ${score}.`
    )

    setTimeout(() => {
    navigate('/register')
    }, 2000)
  }

  return (

    <div className={styles.page}>

      <div className={styles.formPanel}>

        <div className={styles.formCard}>

          <div className={styles.formHeader}>

            <h2 className={styles.formTitle}>
              📝 General Assessment
            </h2>

            <p className={styles.formSub}>
              Complete the assessment before registration
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className={styles.form}
          >

            {questions.map((q) => (

              <div
                key={q.id}
                className={styles.fieldGroup}
              >

                <label className={styles.label}>
                  {q.id}. {q.question}
                </label>

                {q.options.map((option) => (

                  <label
                    key={option}
                    className={styles.moduleOption}
                  >

                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={
                        answers[q.id]
                        === option
                      }

                      onChange={() =>
                        handleChange(
                          q.id,
                          option
                        )
                      }
                    />

                    <span>{option}</span>

                  </label>
                ))}

              </div>
            ))}

            {error && (

              <div className={styles.errorBox}>
                ⚠️ {error}
              </div>

            )}

            {result && (
            <div className={styles.successBox}>
                ✅ {result}
            </div>
            )}

            <button
              type="submit"
              className={styles.loginBtn}
            >
              Submit Assessment
            </button>

          </form>

        </div>
      </div>
    </div>
  )
}

export default AssessmentPage