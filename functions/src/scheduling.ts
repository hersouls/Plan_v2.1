import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { sendNotificationToUser, saveNotificationRecord } from './fcm';

const db = getFirestore();

// 알림 스케줄링을 위한 인터페이스
interface ScheduledReminder {
  id: string;
  taskId: string;
  userId: string;
  taskTitle: string;
  dueDate: FirebaseFirestore.Timestamp;
  reminderTime: FirebaseFirestore.Timestamp;
  offsetMinutes: number;
  method: 'push' | 'email' | 'both';
  sent: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

type ReminderConfig = {
  offsetMinutes: number;
  method?: 'push' | 'email' | 'both';
};

/**
 * 매분 실행되는 알림 스케줄링 함수
 * 현재 시간에 전송해야 할 알림들을 찾아서 FCM으로 전송
 */
export const processScheduledReminders = onSchedule('every 1 minutes', async (_event) => {
  try {
    const now = new Date();
    const currentTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
    
    logger.info(`Processing scheduled reminders at ${currentTime.toISOString()}`);

    // 현재 시간에 전송해야 할 알림들 조회
    const remindersRef = db.collection('scheduledReminders');
    const snapshot = await remindersRef
      .where('reminderTime', '<=', currentTime)
      .where('sent', '==', false)
      .limit(50) // 한 번에 처리할 최대 알림 수
      .get();

    if (snapshot.empty) {
      logger.info('No reminders to process');
      return;
    }

    const batch = db.batch();
    const sendPromises: Promise<void>[] = [];

    snapshot.forEach((doc) => {
      const reminder = doc.data() as ScheduledReminder;
      
      // FCM 알림 전송
      const notificationPromise = sendNotificationToUser(
        reminder.userId,
        {
          title: '할일 알림',
          body: `"${reminder.taskTitle}" - ${reminder.offsetMinutes}분 후 마감입니다.`,
          data: {
            taskId: reminder.taskId,
            type: 'task_reminder',
            offsetMinutes: reminder.offsetMinutes.toString(),
          },
        }
      ).then(async (success) => {
        if (success) {
          logger.info(`Reminder sent successfully for task ${reminder.taskId}`);
          // 알림 전송 완료로 표시
          batch.update(doc.ref, { sent: true, sentAt: new Date() });
          
          // 알림 기록 저장
          await saveNotificationRecord(reminder.userId, {
            title: '할일 알림',
            message: `"${reminder.taskTitle}" - ${reminder.offsetMinutes}분 후 마감입니다.`,
            type: 'task_reminder',
            data: {
              taskId: reminder.taskId,
              offsetMinutes: reminder.offsetMinutes,
            },
          });
        } else {
          logger.error(`Failed to send reminder for task ${reminder.taskId}`);
          // 전송 실패 시 재시도 로직
          batch.update(doc.ref, { 
            sent: false, 
            lastError: 'FCM token not found or invalid',
            retryCount: (reminder.retryCount || 0) + 1 
          });
        }
      }).catch((error) => {
        logger.error(`Failed to send reminder for task ${reminder.taskId}:`, error);
        // 전송 실패 시 재시도 로직
        batch.update(doc.ref, { 
          sent: false, 
          lastError: error.message,
          retryCount: (reminder.retryCount || 0) + 1 
        });
      });

      sendPromises.push(notificationPromise);
    });

    // 모든 알림 전송 완료 대기
    await Promise.all(sendPromises);
    
    // 배치 업데이트 실행
    await batch.commit();
    
    logger.info(`Processed ${snapshot.size} reminders`);
  } catch (error) {
    logger.error('Error processing scheduled reminders:', error);
  }
});

/**
 * 매일 자정에 실행되는 반복 작업 생성 함수
 * 반복 설정이 있는 작업들의 다음 인스턴스를 생성
 */
export const generateRecurringTasks = onSchedule('0 0 * * *', async (_event) => {
  try {
    const now = new Date();
    logger.info(`Generating recurring tasks at ${now.toISOString()}`);

    // 반복 설정이 있고 아직 종료되지 않은 작업들 조회
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef
      .where('recurring', '!=', null)
      .where('recurring.endDate', '>', now.toISOString().split('T')[0])
      .get();

    if (snapshot.empty) {
      logger.info('No recurring tasks to process');
      return;
    }

    const batch = db.batch();
    let generatedCount = 0;

    snapshot.forEach((doc) => {
      const task = doc.data();
      const recurring = task.recurring;
      
      if (!recurring || !task.dueDate) return;

      const lastDueDate = task.dueDate.toDate();
      const nextDueDate = calculateNextDueDate(lastDueDate, recurring.frequency, recurring.interval);
      
      // 다음 인스턴스가 오늘 이후이고 종료일 이전인 경우에만 생성
      if (nextDueDate > now && (!recurring.endDate || nextDueDate <= new Date(recurring.endDate))) {
        const newTask = {
          ...task,
          id: undefined, // 새 ID 자동 생성
          dueDate: nextDueDate,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          recurring: {
            ...recurring,
            originalTaskId: doc.id,
            lastGenerated: new Date()
          }
        };

        // 새 작업 생성
        const newTaskRef = tasksRef.doc();
        batch.set(newTaskRef, newTask);
        
        // 원본 작업의 마지막 생성 시간 업데이트
        batch.update(doc.ref, {
          'recurring.lastGenerated': new Date(),
          updatedAt: new Date()
        });

        generatedCount++;
      }
    });

    await batch.commit();
    logger.info(`Generated ${generatedCount} recurring task instances`);
  } catch (error) {
    logger.error('Error generating recurring tasks:', error);
  }
});

/**
 * 다음 마감일 계산 함수
 */
function calculateNextDueDate(
  lastDueDate: Date, 
  frequency: string, 
  interval: number
): Date {
  const nextDate = new Date(lastDueDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (interval * 7));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
    default:
      throw new Error(`Unsupported frequency: ${frequency}`);
  }
  
