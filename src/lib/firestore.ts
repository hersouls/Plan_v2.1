import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type {
  CreateGroupInput,
  CreateTaskInput,
  FamilyGroup,
  Task,
  UpdateGroupInput,
  UpdateTaskInput,
  User,
} from '../types';
import { db } from './firebase';
import logger from './logger';

// 안전한 실시간 구독을 위한 헬퍼 함수 - 재시도 로직 포함
function createSafeSnapshot<T>(
  queryOrDoc: any,
  onNext: (data: T) => void,
  onError?: (error: Error) => void,
  retryCount: number = 0
): Unsubscribe {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  try {
    return onSnapshot(queryOrDoc, {
      next: snapshot => {
        try {
          // Check if it's a QuerySnapshot (has 'empty' property)
          if ('empty' in snapshot && 'docs' in snapshot) {
            if (snapshot.empty) {
              onNext([] as T);
              return;
            }

            // QuerySnapshot
            const data = (snapshot.docs as any[]).map((doc: any) => ({
              id: doc.id,
              ...(doc.data() as any),
            })) as T;
            onNext(data);
          } else {
            // DocumentSnapshot
            if (snapshot.exists()) {
              const data = {
                id: snapshot.id,
                ...(snapshot.data() as any),
              } as T;
              onNext(data);
            } else {
              onNext(null as T);
            }
          }
        } catch (error) {
          logger.error('Error processing snapshot data:', error);
          if (onError) onError(error as Error);
        }
      },
      error: error => {
        // 권한 오류나 400 오류는 조용히 처리
        if (
          error?.code === 'permission-denied' ||
          error?.code === 'unauthenticated' ||
          error?.message?.includes('permission') ||
          error?.message?.includes('400') ||
          error?.message?.includes('Bad Request')
        ) {
          logger.debug(
            'Firestore snapshot permission/400 error, using empty data:',
            error
          );
          // 빈 데이터로 콜백 호출
          onNext([] as T);
          return;
        }

        logger.error('Firestore snapshot error:', error);

        // 재시도 로직 - assertion 에러나 네트워크 에러의 경우
        if (
          retryCount < MAX_RETRIES &&
          (error.message.includes('INTERNAL ASSERTION FAILED') ||
            error.message.includes('Unexpected state') ||
            error.message.includes('network'))
        ) {
          logger.info(
            `Retrying snapshot connection... (${retryCount + 1}/${MAX_RETRIES})`
          );

          setTimeout(() => {
            try {
              createSafeSnapshot(queryOrDoc, onNext, onError, retryCount + 1);
            } catch (retryError) {
              logger.error('Retry failed:', retryError);
              if (onError) onError(retryError as Error);
            }
          }, RETRY_DELAY * (retryCount + 1));
        } else {
          if (onError) onError(error);
        }
      },
    });
  } catch (error) {
    logger.error('Error creating snapshot listener:', error);
    if (onError) onError(error as Error);
    // 빈 unsubscribe 함수 반환
    return () => {};
  }
}

