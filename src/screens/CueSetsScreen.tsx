import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { CueSet, AudioCue } from '../models/types';

export const CueSetsScreen: React.FC = () => {
  const { cueSets, learningSessions, saveCueSet, loadCueSets } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLearningId, setSelectedLearningId] = useState('');

  const handleCreateCueSet = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    const newCueSet: CueSet = {
      id: `cue_set_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      cues: [],
      learningSessionId: selectedLearningId,
      createdAt: Date.now(),
    };

    try {
      await saveCueSet(newCueSet);
      setModalVisible(false);
      setName('');
      setDescription('');
      setSelectedLearningId('');
      Alert.alert('Success', 'Cue set created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create cue set');
    }
  };

  const renderCueSet = ({ item }: { item: CueSet }) => (
    <View style={styles.cueSetCard}>
      <Text style={styles.cueSetName}>{item.name}</Text>
      <Text style={styles.cueSetDescription}>{item.description}</Text>
      <Text style={styles.cueCount}>{item.cues.length} cues</Text>
      {item.learningSessionId && (
        <Text style={styles.linkedSession}>
          Linked to learning session
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cue Sets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {cueSets.length > 0 ? (
        <FlatList
          data={cueSets}
          renderItem={renderCueSet}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No cue sets yet. Create one to get started!
          </Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Cue Set</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateCueSet}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  cueSetCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  cueSetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cueSetDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cueCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  linkedSession: {
    fontSize: 12,
    color: '#6200ee',
    marginTop: 5,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
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
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  createButton: {
    backgroundColor: '#6200ee',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
