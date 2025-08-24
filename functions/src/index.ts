import * as admin from 'firebase-admin';
import {
  onDocumentCreated,
  onDocumentDeleted,
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
// import { onObjectFinalized, onObjectDeleted } from 'firebase-functions/v2/storage';

// Import scheduling functions

// Initialize Firebase Admin
admin.initializeApp();

// Get Firestore instance
const db = admin.firestore();

// Get FCM instance
const messaging = admin.messaging();

// Task-related cloud functions
export const onTaskCreated = onDocumentCreated(
  'tasks/{taskId}',
  async event => {
    const taskData = event.data?.data();
    const taskId = event.params.taskId;

    if (!taskData) return;

    console.log('New task created:', taskId, taskData);

    try {
      // Send notification to assignee if different from creator
      if (taskData.assigneeId !== taskData.userId) {
        await sendTaskAssignmentNotification(
          taskData.assigneeId,
          taskData,
          taskId
        );
      }

      // Update group statistics (skip personal tasks)
      if (taskData.groupId && taskData.groupId !== 'personal') {
        await updateGroupStats(taskData.groupId);
      }

      // Create activity log
      await createActivityLog({
        taskId,
        userId: taskData.userId,
        action: 'created',
        details: { taskTitle: taskData.title },
      });
    } catch (error) {
      console.error('Error processing task creation:', error);
    }
  }
);

export const onTaskUpdated = onDocumentUpdated(
  'tasks/{taskId}',
  async event => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const taskId = event.params.taskId;

    if (!before || !after) return;

    console.log('Task updated:', taskId);

    try {
      // Check if task was completed
      if (before.status !== 'completed' && after.status === 'completed') {
        await handleTaskCompletion(taskId, after);
      }

      // Check if assignee changed
      if (before.assigneeId !== after.assigneeId) {
        await sendTaskReassignmentNotification(after.assigneeId, after, taskId);
      }

      // Update group statistics (skip personal tasks)
      if (after.groupId && after.groupId !== 'personal') {
        await updateGroupStats(after.groupId);
      }
    } catch (error) {
      console.error('Error processing task update:', error);
    }
  }
);

export const onCommentCreated = onDocumentCreated(
  'comments/{commentId}',
  async event => {
    const commentData = event.data?.data();
    const commentId = event.params.commentId;

    if (!commentData) return;

    try {
      const taskId = commentData.taskId;

      // Get task data
      const taskDoc = await db.doc(`tasks/${taskId}`).get();
      if (!taskDoc.exists) return;

      const taskData = taskDoc.data()!;

      // Update task comment count
      const commentsQuery = await db
        .collection('comments')
        .where('taskId', '==', taskId)
        .get();

      await db.doc(`tasks/${taskId}`).update({
        commentCount: commentsQuery.size,
        lastCommentAt: new Date(),
      });

      // Send notification to task members
      const notifyUsers = [taskData.userId, taskData.assigneeId].filter(
        userId => userId !== commentData.userId
      );

      for (const userId of notifyUsers) {
        await sendCommentNotification(userId, taskData, commentData);
      }
    } catch (error) {
      console.error('Error processing comment creation:', error);
    }
  }
);

export const onCommentDeleted = onDocumentDeleted(
  'comments/{commentId}',
  async event => {
    const commentData = event.data?.data();

    if (!commentData) return;

    try {
      const taskId = commentData.taskId;

      // Update task comment count
      const commentsQuery = await db
        .collection('comments')
        .where('taskId', '==', taskId)
        .get();

      await db.doc(`tasks/${taskId}`).update({
        commentCount: commentsQuery.size,
        lastCommentAt: commentsQuery.size > 0 ? new Date() : null,
      });
    } catch (error) {
      console.error('Error processing comment deletion:', error);
    }
  }
);

