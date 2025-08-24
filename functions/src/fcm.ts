import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

const db = getFirestore();
const messaging = getMessaging();

/**
 * 사용자의 FCM 토큰을 저장하는 함수
 */
export async function saveFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found when saving FCM token`);
      return;
    }

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];
    
    // 토큰이 이미 존재하는지 확인
    if (!fcmTokens.includes(token)) {
      fcmTokens.push(token);
      
      await userRef.update({
        fcmTokens,
        updatedAt: new Date()
      });
      
      logger.info(`FCM token saved for user ${userId}`);
    }
  } catch (error) {
    logger.error(`Error saving FCM token for user ${userId}:`, error);
    throw error;
  }
}

/**
 * 사용자의 FCM 토큰을 제거하는 함수
 */
export async function removeFCMToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found when removing FCM token`);
      return;
    }

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];
    
    // 토큰 제거
    const updatedTokens = fcmTokens.filter((t: string) => t !== token);
    
    await userRef.update({
      fcmTokens: updatedTokens,
      updatedAt: new Date()
    });
    
    logger.info(`FCM token removed for user ${userId}`);
  } catch (error) {
    logger.error(`Error removing FCM token for user ${userId}:`, error);
    throw error;
  }
}

/**
 * 사용자에게 알림을 전송하는 함수
 */
export async function sendNotificationToUser(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<boolean> {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      logger.warn(`User ${userId} not found when sending notification`);
      return false;
    }

    const userData = userDoc.data()!;
    const fcmTokens = userData.fcmTokens || [];
    
    if (fcmTokens.length === 0) {
      logger.info(`No FCM tokens found for user ${userId}`);
      return false;
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: fcmTokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    
    // 실패한 토큰들 제거
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(fcmTokens[idx]);
        }
      });
      
      // 실패한 토큰들 제거
      const updatedTokens = fcmTokens.filter(token => !failedTokens.includes(token));
      await userRef.update({
        fcmTokens: updatedTokens,
        updatedAt: new Date()
      });
      
      logger.warn(`Removed ${failedTokens.length} invalid FCM tokens for user ${userId}`);
    }
    
    logger.info(`Notification sent to user ${userId}: ${response.successCount} successful, ${response.failureCount} failed`);
    return response.successCount > 0;
  } catch (error) {
    logger.error(`Error sending notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * 여러 사용자에게 알림을 전송하는 함수
 */
export async function sendNotificationToUsers(
  userIds: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{ successCount: number; failureCount: number }> {
  let successCount = 0;
  let failureCount = 0;
  
  for (const userId of userIds) {
    const success = await sendNotificationToUser(userId, notification);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  logger.info(`Bulk notification sent: ${successCount} successful, ${failureCount} failed`);
  return { successCount, failureCount };
}

/**
 * 그룹 멤버들에게 알림을 전송하는 함수
 */
export async function sendNotificationToGroup(
  groupId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  },
  excludeUserId?: string
): Promise<{ successCount: number; failureCount: number }> {
  try {
    const groupRef = db.collection('groups').doc(groupId);
    const groupDoc = await groupRef.get();
    
    if (!groupDoc.exists) {
      logger.warn(`Group ${groupId} not found when sending notification`);
      return { successCount: 0, failureCount: 0 };
    }

    const groupData = groupDoc.data()!;
    const memberIds = groupData.members || [];
    
    // 제외할 사용자 필터링
    const targetMemberIds = excludeUserId 
      ? memberIds.filter((id: string) => id !== excludeUserId)
      : memberIds;
    
    return await sendNotificationToUsers(targetMemberIds, notification);
  } catch (error) {
    logger.error(`Error sending notification to group ${groupId}:`, error);
    return { successCount: 0, failureCount: 1 };
  }
}

/**
 * 알림 전송 결과를 데이터베이스에 저장하는 함수
 */
export async function saveNotificationRecord(
  userId: string,
  notification: {
    title: string;
    message: string;
    type: string;
    data?: Record<string, any>;
  }
): Promise<void> {
  try {
    await db.collection('notifications').add({
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      status: 'unread',
      priority: 'normal',
      createdAt: new Date(),
      data: notification.data || {},
    });
    
    logger.info(`Notification record saved for user ${userId}`);
  } catch (error) {
    logger.error(`Error saving notification record for user ${userId}:`, error);
    throw error;
  }
}