  return nextDate;
}

/**
 * 작업 생성 시 알림 스케줄링 함수
 */
export const scheduleTaskReminders = onDocumentCreated('tasks/{taskId}', async (event) => {
  try {
    const taskData = event.data?.data();
    if (!taskData || !taskData.reminders || taskData.reminders.length === 0) {
      return;
    }

    const taskId = event.params.taskId;
    const batch = db.batch();
    const remindersRef = db.collection('scheduledReminders');

    // 각 알림에 대해 스케줄링
    taskData.reminders.forEach((reminder: ReminderConfig) => {
      if (reminder.offsetMinutes && taskData.dueDate) {
        const dueDate = taskData.dueDate.toDate();
        const reminderTime = new Date(dueDate.getTime() - (reminder.offsetMinutes * 60 * 1000));
        
        // 현재 시간보다 미래인 알림만 스케줄링
        if (reminderTime > new Date()) {
          const reminderDoc = remindersRef.doc();
          batch.set(reminderDoc, {
            taskId,
            userId: taskData.assigneeId,
            taskTitle: taskData.title,
            dueDate: taskData.dueDate,
            reminderTime,
            offsetMinutes: reminder.offsetMinutes,
            method: reminder.method || 'push',
            sent: false,
            createdAt: new Date()
          });
        }
      }
    });

    await batch.commit();
    logger.info(`Scheduled reminders for task ${taskId}`);
  } catch (error) {
    logger.error('Error scheduling task reminders:', error);
  }
});

/**
 * 작업 업데이트 시 알림 재스케줄링 함수
 */
export const rescheduleTaskReminders = onDocumentUpdated('tasks/{taskId}', async (event) => {
  try {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();
    
    if (!beforeData || !afterData) return;

    // 마감일이나 알림 설정이 변경된 경우에만 재스케줄링
    const dueDateChanged = beforeData.dueDate?.toDate().getTime() !== afterData.dueDate?.toDate().getTime();
    const remindersChanged = JSON.stringify(beforeData.reminders) !== JSON.stringify(afterData.reminders);
    
    if (!dueDateChanged && !remindersChanged) return;

    const taskId = event.params.taskId;
    
    // 기존 알림 삭제
    const remindersRef = db.collection('scheduledReminders');
    const existingReminders = await remindersRef.where('taskId', '==', taskId).get();
    
    const batch = db.batch();
    existingReminders.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 새 알림 스케줄링
    if (afterData.reminders && afterData.reminders.length > 0) {
      afterData.reminders.forEach((reminder: ReminderConfig) => {
        if (reminder.offsetMinutes && afterData.dueDate) {
          const dueDate = afterData.dueDate.toDate();
          const reminderTime = new Date(dueDate.getTime() - (reminder.offsetMinutes * 60 * 1000));
          
          if (reminderTime > new Date()) {
            const reminderDoc = remindersRef.doc();
            batch.set(reminderDoc, {
              taskId,
              userId: afterData.assigneeId,
              taskTitle: afterData.title,
              dueDate: afterData.dueDate,
              reminderTime,
              offsetMinutes: reminder.offsetMinutes,
              method: reminder.method || 'push',
              sent: false,
              createdAt: new Date()
            });
          }
        }
      });
    }

    await batch.commit();
    logger.info(`Rescheduled reminders for task ${taskId}`);
  } catch (error) {
    logger.error('Error rescheduling task reminders:', error);
  }
});
