import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Modal, ActivityIndicator } from 'react-native';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const TrainingScreen = ({ navigation }) => {
  const [modules, setModules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);

  useEffect(() => {
    if (auth.currentUser) {
      fetchModulesAndEnrollments();
    }
  }, []);

  const fetchModulesAndEnrollments = async () => {
    try {
      // Fetch all modules
      const modulesSnapshot = await getDocs(collection(db, 'trainingModules'));
      const moduleList = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch enrollments for current user
      const q = query(
        collection(db, 'enrollments'),
        where('guideId', '==', auth.currentUser.uid)
      );
      const enrollmentSnapshot = await getDocs(q);
      const enrollmentList = enrollmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setModules(moduleList);
      setEnrollments(enrollmentList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const getEnrollmentStatus = (moduleId) => {
    return enrollments.find(e => e.moduleId === moduleId);
  };

  const handleEnroll = async (module) => {
    try {
      const docRef = await addDoc(collection(db, 'enrollments'), {
        guideId: auth.currentUser.uid,
        moduleId: module.id,
        moduleName: module.title,
        status: 'not-started',
        progress: 0,
        score: 0,
        enrolledAt: new Date().toISOString(),
      });
      
      setEnrollments([...enrollments, {
        id: docRef.id,
        guideId: auth.currentUser.uid,
        moduleId: module.id,
        status: 'not-started',
        progress: 0
      }]);
      
      alert('✅ Enrolled successfully!');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Error enrolling in module');
    }
  };

  const startQuiz = (module) => {
    setSelectedModule(module);
    
    // Parse quiz questions
    let questions = [];
    try {
      if (module.questions) {
        if (typeof module.questions === 'string') {
          questions = JSON.parse(module.questions);
        } else {
          questions = module.questions;
        }
      }
    } catch (e) {
      console.error('Error parsing questions:', e);
    }
    
    setQuizQuestions(questions);
    setCurrentQuestion(0);
    setScore(0);
    setAnswers(new Array(questions.length).fill(-1));
    setQuizComplete(false);
    setShowQuiz(true);
  };

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let correctCount = 0;
    quizQuestions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });
    
    const finalScore = Math.round((correctCount / quizQuestions.length) * 100);
    setScore(finalScore);
    setQuizComplete(true);
  };

  const submitQuiz = async () => {
    try {
      const enrollment = getEnrollmentStatus(selectedModule.id);
      const passed = score >= (selectedModule.passingScore || 70);

      if (enrollment) {
        await updateDoc(doc(db, 'enrollments', enrollment.id), {
          status: passed ? 'passed' : 'failed',
          progress: 100,
          score: score,
          completedAt: new Date().toISOString()
        });
      }

      setShowQuiz(false);
      await fetchModulesAndEnrollments();
      alert(passed ? '✅ Congratulations! You passed!' : '❌ You did not pass. Try again!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz');
    }
  };

  const renderModule = ({ item }) => {
    const enrollment = getEnrollmentStatus(item.id);
    const progress = enrollment?.progress || 0;
    const status = enrollment?.status || 'not-started';

    return (
      <View style={styles.moduleCard}>
        <View style={styles.moduleHeader}>
          <View>
            <Text style={styles.moduleName}>{item.title}</Text>
            <Text style={styles.moduleCategory}>{item.category}</Text>
            <Text style={styles.moduleStatus}>
              {status === 'passed' ? '✅ Completed' : status === 'failed' ? '❌ Failed' : '⏳ In Progress'}
            </Text>
          </View>
          <Text style={styles.moduleProgress}>{progress}%</Text>
        </View>
        
        <Text style={styles.moduleDesc}>{item.description}</Text>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.moduleFooter}>
          <Text style={styles.moduleMeta}>⏱️ {item.duration} min</Text>
          <Text style={styles.moduleMeta}>📊 Pass: {item.passingScore}%</Text>
        </View>

        <View style={styles.buttonGroup}>
          {!enrollment ? (
            <TouchableOpacity style={styles.enrollButton} onPress={() => handleEnroll(item)}>
              <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.quizButton}
                onPress={() => startQuiz(item)}
              >
                <Text style={styles.quizButtonText}>Take Quiz</Text>
              </TouchableOpacity>
              {enrollment.status === 'passed' && (
                <Text style={styles.passedText}>✅ Passed</Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Training Modules</Text>
        <Text style={styles.headerSubtitle}>{modules.length} modules available</Text>
      </View>

      {modules.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No modules available yet</Text>
        </View>
      ) : (
        <FlatList
          data={modules}
          renderItem={renderModule}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}

      {/* Quiz Modal */}
      <Modal visible={showQuiz} transparent animationType="slide">
        <View style={styles.quizContainer}>
          {!quizComplete ? (
            <>
              <View style={styles.quizHeader}>
                <Text style={styles.quizTitle}>{selectedModule?.title}</Text>
                <Text style={styles.quizProgress}>
                  Question {currentQuestion + 1} of {quizQuestions.length}
                </Text>
              </View>

              <ScrollView style={styles.quizContent}>
                {quizQuestions.length > 0 && (
                  <>
                    <Text style={styles.questionText}>
                      {quizQuestions[currentQuestion]?.question}
                    </Text>

                    <View style={styles.optionsContainer}>
                      {quizQuestions[currentQuestion]?.options.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.optionButton,
                            answers[currentQuestion] === index && styles.selectedOption
                          ]}
                          onPress={() => handleAnswer(index)}
                        >
                          <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowQuiz(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Quiz Complete!</Text>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{score}%</Text>
              </View>
              <Text style={styles.resultMessage}>
                {score >= (selectedModule?.passingScore || 70) 
                  ? '✅ You Passed!' 
                  : '❌ You Did Not Pass'}
              </Text>
              <Text style={styles.resultSubtext}>
                {score >= (selectedModule?.passingScore || 70)
                  ? 'Great job! A certificate has been issued.'
                  : 'Try again to improve your score.'}
              </Text>

              <TouchableOpacity 
                style={styles.submitButton}
                onPress={submitQuiz}
              >
                <Text style={styles.submitButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2d6a4f',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e8f5e9',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  moduleCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  moduleStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  moduleProgress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  moduleDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d6a4f',
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  moduleMeta: {
    fontSize: 12,
    color: '#999',
  },
  buttonGroup: {
    gap: 8,
  },
  enrollButton: {
    backgroundColor: '#2d6a4f',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  quizButton: {
    backgroundColor: '#3a86ff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  quizButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  passedText: {
    color: '#06a77d',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  quizContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  quizHeader: {
    backgroundColor: '#2d6a4f',
    padding: 16,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  quizProgress: {
    fontSize: 13,
    color: '#e8f5e9',
    marginTop: 4,
  },
  quizContent: {
    flex: 1,
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#eee',
  },
  selectedOption: {
    borderColor: '#3a86ff',
    backgroundColor: '#f0f4ff',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#999',
    padding: 14,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2d6a4f',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  resultMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TrainingScreen;
