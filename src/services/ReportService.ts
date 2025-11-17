import { DailyMemoryReport } from '../models/types';
import { storageService } from './StorageService';

export class ReportService {
  async generateDailyMemoryReport(date: number): Promise<DailyMemoryReport> {
    const dateKey = new Date(date).setHours(0, 0, 0, 0);
    
    // Get all learning sessions for the day
    const allLearningSessions = await storageService.getAllLearningSessions();
    const dayLearningSessions = allLearningSessions.filter(session => {
      const sessionDate = new Date(session.date).setHours(0, 0, 0, 0);
      return sessionDate === dateKey;
    });

    // Get all sleep sessions for the day
    const allSleepSessions = await storageService.getAllSleepSessions();
    const daySleepSessions = allSleepSessions.filter(session => {
      const sessionDate = new Date(session.startTime).setHours(0, 0, 0, 0);
      return sessionDate === dateKey;
    });

    // Count total cues played
    let cuesPlayedCount = 0;
    daySleepSessions.forEach(session => {
      cuesPlayedCount += session.cuesPlayed.length;
    });

    // Get sleep quality for correlation
    const sleepReport = await storageService.getSleepReportByDate(dateKey);
    const sleepQualityCorrelation = sleepReport ? sleepReport.sleepQuality : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      dayLearningSessions.length,
      cuesPlayedCount,
      sleepQualityCorrelation
    );

    const report: DailyMemoryReport = {
      date: dateKey,
      learningSessionsCount: dayLearningSessions.length,
      cuesPlayedCount,
      sleepQualityCorrelation,
      recommendations,
    };

    await storageService.saveMemoryReport(report);
    return report;
  }

  private generateRecommendations(
    learningSessionsCount: number,
    cuesPlayedCount: number,
    sleepQuality: number
  ): string[] {
    const recommendations: string[] = [];

    if (learningSessionsCount === 0) {
      recommendations.push(
        'No learning sessions recorded today. Create a learning session and associate audio cues for better memory consolidation.'
      );
    }

    if (cuesPlayedCount === 0 && learningSessionsCount > 0) {
      recommendations.push(
        'You had learning sessions but no cues were played during sleep. Make sure to create cue sets and start a sleep session.'
      );
    }

    if (sleepQuality < 50) {
      recommendations.push(
        'Your sleep quality was low. Consider adjusting your sleep environment and bedtime routine.'
      );
    } else if (sleepQuality > 80) {
      recommendations.push(
        'Excellent sleep quality! Your memory consolidation should be optimal.'
      );
    }

    if (learningSessionsCount > 0 && cuesPlayedCount > 0) {
      const ratio = cuesPlayedCount / learningSessionsCount;
      if (ratio < 3) {
        recommendations.push(
          'Consider adding more audio cues per learning session for enhanced memory reactivation.'
        );
      } else if (ratio > 10) {
        recommendations.push(
          'You may be playing too many cues. Focus on quality over quantity for better results.'
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Great job! Keep maintaining your learning and sleep routine for optimal memory enhancement.'
      );
    }

    return recommendations;
  }

  async getWeeklySummary(endDate: number): Promise<{
    averageSleepQuality: number;
    totalCuesPlayed: number;
    totalLearningSessionsCount: number;
    sleepQualityTrend: number[];
  }> {
    const weekStart = endDate - 7 * 24 * 60 * 60 * 1000;
    
    const sleepReports = await storageService.getAllSleepReports();
    const weekSleepReports = sleepReports.filter(
      report => report.date >= weekStart && report.date <= endDate
    );

    const memoryReports = await storageService.getAllMemoryReports();
    const weekMemoryReports = memoryReports.filter(
      report => report.date >= weekStart && report.date <= endDate
    );

    const averageSleepQuality = weekSleepReports.length > 0
      ? weekSleepReports.reduce((sum, r) => sum + r.sleepQuality, 0) / weekSleepReports.length
      : 0;

    const totalCuesPlayed = weekSleepReports.reduce(
      (sum, r) => sum + r.cuesPlayed, 0
    );

    const totalLearningSessionsCount = weekMemoryReports.reduce(
      (sum, r) => sum + r.learningSessionsCount, 0
    );

    const sleepQualityTrend = weekSleepReports
      .sort((a, b) => a.date - b.date)
      .map(r => r.sleepQuality);

    return {
      averageSleepQuality,
      totalCuesPlayed,
      totalLearningSessionsCount,
      sleepQualityTrend,
    };
  }
}

export const reportService = new ReportService();
