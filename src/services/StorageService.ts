import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SleepSession,
  CueSet,
  LearningSession,
  DailySleepReport,
  DailyMemoryReport,
} from '../models/types';

const KEYS = {
  SLEEP_SESSIONS: 'sleep_sessions',
  CUE_SETS: 'cue_sets',
  LEARNING_SESSIONS: 'learning_sessions',
  SLEEP_REPORTS: 'sleep_reports',
  MEMORY_REPORTS: 'memory_reports',
};

export class StorageService {
  // Sleep Sessions
  async saveSleepSession(session: SleepSession): Promise<void> {
    const sessions = await this.getAllSleepSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    
    await AsyncStorage.setItem(KEYS.SLEEP_SESSIONS, JSON.stringify(sessions));
  }

  async getAllSleepSessions(): Promise<SleepSession[]> {
    const data = await AsyncStorage.getItem(KEYS.SLEEP_SESSIONS);
    return data ? JSON.parse(data) : [];
  }

  async getSleepSessionById(id: string): Promise<SleepSession | null> {
    const sessions = await this.getAllSleepSessions();
    return sessions.find(s => s.id === id) || null;
  }

  async getRecentSleepSessions(limit: number = 10): Promise<SleepSession[]> {
    const sessions = await this.getAllSleepSessions();
    return sessions
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  // Cue Sets
  async saveCueSet(cueSet: CueSet): Promise<void> {
    const cueSets = await this.getAllCueSets();
    const index = cueSets.findIndex(c => c.id === cueSet.id);
    
    if (index >= 0) {
      cueSets[index] = cueSet;
    } else {
      cueSets.push(cueSet);
    }
    
    await AsyncStorage.setItem(KEYS.CUE_SETS, JSON.stringify(cueSets));
  }

  async getAllCueSets(): Promise<CueSet[]> {
    const data = await AsyncStorage.getItem(KEYS.CUE_SETS);
    return data ? JSON.parse(data) : [];
  }

  async getCueSetById(id: string): Promise<CueSet | null> {
    const cueSets = await this.getAllCueSets();
    return cueSets.find(c => c.id === id) || null;
  }

  async deleteCueSet(id: string): Promise<void> {
    const cueSets = await this.getAllCueSets();
    const filtered = cueSets.filter(c => c.id !== id);
    await AsyncStorage.setItem(KEYS.CUE_SETS, JSON.stringify(filtered));
  }

  // Learning Sessions
  async saveLearningSession(session: LearningSession): Promise<void> {
    const sessions = await this.getAllLearningSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    
    await AsyncStorage.setItem(KEYS.LEARNING_SESSIONS, JSON.stringify(sessions));
  }

  async getAllLearningSessions(): Promise<LearningSession[]> {
    const data = await AsyncStorage.getItem(KEYS.LEARNING_SESSIONS);
    return data ? JSON.parse(data) : [];
  }

  async getLearningSessionById(id: string): Promise<LearningSession | null> {
    const sessions = await this.getAllLearningSessions();
    return sessions.find(s => s.id === id) || null;
  }

  async deleteLearningSession(id: string): Promise<void> {
    const sessions = await this.getAllLearningSessions();
    const filtered = sessions.filter(s => s.id !== id);
    await AsyncStorage.setItem(KEYS.LEARNING_SESSIONS, JSON.stringify(filtered));
  }

  // Daily Reports
  async saveSleepReport(report: DailySleepReport): Promise<void> {
    const reports = await this.getAllSleepReports();
    const index = reports.findIndex(r => r.date === report.date);
    
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.push(report);
    }
    
    await AsyncStorage.setItem(KEYS.SLEEP_REPORTS, JSON.stringify(reports));
  }

  async getAllSleepReports(): Promise<DailySleepReport[]> {
    const data = await AsyncStorage.getItem(KEYS.SLEEP_REPORTS);
    return data ? JSON.parse(data) : [];
  }

  async getSleepReportByDate(date: number): Promise<DailySleepReport | null> {
    const reports = await this.getAllSleepReports();
    return reports.find(r => r.date === date) || null;
  }

  async saveMemoryReport(report: DailyMemoryReport): Promise<void> {
    const reports = await this.getAllMemoryReports();
    const index = reports.findIndex(r => r.date === report.date);
    
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.push(report);
    }
    
    await AsyncStorage.setItem(KEYS.MEMORY_REPORTS, JSON.stringify(reports));
  }

  async getAllMemoryReports(): Promise<DailyMemoryReport[]> {
    const data = await AsyncStorage.getItem(KEYS.MEMORY_REPORTS);
    return data ? JSON.parse(data) : [];
  }

  async getMemoryReportByDate(date: number): Promise<DailyMemoryReport | null> {
    const reports = await this.getAllMemoryReports();
    return reports.find(r => r.date === date) || null;
  }

  // Utility
  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }
}

export const storageService = new StorageService();
