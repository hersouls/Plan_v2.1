import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  listAll, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';
import type { SettingsState } from '../components/settings/types';

export interface BackupData {
  userId: string;
  timestamp: string;
  version: string;
  data: {
    profile: any;
    settings: SettingsState;
    tasks: any[];
    groups: any[];
    activities: any[];
  };
  metadata: {
    backupType: 'auto' | 'manual';
    frequency: 'weekly' | 'monthly';
    size: number;
    retentionDays: number;
  };
}

export class BackupService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // 자동 백업 실행
  async createAutoBackup(frequency: 'weekly' | 'monthly'): Promise<string> {
    try {
      console.log(`Creating ${frequency} backup for user: ${this.userId}`);
      
      const backupData = await this.collectUserData();
      const fileName = this.generateBackupFileName(frequency);
      const path = `backups/${this.userId}/auto/${frequency}/${fileName}`;
      
      const downloadURL = await this.uploadToStorage(path, backupData);
      
      // 오래된 백업 정리
      await this.cleanupOldBackups(frequency);
      
      console.log(`Backup created successfully: ${path}`);
      return downloadURL;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw new Error('백업 생성에 실패했습니다.');
    }
  }

  // 사용자 데이터 수집
  private async collectUserData(): Promise<BackupData> {
    const userDoc = await getDoc(doc(db, 'users', this.userId));
    const userData = userDoc.data();

    // 사용자의 할일 데이터 수집
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', this.userId)
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 사용자의 그룹 데이터 수집
    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', this.userId)
    );
    const groupsSnapshot = await getDocs(groupsQuery);
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 활동 데이터 수집 (최근 30일)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', '==', this.userId),
      where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);
    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const backupData: BackupData = {
      userId: this.userId,
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        profile: userData?.profile || {},
        settings: userData?.settings || {},
        tasks,
        groups,
        activities,
      },
      metadata: {
        backupType: 'auto',
        frequency: 'weekly', // 기본값, 실제로는 파라미터로 받아야 함
        size: 0, // 업로드 후 계산
        retentionDays: this.getRetentionDays('weekly'),
      }
    };

    return backupData;
  }

  // 백업 파일명 생성
  private generateBackupFileName(frequency: 'weekly' | 'monthly'): string {
    const now = new Date();
    
    if (frequency === 'weekly') {
      const weekNumber = this.getWeekNumber(now);
      const year = now.getFullYear();
      return `backup-${year}-W${weekNumber.toString().padStart(2, '0')}.json`;
    } else {
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      return `backup-${year}-${month}.json`;
    }
  }

  // 주차 계산
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Firebase Storage에 업로드
  private async uploadToStorage(path: string, data: BackupData): Promise<string> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    
    const downloadURL = await getDownloadURL(storageRef);
    
    // 파일 크기 업데이트
    data.metadata.size = blob.size;
    
    return downloadURL;
  }

  // 보관 기간 계산 (일)
  private getRetentionDays(frequency: 'weekly' | 'monthly'): number {
    switch (frequency) {
      case 'weekly':
        return 90; // 12주 (약 3개월)
      case 'monthly':
        return 365; // 12개월 (1년)
      default:
        return 90;
    }
  }

  // 오래된 백업 정리
  private async cleanupOldBackups(frequency: 'weekly' | 'monthly'): Promise<void> {
    try {
      const retentionDays = this.getRetentionDays(frequency);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const backupPath = `backups/${this.userId}/auto/${frequency}`;
      const backupRef = ref(storage, backupPath);
      
      const result = await listAll(backupRef);
      
      for (const item of result.items) {
        const metadata = await this.getFileMetadata(item.fullPath);
        if (metadata && metadata.timeCreated < cutoffDate.getTime()) {
          console.log(`Deleting old backup: ${item.fullPath}`);
          await deleteObject(item);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // 정리 실패는 백업 실패로 처리하지 않음
    }
  }

  // 파일 메타데이터 가져오기
  private async getFileMetadata(path: string): Promise<any> {
    try {
      const fileRef = ref(storage, path);
      // Firebase Storage의 메타데이터는 직접 접근이 제한적이므로
      // 파일명에서 날짜를 파싱하는 방식 사용
      const fileName = path.split('/').pop();
      if (fileName) {
        const dateMatch = fileName.match(/backup-(\d{4})-(\w\d{2})/);
        if (dateMatch) {
          const year = parseInt(dateMatch[1]);
          const weekOrMonth = dateMatch[2];
          
          if (weekOrMonth.startsWith('W')) {
            // 주간 백업
            const week = parseInt(weekOrMonth.substring(1));
            return { timeCreated: this.getDateFromWeek(year, week).getTime() };
          } else {
            // 월간 백업
            const month = parseInt(weekOrMonth) - 1;
            return { timeCreated: new Date(year, month, 1).getTime() };
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      return null;
    }
  }

  // 주차에서 날짜 계산
  private getDateFromWeek(year: number, week: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToAdd = (week - 1) * 7;
    const result = new Date(firstDayOfYear);
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  // 백업 목록 조회
  async getBackupList(frequency?: 'weekly' | 'monthly'): Promise<any[]> {
    try {
      const basePath = frequency 
        ? `backups/${this.userId}/auto/${frequency}`
        : `backups/${this.userId}`;
      
      const backupRef = ref(storage, basePath);
      const result = await listAll(backupRef);
      
      const backups = await Promise.all(
        result.items.map(async (item) => {
          const metadata = await this.getFileMetadata(item.fullPath);
          return {
            name: item.name,
            path: item.fullPath,
            timestamp: metadata?.timeCreated || 0,
            size: 0, // 실제 크기는 별도 API 호출 필요
            frequency: item.fullPath.includes('/weekly/') ? 'weekly' : 'monthly'
          };
        })
      );
      
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get backup list:', error);
      return [];
    }
  }

  // 백업 복원
  async restoreBackup(backupPath: string): Promise<BackupData> {
    try {
      const backupRef = ref(storage, backupPath);
      const downloadURL = await getDownloadURL(backupRef);
      
      const response = await fetch(downloadURL);
      if (!response.ok) {
        throw new Error('백업 파일을 다운로드할 수 없습니다.');
      }
      
      const backupData: BackupData = await response.json();
      
      // 버전 호환성 검사
      if (!backupData.version || !backupData.data) {
        throw new Error('지원하지 않는 백업 형식입니다.');
      }
      
      return backupData;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw new Error('백업 복원에 실패했습니다.');
    }
  }

  // 백업 삭제
  async deleteBackup(backupPath: string): Promise<void> {
    try {
      const backupRef = ref(storage, backupPath);
      await deleteObject(backupRef);
      console.log(`Backup deleted: ${backupPath}`);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw new Error('백업 삭제에 실패했습니다.');
    }
  }
}

// 백업 스케줄러 (클라이언트 사이드)
export class BackupScheduler {
  private static instance: BackupScheduler;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): BackupScheduler {
    if (!BackupScheduler.instance) {
      BackupScheduler.instance = new BackupScheduler();
    }
    return BackupScheduler.instance;
  }

  // 백업 스케줄 시작
  startScheduledBackup(userId: string, frequency: 'weekly' | 'monthly'): void {
    const key = `${userId}-${frequency}`;
    
    // 기존 스케줄 중지
    this.stopScheduledBackup(userId, frequency);
    
    const interval = this.calculateInterval(frequency);
    const timeout = setInterval(async () => {
      try {
        const backupService = new BackupService(userId);
        await backupService.createAutoBackup(frequency);
        console.log(`Scheduled ${frequency} backup completed for user: ${userId}`);
      } catch (error) {
        console.error(`Scheduled ${frequency} backup failed for user: ${userId}:`, error);
      }
    }, interval);
    
    this.intervals.set(key, timeout);
    console.log(`Started ${frequency} backup schedule for user: ${userId}`);
  }

  // 백업 스케줄 중지
  stopScheduledBackup(userId: string, frequency: 'weekly' | 'monthly'): void {
    const key = `${userId}-${frequency}`;
    const timeout = this.intervals.get(key);
    
    if (timeout) {
      clearInterval(timeout);
      this.intervals.delete(key);
      console.log(`Stopped ${frequency} backup schedule for user: ${userId}`);
    }
  }

  // 모든 스케줄 중지
  stopAllSchedules(): void {
    this.intervals.forEach((timeout) => clearInterval(timeout));
    this.intervals.clear();
    console.log('All backup schedules stopped');
  }

  // 백업 간격 계산 (밀리초)
  private calculateInterval(frequency: 'weekly' | 'monthly'): number {
    switch (frequency) {
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7일
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30일 (근사값)
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
