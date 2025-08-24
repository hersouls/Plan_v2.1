import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { groupService } from '../lib/firestore';
import logger from '../lib/logger';
import {
  CreateGroupInput,
  FamilyGroup,
  GroupMember,
  GroupRole,
  GroupStats,
  UpdateGroupInput,
} from '../types/group';

export interface UseGroupOptions {
  groupId?: string | null;
  loadStats?: boolean;
  loadMembers?: boolean;
}

export interface UseGroupReturn {
  // State
  group: FamilyGroup | null;
  members: GroupMember[];
  stats: GroupStats | null;
  loading: boolean;
  error: string | null;

  // Group operations
  createGroup: (data: Omit<CreateGroupInput, 'ownerId'>) => Promise<string>;
  updateGroup: (groupId: string, updates: UpdateGroupInput) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  transferOwnership: (groupId: string, newOwnerUserId: string) => Promise<void>;

  // Member operations
  inviteByEmail: (
    groupId: string,
    email: string,
    role?: GroupRole
  ) => Promise<void>;
  removeMember: (groupId: string, userId: string) => Promise<void>;
  changeMemberRole: (
    groupId: string,
    userId: string,
    newRole: GroupRole
  ) => Promise<void>;

  // Utility functions
  refetch: () => void;
  clearError: () => void;
  generateInviteCode: () => Promise<string>;
  joinGroupByCode: (inviteCode: string) => Promise<void>;

  // Approval functions
  getPendingInvitations: () => Promise<any[]>;
  approveInvitation: (
    invitationId: string,
    userId: string,
    role: string
  ) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
}

