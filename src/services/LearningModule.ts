// Learning Module - Handles flashcards and memory tests
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LearningItem {
  id: string;
  frontText: string;
  backText: string;
  cueId?: string;
  created: number;
}

export interface TestPerformance {
  itemId: string;
  correct: boolean;
  timestamp: number;
}

export interface MemoryTest {
  id: string;
  sessionId?: string;
  type: 'pre-sleep' | 'post-sleep';
  timestamp: number;
  performances: TestPerformance[];
}

export interface MemoryBoostResult {
  cuedDelta: number;
  uncuedDelta: number;
  estimatedBoost: number;
  cuedItemsCount: number;
  uncuedItemsCount: number;
}

export class LearningModule {
  private items: LearningItem[] = [];
  private tests: MemoryTest[] = [];

  async initialize(): Promise<void> {
    await this.loadItems();
    await this.loadTests();
  }

  async addItem(frontText: string, backText: string, cueId?: string): Promise<LearningItem> {
    const item: LearningItem = {
      id: `item_${Date.now()}`,
      frontText,
      backText,
      cueId,
      created: Date.now(),
    };

    this.items.push(item);
    await this.saveItems();
    return item;
  }

  async updateItem(id: string, updates: Partial<LearningItem>): Promise<void> {
    const index = this.items.findIndex(i => i.id === id);
    if (index >= 0) {
      this.items[index] = { ...this.items[index], ...updates };
      await this.saveItems();
    }
  }

  async deleteItem(id: string): Promise<void> {
    this.items = this.items.filter(i => i.id !== id);
    await this.saveItems();
  }

  async startTest(type: 'pre-sleep' | 'post-sleep', sessionId?: string): Promise<MemoryTest> {
    const test: MemoryTest = {
      id: `test_${Date.now()}`,
      sessionId,
      type,
      timestamp: Date.now(),
      performances: [],
    };

    this.tests.push(test);
    await this.saveTests();
    return test;
  }

  async recordPerformance(testId: string, itemId: string, correct: boolean): Promise<void> {
    const test = this.tests.find(t => t.id === testId);
    if (test) {
      test.performances.push({
        itemId,
        correct,
        timestamp: Date.now(),
      });
      await this.saveTests();
    }
  }

  calculateMemoryBoost(preTestId: string, postTestId: string): MemoryBoostResult | null {
    const preTest = this.tests.find(t => t.id === preTestId);
    const postTest = this.tests.find(t => t.id === postTestId);

    if (!preTest || !postTest) return null;

    // Separate cued and uncued items
    const cuedItems = this.items.filter(i => i.cueId);
    const uncuedItems = this.items.filter(i => !i.cueId);

    // Calculate accuracy for cued items
    const cuedPreAccuracy = this.calculateAccuracy(preTest, cuedItems.map(i => i.id));
    const cuedPostAccuracy = this.calculateAccuracy(postTest, cuedItems.map(i => i.id));
    const cuedDelta = cuedPostAccuracy - cuedPreAccuracy;

    // Calculate accuracy for uncued items
    const uncuedPreAccuracy = this.calculateAccuracy(preTest, uncuedItems.map(i => i.id));
    const uncuedPostAccuracy = this.calculateAccuracy(postTest, uncuedItems.map(i => i.id));
    const uncuedDelta = uncuedPostAccuracy - uncuedPreAccuracy;

    return {
      cuedDelta,
      uncuedDelta,
      estimatedBoost: cuedDelta - uncuedDelta,
      cuedItemsCount: cuedItems.length,
      uncuedItemsCount: uncuedItems.length,
    };
  }

  private calculateAccuracy(test: MemoryTest, itemIds: string[]): number {
    const relevantPerformances = test.performances.filter(p => itemIds.includes(p.itemId));
    if (relevantPerformances.length === 0) return 0;

    const correct = relevantPerformances.filter(p => p.correct).length;
    return (correct / relevantPerformances.length) * 100;
  }

  getAllItems(): LearningItem[] {
    return this.items;
  }

  getItemById(id: string): LearningItem | null {
    return this.items.find(i => i.id === id) || null;
  }

  getAllTests(): MemoryTest[] {
    return this.tests;
  }

  getTestsBySessionId(sessionId: string): MemoryTest[] {
    return this.tests.filter(t => t.sessionId === sessionId);
  }

  async clearAllData(): Promise<void> {
    this.items = [];
    this.tests = [];
    await this.saveItems();
    await this.saveTests();
  }

  private async saveItems(): Promise<void> {
    try {
      await AsyncStorage.setItem('tmr_learning_items', JSON.stringify(this.items));
    } catch (error) {
      console.error('Error saving learning items:', error);
    }
  }

  private async loadItems(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('tmr_learning_items');
      this.items = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading learning items:', error);
      this.items = [];
    }
  }

  private async saveTests(): Promise<void> {
    try {
      await AsyncStorage.setItem('tmr_memory_tests', JSON.stringify(this.tests));
    } catch (error) {
      console.error('Error saving memory tests:', error);
    }
  }

  private async loadTests(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('tmr_memory_tests');
      this.tests = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading memory tests:', error);
      this.tests = [];
    }
  }
}

export const learningModule = new LearningModule();
