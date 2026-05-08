import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const AdminModuleManager = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Biology',
    duration: '60',
    passingScore: '70',
    content: '',
    questions: '[]',
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'trainingModules'));
      const moduleList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setModules(moduleList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching modules:', error);
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Biology',
      duration: '60',
      passingScore: '70',
      content: '',
      questions: '[]',
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      const moduleData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        duration: parseInt(formData.duration),
        passingScore: parseInt(formData.passingScore),
        content: formData.content,
        questions: formData.questions,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        await updateDoc(doc(db, 'trainingModules', editingId), moduleData);
        Alert.alert('Success', 'Module updated successfully');
      } else {
        await addDoc(collection(db, 'trainingModules'), {
          ...moduleData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('Success', 'Module created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchModules();
    } catch (error) {
      console.error('Error saving module:', error);
      Alert.alert('Error', 'Failed to save module');
    }
  };

  const handleEdit = (module) => {
    setEditingId(module.id);
    setFormData({
      title: module.title,
      description: module.description,
      category: module.category,
      duration: module.duration.toString(),
      passingScore: module.passingScore.toString(),
      content: module.content || '',
      questions: typeof module.questions === 'string' ? module.questions : JSON.stringify(module.questions || []),
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Module',
      'Are you sure you want to delete this module?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'trainingModules', id));
              fetchModules();
              Alert.alert('Success', 'Module deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete module');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderModule = ({ item }) => (
    <View style={styles.moduleCard}>
      <View style={styles.moduleHeader}>
        <View style={styles.moduleInfo}>
          <Text style={styles.moduleName}>{item.title}</Text>
          <Text style={styles.moduleCategory}>{item.category}</Text>
        </View>
        <Text style={styles.moduleDuration}>⏱️ {item.duration}min</Text>
      </View>

      <Text style={styles.moduleDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.moduleFooter}>
        <Text style={styles.modulePass}>Pass: {item.passingScore}%</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1565c0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Training Modules</Text>
        <Text style={styles.headerSubtitle}>{modules.length} modules</Text>
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => {
          resetForm();
          setShowModal(true);
        }}
      >
        <Text style={styles.createButtonText}>➕ Create Module</Text>
      </TouchableOpacity>

      <FlatList
        data={modules}
        renderItem={renderModule}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />

      {/* Create/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? '✏️ Edit Module' : '➕ Create Module'}
              </Text>
              <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Module Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter module title"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter module description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Biology"
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Duration (min)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="60"
                    value={formData.duration}
                    onChangeText={(text) => setFormData({ ...formData, duration: text })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Passing Score %</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="70"
                    value={formData.passingScore}
                    onChangeText={(text) => setFormData({ ...formData, passingScore: text })}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Module content (optional)"
                value={formData.content}
                onChangeText={(text) => setFormData({ ...formData, content: text })}
                multiline
              />

              <Text style={styles.label}>Questions (JSON)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { fontFamily: 'Courier' }]}
                placeholder='[{"question":"?","options":[],"correctAnswer":0}]'
                value={formData.questions}
                onChangeText={(text) => setFormData({ ...formData, questions: text })}
                multiline
              />
              <Text style={styles.hint}>{`Format: [{"question":"Your question?","options":["Option 1","Option 2","Option 3","Option 4"],"correctAnswer":0}]`}</Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => { setShowModal(false); resetForm(); }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save Module</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1565c0',
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
    color: '#b3e5fc',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#1565c0',
    margin: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    padding: 12,
  },
  moduleCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  moduleCategory: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  moduleDuration: {
    fontSize: 12,
    color: '#666',
  },
  moduleDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modulePass: {
    fontSize: 11,
    color: '#999',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#3a86ff',
    padding: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e63946',
    padding: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 13,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  hint: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1565c0',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AdminModuleManager;
