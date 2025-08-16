import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { groupService } from '../lib/firestore';
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

  const refetch = useCallback(() => {
    if (groupId) {
      loadGroupData(groupId);
    } else {
      loadGroupData(null);
    }
  }, [groupId]);

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
          console.warn(`Group ${targetGroupId} not found`);
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
            console.error('Error loading members:', error);
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
                  const memberStat = statsData.memberStats.find(
                    (stat: any) => stat.userId === member.userId
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
            console.error('Error loading stats:', error);
            setStats(null);
          }
        }
      } catch (err) {
        console.error('Error loading group data:', err);
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
          console.error('Error subscribing to group:', error);
          setError('그룹 정보 구독 중 오류가 발생했습니다.');
        }
      );

      // Subscribe to member changes (custom implementation)
      if (loadMembers) {
        const updateMembers = async () => {
          try {
            const membersData = await groupService.getGroupMembers(groupId);
            setMembers(membersData);
          } catch (error) {
            console.error('Error updating members:', error);
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
      console.error('Error setting up subscriptions:', error);
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
          console.warn('Failed to update user profile:', profileError);
          // Don't throw error as group creation was successful
        }

        return newGroupId;
      } catch (err) {
        console.error('Error creating group:', err);
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
        console.error('Error updating group:', err);
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
        console.error('Error deleting group:', err);
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
        console.error('Error leaving group:', err);
        setError('그룹을 나가는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user, group]
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
        console.error('Error inviting member:', err);
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
        console.error('Error removing member:', err);
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
        console.error('Error changing member role:', err);
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
      console.error('Error generating invite code:', err);
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
        console.error('Error joining group:', err);
        setError('그룹에 참여하는 중 오류가 발생했습니다.');
        throw err;
      }
    },
    [user, loadGroupData]
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

    // Member operations
    inviteByEmail,
    removeMember,
    changeMemberRole,

    // Utility functions
    refetch,
    clearError,
    generateInviteCode,
    joinGroupByCode,
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

    const loadUserGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const userGroups = await groupService.getUserGroups(user.uid);
        setGroups(userGroups);
      } catch (err) {
        console.error('Error loading user groups:', err);
        setError('사용자 그룹을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUserGroups();
  }, [user]);

  const refetch = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userGroups = await groupService.getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (err) {
      console.error('Error refetching user groups:', err);
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