export function useGroup(options: UseGroupOptions = {}): UseGroupReturn {
  const { user } = useAuth();
  const { groupId, loadStats = true, loadMembers = true } = options;

  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadGroupData = useCallback(
    async (targetGroupId: string | null) => {
      try {
        setLoading(true);
        setError(null);

        // groupId가 null이면 그룹 데이터를 로드하지 않음
        if (!targetGroupId) {
          setGroup(null);
          setMembers([]);
          setStats(null);
          setLoading(false);
          return;
        }

        // Load group basic info
        const groupData = await groupService.getGroup(targetGroupId);
        if (!groupData) {
          // 그룹이 존재하지 않는 경우 정상적으로 처리
          setGroup(null);
          setMembers([]);
          setStats(null);
          // 에러 메시지를 설정하지 않고 조용히 처리
          logger.warn(`Group ${targetGroupId} not found`);
          return;
        }
        setGroup(groupData);

        // Load members if requested
        if (loadMembers) {
          try {
            const membersData = await groupService.getGroupMembers(
              targetGroupId
            );
            setMembers(membersData);
          } catch (error) {
            logger.error('Error loading members:', error);
            setMembers([]);
          }
        }

        // Load stats if requested
        if (loadStats) {
          try {
            const statsData = await groupService.getGroupStats(targetGroupId);
            setStats(statsData);

            // 멤버 통계 데이터를 멤버 정보에 병합
            if (loadMembers && statsData.memberStats) {
              setMembers(prevMembers =>
                prevMembers.map(member => {
                  type MemberStat = {
                    userId: string;
                    tasksCreated?: number;
                    tasksAssigned?: number;
                    tasksCompleted?: number;
                  };
                  const memberStats = (statsData.memberStats ||
                    []) as MemberStat[];
                  const memberStat = memberStats.find(
                    ms => ms.userId === member.userId
                  );
                  return {
                    ...member,
                    tasksCreated: memberStat?.tasksCreated || 0,
                    tasksAssigned: memberStat?.tasksAssigned || 0,
                    tasksCompleted: memberStat?.tasksCompleted || 0,
                  };
                })
              );
            }
          } catch (error) {
            logger.error('Error loading stats:', error);
            setStats(null);
          }
        }
      } catch (err) {
        logger.error('Error loading group data:', err);
        setError(
          err instanceof Error
            ? err.message
            : '그룹 정보를 불러오는 중 오류가 발생했습니다.'
        );
      } finally {
        setLoading(false);
      }
    },
    [loadMembers, loadStats]
  );

  const refetch = useCallback(() => {
    if (groupId) {
      loadGroupData(groupId);
    } else {
      loadGroupData(null);
    }
  }, [groupId, loadGroupData]);

  // Load group data when groupId changes
  useEffect(() => {
    if (groupId) {
      loadGroupData(groupId);
    } else {
      setGroup(null);
      setMembers([]);
      setStats(null);
      setLoading(false);
    }
  }, [groupId, loadGroupData]);

  // Real-time subscription to group and members
  useEffect(() => {
    if (!groupId) return;

    let unsubscribeGroup: (() => void) | undefined;
    let unsubscribeMembers: (() => void) | undefined;

    try {
      // Subscribe to group changes
      unsubscribeGroup = groupService.subscribeToGroup(
        groupId,
        groupData => {
          setGroup(groupData);
        },
        error => {
          logger.error('Error subscribing to group:', error);
          setError('그룹 정보 구독 중 오류가 발생했습니다.');
        }
      );

      // Subscribe to member changes (custom implementation)
      if (loadMembers) {
        const updateMembers = async () => {
          try {
            const membersData = await groupService.getGroupMembers(groupId);

            // When stats are requested, merge latest stats into members so that
            // tasksCreated/Assigned/Completed are not reset to 0 by periodic refreshes
            if (loadStats) {
              try {
                const statsData = await groupService.getGroupStats(groupId);
                setStats(statsData);
                const merged = membersData.map(member => {
                  const ms = (statsData.memberStats || []).find(
                    (s: any) => s.userId === member.userId
                  );
                  return {
                    ...member,
                    tasksCreated: ms?.tasksCreated || 0,
                    tasksAssigned: ms?.tasksAssigned || 0,
                    tasksCompleted: ms?.tasksCompleted || 0,
                  };
                });
                setMembers(merged);
              } catch (statsError) {
                logger.error('Error updating member stats:', statsError);
                setMembers(membersData);
              }
            } else {
              setMembers(membersData);
            }
          } catch (error) {
            logger.error('Error updating members:', error);
            // 그룹이 존재하지 않는 경우 빈 배열로 설정
            setMembers([]);
          }
        };

        // Initial load
        updateMembers();

        // Set up periodic refresh for members (every 30 seconds)
        const interval = setInterval(updateMembers, 30000);
        unsubscribeMembers = () => clearInterval(interval);
      }
    } catch (error) {
      logger.error('Error setting up subscriptions:', error);
    }

    return () => {
      if (unsubscribeGroup) unsubscribeGroup();
      if (unsubscribeMembers) unsubscribeMembers();
    };
  }, [groupId, loadMembers]);

  // Group operations
  const createGroup = useCallback(
    async (data: Omit<CreateGroupInput, 'ownerId'>): Promise<string> => {
      if (!user) {
        setError('로그인이 필요합니다.');
        throw new Error('로그인이 필요합니다.');
      }

      try {
        setError(null);
        const fullGroupData: CreateGroupInput = {
          ...data,
          ownerId: user.uid,
        };

        const newGroupId = await groupService.createGroup(fullGroupData);

        // Update user profile to include new group
        try {
          const userService = (await import('../lib/firestore')).userService;
          const userDoc = await userService.getUserProfile(user.uid);
          if (userDoc) {
            const updatedGroupIds = [...(userDoc.groupIds || []), newGroupId];
            await userService.createOrUpdateUserProfile(user.uid, {
              groupIds: updatedGroupIds,
            });
          }
        } catch (profileError) {
          logger.warn('Failed to update user profile:', profileError);
          // Don't throw error as group creation was successful
        }

        return newGroupId;
      } catch (err) {
        logger.error('Error creating group:', err);
        setError('그룹을 생성하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user]
  );

  const updateGroup = useCallback(
    async (targetGroupId: string, updates: UpdateGroupInput) => {
      try {
        setError(null);
        await groupService.updateGroup(targetGroupId, updates);

        // Update local state
        if (group && targetGroupId === group.id) {
          setGroup(prev =>
            prev ? ({ ...prev, ...updates } as FamilyGroup) : null
          );
        }
      } catch (err) {
        logger.error('Error updating group:', err);
        setError('그룹을 업데이트하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [group]
  );

  const deleteGroup = useCallback(
    async (targetGroupId: string) => {
      if (!user) {
        setError('로그인이 필요합니다.');
        throw new Error('로그인이 필요합니다.');
      }

      try {
        setError(null);
        await groupService.deleteGroup(targetGroupId, user.uid);

        // Clear local state if it was the current group
        if (group && targetGroupId === group.id) {
          setGroup(null);
          setMembers([]);
          setStats(null);
        }
      } catch (err) {
        logger.error('Error deleting group:', err);
        setError('그룹을 삭제하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user, group]
  );

  const leaveGroup = useCallback(
    async (targetGroupId: string) => {
      if (!user) {
        setError('로그인이 필요합니다.');
        throw new Error('로그인이 필요합니다.');
      }

      try {
        setError(null);
        await groupService.removeMemberFromGroup(targetGroupId, user.uid);

        // Clear local state if it was the current group
        if (group && targetGroupId === group.id) {
          setGroup(null);
          setMembers([]);
          setStats(null);
        }
      } catch (err) {
        logger.error('Error leaving group:', err);
        setError('그룹을 나가는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user, group]
  );

  const transferOwnership = useCallback(
    async (targetGroupId: string, newOwnerUserId: string) => {
      if (!user) {
        setError('로그인이 필요합니다.');
        throw new Error('로그인이 필요합니다.');
      }

      try {
        setError(null);
        await groupService.transferOwnership(
          targetGroupId,
          newOwnerUserId,
          user.uid
        );

        // Refresh group state after transfer
        if (group && targetGroupId === group.id) {
          await loadGroupData(targetGroupId);
        }
      } catch (err) {
        logger.error('Error transferring ownership:', err);
        setError('그룹장 권한을 양도하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user, group, loadGroupData]
  );

  // Member operations
  const inviteByEmail = useCallback(
    async (
      targetGroupId: string,
      email: string,
      role: GroupRole = 'member'
    ) => {
      if (!user) {
        setError('로그인이 필요합니다.');
        throw new Error('로그인이 필요합니다.');
      }

      try {
        setError(null);
        await groupService.inviteMemberByEmail(targetGroupId, email, role);
      } catch (err) {
        logger.error('Error inviting member:', err);
        setError('멤버를 초대하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user]
  );

  const removeMember = useCallback(
    async (targetGroupId: string, userId: string) => {
      try {
        setError(null);
        await groupService.removeMemberFromGroup(targetGroupId, userId);

        // Update local members state
        setMembers(prev => prev.filter(member => member.userId !== userId));
      } catch (err) {
        logger.error('Error removing member:', err);
        setError('멤버를 제거하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    []
  );

  const changeMemberRole = useCallback(
    async (targetGroupId: string, userId: string, newRole: GroupRole) => {
      try {
        setError(null);
        await groupService.changeMemberRole(targetGroupId, userId, newRole);

        // Update local members state
        setMembers(prev =>
          prev.map(member =>
            member.userId === userId ? { ...member, role: newRole } : member
          )
        );
      } catch (err) {
        logger.error('Error changing member role:', err);
        setError('멤버 역할을 변경하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    []
  );

  const generateInviteCode = useCallback(async (): Promise<string> => {
    if (!groupId) {
      throw new Error('그룹 ID가 필요합니다.');
    }

    try {
      setError(null);
      const inviteCode = await groupService.generateInviteCode(groupId);

      // Update local group state
      if (group) {
        setGroup(prev => (prev ? { ...prev, inviteCode } : null));
      }

      return inviteCode;
    } catch (err) {
      logger.error('Error generating invite code:', err);
      setError('초대 코드를 생성하는 중 오류가 발생했습니다.');
      throw err;
    }
  }, [groupId, group]);

  const joinGroupByCode = useCallback(
    async (inviteCode: string): Promise<void> => {
      if (!user) {
        setError('로그인이 필요합니다.');
        throw new Error('로그인이 필요합니다.');
      }

      try {
        setError(null);
        const joinedGroupId = await groupService.joinGroupByCode(
          inviteCode,
          user.uid
        );

        // Load the newly joined group data
        await loadGroupData(joinedGroupId);
      } catch (err) {
        logger.error('Error joining group:', err);
        setError('그룹에 참여하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user, loadGroupData]
  );

  const getPendingInvitations = useCallback(async (): Promise<any[]> => {
    if (!groupId) {
      return [];
    }

    try {
      setError(null);
      return await groupService.getPendingInvitations(groupId);
    } catch (err) {
      logger.error('Error getting pending invitations:', err);
      setError('대기 중인 초대를 불러오는 중 오류가 발생했습니다.');
      throw err;
    }
  }, [groupId]);

  const approveInvitation = useCallback(
    async (
      invitationId: string,
      userId: string,
      role: string
    ): Promise<void> => {
      if (!groupId) {
        setError('그룹 ID가 필요합니다.');
        throw new Error('그룹 ID가 필요합니다.');
      }

      try {
        setError(null);
        await groupService.approveInvitation(
          invitationId,
          groupId,
          userId,
          role
        );

        // Refresh group data after approval
        await loadGroupData(groupId);
      } catch (err) {
        logger.error('Error approving invitation:', err);
        setError('초대 승인 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [groupId, loadGroupData]
  );

  const rejectInvitation = useCallback(
    async (invitationId: string): Promise<void> => {
      try {
        setError(null);
        await groupService.rejectInvitation(invitationId);
      } catch (err) {
        logger.error('Error rejecting invitation:', err);
        setError('초대 거부 중 오류가 발생했습니다.');
        throw err;
      }
    },
    []
  );

  return {
    // State
    group,
    members: members || [],
    stats,
    loading,
    error,

    // Group operations
    createGroup,
    updateGroup,
    deleteGroup,
    leaveGroup,
    transferOwnership,

    // Member operations
    inviteByEmail,
    removeMember,
    changeMemberRole,

    // Utility functions
    refetch,
    clearError,
    generateInviteCode,
    joinGroupByCode,

    // Approval functions
    getPendingInvitations,
    approveInvitation,
    rejectInvitation,
  };
}

// Hook for managing user's groups
export function useUserGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = groupService.subscribeToUserGroups(
      user.uid,
      nextGroups => {
        setGroups(nextGroups || []);
        setLoading(false);
      },
      err => {
        logger.error('Error subscribing to user groups:', err);
        setError('사용자 그룹 구독 중 오류가 발생했습니다.');
        setLoading(false);
      }
    );

    return () => {
      try {
        if (typeof unsubscribe === 'function') unsubscribe();
      } catch {
        /* noop */
      }
    };
  }, [user]);

  const refetch = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userGroups = await groupService.getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (err) {
      logger.error('Error refetching user groups:', err);
      setError('사용자 그룹을 다시 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    groups: groups || [],
    loading,
    error,
    refetch,
    clearError: () => setError(null),
  };
}
