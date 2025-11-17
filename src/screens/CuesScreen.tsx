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
import { cueManager } from '../services/CueManager';

export const CuesScreen: React.FC = () => {
  const { cues, cueSets, refreshCues } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSetModal, setShowSetModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newCueName, setNewCueName] = useState('');
  const [newSetName, setNewSetName] = useState('');
  const [selectedCues, setSelectedCues] = useState<string[]>([]);
  const [renamingCue, setRenamingCue] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    refreshCues();
  }, []);

  const handleAddCue = async () => {
    if (!newCueName.trim()) {
      Alert.alert('Error', 'Please enter a name for the cue');
      return;
    }

    // For demo, use a placeholder file path
    const filePath = `demo://cue_${Date.now()}.mp3`;
    
    try {
      await cueManager.addCue(newCueName.trim(), filePath);
      await refreshCues();
      setNewCueName('');
      setShowAddModal(false);
      Alert.alert('Success', 'Cue added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add cue');
    }
  };

  const handleDeleteCue = (cueId: string) => {
    Alert.alert(
      'Delete Cue',
      'Are you sure you want to delete this cue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cueManager.deleteCue(cueId);
            await refreshCues();
          },
        },
      ]
    );
  };

  const handleToggleCue = async (cueId: string) => {
    await cueManager.toggleCueEnabled(cueId);
    await refreshCues();
  };

  const handleTestCue = async (cueId: string) => {
    try {
      await cueManager.playCue(cueId, 0.5);
      Alert.alert('Playing Cue', 'Demo playback (no actual audio file)');
    } catch (error) {
      Alert.alert('Error', 'Failed to play cue');
    }
  };

  const handleCreateSet = async () => {
    if (!newSetName.trim()) {
      Alert.alert('Error', 'Please enter a name for the cue set');
      return;
    }

    if (selectedCues.length === 0) {
      Alert.alert('Error', 'Please select at least one cue');
      return;
    }

    try {
      await cueManager.createCueSet(newSetName.trim(), selectedCues);
      await refreshCues();
      setNewSetName('');
      setSelectedCues([]);
      setShowSetModal(false);
      Alert.alert('Success', 'Cue set created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create cue set');
    }
  };

  const handleActivateSet = async (setId: string) => {
    await cueManager.setActiveCueSet(setId);
    await refreshCues();
    Alert.alert('Success', 'Cue set activated for next session');
  };

  const toggleCueSelection = (cueId: string) => {
    setSelectedCues(prev =>
      prev.includes(cueId)
        ? prev.filter(id => id !== cueId)
        : [...prev, cueId]
    );
  };

  const handleRenameCue = (cue: { id: string; name: string }) => {
    setRenamingCue(cue);
    setNewCueName(cue.name);
    setShowRenameModal(true);
  };

  const saveRename = async () => {
    if (!renamingCue || !newCueName.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    try {
      await cueManager.renameCue(renamingCue.id, newCueName.trim());
      await refreshCues();
      setShowRenameModal(false);
      setRenamingCue(null);
      setNewCueName('');
      Alert.alert('Success', 'Cue renamed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to rename cue');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cue Manager</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Cue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Cue Set</Text>
          <TouchableOpacity
            style={styles.createSetButton}
            onPress={() => setShowSetModal(true)}
          >
            <Text style={styles.createSetButtonText}>Create Set</Text>
          </TouchableOpacity>
        </View>
        
        {cueSets.filter(s => s.isActive).map(set => (
          <View key={set.id} style={styles.activeSet}>
            <Text style={styles.activeSetName}>{set.name}</Text>
            <Text style={styles.activeSetCues}>{set.cueIds.length} cues</Text>
          </View>
        ))}
        
        {cueSets.filter(s => !s.isActive).length > 0 && (
          <View style={styles.inactiveSets}>
            <Text style={styles.inactiveSetsTitle}>Other Sets:</Text>
            {cueSets.filter(s => !s.isActive).map(set => (
              <TouchableOpacity
                key={set.id}
                style={styles.inactiveSet}
                onPress={() => handleActivateSet(set.id)}
              >
                <Text style={styles.inactiveSetName}>{set.name}</Text>
                <Text style={styles.activateText}>Tap to activate</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Cues ({cues.length})</Text>
        {cues.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No cues yet</Text>
            <Text style={styles.emptySubtext}>Add your first audio cue to get started</Text>
          </View>
        ) : (
          <FlatList
            data={cues}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.cueCard}>
                <View style={styles.cueInfo}>
                  <Text style={styles.cueName}>{item.name}</Text>
                  <Text style={styles.cueStatus}>
                    {item.enabled ? '✓ Enabled' : '✗ Disabled'}
                  </Text>
                </View>
                <View style={styles.cueActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleTestCue(item.id)}
                  >
                    <Text style={styles.actionButtonText}>▶️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleRenameCue({ id: item.id, name: item.name })}
                  >
                    <Text style={styles.actionButtonText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleToggleCue(item.id)}
                  >
                    <Text style={styles.actionButtonText}>
                      {item.enabled ? '⏸️' : '▶️'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteCue(item.id)}
                  >
                    <Text style={styles.actionButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Add Cue Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Cue</Text>
            <TextInput
              style={styles.input}
              placeholder="Cue name"
              value={newCueName}
              onChangeText={setNewCueName}
            />
            <Text style={styles.modalNote}>
              Note: In demo mode, cues don't play actual audio
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddCue}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Set Modal */}
      <Modal visible={showSetModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Cue Set</Text>
            <TextInput
              style={styles.input}
              placeholder="Set name"
              value={newSetName}
              onChangeText={setNewSetName}
            />
            <Text style={styles.modalLabel}>Select Cues:</Text>
            <FlatList
              data={cues}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectableCue}
                  onPress={() => toggleCueSelection(item.id)}
                >
                  <Text style={styles.selectableCueName}>{item.name}</Text>
                  <Text style={styles.checkbox}>
                    {selectedCues.includes(item.id) ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.cueList}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowSetModal(false);
                  setSelectedCues([]);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateSet}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Cue Modal */}
      <Modal visible={showRenameModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Cue</Text>
            <TextInput
              style={styles.input}
              placeholder="New cue name"
              value={newCueName}
              onChangeText={setNewCueName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowRenameModal(false);
                  setRenamingCue(null);
                  setNewCueName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={saveRename}
              >
                <Text style={styles.modalButtonText}>Save</Text>
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
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  createSetButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  createSetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeSet: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  activeSetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  activeSetCues: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  inactiveSets: {
    marginTop: 10,
  },
  inactiveSetsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  inactiveSet: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inactiveSetName: {
    fontSize: 14,
    color: '#333',
  },
  activateText: {
    fontSize: 12,
    color: '#6200ee',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
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
  },
  cueCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  cueInfo: {
    flex: 1,
  },
  cueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cueStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  cueActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  actionButtonText: {
    fontSize: 18,
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
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  modalNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  cueList: {
    maxHeight: 200,
    marginBottom: 15,
  },
  selectableCue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectableCueName: {
    fontSize: 14,
    color: '#333',
  },
  checkbox: {
    fontSize: 18,
    color: '#6200ee',
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
});
