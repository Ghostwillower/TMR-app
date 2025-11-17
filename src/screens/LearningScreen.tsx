import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { learningModule, LearningItem } from '../services/LearningModule';

export const LearningScreen: React.FC = () => {
  const { learningItems, refreshLearning, cues, currentSession } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [selectedCueId, setSelectedCueId] = useState('');
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [currentItem, setCurrentItem] = useState<LearningItem | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Test mode state
  const [testMode, setTestMode] = useState<'pre-sleep' | 'post-sleep' | null>(null);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testPerformances, setTestPerformances] = useState<{ itemId: string; correct: boolean }[]>([]);

  useEffect(() => {
    refreshLearning();
  }, []);

  const handleAddItem = async () => {
    if (!frontText.trim() || !backText.trim()) {
      Alert.alert('Error', 'Please enter both front and back text');
      return;
    }

    try {
      await learningModule.addItem(frontText.trim(), backText.trim(), selectedCueId || undefined);
      await refreshLearning();
      setFrontText('');
      setBackText('');
      setSelectedCueId('');
      setShowAddModal(false);
      Alert.alert('Success', 'Learning item added!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this learning item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await learningModule.deleteItem(itemId);
            await refreshLearning();
          },
        },
      ]
    );
  };

  const handleStudyItem = (item: LearningItem) => {
    setCurrentItem(item);
    setShowAnswer(false);
    setShowFlashcard(true);
  };

  const startTest = (type: 'pre-sleep' | 'post-sleep') => {
    if (learningItems.length === 0) {
      Alert.alert('Error', 'Add learning items first');
      return;
    }
    setTestMode(type);
    setCurrentTestIndex(0);
    setTestPerformances([]);
    setCurrentItem(learningItems[0]);
    setShowAnswer(false);
    setShowFlashcard(true);
  };

  const handleTestAnswer = async (correct: boolean) => {
    if (!currentItem || !testMode) return;

    const newPerformances = [...testPerformances, { itemId: currentItem.id, correct }];
    setTestPerformances(newPerformances);

    if (currentTestIndex < learningItems.length - 1) {
      // Next item
      const nextIndex = currentTestIndex + 1;
      setCurrentTestIndex(nextIndex);
      setCurrentItem(learningItems[nextIndex]);
      setShowAnswer(false);
    } else {
      // Test complete
      await learningModule.startTest(testMode, currentSession?.id);
      
      // Record all performances
      const testId = `test_${Date.now()}`;
      for (const perf of newPerformances) {
        await learningModule.recordPerformance(testId, perf.itemId, perf.correct);
      }

      const accuracy = (newPerformances.filter(p => p.correct).length / newPerformances.length) * 100;
      Alert.alert(
        `${testMode === 'pre-sleep' ? 'Pre' : 'Post'}-Sleep Test Complete`,
        `Accuracy: ${accuracy.toFixed(1)}%\n\n${testMode === 'pre-sleep' ? 'Good luck with your sleep session!' : 'Check your memory boost in Reports!'}`,
        [{ text: 'OK', onPress: () => {
          setShowFlashcard(false);
          setTestMode(null);
          setTestPerformances([]);
        }}]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Learning</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Flashcards ({learningItems.length})</Text>
        
        {learningItems.length > 0 && (
          <View style={styles.testButtons}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => startTest('pre-sleep')}
            >
              <Text style={styles.testButtonText}>📝 Pre-Sleep Test</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.testButton, styles.postTestButton]}
              onPress={() => startTest('post-sleep')}
            >
              <Text style={styles.testButtonText}>✅ Post-Sleep Test</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {learningItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No learning items yet</Text>
            <Text style={styles.emptySubtext}>
              Add flashcards to help memory consolidation
            </Text>
          </View>
        ) : (
          <FlatList
            data={learningItems}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemFront}>{item.frontText}</Text>
                  <Text style={styles.itemBack}>→ {item.backText}</Text>
                  {item.cueId && (
                    <Text style={styles.itemCue}>
                      🎵 Linked to cue
                    </Text>
                  )}
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.studyButton}
                    onPress={() => handleStudyItem(item)}
                  >
                    <Text style={styles.studyButtonText}>Study</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Add Item Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Learning Item</Text>
            
            <Text style={styles.label}>Front (Question):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., What is TMR?"
              value={frontText}
              onChangeText={setFrontText}
              multiline
            />
            
            <Text style={styles.label}>Back (Answer):</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Targeted Memory Reactivation"
              value={backText}
              onChangeText={setBackText}
              multiline
            />
            
            <Text style={styles.label}>Link to Cue (Optional):</Text>
            <View style={styles.pickerContainer}>
              {cues.map(cue => (
                <TouchableOpacity
                  key={cue.id}
                  style={[
                    styles.cueOption,
                    selectedCueId === cue.id && styles.cueOptionSelected
                  ]}
                  onPress={() => setSelectedCueId(cue.id === selectedCueId ? '' : cue.id)}
                >
                  <Text style={styles.cueOptionText}>{cue.name}</Text>
                  {selectedCueId === cue.id && <Text>✓</Text>}
                </TouchableOpacity>
              ))}
              {cues.length === 0 && (
                <Text style={styles.noCues}>No cues available. Add cues first.</Text>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddItem}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Flashcard Modal */}
      <Modal visible={showFlashcard} transparent animationType="fade">
        <View style={styles.flashcardContainer}>
          <View style={styles.flashcardContent}>
            {testMode && (
              <View style={styles.testModeHeader}>
                <Text style={styles.testModeTitle}>
                  {testMode === 'pre-sleep' ? 'Pre-Sleep Test' : 'Post-Sleep Test'}
                </Text>
                <Text style={styles.testProgress}>
                  {currentTestIndex + 1} / {learningItems.length}
                </Text>
              </View>
            )}
            
            <Text style={styles.flashcardLabel}>
              {showAnswer ? 'Answer' : 'Question'}
            </Text>
            <Text style={styles.flashcardText}>
              {showAnswer ? currentItem?.backText : currentItem?.frontText}
            </Text>
            
            {!showAnswer ? (
              <TouchableOpacity
                style={styles.showAnswerButton}
                onPress={() => setShowAnswer(true)}
              >
                <Text style={styles.showAnswerButtonText}>Show Answer</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.flashcardActions}>
                <TouchableOpacity
                  style={[styles.flashcardButton, styles.incorrectButton]}
                  onPress={() => testMode ? handleTestAnswer(false) : setShowFlashcard(false)}
                >
                  <Text style={styles.flashcardButtonText}>❌ Incorrect</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.flashcardButton, styles.correctButton]}
                  onPress={() => testMode ? handleTestAnswer(true) : setShowFlashcard(false)}
                >
                  <Text style={styles.flashcardButtonText}>✓ Correct</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {!testMode && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFlashcard(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            )}
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
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    flex: 1,
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  itemInfo: {
    marginBottom: 10,
  },
  itemFront: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemBack: {
    fontSize: 14,
    color: '#666',
  },
  itemCue: {
    fontSize: 12,
    color: '#6200ee',
    marginTop: 5,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  studyButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  studyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  postTestButton: {
    backgroundColor: '#4caf50',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testModeHeader: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  testModeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 5,
  },
  testProgress: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    maxHeight: 150,
    marginBottom: 15,
  },
  cueOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  cueOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#6200ee',
  },
  cueOptionText: {
    fontSize: 14,
    color: '#333',
  },
  noCues: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#999',
  },
  modalButtonPrimary: {
    backgroundColor: '#6200ee',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  flashcardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  flashcardContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    width: '85%',
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashcardLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  flashcardText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  showAnswerButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  showAnswerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  flashcardActions: {
    flexDirection: 'row',
    gap: 15,
  },
  flashcardButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  incorrectButton: {
    backgroundColor: '#d32f2f',
  },
  correctButton: {
    backgroundColor: '#4caf50',
  },
  flashcardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 20,
  },
  closeButtonText: {
    color: '#666',
    fontSize: 14,
  },
});
