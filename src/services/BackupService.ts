import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import CryptoJS from 'crypto-js';
import { AudioCue, CueSet } from './CueManager';
import { SessionLog } from './SessionEngine';
import { LearningItem, MemoryTest } from './LearningModule';
import type { AppSettings } from '../contexts/AppContext';

export type BackupStrategy = 'merge' | 'replace';

export interface BackupData {
  sessions: SessionLog[];
  cues: AudioCue[];
  cueSets: CueSet[];
  learningItems: LearningItem[];
  memoryTests: MemoryTest[];
  settings: AppSettings;
}

interface BackupEnvelope {
  version: number;
  createdAt: number;
  data: BackupData;
}

const STORAGE_KEYS = {
  sessions: 'tmr_sessions',
  cues: 'tmr_cues',
  cueSets: 'tmr_cue_sets',
  learningItems: 'tmr_learning_items',
  memoryTests: 'tmr_memory_tests',
  settings: 'tmr_settings',
};

const DEFAULT_SETTINGS: AppSettings = {
  demoMode: true,
  darkMode: false,
  maxCuesPerSession: 10,
  minSecondsBetweenCues: 120,
  movementThreshold: 30,
  hrSpikeThreshold: 20,
};

class BackupService {
  async exportEncryptedBackup(passphrase: string): Promise<string> {
    const backupEnvelope = await this.buildBackupEnvelope();
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(backupEnvelope), passphrase).toString();
    const fileUri = `${FileSystem.cacheDirectory}tmr-backup-${backupEnvelope.createdAt}.json`;

    await FileSystem.writeAsStringAsync(fileUri, encrypted, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Share encrypted backup',
      });
    }

    return fileUri;
  }

  async importFromFile(uri: string, passphrase: string, strategy: BackupStrategy = 'merge'): Promise<BackupData> {
    const encrypted = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
    const decrypted = CryptoJS.AES.decrypt(encrypted, passphrase).toString(CryptoJS.enc.Utf8);

    if (!decrypted) {
      throw new Error('Invalid passphrase or unreadable backup file.');
    }

    const parsed = JSON.parse(decrypted) as BackupEnvelope;

    if (!parsed?.data || !this.validateBackupData(parsed.data)) {
      throw new Error('Backup file is corrupted or missing required data.');
    }

    await this.persistData(parsed.data, strategy);
    return parsed.data;
  }

  private async buildBackupEnvelope(): Promise<BackupEnvelope> {
    const [sessionsRaw, cuesRaw, cueSetsRaw, learningItemsRaw, memoryTestsRaw, settingsRaw] = await AsyncStorage.multiGet(
      Object.values(STORAGE_KEYS)
    );

    const envelope: BackupEnvelope = {
      version: 1,
      createdAt: Date.now(),
      data: {
        sessions: this.safeParse<SessionLog[]>(sessionsRaw?.[1], []),
        cues: this.safeParse<AudioCue[]>(cuesRaw?.[1], []),
        cueSets: this.safeParse<CueSet[]>(cueSetsRaw?.[1], []),
        learningItems: this.safeParse<LearningItem[]>(learningItemsRaw?.[1], []),
        memoryTests: this.safeParse<MemoryTest[]>(memoryTestsRaw?.[1], []),
        settings: this.safeParse<AppSettings>(settingsRaw?.[1], DEFAULT_SETTINGS),
      },
    };

    return envelope;
  }

  private async persistData(data: BackupData, strategy: BackupStrategy): Promise<void> {
    const existingEntries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));

    const existing: BackupData = {
      sessions: this.safeParse<SessionLog[]>(existingEntries[0]?.[1], []),
      cues: this.safeParse<AudioCue[]>(existingEntries[1]?.[1], []),
      cueSets: this.safeParse<CueSet[]>(existingEntries[2]?.[1], []),
      learningItems: this.safeParse<LearningItem[]>(existingEntries[3]?.[1], []),
      memoryTests: this.safeParse<MemoryTest[]>(existingEntries[4]?.[1], []),
      settings: this.safeParse<AppSettings>(existingEntries[5]?.[1], DEFAULT_SETTINGS),
    };

    const merged: BackupData = strategy === 'replace'
      ? data
      : {
          sessions: this.mergeById(existing.sessions, data.sessions),
          cues: this.mergeById(existing.cues, data.cues),
          cueSets: this.mergeById(existing.cueSets, data.cueSets),
          learningItems: this.mergeById(existing.learningItems, data.learningItems),
          memoryTests: this.mergeById(existing.memoryTests, data.memoryTests),
          settings: { ...existing.settings, ...data.settings },
        };

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.sessions, JSON.stringify(merged.sessions)],
      [STORAGE_KEYS.cues, JSON.stringify(merged.cues)],
      [STORAGE_KEYS.cueSets, JSON.stringify(merged.cueSets)],
      [STORAGE_KEYS.learningItems, JSON.stringify(merged.learningItems)],
      [STORAGE_KEYS.memoryTests, JSON.stringify(merged.memoryTests)],
      [STORAGE_KEYS.settings, JSON.stringify(merged.settings)],
    ]);
  }

  private mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
    const mergedMap = new Map<string, T>();
    existing.forEach(item => mergedMap.set(item.id, item));
    incoming.forEach(item => mergedMap.set(item.id, item));
    return Array.from(mergedMap.values());
  }

  private safeParse<T>(value: string | null | undefined, fallback: T): T {
    try {
      return value ? (JSON.parse(value) as T) : fallback;
    } catch (error) {
      console.warn('Failed to parse value while backing up', error);
      return fallback;
    }
  }

  private validateBackupData(data: BackupData): boolean {
    const hasArrays =
      Array.isArray(data.sessions) &&
      Array.isArray(data.cues) &&
      Array.isArray(data.cueSets) &&
      Array.isArray(data.learningItems) &&
      Array.isArray(data.memoryTests);

    const settings = data.settings as Partial<AppSettings>;
    const hasSettings =
      settings !== null &&
      typeof settings === 'object' &&
      typeof settings.demoMode === 'boolean' &&
      typeof settings.darkMode === 'boolean' &&
      typeof settings.maxCuesPerSession === 'number' &&
      typeof settings.minSecondsBetweenCues === 'number' &&
      typeof settings.movementThreshold === 'number' &&
      typeof settings.hrSpikeThreshold === 'number';

    return hasArrays && hasSettings;
  }
}

export const backupService = new BackupService();
