import { StorageService } from '../src/services/StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    jest.clearAllMocks();
  });

  describe('Sleep Sessions', () => {
    it('should save a new sleep session', async () => {
      const mockSession = {
        id: 'session_1',
        startTime: Date.now(),
        biometricData: [],
        sleepStages: [],
        cuesPlayed: [],
        status: 'ACTIVE' as const,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await storageService.saveSleepSession(mockSession);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'sleep_sessions',
        JSON.stringify([mockSession])
      );
    });

    it('should retrieve all sleep sessions', async () => {
      const mockSessions = [
        {
          id: 'session_1',
          startTime: Date.now(),
          biometricData: [],
          sleepStages: [],
          cuesPlayed: [],
          status: 'COMPLETED' as const,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSessions)
      );

      const sessions = await storageService.getAllSleepSessions();

      expect(sessions).toEqual(mockSessions);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('sleep_sessions');
    });
  });

  describe('Cue Sets', () => {
    it('should save a cue set', async () => {
      const mockCueSet = {
        id: 'cue_set_1',
        name: 'Test Cue Set',
        description: 'Test description',
        cues: [],
        learningSessionId: 'learning_1',
        createdAt: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await storageService.saveCueSet(mockCueSet);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'cue_sets',
        JSON.stringify([mockCueSet])
      );
    });
  });

  describe('Data Management', () => {
    it('should clear all data', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      await storageService.clearAllData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(
        expect.arrayContaining([
          'sleep_sessions',
          'cue_sets',
          'learning_sessions',
          'sleep_reports',
          'memory_reports',
        ])
      );
    });
  });
});