// Task-related Firestore operations
export const taskService = {
  // Create a new task
  async createTask(taskData: CreateTaskInput): Promise<string> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const sanitizedData = filterUndefinedValues({
        ...taskData,
        status: 'pending',
        watchers: taskData.watchers || [],
        mentionedUsers: taskData.mentionedUsers || [],
        attachments: taskData.attachments || [],
        tags: taskData.tags || [],
        reminders: taskData.reminders || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Additional check for undefined values
      const finalData = Object.fromEntries(
        Object.entries(sanitizedData).filter(
          ([_, value]) => value !== undefined
        )
      );

      logger.debug('taskService', 'final task data', finalData); // 디버깅용 로그
      const docRef = await addDoc(collection(db, 'tasks'), finalData);
      return docRef.id;
    } catch (error) {
      logger.error('taskService', 'createTask failed', error);
      throw error;
    }
  },

  // Update a task
  async updateTask(taskId: string, updates: UpdateTaskInput): Promise<void> {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      // Filter out undefined values to prevent Firestore errors
      const sanitizedUpdates = filterUndefinedValues({
        ...updates,
        updatedAt: serverTimestamp(),
      });
      await updateDoc(taskRef, sanitizedUpdates);
    } catch (error) {
      logger.error('taskService', 'updateTask failed', error);
      throw error;
    }
  },

  // Delete a task
  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      logger.error('taskService', 'deleteTask failed', error);
      throw error;
    }
  },

  // Get a single task
  async getTask(taskId: string): Promise<Task | null> {
    try {
      const docSnap = await getDoc(doc(db, 'tasks', taskId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Task;
      }
      return null;
    } catch (error) {
      logger.error('taskService', 'getTask failed', error);
      throw error;
    }
  },

  // Subscribe to a single task document
  subscribeToTask(
    taskId: string,
    callback: (task: Task | null) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      return createSafeSnapshot<Task | null>(taskRef, callback, onError);
    } catch (error) {
      logger.error('taskService', 'subscribeToTask failed', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },

  // Subscribe to tasks for a specific group
  subscribeToGroupTasks(
    groupId: string,
    callback: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      return createSafeSnapshot<Task[]>(q, callback, onError);
    } catch (error) {
      logger.error('taskService', 'subscribeToGroupTasks failed', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },

  // Subscribe to tasks for a specific user
  subscribeToUserTasks(
    userId: string,
    callback: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('assigneeId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return createSafeSnapshot<Task[]>(q, callback, onError);
    } catch (error) {
      logger.error('taskService', 'subscribeToUserTasks failed', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },

  // Subscribe to personal tasks for a specific user
  subscribeToPersonalTasks(
    userId: string,
    callback: (tasks: Task[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      // 개인 할일은 groupId가 'personal'이거나 없는 할일
      const q = query(
        collection(db, 'tasks'),
        where('assigneeId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      return createSafeSnapshot<Task[]>(
        q,
        allTasks => {
          // 클라이언트 사이드에서 개인 할일만 필터링
          const personalTasks = allTasks.filter(
            task => !task.groupId || task.groupId === 'personal'
          );
          callback(personalTasks);
        },
        onError
      );
    } catch (error) {
      logger.error('taskService', 'subscribeToPersonalTasks failed', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },

  // Get tasks for a group (one-time)
  async getGroupTasks(groupId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('groupId', '==', groupId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      logger.error('taskService', 'getGroupTasks failed', error);
      throw error;
    }
  },

  // Get tasks for a user (one-time)
  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('assigneeId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
    } catch (error) {
      logger.error('taskService', 'getUserTasks failed', error);
      throw error;
    }
  },
};

// Group-related Firestore operations
export const groupService = {
  // Transfer group ownership atomically
  async transferOwnership(
    groupId: string,
    newOwnerUserId: string,
    requestingUserId: string
  ): Promise<void> {
    try {
      await runTransaction(db, async tx => {
        const groupRef = doc(db, 'groups', groupId);
        const snap = await tx.get(groupRef);
        if (!snap.exists()) {
          throw new Error('Group not found');
        }

        const data: any = snap.data();
        const currentOwner: string = data.ownerId;

        if (currentOwner !== requestingUserId) {
          throw new Error('Only the current owner can transfer ownership');
        }

        if (newOwnerUserId === currentOwner) {
          throw new Error('New owner must be different from current owner');
        }

        const memberIds: string[] = Array.isArray(data.memberIds)
          ? [...data.memberIds]
          : [];
        if (!memberIds.includes(newOwnerUserId)) {
          memberIds.push(newOwnerUserId);
        }

        const memberRoles: Record<string, string> = {
          ...(data.memberRoles || {}),
        };
        memberRoles[newOwnerUserId] = 'owner';
        // Downgrade previous owner to admin for continuity
        memberRoles[currentOwner] = 'admin';

        tx.update(groupRef, {
          ownerId: newOwnerUserId,
          memberIds,
          memberRoles,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      logger.error('groupService', 'transferOwnership failed', error);
      throw error;
    }
  },
  // Create a new group
  async createGroup(groupData: CreateGroupInput): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'groups'), {
        ...groupData,
        memberIds: [groupData.ownerId],
        memberRoles: { [groupData.ownerId]: 'owner' },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('groupService', 'createGroup failed', error);
      throw error;
    }
  },

  // Update a group
  async updateGroup(groupId: string, updates: UpdateGroupInput): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('groupService', 'updateGroup failed', error);
      throw error;
    }
  },

  // Get a single group
  async getGroup(
    groupId: string | null | undefined
  ): Promise<FamilyGroup | null> {
    try {
      // groupId가 null이거나 undefined이면 null 반환
      if (!groupId) {
        return null;
      }

      const docSnap = await getDoc(doc(db, 'groups', groupId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as FamilyGroup;
      }
      return null;
    } catch (error) {
      logger.error('groupService', 'getGroup failed', error);
      throw error;
    }
  },

  // Subscribe to a group
  subscribeToGroup(
    groupId: string | null | undefined,
    callback: (group: FamilyGroup | null) => void,
    onError?: (error: Error) => void
  ) {
    try {
      // groupId가 null이거나 undefined이면 구독하지 않음
      if (!groupId) {
        callback(null);
        return () => {};
      }

      const groupRef = doc(db, 'groups', groupId);
      return createSafeSnapshot<FamilyGroup | null>(
        groupRef,
        callback,
        onError
      );
    } catch (error) {
      logger.error('groupService', 'subscribeToGroup failed', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },

  // Add member to group
  async addMemberToGroup(
    groupId: string,
    userId: string,
    role: string = 'member'
  ) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        memberIds: arrayUnion(userId),
        [`memberRoles.${userId}`]: role,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('groupService', 'addMemberToGroup failed', error);
      throw error;
    }
  },

  // Remove member from group
  async removeMemberFromGroup(groupId: string, userId: string) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const existing = await getDoc(groupRef);
      if (!existing.exists()) {
        throw new Error('Group not found');
      }
      const data: any = existing.data();
      if (data.ownerId === userId) {
        throw new Error('Cannot remove the group owner');
      }
      const batch = writeBatch(db);

      // Remove from memberIds array
      batch.update(groupRef, {
        memberIds: arrayRemove(userId),
        updatedAt: serverTimestamp(),
      });

      // Remove from memberRoles
      const groupDoc = await getDoc(groupRef);
      if (groupDoc.exists()) {
        const data = groupDoc.data();
        const memberRoles = data.memberRoles || {};
        delete memberRoles[userId];
        batch.update(groupRef, { memberRoles });
      }

      await batch.commit();
    } catch (error) {
      logger.error('groupService', 'removeMemberFromGroup failed', error);
      throw error;
    }
  },

  // Get user's groups
  async getUserGroups(userId: string): Promise<FamilyGroup[]> {
    try {
      const q = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FamilyGroup[];
    } catch (error) {
      logger.error('groupService', 'getUserGroups failed', error);
      throw error;
    }
  },

  // Subscribe to user's groups
  subscribeToUserGroups(
    userId: string,
    callback: (groups: FamilyGroup[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const q = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      return createSafeSnapshot<FamilyGroup[]>(q, callback, onError);
    } catch (error) {
      logger.error('groupService', 'subscribeToUserGroups failed', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },

  // Get group members with details
  async getGroupMembers(groupId: string | null | undefined): Promise<any[]> {
    try {
      // groupId가 null이거나 undefined이면 빈 배열 반환
      if (!groupId) {
        return [];
      }

      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        // 그룹이 존재하지 않는 경우 빈 배열 반환
        logger.warn('groupService', 'group not found; empty members', groupId);
        return [];
      }

      const groupData = groupDoc.data();
      const memberIds: string[] = groupData.memberIds || [];
      const memberRoles = groupData.memberRoles || {};

      if (memberIds.length === 0) return [];

      // Batch fetch users with documentId() in chunks of 10
      const toChunks = (arr: string[], size: number) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
          arr.slice(i * size, i * size + size)
        );

      const chunks = toChunks(memberIds, 10);
      const userMap = new Map<string, any>();
      for (const chunk of chunks) {
        try {
          const q = query(
            collection(db, 'users'),
            where(documentId(), 'in', chunk)
          );
          const snap = await getDocs(q);
          snap.docs.forEach(d => userMap.set(d.id, d.data()));
        } catch (err) {
          // Fallback per-user reads for this chunk
          for (const memberId of chunk) {
            try {
              const uref = doc(db, 'users', memberId);
              const usnap = await getDoc(uref);
              if (usnap.exists()) userMap.set(memberId, usnap.data());
            } catch (e) {
              logger.warn(
                'groupService',
                `fallback users/${memberId} failed`,
                e
              );
            }
          }
        }
      }

      // Build enriched member list preserving original order
      return memberIds.map(memberId => {
        const userData: any = userMap.get(memberId) || {};

        let role = memberRoles[memberId] || 'member';
        if (typeof role === 'object' && role !== null) {
          role = (role as any).isDeputyGroupLeader ? 'admin' : 'member';
        }

        const resolvedName =
          userData.displayName ||
          userData.email ||
          (userData.userName as string | undefined) ||
          (userData.profile && (userData.profile.name as string | undefined)) ||
          'Unknown User';

        const resolvedAvatar =
          userData.photoURL ||
          (userData.avatarStorageUrl as string | undefined) ||
          (userData.avatar as string | undefined) ||
          (userData.profile &&
            (userData.profile.avatar as string | undefined)) ||
          null;

        return {
          userId: memberId,
          displayName: resolvedName,
          userName: resolvedName,
          email: (userData.email as string | undefined) || '',
          avatar: resolvedAvatar,
          role,
          joinedAt: (userData.createdAt as any) || null,
          isOnline: (userData.isOnline as boolean | undefined) || false,
          tasksCreated: 0,
          tasksAssigned: 0,
          tasksCompleted: 0,
          points: (userData.points as number | undefined) || 0,
        };
      });
    } catch (error) {
      logger.error('groupService', 'getGroupMembers failed', error);
      throw error;
    }
  },

  // Get group statistics
  async getGroupStats(groupId: string | null | undefined): Promise<any> {
    try {
      // groupId가 null이거나 undefined이면 빈 통계 반환
      if (!groupId) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          completionRate: 0,
          memberStats: [],
        };
      }

      // 먼저 그룹이 존재하는지 확인
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        logger.warn('groupService', 'group not found; empty stats', groupId);
        return {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          completionRate: 0,
          memberStats: [],
        };
      }

      // Get all tasks for the group
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('groupId', '==', groupId)
      );

      const tasksSnapshot = await getDocs(tasksQuery);
      const tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculate stats
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (task: any) => task.status === 'completed'
      ).length;
      const pendingTasks = tasks.filter(
        (task: any) => task.status === 'pending'
      ).length;
      const overdueTasks = tasks.filter((task: any) => {
        if (task.status === 'completed') return false;
        const dueDate = task.dueDate?.toDate
          ? task.dueDate.toDate()
          : new Date(task.dueDate);
        return dueDate < new Date();
      }).length;

      // Get member stats with detailed calculations
      const members = await this.getGroupMembers(groupId);
      const memberStats = members.map(member => {
        // 해당 멤버가 생성한 할일
        const createdTasks = tasks.filter(
          (task: any) => task.userId === member.userId
        );

        // 해당 멤버에게 할당된 할일
        const assignedTasks = tasks.filter(
          (task: any) => task.assigneeId === member.userId
        );

        // 해당 멤버가 완료한 할일
        const completedTasks = tasks.filter(
          (task: any) =>
            task.assigneeId === member.userId && task.status === 'completed'
        );

        return {
          userId: member.userId,
          userName: member.userName,
          tasksCreated: createdTasks.length,
          tasksAssigned: assignedTasks.length,
          tasksCompleted: completedTasks.length,
          points: member.points || 0,
        };
      });

      return {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        memberStats,
      };
    } catch (error) {
      logger.error('groupService', 'getGroupStats failed', error);
      throw error;
    }
  },

  // Delete a group
  async deleteGroup(groupId: string, requestingUserId: string): Promise<void> {
    try {
      // Verify the requesting user is the owner
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data();
      if (groupData.ownerId !== requestingUserId) {
        throw new Error('Only the group owner can delete the group');
      }

      // Delete all tasks for this group
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('groupId', '==', groupId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);

      const batch = writeBatch(db);
      tasksSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the group
      batch.delete(doc(db, 'groups', groupId));

      await batch.commit();
    } catch (error) {
      logger.error('groupService', 'deleteGroup failed', error);
      throw error;
    }
  },

  // Invite member by email
  async inviteMemberByEmail(
    groupId: string,
    email: string,
    role: string = 'member'
  ): Promise<void> {
    try {
      // In a real app, this would send an email invitation
      // For now, we'll create an invitation document
      await addDoc(collection(db, 'invitations'), {
        groupId,
        email,
        role,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    } catch (error) {
      logger.error('groupService', 'inviteMemberByEmail failed', error);
      throw error;
    }
  },

  // Change member role
  async changeMemberRole(
    groupId: string,
    userId: string,
    newRole: string
  ): Promise<void> {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        throw new Error('Group not found');
      }
      const data: any = groupSnap.data();
      if (data.ownerId === userId && newRole !== 'owner') {
        throw new Error('Cannot change role of the owner');
      }
      await updateDoc(groupRef, {
        [`memberRoles.${userId}`]: newRole,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('groupService', 'changeMemberRole failed', error);
      throw error;
    }
  },

  // Generate invite code
  async generateInviteCode(groupId: string): Promise<string> {
    try {
      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Update the group with the new invite code
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        inviteCode: code,
        inviteCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        updatedAt: serverTimestamp(),
      });

      return code;
    } catch (error) {
      logger.error('groupService', 'generateInviteCode failed', error);
      throw error;
    }
  },

  // Join group by invite code
  async joinGroupByCode(inviteCode: string, userId: string): Promise<string> {
    try {
      // Find group with this invite code
      const q = query(
        collection(db, 'groups'),
        where('inviteCode', '==', inviteCode)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error('Invalid invite code');
      }

      const groupDoc = querySnapshot.docs[0];
      const groupId = groupDoc.id;
      const groupData = groupDoc.data();

      // Check if invite code is expired
      if (
        groupData.inviteCodeExpiresAt &&
        groupData.inviteCodeExpiresAt.toDate() < new Date()
      ) {
        throw new Error('Invite code has expired');
      }

      // Enforce approval flow if required
      const requireApproval = !!(
        groupData.settings && groupData.settings.requireApprovalForNewMembers
      );

      if (requireApproval) {
        await addDoc(collection(db, 'invitations'), {
          groupId,
          invitedBy: groupData.ownerId,
          invitedUserId: userId,
          role:
            (groupData.settings && groupData.settings.defaultRole) || 'member',
          status: 'pending_approval',
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        throw new Error('승인 대기 중입니다. 그룹 관리자의 승인이 필요합니다.');
      } else {
        // Add user to group immediately
        await this.addMemberToGroup(groupId, userId, 'member');
        return groupId;
      }
    } catch (error) {
      logger.error('groupService', 'joinGroupByCode failed', error);
      throw error;
    }
  },

  // Get pending invitations for a group
  async getPendingInvitations(groupId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'invitations'),
        where('groupId', '==', groupId),
        where('status', '==', 'pending_approval'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      logger.error('groupService', 'getPendingInvitations failed', error);
      throw error;
    }
  },

  // Approve invitation
  async approveInvitation(
    invitationId: string,
    groupId: string,
    userId: string,
    role: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update invitation status
      const invitationRef = doc(db, 'invitations', invitationId);
      batch.update(invitationRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });

      // Add user to group
      const groupRef = doc(db, 'groups', groupId);
      batch.update(groupRef, {
        memberIds: arrayUnion(userId),
        [`memberRoles.${userId}`]: role,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      logger.error('groupService', 'approveInvitation failed', error);
      throw error;
    }
  },

  // Reject invitation
  async rejectInvitation(invitationId: string): Promise<void> {
    try {
      const invitationRef = doc(db, 'invitations', invitationId);
      await updateDoc(invitationRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error('groupService', 'rejectInvitation failed', error);
      throw error;
    }
  },
};

// Comment-related Firestore operations
export const commentService = {
  // Add a comment to a task
  async addComment(taskId: string, commentData: any) {
    try {
      // 데이터 검증 및 정리
      const cleanData = { ...commentData };

      // undefined 값 제거
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined || cleanData[key] === null) {
          delete cleanData[key];
        }
      });

      // 필수 필드 검증
      if (!cleanData.userId || !cleanData.content) {
        throw new Error('필수 필드가 누락되었습니다.');
      }

      // attachments 배열 내부의 undefined 값 제거
      const cleanAttachments = Array.isArray(cleanData.attachments)
        ? cleanData.attachments.filter(
            (att: unknown) => att !== undefined && att !== null
          )
        : [];

      // attachments 배열 내부의 객체들도 검증
      const validatedAttachments = cleanAttachments.map((att: any) => {
        if (typeof att === 'object' && att !== null) {
          const cleanAtt: any = {};
          Object.keys(att).forEach(key => {
            if (att[key] !== undefined && att[key] !== null) {
              cleanAtt[key] = att[key];
            }
          });
          return cleanAtt;
        }
        return att;
      });

      // 최종 데이터 구조 검증
      const finalData = {
        taskId: cleanData.taskId || taskId,
        userId: cleanData.userId,
        userName: cleanData.userName || '익명',
        userAvatar: cleanData.userAvatar || null,
        content: cleanData.content,
        attachments: validatedAttachments,
        reactions: cleanData.reactions || {},
      };

      logger.debug('commentService', 'final data', finalData);
      logger.debug(
        'commentService',
        'attachments detail',
        finalData.attachments
      );
      logger.debug(
        'commentService',
        'validated attachments',
        validatedAttachments
      );

      // undefined 값이 있는지 최종 확인 (재귀적 검사)
      const hasUndefined = checkForUndefined(finalData);
      if (hasUndefined) {
        logger.error(
          'commentService',
          'undefined values in final data',
          finalData
        );
        throw new Error('데이터에 undefined 값이 포함되어 있습니다.');
      }

      const docRef = await addDoc(collection(db, 'tasks', taskId, 'comments'), {
        ...finalData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      logger.error('commentService', 'addComment failed', error);
      throw error;
    }
  },

  // Delete a comment
  async deleteComment(taskId: string, commentId: string) {
    try {
      await deleteDoc(doc(db, 'tasks', taskId, 'comments', commentId));
    } catch (error) {
      logger.error('commentService', 'deleteComment failed', error);
      throw error;
    }
  },

  // Subscribe to comments for a task
  subscribeToTaskComments(
    taskId: string,
    callback: (comments: any[]) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const q = query(
        collection(db, 'tasks', taskId, 'comments'),
        orderBy('createdAt', 'asc')
      );

      return createSafeSnapshot<any[]>(q, callback, onError);
    } catch (error) {
      logger.error('commentService', 'subscribeToTaskComments failed', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },

  // Add reaction to comment
  async addReaction(
    taskId: string,
    commentId: string,
    userId: string,
    emoji: string
  ) {
    try {
      const commentRef = doc(db, 'tasks', taskId, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        const reactions = commentData.reactions || {};

        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }

        if (!reactions[emoji].includes(userId)) {
          reactions[emoji].push(userId);
          await updateDoc(commentRef, { reactions });
        }
      }
    } catch (error) {
      logger.error('commentService', 'addReaction failed', error);
      throw error;
    }
  },

  // Add file attachment to comment
  async addFileAttachment(
    taskId: string,
    commentId: string,
    fileAttachment: any
  ) {
    try {
      const commentRef = doc(db, 'tasks', taskId, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        const attachments = commentData.attachments || [];
        attachments.push(fileAttachment);

        await updateDoc(commentRef, {
          attachments,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      logger.error('commentService', 'addFileAttachment failed', error);
      throw error;
    }
  },

  // Remove file attachment from comment
  async removeFileAttachment(
    taskId: string,
    commentId: string,
    fileId: string
  ) {
    try {
      const commentRef = doc(db, 'tasks', taskId, 'comments', commentId);
      const commentSnap = await getDoc(commentRef);

      if (commentSnap.exists()) {
        const commentData = commentSnap.data();
        const attachments = commentData.attachments || [];
        const updatedAttachments = attachments.filter(
          (att: any) => att.id !== fileId
        );

        await updateDoc(commentRef, {
          attachments: updatedAttachments,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      logger.error('commentService', 'removeFileAttachment failed', error);
      throw error;
    }
  },
};

// Helper function to deep filter undefined values
function filterUndefinedValues(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj === undefined ? null : obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => filterUndefinedValues(item));
  }

  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value === null || typeof value !== 'object') {
        result[key] = value;
      } else {
        result[key] = filterUndefinedValues(value);
      }
    }
  }
  return result;
}

// Helper function to check for undefined values recursively
function checkForUndefined(obj: any): boolean {
  if (obj === undefined) {
    return true;
  }

  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  if (Array.isArray(obj)) {
    return obj.some(item => checkForUndefined(item));
  }

  return Object.values(obj).some(value => checkForUndefined(value));
}

// User-related Firestore operations
export const userService = {
  // Create or update user profile
  async createOrUpdateUserProfile(
    userId: string,
    userData: Partial<User>
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);

      // 데이터 정규화: avatar -> photoURL 동기화
      const normalizedData: Record<string, unknown> = { ...userData } as Record<
        string,
        unknown
      >;
      if ((normalizedData as any).avatar && !(normalizedData as any).photoURL) {
        (normalizedData as any).photoURL = (normalizedData as any).avatar;
        delete (normalizedData as any).avatar;
      }

      // undefined 제거 및 깊은 살균
      const sanitizedData = filterUndefinedValues(normalizedData);

      // 최종 검증: undefined가 남아있지 않은지 재귀 확인
      const hasUndefined = checkForUndefined(sanitizedData);
      if (hasUndefined) {
        logger.warn(
          'firestore',
          'user profile contains undefined values after sanitation',
          {
            userId,
            keys: Object.keys(sanitizedData || {}),
          }
        );
      }

      // 과도한 로그를 피하기 위해 키 목록만 출력
      try {
        logger.debug('firestore', 'upserting user profile', {
          userId,
          keys: Object.keys(sanitizedData || {}),
        });
      } catch {
        /* noop */
      }

      await setDoc(
        userRef,
        {
          ...(sanitizedData as Record<string, unknown>),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      logger.error('firestore', 'Error creating/updating user profile', {
        code: error?.code,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      logger.error('firestore', 'Error getting user profile', error);
      throw error;
    }
  },

  // Subscribe to user profile
  subscribeToUserProfile(
    userId: string,
    callback: (profile: User | null) => void,
    onError?: (error: Error) => void
  ) {
    try {
      const userRef = doc(db, 'users', userId);
      return createSafeSnapshot<User | null>(userRef, callback, onError);
    } catch (error) {
      logger.error('firestore', 'Error subscribing to user profile', error);
      if (onError) onError(error as Error);
      return () => {};
    }
  },
};

// Batch operations
export const batchService = {
  // Create multiple tasks at once
  async createMultipleTasks(tasks: any[]) {
    const batch = writeBatch(db);
    const taskRefs: any[] = [];

    tasks.forEach(taskData => {
      const taskRef = doc(collection(db, 'tasks'));
      taskRefs.push(taskRef);
      batch.set(taskRef, {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    return taskRefs.map(ref => ref.id);
  },

  // Update multiple tasks
  async updateMultipleTasks(updates: Array<{ id: string; data: any }>) {
    const batch = writeBatch(db);

    updates.forEach(({ id, data }) => {
      const taskRef = doc(db, 'tasks', id);
      batch.update(taskRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    });

    await batch.commit();
  },
};

// Default export for easier importing
export default {
  taskService,
  groupService,
  commentService,
  userService,
  batchService,
};