// Scheduled function to send daily reminders
export const sendDailyReminders = onSchedule('0 9 * * *', async (_event) => {
  console.log('Running daily reminders...');

  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Get all tasks due today
    const tasksQuery = await db
      .collection('tasks')
      .where('status', 'in', ['pending', 'in_progress'])
      .where('dueDate', '<=', admin.firestore.Timestamp.fromDate(today))
      .get();

    const reminderPromises: Promise<void>[] = [];

    tasksQuery.forEach(doc => {
      const taskData = doc.data();
      reminderPromises.push(
        sendTaskReminderNotification(taskData.assigneeId, taskData, doc.id)
      );
    });

    await Promise.all(reminderPromises);
    console.log(`Sent ${reminderPromises.length} daily reminders`);
  } catch (error) {
    console.error('Error sending daily reminders:', error);
  }
});

// Scheduled function to send weekly summaries
export const sendWeeklySummary = onSchedule('0 18 * * 0', async (_event) => {
  console.log('Running weekly summary...');

  try {
    // Get all active groups
    const groupsQuery = await db.collection('groups').get();

    for (const groupDoc of groupsQuery.docs) {
      const groupData = groupDoc.data();
      await sendWeeklySummaryToGroup(groupDoc.id, groupData);
    }
  } catch (error) {
    console.error('Error sending weekly summaries:', error);
  }
});

// Helper function to send task assignment notification
interface TaskData {
  userId: string;
  assigneeId: string;
  title: string;
  [key: string]: any;
}

async function sendTaskAssignmentNotification(
  userId: string,
  taskData: TaskData,
  taskId: string
) {
  try {
    // Get user's FCM tokens
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    // Get assigner's name
    const assignerDoc = await db.doc(`users/${taskData.userId}`).get();
    const assignerName = assignerDoc.exists
      ? assignerDoc.data()!.displayName || 'Someone'
      : 'Someone';

    const message = {
      notification: {
        title: '새 할일이 할당되었습니다',
        body: `${assignerName}님이 "${taskData.title}" 할일을 할당했습니다.`,
      },
      data: {
        type: 'task_assigned',
        taskId: taskId,
        url: `/tasks/${taskId}`,
      },
      tokens: fcmTokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    // Persist a corresponding notification document for the UI
    await db.collection('notifications').add({
      userId,
      title: '새 할일이 할당되었습니다',
      message: `${assignerName}님이 "${taskData.title}" 할일을 할당했습니다.`,
      type: 'task',
      status: 'unread',
      priority: 'medium',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { taskId, actionUrl: `/tasks/${taskId}` },
    });
    console.log(
      'Task assignment notification sent:',
      response.successCount,
      'successful,',
      response.failureCount,
      'failed'
    );
  } catch (error) {
    console.error('Error sending task assignment notification:', error);
  }
}

// Helper function to send task reminder notification
async function sendTaskReminderNotification(
  userId: string,
  taskData: TaskData,
  taskId: string
) {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    const dueDate = new Date(taskData.dueDate);
    const timeUntilDue = dueDate.getTime() - Date.now();
    const hoursUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60));

    let dueSoon = '';
    if (hoursUntilDue <= 0) {
      dueSoon = '이미 마감되었습니다';
    } else if (hoursUntilDue <= 24) {
      dueSoon = `${hoursUntilDue}시간 후 마감`;
    } else {
      dueSoon = `${Math.ceil(hoursUntilDue / 24)}일 후 마감`;
    }

    const message = {
      notification: {
        title: '할일 알림',
        body: `"${taskData.title}" - ${dueSoon}`,
      },
      data: {
        type: 'task_reminder',
        taskId: taskId,
        url: `/tasks/${taskId}`,
      },
      tokens: fcmTokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    await db.collection('notifications').add({
      userId,
      title: '할일 알림',
      message: `"${taskData.title}" - ${dueSoon}`,
      type: 'reminder',
      status: 'unread',
      priority: 'high',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { taskId, actionUrl: `/tasks/${taskId}` },
    });
    console.log(
      'Task reminder sent:',
      response.successCount,
      'successful,',
      response.failureCount,
      'failed'
    );
  } catch (error) {
    console.error('Error sending task reminder:', error);
  }
}

// Helper function to handle task completion
async function handleTaskCompletion(taskId: string, taskData: TaskData) {
  try {
    // Update user statistics
    await updateUserStats(taskData.completedBy);

    // Send completion notification to creator if different from completer
    if (taskData.userId !== taskData.completedBy) {
      await sendTaskCompletionNotification(taskData.userId, taskData, taskId);
    }

    // Create activity log
    await createActivityLog({
      taskId,
      userId: taskData.completedBy,
      action: 'completed',
      details: { taskTitle: taskData.title },
    });
  } catch (error) {
    console.error('Error handling task completion:', error);
  }
}

