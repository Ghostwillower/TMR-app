// Cue Manager - Handles audio cue management and playback
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export interface AudioCue {
  id: string;
  name: string;
  filePath: string;
  enabled: boolean;
  duration?: number;
}

export interface CueSet {
  id: string;
  name: string;
  cueIds: string[];
  isActive: boolean;
}

export class CueManager {
  private cues: AudioCue[] = [];
  private cueSets: CueSet[] = [];
  private sound: Audio.Sound | null = null;

  async initialize(): Promise<void> {
    await this.loadCues();
    await this.loadCueSets();
    
    // Configure audio mode
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Error setting audio mode:', error);
    }
  }

  async addCue(name: string, filePath: string): Promise<AudioCue> {
    const cue: AudioCue = {
      id: `cue_${Date.now()}`,
      name,
      filePath,
      enabled: true,
    };

    this.cues.push(cue);
    await this.saveCues();
    return cue;
  }

  async updateCue(id: string, updates: Partial<AudioCue>): Promise<void> {
    const index = this.cues.findIndex(c => c.id === id);
    if (index >= 0) {
      this.cues[index] = { ...this.cues[index], ...updates };
      await this.saveCues();
    }
  }

  async deleteCue(id: string): Promise<void> {
    this.cues = this.cues.filter(c => c.id !== id);
    
    // Remove from all cue sets
    this.cueSets.forEach(set => {
      set.cueIds = set.cueIds.filter(cueId => cueId !== id);
    });
    
    await this.saveCues();
    await this.saveCueSets();
  }

  async toggleCueEnabled(id: string): Promise<void> {
    const cue = this.cues.find(c => c.id === id);
    if (cue) {
      cue.enabled = !cue.enabled;
      await this.saveCues();
    }
  }

  async playCue(id: string, volume: number = 0.3): Promise<void> {
    const cue = this.cues.find(c => c.id === id);
    if (!cue) {
      throw new Error('Cue not found');
    }

    try {
      // Unload previous sound
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: cue.filePath },
        { shouldPlay: true, volume }
      );
      this.sound = sound;

      // Cleanup after playback
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Error playing cue:', error);
      throw error;
    }
  }

  async stopCue(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async createCueSet(name: string, cueIds: string[]): Promise<CueSet> {
    const cueSet: CueSet = {
      id: `set_${Date.now()}`,
      name,
      cueIds,
      isActive: false,
    };

    this.cueSets.push(cueSet);
    await this.saveCueSets();
    return cueSet;
  }

  async setActiveCueSet(id: string): Promise<void> {
    // Deactivate all sets
    this.cueSets.forEach(set => {
      set.isActive = false;
    });

    // Activate the selected set
    const cueSet = this.cueSets.find(s => s.id === id);
    if (cueSet) {
      cueSet.isActive = true;
      await this.saveCueSets();
    }
  }

  async deleteCueSet(id: string): Promise<void> {
    this.cueSets = this.cueSets.filter(s => s.id !== id);
    await this.saveCueSets();
  }

  getActiveCueSet(): CueSet | null {
    return this.cueSets.find(s => s.isActive) || null;
  }

  getEnabledCuesFromActiveSet(): AudioCue[] {
    const activeSet = this.getActiveCueSet();
    if (!activeSet) return [];

    return this.cues.filter(
      cue => activeSet.cueIds.includes(cue.id) && cue.enabled
    );
  }

  getAllCues(): AudioCue[] {
    return this.cues;
  }

  getAllCueSets(): CueSet[] {
    return this.cueSets;
  }

  private async saveCues(): Promise<void> {
    try {
      await AsyncStorage.setItem('tmr_cues', JSON.stringify(this.cues));
    } catch (error) {
      console.error('Error saving cues:', error);
    }
  }

  private async loadCues(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('tmr_cues');
      this.cues = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading cues:', error);
      this.cues = [];
    }
  }

  private async saveCueSets(): Promise<void> {
    try {
      await AsyncStorage.setItem('tmr_cue_sets', JSON.stringify(this.cueSets));
    } catch (error) {
      console.error('Error saving cue sets:', error);
    }
  }

  private async loadCueSets(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('tmr_cue_sets');
      this.cueSets = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading cue sets:', error);
      this.cueSets = [];
    }
  }
}

export const cueManager = new CueManager();
