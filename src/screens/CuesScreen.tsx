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
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { cueManager } from '../services/CueManager';
import { theme } from '../theme';

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

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const handleAddCue = async () => {
    if (!newCueName.trim()) {
      Alert.alert('Error', 'Please enter a name for the cue');
      return;
    }

    const filePath = `demo://cue_${Date.now()}.mp3`;

    try {
      await cueManager.addCue(newCueName.trim(), filePath);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            await refreshCues();
          },
        },
      ]
    );
  };

  const handleToggleCue = async (cueId: string) => {
    await cueManager.toggleCueEnabled(cueId);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
        <View>
          <Text style={styles.title}>Cue Manager</Text>
          <Text style={styles.subtitle}>Curate crisp audio for better recall</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
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
                style={[styles.modalButton, styles.modalButtonAlt]}
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
                style={[styles.modalButton, styles.modalButtonAlt]}
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
                style={[styles.modalButton, styles.modalButtonAlt]}
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
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    color: theme.colors.muted,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    ...theme.shadow.card,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 16,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  createSetButton: {
    backgroundColor: theme.colors.info,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
  },
  createSetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  activeSet: {
    backgroundColor: '#eef2ff',
    padding: 14,
    borderRadius: theme.radius.md,
    marginBottom: 10,
  },
  activeSetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  activeSetCues: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 5,
  },
  inactiveSets: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  inactiveSetsTitle: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: 6,
  },
  inactiveSet: {
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inactiveSetName: {
    fontSize: 14,
    color: '#0f172a',
  },
  activateText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  cueCard: {
    backgroundColor: theme.colors.surface,
    padding: 15,
    borderRadius: theme.radius.lg,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  cueInfo: {
    flex: 1,
  },
  cueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cueStatus: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 5,
  },
  cueActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 15,
  },
  modalNote: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
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
    borderBottomColor: theme.colors.border,
  },
  selectableCueName: {
    fontSize: 14,
    color: '#0f172a',
  },
  checkbox: {
    fontSize: 18,
    color: theme.colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonAlt: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