// Helper function to send task completion notification
async function sendTaskCompletionNotification(
  userId: string,
  taskData: TaskData,
  taskId: string
) {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    // Get completer's name
    const completerDoc = await db.doc(`users/${taskData.completedBy}`).get();
    const completerName = completerDoc.exists
      ? completerDoc.data()!.displayName || 'Someone'
      : 'Someone';

    const message = {
      notification: {
        title: '할일이 완료되었습니다',
        body: `${completerName}님이 "${taskData.title}" 할일을 완료했습니다.`,
      },
      data: {
        type: 'task_completed',
        taskId: taskId,
        url: `/tasks/${taskId}`,
      },
      tokens: fcmTokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    await db.collection('notifications').add({
      userId,
      title: '할일이 완료되었습니다',
      message: `${completerName}님이 "${taskData.title}" 할일을 완료했습니다.`,
      type: 'task',
      status: 'unread',
      priority: 'low',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { taskId, actionUrl: `/tasks/${taskId}` },
    });
    console.log(
      'Task completion notification sent:',
      response.successCount,
      'successful'
    );
  } catch (error) {
    console.error('Error sending task completion notification:', error);
  }
}

// Helper function to send comment notification
async function sendCommentNotification(
  userId: string,
  taskData: TaskData & { id: string },
  commentData: { id: string; userId: string; userName: string; mentions?: string[] }
) {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    // 멘션된 사용자 확인
    const mentionedUsers = commentData.mentions || [];
    const isMentioned = mentionedUsers.includes(userId);

    // 멘션된 경우 더 강조된 알림
    const notificationTitle = isMentioned
      ? '멘션되었습니다'
      : '새 댓글이 있습니다';

    const notificationBody = isMentioned
      ? `${commentData.userName}님이 "${taskData.title}" 할일에서 당신을 멘션했습니다.`
      : `${commentData.userName}님이 "${taskData.title}" 할일에 댓글을 남겼습니다.`;

    const message = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
        icon: '/moonwave-icon.svg',
        badge: '/moonwave-icon.svg',
      },
      data: {
        type: isMentioned ? 'mention' : 'new_comment',
        taskId: taskData.id,
        commentId: commentData.id,
        url: `/tasks/${taskData.id}`,
        userId: commentData.userId,
        userName: commentData.userName,
      },
      tokens: fcmTokens,
      android: {
        notification: {
          channelId: isMentioned ? 'mentions' : 'comments',
          priority: isMentioned ? 'high' : 'normal',
          sound: isMentioned ? 'default' : 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: isMentioned ? 'default' : 'default',
            badge: 1,
            category: isMentioned ? 'MENTION' : 'COMMENT',
          },
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    await db.collection('notifications').add({
      userId,
      title: notificationTitle,
      message: notificationBody,
      type: 'task',
      status: 'unread',
      priority: isMentioned ? 'high' : 'medium',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      data: { taskId: taskData.id, actionUrl: `/tasks/${taskData.id}` },
    });
    console.log(
      `${isMentioned ? 'Mention' : 'Comment'} notification sent:`,
      response.successCount,
      'successful'
    );
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
}

