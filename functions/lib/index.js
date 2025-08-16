"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWeeklySummary = exports.sendDailyReminders = exports.onCommentCreated = exports.onTaskUpdated = exports.onTaskCreated = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
// import { onObjectFinalized, onObjectDeleted } from 'firebase-functions/v2/storage';
// Initialize Firebase Admin
admin.initializeApp();
// Get Firestore instance
const db = admin.firestore();
// Get FCM instance
const messaging = admin.messaging();
// Task-related cloud functions
exports.onTaskCreated = (0, firestore_1.onDocumentCreated)('tasks/{taskId}', async (event) => {
    var _a;
    const taskData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const taskId = event.params.taskId;
    if (!taskData)
        return;
    console.log('New task created:', taskId, taskData);
    try {
        // Send notification to assignee if different from creator
        if (taskData.assigneeId !== taskData.userId) {
            await sendTaskAssignmentNotification(taskData.assigneeId, taskData, taskId);
        }
        // Update group statistics
        await updateGroupStats(taskData.groupId);
        // Create activity log
        await createActivityLog({
            taskId,
            userId: taskData.userId,
            action: 'created',
            details: { taskTitle: taskData.title },
        });
    }
    catch (error) {
        console.error('Error processing task creation:', error);
    }
});
exports.onTaskUpdated = (0, firestore_1.onDocumentUpdated)('tasks/{taskId}', async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    const taskId = event.params.taskId;
    if (!before || !after)
        return;
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
        // Update group statistics
        await updateGroupStats(after.groupId);
    }
    catch (error) {
        console.error('Error processing task update:', error);
    }
});
exports.onCommentCreated = (0, firestore_1.onDocumentCreated)('tasks/{taskId}/comments/{commentId}', async (event) => {
    var _a;
    const commentData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    const taskId = event.params.taskId;
    if (!commentData)
        return;
    try {
        // Get task data
        const taskDoc = await db.doc(`tasks/${taskId}`).get();
        if (!taskDoc.exists)
            return;
        const taskData = taskDoc.data();
        // Send notification to task members
        const notifyUsers = [taskData.userId, taskData.assigneeId].filter(userId => userId !== commentData.userId);
        for (const userId of notifyUsers) {
            await sendCommentNotification(userId, taskData, commentData);
        }
    }
    catch (error) {
        console.error('Error processing comment creation:', error);
    }
});
// Scheduled function to send daily reminders
exports.sendDailyReminders = (0, scheduler_1.onSchedule)('0 9 * * *', async (event) => {
    console.log('Running daily reminders...');
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        // Get all tasks due today
        const tasksQuery = await db
            .collection('tasks')
            .where('status', 'in', ['pending', 'in_progress'])
            .where('dueDate', '<=', today.toISOString())
            .get();
        const reminderPromises = [];
        tasksQuery.forEach(doc => {
            const taskData = doc.data();
            reminderPromises.push(sendTaskReminderNotification(taskData.assigneeId, taskData, doc.id));
        });
        await Promise.all(reminderPromises);
        console.log(`Sent ${reminderPromises.length} daily reminders`);
    }
    catch (error) {
        console.error('Error sending daily reminders:', error);
    }
});
// Scheduled function to send weekly summaries
exports.sendWeeklySummary = (0, scheduler_1.onSchedule)('0 18 * * 0', async (event) => {
    console.log('Running weekly summary...');
    try {
        // Get all active groups
        const groupsQuery = await db.collection('groups').get();
        for (const groupDoc of groupsQuery.docs) {
            const groupData = groupDoc.data();
            await sendWeeklySummaryToGroup(groupDoc.id, groupData);
        }
    }
    catch (error) {
        console.error('Error sending weekly summaries:', error);
    }
});
// Helper function to send task assignment notification
async function sendTaskAssignmentNotification(userId, taskData, taskId) {
    try {
        // Get user's FCM tokens
        const userDoc = await db.doc(`users/${userId}`).get();
        if (!userDoc.exists)
            return;
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0)
            return;
        // Get assigner's name
        const assignerDoc = await db.doc(`users/${taskData.userId}`).get();
        const assignerName = assignerDoc.exists
            ? assignerDoc.data().displayName || 'Someone'
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
        console.log('Task assignment notification sent:', response.successCount, 'successful,', response.failureCount, 'failed');
    }
    catch (error) {
        console.error('Error sending task assignment notification:', error);
    }
}
// Helper function to send task reminder notification
async function sendTaskReminderNotification(userId, taskData, taskId) {
    try {
        const userDoc = await db.doc(`users/${userId}`).get();
        if (!userDoc.exists)
            return;
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0)
            return;
        const dueDate = new Date(taskData.dueDate);
        const timeUntilDue = dueDate.getTime() - Date.now();
        const hoursUntilDue = Math.ceil(timeUntilDue / (1000 * 60 * 60));
        let dueSoon = '';
        if (hoursUntilDue <= 0) {
            dueSoon = '이미 마감되었습니다';
        }
        else if (hoursUntilDue <= 24) {
            dueSoon = `${hoursUntilDue}시간 후 마감`;
        }
        else {
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
        console.log('Task reminder sent:', response.successCount, 'successful,', response.failureCount, 'failed');
    }
    catch (error) {
        console.error('Error sending task reminder:', error);
    }
}
// Helper function to handle task completion
async function handleTaskCompletion(taskId, taskData) {
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
    }
    catch (error) {
        console.error('Error handling task completion:', error);
    }
}
// Helper function to send task completion notification
async function sendTaskCompletionNotification(userId, taskData, taskId) {
    try {
        const userDoc = await db.doc(`users/${userId}`).get();
        if (!userDoc.exists)
            return;
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0)
            return;
        // Get completer's name
        const completerDoc = await db.doc(`users/${taskData.completedBy}`).get();
        const completerName = completerDoc.exists
            ? completerDoc.data().displayName || 'Someone'
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
        console.log('Task completion notification sent:', response.successCount, 'successful');
    }
    catch (error) {
        console.error('Error sending task completion notification:', error);
    }
}
// Helper function to send comment notification
async function sendCommentNotification(userId, taskData, commentData) {
    try {
        const userDoc = await db.doc(`users/${userId}`).get();
        if (!userDoc.exists)
            return;
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0)
            return;
        const message = {
            notification: {
                title: '새 댓글이 있습니다',
                body: `${commentData.userName}님이 "${taskData.title}" 할일에 댓글을 남겼습니다.`,
            },
            data: {
                type: 'new_comment',
                taskId: taskData.id,
                url: `/tasks/${taskData.id}`,
            },
            tokens: fcmTokens,
        };
        const response = await messaging.sendEachForMulticast(message);
        console.log('Comment notification sent:', response.successCount, 'successful');
    }
    catch (error) {
        console.error('Error sending comment notification:', error);
    }
}
// Helper function to update group statistics
async function updateGroupStats(groupId) {
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
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        await db.doc(`groups/${groupId}`).update({
            totalTasks,
            completedTasks,
            completionRate: Math.round(completionRate),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('Error updating group stats:', error);
    }
}
// Helper function to update user statistics
async function updateUserStats(userId) {
    try {
        const userDoc = await db.doc(`users/${userId}`).get();
        if (!userDoc.exists)
            return;
        const userData = userDoc.data();
        const stats = userData.stats || {};
        // Update completion count
        stats.totalTasksCompleted = (stats.totalTasksCompleted || 0) + 1;
        // Update streak (simplified - would need more complex logic for accurate streaks)
        const today = new Date().toDateString();
        const lastCompletionDate = stats.lastCompletionDate;
        if (lastCompletionDate !== today) {
            stats.currentStreak = (stats.currentStreak || 0) + 1;
            stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);
            stats.lastCompletionDate = today;
        }
        await db.doc(`users/${userId}`).update({
            stats,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('Error updating user stats:', error);
    }
}
// Helper function to create activity log
async function createActivityLog(activity) {
    try {
        await db.collection('activities').add(Object.assign(Object.assign({}, activity), { createdAt: admin.firestore.FieldValue.serverTimestamp() }));
    }
    catch (error) {
        console.error('Error creating activity log:', error);
    }
}
// Helper function to send weekly summary
async function sendWeeklySummaryToGroup(groupId, groupData) {
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
            if (!userDoc.exists)
                continue;
            const userData = userDoc.data();
            const fcmTokens = userData.fcmTokens || [];
            if (fcmTokens.length === 0)
                continue;
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
        }
    }
    catch (error) {
        console.error('Error sending weekly summary:', error);
    }
}
// Helper function to send task reassignment notification
async function sendTaskReassignmentNotification(userId, taskData, taskId) {
    try {
        const userDoc = await db.doc(`users/${userId}`).get();
        if (!userDoc.exists)
            return;
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];
        if (fcmTokens.length === 0)
            return;
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
        console.log('Task reassignment notification sent:', response.successCount, 'successful');
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map