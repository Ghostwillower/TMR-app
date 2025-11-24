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

    let parsed: BackupEnvelope;

    try {
      parsed = JSON.parse(decrypted) as BackupEnvelope;
    } catch (error) {
      throw new Error('Backup file could not be parsed. Please check the file integrity.');
    }

    if (!parsed?.data || !this.validateBackupData(parsed.data)) {
      throw new Error('Backup file is corrupted or missing required data.');
    }

    await this.persistData(parsed.data, strategy);
    return parsed.data;
  }

  private async buildBackupEnvelope(): Promise<BackupEnvelope> {
    const storageEntries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
    const entryMap = this.indexEntries(storageEntries);

    const envelope: BackupEnvelope = {
      version: 1,
      createdAt: Date.now(),
      data: {
        sessions: this.safeParse<SessionLog[]>(entryMap[STORAGE_KEYS.sessions], []),
        cues: this.safeParse<AudioCue[]>(entryMap[STORAGE_KEYS.cues], []),
        cueSets: this.safeParse<CueSet[]>(entryMap[STORAGE_KEYS.cueSets], []),
        learningItems: this.safeParse<LearningItem[]>(entryMap[STORAGE_KEYS.learningItems], []),
        memoryTests: this.safeParse<MemoryTest[]>(entryMap[STORAGE_KEYS.memoryTests], []),
        settings: this.safeParse<AppSettings>(entryMap[STORAGE_KEYS.settings], DEFAULT_SETTINGS),
      },
    };

    return envelope;
  }

  private async persistData(data: BackupData, strategy: BackupStrategy): Promise<void> {
    const existingEntries = await AsyncStorage.multiGet(Object.values(STORAGE_KEYS));
    const entryMap = this.indexEntries(existingEntries);

    const existing: BackupData = {
      sessions: this.safeParse<SessionLog[]>(entryMap[STORAGE_KEYS.sessions], []),
      cues: this.safeParse<AudioCue[]>(entryMap[STORAGE_KEYS.cues], []),
      cueSets: this.safeParse<CueSet[]>(entryMap[STORAGE_KEYS.cueSets], []),
      learningItems: this.safeParse<LearningItem[]>(entryMap[STORAGE_KEYS.learningItems], []),
      memoryTests: this.safeParse<MemoryTest[]>(entryMap[STORAGE_KEYS.memoryTests], []),
      settings: this.safeParse<AppSettings>(entryMap[STORAGE_KEYS.settings], DEFAULT_SETTINGS),
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

  private indexEntries(entries: [string, string | null][]): Record<string, string | null> {
    return entries.reduce<Record<string, string | null>>((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  }
}

export const backupService = new BackupService();