// Helper function to update group statistics
async function updateGroupStats(groupId: string) {
  try {
    const tasksQuery = await db
      .collection('tasks')
      .where('groupId', '==', groupId)
      .get();

    let totalTasks = 0;
    let completedTasks = 0;

    tasksQuery.forEach(doc => {
      totalTasks++;
      const taskData = doc.data();
      if (taskData.status === 'completed') {
        completedTasks++;
      }
    });

    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    await db.doc(`groups/${groupId}`).update({
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating group stats:', error);
  }
}

// Helper function to update user statistics
async function updateUserStats(userId: string) {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const stats = userData.stats || {};

    // Update completion count
    stats.totalTasksCompleted = (stats.totalTasksCompleted || 0) + 1;

    // Update streak (simplified - would need more complex logic for accurate streaks)
    const today = new Date().toDateString();
    const lastCompletionDate = stats.lastCompletionDate;

    if (lastCompletionDate !== today) {
      stats.currentStreak = (stats.currentStreak || 0) + 1;
      stats.longestStreak = Math.max(
        stats.longestStreak || 0,
        stats.currentStreak
      );
      stats.lastCompletionDate = today;
    }

    await db.doc(`users/${userId}`).update({
      stats,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Helper function to create activity log
interface ActivityLogInput {
  taskId: string;
  userId: string;
  action: 'created' | 'completed' | 'updated' | 'commented';
  details?: Record<string, unknown>;
}

async function createActivityLog(activity: ActivityLogInput) {
  try {
    await db.collection('activities').add({
      ...activity,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
}

// Helper function to send weekly summary
async function sendWeeklySummaryToGroup(groupId: string, groupData: { memberIds?: string[] }) {
  try {
    const memberIds = groupData.memberIds || [];

    for (const memberId of memberIds) {
      // Get member's completed tasks this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const completedTasksQuery = await db
        .collection('tasks')
        .where('groupId', '==', groupId)
        .where('completedBy', '==', memberId)
        .where('completedAt', '>=', weekAgo)
        .get();

      const completedCount = completedTasksQuery.size;

      // Send summary notification
      const userDoc = await db.doc(`users/${memberId}`).get();
      if (!userDoc.exists) continue;

      const userData = userDoc.data()!;
      const fcmTokens = userData.fcmTokens || [];

      if (fcmTokens.length === 0) continue;

      const message = {
        notification: {
          title: '주간 요약',
          body: `이번 주에 ${completedCount}개의 할일을 완료했습니다! 👏`,
        },
        data: {
          type: 'weekly_summary',
          groupId: groupId,
          url: '/statistics',
        },
        tokens: fcmTokens,
      };

      await messaging.sendEachForMulticast(message);
      // Persist weekly summary notifications per member
      await db.collection('notifications').add({
        userId: memberId,
        title: '주간 요약',
        message: `이번 주에 ${completedCount}개의 할일을 완료했습니다! 👏`,
        type: 'system',
        status: 'unread',
        priority: 'low',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: { actionUrl: '/statistics' },
      });
    }
  } catch (error) {
    console.error('Error sending weekly summary:', error);
  }
}

// Helper function to send task reassignment notification
async function sendTaskReassignmentNotification(
  userId: string,
  taskData: Pick<TaskData, 'title'>,
  taskId: string
) {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];

    if (fcmTokens.length === 0) return;

    const message = {
      notification: {
        title: '할일이 재할당되었습니다',
        body: `"${taskData.title}" 할일이 당신에게 할당되었습니다.`,
      },
      data: {
        type: 'task_reassigned',
        taskId: taskId,
        url: `/tasks/${taskId}`,
      },
      tokens: fcmTokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(
      'Task reassignment notification sent:',
      response.successCount,
      'successful'
    );
  } catch (error) {
    console.error('Error sending task reassignment notification:', error);
  }
}

// Storage functions are temporarily disabled due to region conflicts
// Cloud function to handle file upload completion
// export const onFileUploaded = onObjectFinalized(async (event) => {
//   const filePath = event.data.name;
//   const contentType = event.data.contentType;
//   const size = event.data.size;

//   console.log('File uploaded:', filePath, contentType, size);

//   try {
//     // Extract task ID from path if it's a task attachment
//     if (filePath && filePath.startsWith('task-attachments/')) {
//       await processTaskAttachment(event.data);
//     }
//   } catch (error) {
//     console.error('Error processing uploaded file:', error);
//   }
// });

// Cloud function to handle file deletion
// export const onFileDeleted = onObjectDeleted(async (event) => {
//   const filePath = event.data.name;

//   console.log('File deleted:', filePath);

//   try {
//     // Clean up any references to the deleted file
//     if (filePath && filePath.startsWith('task-attachments/')) {
//       await cleanupTaskAttachment(filePath);
//     }
//   } catch (error) {
//     console.error('Error processing file deletion:', error);
//   }
// });

// Export scheduling functions
export {
  generateRecurringTasks,
  processScheduledReminders,
  rescheduleTaskReminders,
  scheduleTaskReminders,
};
