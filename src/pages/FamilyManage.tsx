import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import {
  ArrowUp,
  Camera,
  Copy,
  Crown,
  Edit,
  Plus,
  QrCode,
  Settings,
  Star,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { GroupChat } from '../components/family/GroupChat';
import { QRInviteModal } from '../components/family/QRInviteModal';
import { QRScannerModal } from '../components/family/QRScannerModal';
import { WaveBackground } from '../components/layout/WaveBackground';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { useTasks } from '../hooks/useTasks';
import { Task } from '../types/task';
import { toDate } from '../utils/dateHelpers';

// Extended Group Member interface for UI
interface ExtendedGroupMember {
  userId: string;
  displayName?: string;
  userName?: string;
  email?: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'vice_owner' | 'member' | 'viewer';
  joinedAt: any;

  // 그룹별 통계 (개선된 구조)
  tasksCreated?: number; // 이 그룹에서 생성한 할일 수
  tasksAssigned?: number; // 이 그룹에서 할당받은 할일 수
  tasksCompleted?: number; // 이 그룹에서 완료한 할일 수
  points?: number; // 이 그룹에서 획득한 포인트
}

function FamilyManage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQRInviteModal, setShowQRInviteModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showMemberEditModal, setShowMemberEditModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showFullscreenChatModal, setShowFullscreenChatModal] = useState(false);
  const [fullscreenChatData, setFullscreenChatData] = useState<{
    groupId: string;
    groupName: string;
    members: any[];
  } | null>(null);
  const [selectedMember, setSelectedMember] =
    useState<ExtendedGroupMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<
    'admin' | 'vice_owner' | 'member'
  >('member');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // 구성원 통계 상세 보기 상태
  const [selectedStatType, setSelectedStatType] = useState<
    'created' | 'assigned' | 'completed' | 'points' | null
  >(null);
  const [selectedMemberForStats, setSelectedMemberForStats] =
    useState<ExtendedGroupMember | null>(null);
  const [showStatsDetail, setShowStatsDetail] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [showFilteredTasks, setShowFilteredTasks] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [lastLoginTimes, setLastLoginTimes] = useState<
    Record<string, Date | null>
  >({});
  const [useOptimizedMode, setUseOptimizedMode] = useState(true); // 최적화 모드 토글

  // 할일 목록 페이지네이션 상태
  const [currentTaskPage, setCurrentTaskPage] = useState(1);
  const tasksPerPage = 5; // 페이지당 할일 수

  // 새 그룹 생성 관련 상태
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [isPointsManagement, setIsPointsManagement] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  // 즐겨찾기 그룹 관리
  const [favoriteGroups, setFavoriteGroups] = useState<string[]>([]);

  // Use real data from Firebase
  const {
    groups,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useUserGroups();
  const {
    group,
    members,
    loading: groupLoading,
    createGroup,
    updateGroup,
    inviteByEmail,
    removeMember,
    changeMemberRole,
    deleteGroup,
    generateInviteCode,
    joinGroupByCode,
  } = useGroup({ groupId: selectedGroupId || undefined });

  // 할일 목록 가져오기 - 현재 선택된 그룹의 할일만 가져오기
  const { tasks } = useTasks({
    groupId: selectedGroupId || undefined,
    realtime: false,
  });

  // 즐겨찾기 그룹 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteGroups');
    if (savedFavorites) {
      try {
        setFavoriteGroups(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Failed to parse favorite groups:', error);
        setFavoriteGroups([]);
      }
    }
  }, []);

  // 전체화면 채팅 모달 이벤트 리스너
  useEffect(() => {
    const handleFullscreenChatOpen = (event: CustomEvent) => {
      console.log('전체화면 채팅 모달 이벤트 수신:', event.detail);
      setFullscreenChatData(event.detail);
      setShowFullscreenChatModal(true);
      console.log('전체화면 채팅 모달 상태 업데이트 완료');
    };

    console.log('전체화면 채팅 모달 이벤트 리스너 등록');
    window.addEventListener(
      'groupChatFullscreenOpen',
      handleFullscreenChatOpen as EventListener
    );

    return () => {
      console.log('전체화면 채팅 모달 이벤트 리스너 제거');
      window.removeEventListener(
        'groupChatFullscreenOpen',
        handleFullscreenChatOpen as EventListener
      );
    };
  }, []);

  // ESC 키로 전체화면 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullscreenChatModal) {
        console.log('ESC 키로 모달 닫기');
        setShowFullscreenChatModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreenChatModal]);

  // 전체화면 채팅 모달 닫기 이벤트 리스너
  useEffect(() => {
    const handleFullscreenChatClose = () => {
      console.log('전체화면 채팅 모달 닫기 이벤트 수신');
      setShowFullscreenChatModal(false);
    };

    window.addEventListener(
      'groupChatFullscreenClose',
      handleFullscreenChatClose
    );
    return () => {
      window.removeEventListener(
        'groupChatFullscreenClose',
        handleFullscreenChatClose
      );
    };
  }, []);

  // 페이지 로드 시 자동 스크롤 방지
  useEffect(() => {
    // 페이지 로드 시 스크롤 위치를 상단으로 고정
    if (window.scrollY > 0) {
      window.scrollTo(0, 0);
    }
  }, []);

  // 즐겨찾기 그룹 저장
  const saveFavoriteGroups = (favorites: string[]) => {
    localStorage.setItem('favoriteGroups', JSON.stringify(favorites));
    setFavoriteGroups(favorites);
  };

  // 즐겨찾기 토글
  const toggleFavorite = (groupId: string) => {
    const newFavorites = favoriteGroups.includes(groupId)
      ? favoriteGroups.filter(id => id !== groupId)
      : [...favoriteGroups, groupId];
    saveFavoriteGroups(newFavorites);
  };

  // 상단으로 스크롤
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 즐겨찾기 순으로 정렬된 그룹 목록
  const sortedGroups = useMemo(() => {
    if (!groups) return [];

    return [...groups].sort((a, b) => {
      const aIsFavorite = favoriteGroups.includes(a.id);
      const bIsFavorite = favoriteGroups.includes(b.id);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // 즐겨찾기 상태가 같으면 이름순 정렬
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [groups, favoriteGroups]);

  // Set first group as selected if available (즐겨찾기 우선)
  useEffect(() => {
    if (sortedGroups && sortedGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(sortedGroups[0].id);
      // 자동 스크롤 비활성화
    }
  }, [sortedGroups, selectedGroupId]);

  // 그룹이 변경될 때 페이지를 1로 리셋
  useEffect(() => {
    setCurrentTaskPage(1);
    // 자동 스크롤 비활성화
  }, [selectedGroupId]);

  // 멤버들의 온라인 상태와 최근 로그인 시간 확인 (최적화된 버전)
  useEffect(() => {
    const updateOnlineStatus = async () => {
      if (!members || members.length === 0) return;

      const statusUpdates: Record<string, boolean> = {};
      const loginTimeUpdates: Record<string, Date | null> = {};

      // 최적화 모드에 따라 다른 함수 사용
      const checkFunction = useOptimizedMode
        ? checkOnlineStatusOptimized
        : checkOnlineStatus;

      // 병렬로 모든 멤버의 상태를 한 번에 확인
      const promises = members.map(async member => {
        const { isOnline, lastLoginTime } = await checkFunction(member.userId);
        return { userId: member.userId, isOnline, lastLoginTime };
      });

      const results = await Promise.all(promises);

      results.forEach(({ userId, isOnline, lastLoginTime }) => {
        statusUpdates[userId] = isOnline;
        loginTimeUpdates[userId] = lastLoginTime;
      });

      setOnlineStatus(prev => ({ ...prev, ...statusUpdates }));
      setLastLoginTimes(prev => ({ ...prev, ...loginTimeUpdates }));
    };

    // 초기 로드 시에만 실행
    updateOnlineStatus();

    // 최적화 모드에 따라 다른 간격으로 업데이트
    const interval = setInterval(
      updateOnlineStatus,
      useOptimizedMode ? 300000 : 120000
    ); // 5분 vs 2분

    return () => clearInterval(interval);
  }, [members, useOptimizedMode]);

  const loading = groupsLoading || groupLoading;

  // 최근 로그인 시간을 포맷하는 함수
  const formatLastLoginTime = (lastLoginTime: Date | null): string => {
    if (!lastLoginTime) return '로그인 기록 없음';

    const now = new Date();
    const timeDiff = now.getTime() - lastLoginTime.getTime();

    // 1분 이내
    if (timeDiff < 60 * 1000) {
      return '방금 전';
    }
    // 1시간 이내
    if (timeDiff < 60 * 60 * 1000) {
      const minutes = Math.floor(timeDiff / (60 * 1000));
      return `${minutes}분 전`;
    }
    // 24시간 이내
    if (timeDiff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(timeDiff / (60 * 60 * 1000));
      return `${hours}시간 전`;
    }
    // 7일 이내
    if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
      return `${days}일 전`;
    }
    // 그 이상
    return lastLoginTime.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Firebase Auth의 lastSignInTime을 기반으로 온라인 상태와 로그인 시간을 확인하는 함수
  const checkOnlineStatus = async (
    userId: string
  ): Promise<{ isOnline: boolean; lastLoginTime: Date | null }> => {
    try {
      console.log(`🔍 Checking online status for user: ${userId}`);

      // 방법 1: 현재 로그인한 사용자의 정보 확인 (클라이언트 사이드 안전)
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        // 현재 사용자와 확인하려는 사용자가 같은 경우에만 정보 접근 가능
        if (currentUser && currentUser.uid === userId) {
          console.log('📱 Current user metadata:', currentUser.metadata);

          if (currentUser.metadata.lastSignInTime) {
            const lastLogin = new Date(currentUser.metadata.lastSignInTime);
            const now = new Date();
            const timeDiff = now.getTime() - lastLogin.getTime();

            console.log('✅ Current user lastSignInTime found:', lastLogin);
            console.log('⏰ Time difference:', timeDiff / 1000 / 60, 'minutes');

            return {
              isOnline: timeDiff < 10 * 60 * 1000,
              lastLoginTime: lastLogin,
            };
          } else {
            console.log('❌ Current user lastSignInTime not found');
          }
        } else {
          console.log('⚠️ Cannot access other user metadata from client side');
        }
      } catch (authError) {
        console.log('⚠️ Firebase Auth error:', authError);
      }

      // 방법 2: Firestore에서 사용자 정보 확인 (백업)
      console.log('🔄 Trying Firestore backup method...');
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📄 Firestore user data:', userData);

        // 여러 가능한 필드명 확인 (우선순위 순서)
        const lastLoginTime =
          userData.lastLoginTime ||
          userData.lastSignInTime ||
          userData.lastLoginAt ||
          userData.lastLogin;
        console.log('🕐 Firestore lastLoginTime:', lastLoginTime);
        console.log('📊 Available login time fields:', {
          lastLoginTime: userData.lastLoginTime,
          lastSignInTime: userData.lastSignInTime,
          lastLoginAt: userData.lastLoginAt,
          lastLogin: userData.lastLogin,
        });

        if (lastLoginTime) {
          let lastLogin: Date;

          // Firebase Timestamp 객체인지 확인
          if (
            lastLoginTime &&
            typeof lastLoginTime === 'object' &&
            'toDate' in lastLoginTime
          ) {
            lastLogin = lastLoginTime.toDate();
            console.log('✅ Firebase Timestamp detected and converted');
          } else if (
            lastLoginTime &&
            typeof lastLoginTime === 'object' &&
            'seconds' in lastLoginTime
          ) {
            // Firestore Timestamp 형식 (seconds, nanoseconds)
            lastLogin = new Date(lastLoginTime.seconds * 1000);
            console.log('✅ Firestore Timestamp detected and converted');
          } else if (typeof lastLoginTime === 'string') {
            lastLogin = new Date(lastLoginTime);
            console.log('✅ String timestamp detected and converted');
          } else if (typeof lastLoginTime === 'number') {
            lastLogin = new Date(lastLoginTime);
            console.log('✅ Number timestamp detected and converted');
          } else {
            console.log(
              '❌ Unknown timestamp format:',
              typeof lastLoginTime,
              lastLoginTime
            );
            return { isOnline: false, lastLoginTime: null };
          }

          const now = new Date();
          const timeDiff = now.getTime() - lastLogin.getTime();

          console.log('✅ Firestore lastLoginTime found:', lastLogin);
          console.log('⏰ Time difference:', timeDiff / 1000 / 60, 'minutes');

          return {
            isOnline: timeDiff < 10 * 60 * 1000,
            lastLoginTime: lastLogin,
          };
        } else {
          console.log('❌ Firestore lastLoginTime field not found');
          console.log('🔍 Available fields:', Object.keys(userData));
        }
      } else {
        console.log('❌ Firestore user document does not exist');
      }

      console.log('❌ No login time found from any source');
      return { isOnline: false, lastLoginTime: null };
    } catch (error) {
      console.error('💥 Error checking online status:', error);
      return { isOnline: false, lastLoginTime: null };
    }
  };

  // 최적화된 온라인 상태 확인 (실시간 배치 없이)
  const checkOnlineStatusOptimized = async (
    userId: string
  ): Promise<{ isOnline: boolean; lastLoginTime: Date | null }> => {
    try {
      // 방법 1: 로컬 스토리지 캐시 확인 (가장 빠름)
      const cached = localStorage.getItem(`online_status_${userId}`);
      if (cached) {
        const { isOnline, lastLoginTime, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // 캐시가 5분 이내라면 사용
        if (now - timestamp < 5 * 60 * 1000) {
          return {
            isOnline,
            lastLoginTime: lastLoginTime ? new Date(lastLoginTime) : null,
          };
        }
      }

      // 방법 2: 현재 사용자 정보 사용 (클라이언트 사이드 안전)
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (
        currentUser &&
        currentUser.uid === userId &&
        currentUser.metadata.lastSignInTime
      ) {
        const lastLogin = new Date(currentUser.metadata.lastSignInTime);
        const now = new Date();
        const timeDiff = now.getTime() - lastLogin.getTime();
        const isOnline = timeDiff < 10 * 60 * 1000;

        // 결과를 캐시에 저장
        localStorage.setItem(
          `online_status_${userId}`,
          JSON.stringify({
            isOnline,
            lastLoginTime: lastLogin.toISOString(),
            timestamp: Date.now(),
          })
        );

        return { isOnline, lastLoginTime: lastLogin };
      }

      return { isOnline: false, lastLoginTime: null };
    } catch (error) {
      console.error('Error checking online status (optimized):', error);
      return { isOnline: false, lastLoginTime: null };
    }
  };

  // 모달 닫기 핸들러 (상태 초기화)
  const handleCloseCreateGroupModal = () => {
    setShowCreateGroupModal(false);
    setNewGroupName('');
    setNewGroupDescription('');
    setIsPointsManagement(false);
    setCreateGroupError('');
    setFormErrors({});
    setIsCreatingGroup(false);
  };

  // 폼 검증 함수
  const validateGroupForm = () => {
    const errors: { name?: string; description?: string } = {};

    if (!newGroupName.trim()) {
      errors.name = '그룹 이름을 입력해주세요.';
    } else if (newGroupName.trim().length < 2) {
      errors.name = '그룹 이름은 최소 2글자 이상이어야 합니다.';
    } else if (newGroupName.trim().length > 50) {
      errors.name = '그룹 이름은 50글자를 초과할 수 없습니다.';
    }

    if (newGroupDescription.trim().length > 200) {
      errors.description = '그룹 설명은 200글자를 초과할 수 없습니다.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 새 그룹 생성 핸들러
  const handleCreateGroup = async () => {
    if (isCreatingGroup) return;

    // 폼 검증
    if (!validateGroupForm()) {
      return;
    }

    setIsCreatingGroup(true);
    setCreateGroupError('');

    try {
      // 올바른 CreateGroupInput 구조 사용
      const groupData = {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        isPublic: false,
        tags: ['family'],
        settings: {
          allowMembersToInvite: false,
          requireApprovalForNewMembers: true,
          defaultRole: 'member' as const,
          taskCategories: ['household', 'personal', 'work'],
          taskTags: ['urgent', 'routine', 'fun'],
          enablePointsManagement: isPointsManagement, // 포인트 관리 활성화
        },
      };

      const newGroupId = await createGroup(groupData);

      // 상태 초기화
      setSelectedGroupId(newGroupId);
      handleCloseCreateGroupModal();

      // 그룹 목록 새로고침
      await refetchGroups();

      // 성공 메시지 표시
      alert('새 그룹이 성공적으로 생성되었습니다!');
    } catch (error) {
      console.error('Failed to create group:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '그룹 생성에 실패했습니다. 다시 시도해주세요.';
      setCreateGroupError(errorMessage);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      // Type assertion with proper interface
      const groupWithInvite = group as any;
      if (groupWithInvite?.inviteCode) {
        await navigator.clipboard.writeText(groupWithInvite.inviteCode);
        alert('초대 코드가 복사되었습니다!');
      } else {
        // Generate new invite code if doesn't exist
        const newCode = await generateInviteCode();
        await navigator.clipboard.writeText(newCode);
        alert('새 초대 코드가 생성되고 복사되었습니다!');
      }
    } catch (error) {
      console.error('Failed to copy invite code:', error);
      alert('초대 코드 복사에 실패했습니다.');
    }
  };

  const handleShowQRCode = () => {
    setShowQRInviteModal(true);
  };

  const handleScanQRCode = () => {
    setShowQRScannerModal(true);
  };

  const handleQRScanSuccess = async (data: string) => {
    try {
      // QR코드에서 초대 코드 추출
      const inviteCode = data.split('/').pop() || data;

      // 그룹에 참여
      await joinGroupByCode(inviteCode);

      // 그룹 목록 새로고침
      await refetchGroups();

      setShowQRScannerModal(false);
      alert('가족 그룹에 성공적으로 참여했습니다!');
    } catch (error) {
      console.error('Failed to join group:', error);
      const errorMessage =
        error instanceof Error ? error.message : '그룹 참여에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const handleQRScanError = (error: string) => {
    alert(error);
    setShowQRScannerModal(false);
  };

  const handleEditMember = (memberId: string) => {
    const member = members.find(m => m.userId === memberId);
    const currentUserRole = members.find(m => m.userId === user?.uid)?.role;

    // 권한 체크: 그룹장, 관리자, 부그룹장만 편집 가능
    const hasEditPermission =
      group.ownerId === user?.uid ||
      currentUserRole === 'admin' ||
      currentUserRole === 'vice_owner';

    if (member && hasEditPermission) {
      setSelectedMember(member);
      setShowMemberEditModal(true);
    } else if (!hasEditPermission) {
      alert(
        '멤버 편집 권한이 없습니다. 그룹장, 관리자, 부그룹장만 멤버를 편집할 수 있습니다.'
      );
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const currentUserRole = members.find(m => m.userId === user?.uid)?.role;

    // 권한 체크: 그룹장, 관리자, 부그룹장만 제거 가능
    const hasRemovePermission =
      group.ownerId === user?.uid ||
      currentUserRole === 'admin' ||
      currentUserRole === 'vice_owner';

    if (!hasRemovePermission) {
      alert(
        '멤버 제거 권한이 없습니다. 그룹장, 관리자, 부그룹장만 멤버를 제거할 수 있습니다.'
      );
      return;
    }

    if (confirm('정말로 이 멤버를 제거하시겠습니까?')) {
      try {
        if (selectedGroupId) {
          await removeMember(selectedGroupId, memberId);
          alert('멤버가 제거되었습니다.');
        }
      } catch (error) {
        console.error('Failed to remove member:', error);
        alert('멤버 제거에 실패했습니다.');
      }
    }
  };

  const handleChangeMemberRole = async (
    memberId: string,
    newRole: 'admin' | 'vice_owner' | 'member'
  ) => {
    const currentUserRole = members.find(m => m.userId === user?.uid)?.role;

    // 권한 체크: 그룹장, 관리자, 부그룹장만 역할 변경 가능
    const hasRoleChangePermission =
      group.ownerId === user?.uid ||
      currentUserRole === 'admin' ||
      currentUserRole === 'vice_owner';

    if (!hasRoleChangePermission) {
      alert(
        '멤버 역할 변경 권한이 없습니다. 그룹장, 관리자, 부그룹장만 역할을 변경할 수 있습니다.'
      );
      return;
    }

    const roleLabels = {
      admin: '관리자',
      vice_owner: '부그룹장',
      member: '멤버',
    };

    if (
      confirm(`이 멤버의 역할을 ${roleLabels[newRole]}로 변경하시겠습니까?`)
    ) {
      try {
        if (selectedGroupId) {
          await changeMemberRole(selectedGroupId, memberId, newRole);
          alert(`멤버 역할이 ${roleLabels[newRole]}로 변경되었습니다.`);
        }
      } catch (error) {
        console.error('Failed to change member role:', error);
        alert('멤버 역할 변경에 실패했습니다.');
      }
    }
  };

  const handleTransferOwnership = async (memberId: string) => {
    const currentUserRole = members.find(m => m.userId === user?.uid)?.role;

    // 권한 체크: 그룹장과 부그룹장만 양도 가능
    const hasTransferPermission =
      group.ownerId === user?.uid ||
      (currentUserRole === 'vice_owner' && group.ownerId !== user?.uid);

    if (!hasTransferPermission) {
      alert(
        '그룹장 양도 권한이 없습니다. 그룹장과 부그룹장만 그룹장 권한을 양도할 수 있습니다.'
      );
      return;
    }

    if (
      confirm(
        '정말로 그룹장 권한을 이 멤버에게 양도하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      )
    ) {
      try {
        if (selectedGroupId) {
          // Note: ownerId update should be handled by the backend
          await changeMemberRole(selectedGroupId, memberId, 'owner');
          if (user?.uid) {
            await changeMemberRole(selectedGroupId, user.uid, 'admin');
          }
          alert('그룹장 권한이 양도되었습니다.');
        }
      } catch (error) {
        console.error('Failed to transfer ownership:', error);
        alert('그룹장 권한 양도에 실패했습니다.');
      }
    }
  };

  const handleDeleteGroup = async () => {
    if (
      confirm(
        '정말로 이 그룹을 삭제하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.'
      )
    ) {
      try {
        if (selectedGroupId) {
          await deleteGroup(selectedGroupId);
          setSelectedGroupId(null);
          alert('그룹이 삭제되었습니다.');
        }
      } catch (error) {
        console.error('Failed to delete group:', error);
        alert('그룹 삭제에 실패했습니다.');
      }
    }
  };

  const handleInviteMember = () => {
    setShowInviteModal(true);
  };

  const handleEditGroup = () => {
    setShowEditGroupModal(true);
  };

  const handleGroupSettings = () => {
    setShowSettingsModal(true);
  };

  const handleSendInvite = async () => {
    if (inviteEmail.trim() && selectedGroupId) {
      try {
        await inviteByEmail(selectedGroupId, inviteEmail, inviteRole);
        alert(`${inviteEmail}에게 초대장을 보냈습니다.`);
        setInviteEmail('');
        setShowInviteModal(false);
      } catch (error) {
        console.error('Failed to send invite:', error);
        alert('초대장 발송에 실패했습니다.');
      }
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    updates: Partial<ExtendedGroupMember>
  ) => {
    const currentUserRole = members.find(m => m.userId === user?.uid)?.role;

    // 권한 체크: 그룹장, 관리자, 부그룹장만 업데이트 가능
    const hasUpdatePermission =
      group.ownerId === user?.uid ||
      currentUserRole === 'admin' ||
      currentUserRole === 'vice_owner';

    if (!hasUpdatePermission) {
      alert(
        '멤버 정보 업데이트 권한이 없습니다. 그룹장, 관리자, 부그룹장만 멤버 정보를 수정할 수 있습니다.'
      );
      return;
    }

    try {
      // Update member role if changed
      if (updates.role && selectedGroupId) {
        await changeMemberRole(selectedGroupId, memberId, updates.role);
      }

      alert('멤버 정보가 업데이트되었습니다.');
      setShowMemberEditModal(false);
      setSelectedMember(null);

      // Refresh member list to get updated data
      if (selectedGroupId) {
        await refetchGroups();
      }
    } catch (error) {
      console.error('Failed to update member:', error);
      alert('멤버 정보 업데이트에 실패했습니다.');
    }
  };

  const handleUpdateGroup = async (updates: any) => {
    try {
      if (selectedGroupId) {
        await updateGroup(selectedGroupId, updates);
        alert('그룹 정보가 업데이트되었습니다.');
        setShowEditGroupModal(false);
      }
    } catch (error) {
      console.error('Failed to update group:', error);
      alert('그룹 업데이트에 실패했습니다.');
    }
  };

  const handleUpdateSettings = async (settings: any) => {
    try {
      if (selectedGroupId && group) {
        await updateGroup(selectedGroupId, {
          settings: { ...group.settings, ...settings },
        });
        alert('그룹 설정이 업데이트되었습니다.');
        setShowSettingsModal(false);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('설정 업데이트에 실패했습니다.');
    }
  };

  // 할일 카드 클릭 핸들러
  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  // 페이지네이션 계산
  const totalTaskPages = tasks ? Math.ceil(tasks.length / tasksPerPage) : 0;
  const startTaskIndex = (currentTaskPage - 1) * tasksPerPage;
  const endTaskIndex = startTaskIndex + tasksPerPage;
  const currentTasks = tasks ? tasks.slice(startTaskIndex, endTaskIndex) : [];

  // 페이지 변경 핸들러
  const handleTaskPageChange = (page: number) => {
    setCurrentTaskPage(page);
  };

  // 통계 버튼 클릭 핸들러
  const handleStatClick = (
    member: ExtendedGroupMember,
    statType: 'created' | 'assigned' | 'completed' | 'points'
  ) => {
    setSelectedMemberForStats(member);
    setSelectedStatType(statType);
    setShowStatsDetail(true);

    // 할일 목록 필터링
    const filtered = tasks.filter(task => {
      switch (statType) {
        case 'created':
          return task.userId === member.userId;
        case 'assigned':
          return task.assigneeId === member.userId;
        case 'completed':
          return (
            task.assigneeId === member.userId && task.status === 'completed'
          );
        case 'points':
          return (
            task.assigneeId === member.userId && task.status === 'completed'
          );
        default:
          return false;
      }
    });

    setFilteredTasks(filtered);
    setShowFilteredTasks(true);
  };

  // 통계 상세 보기 닫기 핸들러
  const handleCloseStatsDetail = () => {
    setShowStatsDetail(false);
    setShowFilteredTasks(false);
    setSelectedMemberForStats(null);
    setSelectedStatType(null);
    setFilteredTasks([]);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return '그룹장';
      case 'admin':
        return '관리자';
      case 'vice_owner':
        return '부그룹장';
      case 'member':
        return '멤버';
      case 'viewer':
        return '뷰어';
      case 'parent':
        return '부모';
      case 'child':
        return '자녀';
      default:
        return '멤버';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-400';
      case 'admin':
        return 'text-blue-400';
      case 'vice_owner':
        return 'text-orange-400';
      case 'member':
        return 'text-green-400';
      case 'viewer':
        return 'text-gray-400';
      case 'parent':
        return 'text-blue-400';
      case 'child':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600">
        <WaveBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="가족 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }

  // 그룹이 없을 때의 화면
  if (!selectedGroupId || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600">
        <WaveBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <GlassCard variant="light" className="p-8 max-w-md">
            <Typography.H3 className="text-white mb-4">
              가족 그룹이 없습니다
            </Typography.H3>
            <Typography.Body className="text-white/80 mb-6">
              아직 가족 그룹에 참여하지 않았습니다.
              <br />새 그룹을 만들거나 기존 그룹에 참여하세요.
            </Typography.Body>
            <div className="space-y-3">
              <WaveButton
                variant="primary"
                className="w-full"
                onClick={() => setShowCreateGroupModal(true)}
              >
                새 그룹 만들기
              </WaveButton>
              <WaveButton
                variant="ghost"
                className="w-full"
                onClick={() => setShowQRScannerModal(true)}
              >
                초대코드로 참여하기
              </WaveButton>
            </div>
          </GlassCard>
        </div>

        {/* QR 스캔 모달을 여기서도 렌더링 */}
        {showQRScannerModal && (
          <QRScannerModal
            isOpen={showQRScannerModal}
            onClose={() => setShowQRScannerModal(false)}
            onScanSuccess={handleQRScanSuccess}
            onScanError={handleQRScanError}
          />
        )}

        {/* 모달을 여기서도 렌더링 */}
        {showCreateGroupModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <GlassCard variant="medium" className="p-6 max-w-md w-full">
              <Typography.H3 className="text-white mb-4">
                새 그룹 만들기
              </Typography.H3>

              {/* Error Message */}
              {createGroupError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-200 text-sm">{createGroupError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">
                    그룹 이름 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => {
                      setNewGroupName(e.target.value);
                      if (formErrors.name) {
                        setFormErrors(prev => ({ ...prev, name: undefined }));
                      }
                    }}
                    className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 transition-colors ${
                      formErrors.name
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/20 focus:border-white/40'
                    }`}
                    placeholder="그룹 이름을 입력하세요"
                    maxLength={50}
                    disabled={isCreatingGroup}
                  />
                  {formErrors.name && (
                    <p className="text-red-400 text-sm mt-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-white/80 text-sm mb-2 block">
                    그룹 설명 (선택 사항)
                  </label>
                  <textarea
                    value={newGroupDescription}
                    onChange={e => {
                      setNewGroupDescription(e.target.value);
                      if (formErrors.description) {
                        setFormErrors(prev => ({
                          ...prev,
                          description: undefined,
                        }));
                      }
                    }}
                    className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 transition-colors resize-none ${
                      formErrors.description
                        ? 'border-red-500/50 focus:border-red-500'
                        : 'border-white/20 focus:border-white/40'
                    }`}
                    rows={3}
                    placeholder="그룹에 대한 설명을 입력하세요"
                    maxLength={200}
                    disabled={isCreatingGroup}
                  />
                  {formErrors.description && (
                    <p className="text-red-400 text-sm mt-1">
                      {formErrors.description}
                    </p>
                  )}
                  <p className="text-white/50 text-xs mt-1">
                    {newGroupDescription.length}/200
                  </p>
                </div>

                {/* 가족관리 설정 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="checkbox"
                      id="pointsManagement"
                      checked={isPointsManagement}
                      onChange={e => setIsPointsManagement(e.target.checked)}
                      disabled={isCreatingGroup}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="pointsManagement"
                      className="text-white/90 font-pretendard cursor-pointer"
                    >
                      포인트 관리 기능 활성화
                    </label>
                  </div>

                  {isPointsManagement && (
                    <div className="ml-7 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-400 text-sm">✓</span>
                        <span className="text-green-400 text-sm font-pretendard font-medium">
                          포인트 관리 기능이 활성화됩니다
                        </span>
                      </div>
                      <p className="text-white/70 text-xs font-pretendard">
                        • 구성원별 할일 완료 시 포인트 적립
                        <br />
                        • 포인트 기반 리더보드 및 순위 표시
                        <br />• 포인트 히스토리 및 통계 관리
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <WaveButton
                    variant="ghost"
                    onClick={handleCloseCreateGroupModal}
                    className="flex-1"
                    disabled={isCreatingGroup}
                  >
                    취소
                  </WaveButton>
                  <WaveButton
                    variant="primary"
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup || !newGroupName.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
                  >
                    {isCreatingGroup ? (
                      <div className="flex items-center justify-center gap-2">
                        <LoadingSpinner size="sm" />
                        <span>생성 중...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Plus size={18} />
                        <span>그룹 생성</span>
                      </div>
                    )}
                  </WaveButton>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-600">
      <WaveBackground />

      <div
        className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 xl:py-16 fixed-header-spacing"
        style={{ paddingTop: '120px' }}
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex-1 min-w-0">
              <Typography.H2 className="text-white mb-2 text-xl sm:text-2xl lg:text-3xl break-keep-ko">
                {groups && groups.length > 1 ? '그룹 관리' : '가족 관리'}
              </Typography.H2>
              <Typography.Body className="text-white/90 text-sm sm:text-base break-keep-ko">
                {groups && groups.length > 1
                  ? '여러 그룹의 구성원과 설정을 관리하세요'
                  : '가족 구성원과 그룹 설정을 관리하세요'}
              </Typography.Body>
            </div>

            {/* 그룹 선택 */}
            {sortedGroups && sortedGroups.length > 1 && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <select
                  value={selectedGroupId || ''}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base"
                >
                  {sortedGroups.map(g => (
                    <option
                      key={g.id}
                      value={g.id}
                      className="bg-gray-800 text-white"
                    >
                      {favoriteGroups.includes(g.id) ? '⭐ ' : ''}
                      {g.name}
                    </option>
                  ))}
                </select>
                <WaveButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    selectedGroupId && toggleFavorite(selectedGroupId)
                  }
                  className={`font-pretendard sm:size-md lg:size-lg transition-all duration-200 ${
                    selectedGroupId && favoriteGroups.includes(selectedGroupId)
                      ? 'text-yellow-400 hover:text-yellow-300'
                      : 'text-white/60 hover:text-white'
                  }`}
                  title={
                    selectedGroupId && favoriteGroups.includes(selectedGroupId)
                      ? '즐겨찾기 해제'
                      : '즐겨찾기 추가'
                  }
                >
                  <Star
                    size={16}
                    className={`sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                      selectedGroupId &&
                      favoriteGroups.includes(selectedGroupId)
                        ? 'fill-current'
                        : ''
                    }`}
                  />
                </WaveButton>
              </div>
            )}

            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={scrollToTop}
                className="font-pretendard sm:size-md lg:size-lg"
                title="상단으로 이동"
              >
                <ArrowUp size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </WaveButton>
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleScanQRCode}
                className="font-pretendard sm:size-md lg:size-lg"
                title="QR코드 스캔"
              >
                <Camera size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </WaveButton>
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleGroupSettings}
                className="font-pretendard sm:size-md lg:size-lg"
                title="그룹 설정"
              >
                <Settings size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </WaveButton>
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleEditGroup}
                className="font-pretendard sm:size-md lg:size-lg"
                title="그룹 편집"
              >
                <Edit size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </WaveButton>
              <WaveButton
                variant="primary"
                size="sm"
                onClick={() => setShowCreateGroupModal(true)}
                className="font-pretendard bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out sm:size-md lg:size-lg"
                title="새 그룹 만들기"
              >
                <Plus
                  size={16}
                  className="sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white"
                />
              </WaveButton>
              <WaveButton
                variant="primary"
                size="sm"
                onClick={handleInviteMember}
                className="font-pretendard bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out sm:size-md lg:size-lg"
                title="멤버 초대"
              >
                <UserPlus
                  size={16}
                  className="sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white"
                />
              </WaveButton>
            </div>
          </div>
        </div>

        {/* Group Info */}
        <GlassCard variant="light" className="p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Typography.H3 className="text-white font-pretendard">
                  {group.name}
                </Typography.H3>
                {favoriteGroups.includes(group.id) && (
                  <Star
                    size={20}
                    className="text-yellow-400 fill-current"
                    title="즐겨찾기 그룹"
                  />
                )}
                {sortedGroups && sortedGroups.length > 1 && (
                  <span className="px-2 py-1 bg-white/20 rounded-full text-white/80 text-xs">
                    {sortedGroups.findIndex(g => g.id === selectedGroupId) + 1}{' '}
                    / {sortedGroups.length}
                  </span>
                )}
              </div>
              <Typography.Body className="text-white/80 font-pretendard">
                멤버 {members.length}명 •{' '}
                {group.createdAt
                  ? toDate(group.createdAt).toLocaleDateString()
                  : ''}
                {sortedGroups && sortedGroups.length > 1 && (
                  <span> • {sortedGroups.length}개 그룹 중 선택됨</span>
                )}
                {favoriteGroups.includes(group.id) && (
                  <span> • ⭐ 즐겨찾기 그룹</span>
                )}
              </Typography.Body>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <WaveButton
                variant="ghost"
                size="lg"
                onClick={handleCopyInviteCode}
                className="font-pretendard"
                title="초대 코드 복사"
              >
                <Copy size={18} className="lg:w-5 lg:h-5" />
              </WaveButton>
              <WaveButton
                variant="ghost"
                size="lg"
                onClick={handleShowQRCode}
                className="font-pretendard"
                title="QR 코드"
              >
                <QrCode size={18} className="lg:w-5 lg:h-5" />
              </WaveButton>
              {group.ownerId === user?.uid && (
                <WaveButton
                  variant="ghost"
                  size="lg"
                  onClick={handleDeleteGroup}
                  className="font-pretendard text-red-400 hover:text-red-300"
                  title="그룹 삭제"
                >
                  <Trash2 size={18} className="lg:w-5 lg:h-5" />
                </WaveButton>
              )}
            </div>
          </div>

          {/* Invite Code Display */}
          <div className="mt-6 p-4 glass-medium rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm lg:text-base font-pretendard mb-1">
                  초대 코드
                </p>
                <p className="text-white text-lg lg:text-xl font-mono font-bold">
                  {(group as any)?.inviteCode || '코드 생성 필요'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm font-pretendard">
                  최대 {(group.settings as any)?.maxMembers || 10}명
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Members List */}
        <div className="space-y-6 lg:space-y-8">
          <div className="flex items-center justify-between">
            <Typography.H4 className="text-white font-pretendard">
              구성원 ({members.length}명)
            </Typography.H4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {(members as ExtendedGroupMember[]).map(member => (
              <GlassCard
                key={member.userId}
                variant="light"
                className="p-6 lg:p-8"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg lg:text-xl font-bold shadow-lg">
                      {member.avatar ? (
                        <img
                          src={member.avatar}
                          alt={member.userName || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        (member.displayName || member.userName || 'U').charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold text-base lg:text-lg font-pretendard">
                          {member.displayName || member.userName}
                        </h4>
                        {member.role === 'owner' && (
                          <Crown
                            size={16}
                            className="lg:w-5 lg:h-5 text-yellow-400"
                          />
                        )}
                        {member.role === 'vice_owner' && (
                          <Crown
                            size={16}
                            className="lg:w-5 lg:h-5 text-orange-400"
                          />
                        )}
                        <span
                          className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-full ${getRoleColor(
                            member.role
                          )} bg-background/10`}
                        >
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm lg:text-base font-pretendard">
                        {member.email || '이메일 없음'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            onlineStatus[member.userId]
                              ? 'bg-green-400 animate-pulse'
                              : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-white/60 text-xs lg:text-sm font-pretendard">
                          {onlineStatus[member.userId] ? '온라인' : '오프라인'}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-white/50 text-xs font-pretendard">
                          최근 로그인:{' '}
                          {formatLastLoginTime(lastLoginTimes[member.userId])}
                        </span>
                      </div>
                    </div>
                  </div>

                  {member.userId !== user?.uid && (
                    <div className="flex gap-2">
                      {/* 현재 사용자의 역할 확인 */}
                      {(() => {
                        const currentUserRole = members.find(
                          m => m.userId === user?.uid
                        )?.role;
                        const hasEditPermission =
                          group.ownerId === user?.uid ||
                          currentUserRole === 'admin' ||
                          currentUserRole === 'vice_owner';

                        return hasEditPermission ? (
                          <>
                            <WaveButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentRole = member.role;
                                let newRole: 'admin' | 'vice_owner' | 'member';

                                if (currentRole === 'admin') {
                                  newRole = 'vice_owner';
                                } else if (currentRole === 'vice_owner') {
                                  newRole = 'member';
                                } else {
                                  newRole = 'admin';
                                }

                                handleChangeMemberRole(member.userId, newRole);
                              }}
                              className="font-pretendard text-blue-400 hover:text-blue-300"
                              title={
                                member.role === 'admin'
                                  ? '부그룹장으로 변경'
                                  : member.role === 'vice_owner'
                                  ? '멤버로 변경'
                                  : '관리자로 변경'
                              }
                            >
                              <Crown size={14} className="lg:w-4 lg:h-4" />
                            </WaveButton>
                            {(group.ownerId === user?.uid ||
                              (currentUserRole === 'vice_owner' &&
                                group.ownerId !== member.userId)) && (
                              <WaveButton
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleTransferOwnership(member.userId)
                                }
                                className="font-pretendard text-yellow-400 hover:text-yellow-300"
                                title="그룹장 양도"
                              >
                                <Crown size={14} className="lg:w-4 lg:h-4" />
                              </WaveButton>
                            )}
                            <WaveButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMember(member.userId)}
                              className="font-pretendard"
                              title="멤버 편집"
                            >
                              <Edit size={14} className="lg:w-4 lg:h-4" />
                            </WaveButton>
                            <WaveButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                              className="text-red-400 hover:text-red-300 font-pretendard"
                              title="멤버 제거"
                            >
                              <Trash2 size={14} className="lg:w-4 lg:h-4" />
                            </WaveButton>
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Member Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div
                    className="text-center p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                    title="이 그룹에서 생성한 할일 수"
                    onClick={() => handleStatClick(member, 'created')}
                  >
                    <div className="text-lg lg:text-xl font-bold text-indigo-400 font-pretendard">
                      {member.tasksCreated || 0}
                    </div>
                    <div className="text-black text-xs lg:text-sm font-pretendard">
                      생성
                    </div>
                  </div>
                  <div
                    className="text-center p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                    title="이 그룹에서 할당받은 할일 수"
                    onClick={() => handleStatClick(member, 'assigned')}
                  >
                    <div className="text-lg lg:text-xl font-bold text-blue-400 font-pretendard">
                      {member.tasksAssigned || 0}
                    </div>
                    <div className="text-black text-xs lg:text-sm font-pretendard">
                      할당
                    </div>
                  </div>
                  <div
                    className="text-center p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                    title="이 그룹에서 완료한 할일 수"
                    onClick={() => handleStatClick(member, 'completed')}
                  >
                    <div className="text-lg lg:text-xl font-bold text-green-400 font-pretendard">
                      {member.tasksCompleted || 0}
                    </div>
                    <div className="text-black text-xs lg:text-sm font-pretendard">
                      완료
                    </div>
                  </div>
                  <div
                    className="text-center p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                    title="할당받은 할일 대비 완료율"
                    onClick={() => handleStatClick(member, 'completed')}
                  >
                    <div className="text-lg lg:text-xl font-bold text-purple-400 font-pretendard">
                      {(() => {
                        const assigned = member.tasksAssigned || 0;
                        const completed = member.tasksCompleted || 0;
                        return assigned > 0
                          ? Math.round((completed / assigned) * 100)
                          : 0;
                      })()}
                      %
                    </div>
                    <div className="text-black text-xs lg:text-sm font-pretendard">
                      완료율
                    </div>
                  </div>
                  <div
                    className="text-center p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                    title="이 그룹에서 획득한 포인트"
                    onClick={() => handleStatClick(member, 'points')}
                  >
                    <div className="text-lg lg:text-xl font-bold text-yellow-400 font-pretendard">
                      {member.points || 0}
                    </div>
                    <div className="text-black text-xs lg:text-sm font-pretendard">
                      포인트
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* 통계 상세 보기 섹션 */}
        {showStatsDetail && selectedMemberForStats && selectedStatType && (
          <GlassCard variant="light" className="p-6 lg:p-8 mb-8 mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Typography.H3 className="text-white font-pretendard">
                  {selectedMemberForStats.displayName ||
                    selectedMemberForStats.userName}
                  의 {selectedStatType === 'created' && '생성한 할일'}
                  {selectedStatType === 'assigned' && '할당받은 할일'}
                  {selectedStatType === 'completed' && '완료한 할일'}
                  {selectedStatType === 'points' && '포인트 현황'}
                </Typography.H3>
                <Typography.Body className="text-white/80 font-pretendard">
                  {group?.name} 그룹 기준
                </Typography.Body>
              </div>
              <WaveButton
                variant="ghost"
                size="sm"
                onClick={handleCloseStatsDetail}
                className="text-white/80 hover:text-white"
              >
                ✕
              </WaveButton>
            </div>

            <div className="space-y-6">
              {/* 통계 요약 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <div className="text-2xl lg:text-3xl font-bold text-white font-pretendard">
                    {selectedStatType === 'created' &&
                      (selectedMemberForStats.tasksCreated || 0)}
                    {selectedStatType === 'assigned' &&
                      (selectedMemberForStats.tasksAssigned || 0)}
                    {selectedStatType === 'completed' &&
                      (selectedMemberForStats.tasksCompleted || 0)}
                    {selectedStatType === 'points' &&
                      (selectedMemberForStats.points || 0)}
                  </div>
                  <div className="text-white/80 text-sm font-pretendard">
                    {selectedStatType === 'created' && '총 생성'}
                    {selectedStatType === 'assigned' && '총 할당'}
                    {selectedStatType === 'completed' && '총 완료'}
                    {selectedStatType === 'points' && '총 포인트'}
                  </div>
                </div>

                {selectedStatType === 'completed' && (
                  <div className="text-center p-4 bg-white/10 rounded-lg">
                    <div className="text-2xl lg:text-3xl font-bold text-green-400 font-pretendard">
                      {(() => {
                        const assigned =
                          selectedMemberForStats.tasksAssigned || 0;
                        const completed =
                          selectedMemberForStats.tasksCompleted || 0;
                        return assigned > 0
                          ? Math.round((completed / assigned) * 100)
                          : 0;
                      })()}
                      %
                    </div>
                    <div className="text-white/80 text-sm font-pretendard">
                      완료율
                    </div>
                  </div>
                )}

                {selectedStatType === 'points' && (
                  <div className="text-center p-4 bg-white/10 rounded-lg">
                    <div className="text-2xl lg:text-3xl font-bold text-yellow-400 font-pretendard">
                      {selectedMemberForStats.tasksCompleted || 0}
                    </div>
                    <div className="text-white/80 text-sm font-pretendard">
                      완료한 할일
                    </div>
                  </div>
                )}
              </div>

              {/* 상세 정보 */}
              <div className="bg-white/5 rounded-lg p-4">
                <Typography.Body className="text-white/90 font-pretendard">
                  {selectedStatType === 'created' &&
                    `${
                      selectedMemberForStats.displayName ||
                      selectedMemberForStats.userName
                    }님이 이 그룹에서 생성한 할일은 총 ${
                      selectedMemberForStats.tasksCreated || 0
                    }개입니다.`}
                  {selectedStatType === 'assigned' &&
                    `${
                      selectedMemberForStats.displayName ||
                      selectedMemberForStats.userName
                    }님이 이 그룹에서 할당받은 할일은 총 ${
                      selectedMemberForStats.tasksAssigned || 0
                    }개입니다.`}
                  {selectedStatType === 'completed' &&
                    `${
                      selectedMemberForStats.displayName ||
                      selectedMemberForStats.userName
                    }님이 이 그룹에서 완료한 할일은 총 ${
                      selectedMemberForStats.tasksCompleted || 0
                    }개이며, 할당받은 할일 대비 ${(() => {
                      const assigned =
                        selectedMemberForStats.tasksAssigned || 0;
                      const completed =
                        selectedMemberForStats.tasksCompleted || 0;
                      return assigned > 0
                        ? Math.round((completed / assigned) * 100)
                        : 0;
                    })()}%의 완료율을 보이고 있습니다.`}
                  {selectedStatType === 'points' &&
                    `${
                      selectedMemberForStats.displayName ||
                      selectedMemberForStats.userName
                    }님이 이 그룹에서 획득한 포인트는 총 ${
                      selectedMemberForStats.points || 0
                    }점이며, ${
                      selectedMemberForStats.tasksCompleted || 0
                    }개의 할일을 완료했습니다.`}
                </Typography.Body>
              </div>

              {/* 할일 목록 */}
              {showFilteredTasks && filteredTasks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography.H4 className="text-white font-pretendard">
                      {selectedStatType === 'created' && '생성한 할일 목록'}
                      {selectedStatType === 'assigned' && '할당받은 할일 목록'}
                      {selectedStatType === 'completed' && '완료한 할일 목록'}
                      {selectedStatType === 'points' && '포인트 획득 할일 목록'}
                    </Typography.H4>
                    <Typography.BodySmall className="text-white/60 font-pretendard">
                      총 {filteredTasks.length}개
                    </Typography.BodySmall>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Typography.Body className="text-white font-semibold mb-1">
                              {task.title}
                            </Typography.Body>
                            <Typography.Caption className="text-white/70">
                              상태:{' '}
                              {task.status === 'completed'
                                ? '완료'
                                : task.status === 'in_progress'
                                ? '진행중'
                                : '대기중'}{' '}
                              • 우선순위:{' '}
                              {task.priority === 'high'
                                ? '높음'
                                : task.priority === 'medium'
                                ? '보통'
                                : '낮음'}{' '}
                              • 카테고리: {task.category}
                            </Typography.Caption>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <Typography.Caption className="text-white/60">
                                {toDate(task.dueDate).toLocaleDateString()}
                              </Typography.Caption>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showFilteredTasks && filteredTasks.length === 0 && (
                <div className="text-center py-8">
                  <Typography.Body className="text-white/60 mb-2">
                    {selectedStatType === 'created' && '생성한 할일이 없습니다'}
                    {selectedStatType === 'assigned' &&
                      '할당받은 할일이 없습니다'}
                    {selectedStatType === 'completed' &&
                      '완료한 할일이 없습니다'}
                    {selectedStatType === 'points' &&
                      '포인트를 획득한 할일이 없습니다'}
                  </Typography.Body>
                  <Typography.Caption className="text-white/40">
                    할일을 생성하거나 할당받으면 여기에 표시됩니다
                  </Typography.Caption>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* 할일 목록 섹션 */}
        <GlassCard variant="light" className="p-6 lg:p-8 mb-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Typography.H3 className="text-white font-pretendard">
                할일 목록
              </Typography.H3>
              <Typography.Caption className="text-white/60">
                할일을 클릭하면 상세 페이지로 이동합니다
              </Typography.Caption>
            </div>
            <Typography.Body className="text-white/80 font-pretendard">
              총 {tasks?.length || 0}개의 할일
            </Typography.Body>
          </div>

          {tasks && tasks.length > 0 ? (
            <div className="space-y-4">
              {currentTasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Typography.Body className="text-white font-semibold">
                          {task.title}
                        </Typography.Body>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Typography.Caption className="text-white/60">
                            클릭하여 상세보기 →
                          </Typography.Caption>
                        </div>
                      </div>
                      <Typography.Caption className="text-white/70">
                        담당자:{' '}
                        {task.assigneeId === user?.uid ? '나' : '다른 구성원'} •
                        상태:{' '}
                        {task.status === 'completed'
                          ? '완료'
                          : task.status === 'in_progress'
                          ? '진행중'
                          : '대기중'}{' '}
                        • 우선순위:{' '}
                        {task.priority === 'high'
                          ? '높음'
                          : task.priority === 'medium'
                          ? '보통'
                          : '낮음'}
                      </Typography.Caption>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <Typography.Caption className="text-white/60">
                          {toDate(task.dueDate).toLocaleDateString()}
                        </Typography.Caption>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* 페이지네이션 */}
              {totalTaskPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  {/* 이전 페이지 버튼 */}
                  <WaveButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTaskPageChange(currentTaskPage - 1)}
                    disabled={currentTaskPage === 1}
                    className="text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ←
                  </WaveButton>

                  {/* 페이지 번호들 */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisiblePages = 5;

                      if (totalTaskPages <= maxVisiblePages) {
                        // 모든 페이지 표시
                        for (let i = 1; i <= totalTaskPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // 현재 페이지 주변의 페이지들만 표시
                        let start = Math.max(
                          1,
                          currentTaskPage - Math.floor(maxVisiblePages / 2)
                        );
                        const end = Math.min(
                          totalTaskPages,
                          start + maxVisiblePages - 1
                        );

                        if (end - start + 1 < maxVisiblePages) {
                          start = Math.max(1, end - maxVisiblePages + 1);
                        }

                        // 첫 페이지
                        if (start > 1) {
                          pages.push(1);
                          if (start > 2) pages.push('...');
                        }

                        // 중간 페이지들
                        for (let i = start; i <= end; i++) {
                          pages.push(i);
                        }

                        // 마지막 페이지
                        if (end < totalTaskPages) {
                          if (end < totalTaskPages - 1) pages.push('...');
                          pages.push(totalTaskPages);
                        }
                      }

                      return pages.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="text-white/40 px-2"
                            >
                              ...
                            </span>
                          );
                        }

                        const pageNumber = page as number;
                        const isCurrentPage = pageNumber === currentTaskPage;

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handleTaskPageChange(pageNumber)}
                            className={`
                              w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200
                              ${
                                isCurrentPage
                                  ? 'bg-white/20 text-white border border-white/40'
                                  : 'text-white/60 hover:text-white hover:bg-white/10'
                              }
                            `}
                          >
                            {pageNumber}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* 다음 페이지 버튼 */}
                  <WaveButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTaskPageChange(currentTaskPage + 1)}
                    disabled={currentTaskPage === totalTaskPages}
                    className="text-white/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    →
                  </WaveButton>
                </div>
              )}

              {/* 페이지 정보 표시 */}
              {tasks && tasks.length > 0 && (
                <div className="text-center pt-4">
                  <Typography.Caption className="text-white/60">
                    {startTaskIndex + 1}-{Math.min(endTaskIndex, tasks.length)}{' '}
                    / {tasks.length}개 할일
                  </Typography.Caption>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Typography.Body className="text-white/60 mb-4">
                아직 등록된 할일이 없습니다
              </Typography.Body>
              <Typography.Caption className="text-white/40">
                할일을 등록하면 여기에 표시됩니다
              </Typography.Caption>
            </div>
          )}
        </GlassCard>

        {/* 그룹 채팅 섹션 */}
        {selectedGroupId && group && members && members.length > 0 && (
          <div
            id="group-chat-section"
            className="mt-8"
            style={{ scrollMarginTop: '0px' }}
          >
            <GroupChat
              groupId={selectedGroupId}
              groupName={group.name}
              members={members.map(member => ({
                userId: member.userId,
                displayName: member.displayName,
                userName: member.userName,
                avatar: member.avatar,
              }))}
              onOpenFullscreen={data => {
                console.log('GroupChat에서 전체화면 모달 열기 요청:', data);
                console.log('현재 모달 상태:', {
                  showFullscreenChatModal,
                  fullscreenChatData,
                });
                setFullscreenChatData(data);
                setShowFullscreenChatModal(true);
                console.log('모달 상태 업데이트 완료');
              }}
            />
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="medium" className="p-6 max-w-md w-full">
            <Typography.H3 className="text-white mb-4">멤버 초대</Typography.H3>
            <div className="space-y-4">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  이메일
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                  placeholder="초대할 이메일을 입력하세요"
                />
              </div>
              <div className="modal-dropdown">
                <label className="text-white/80 text-sm mb-2 block">역할</label>
                <select
                  value={inviteRole}
                  onChange={e =>
                    setInviteRole(
                      e.target.value as 'admin' | 'vice_owner' | 'member'
                    )
                  }
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="admin">관리자</option>
                  <option value="vice_owner">부그룹장</option>
                  <option value="member">멤버</option>
                </select>
              </div>
              <div className="flex gap-3">
                <WaveButton
                  variant="ghost"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1"
                >
                  취소
                </WaveButton>
                <WaveButton
                  variant="primary"
                  onClick={handleSendInvite}
                  className="flex-1"
                >
                  초대 보내기
                </WaveButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Group Settings Modal */}
      {showSettingsModal && group && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="medium" className="p-6 max-w-md w-full">
            <Typography.H3 className="text-white mb-4">그룹 설정</Typography.H3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/80">자녀 초대 허용</span>
                <input
                  type="checkbox"
                  checked={
                    (group.settings as any)?.allowChildrenToInvite || false
                  }
                  onChange={e =>
                    handleUpdateSettings({
                      allowChildrenToInvite: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">초대 승인 필요</span>
                <input
                  type="checkbox"
                  checked={(group.settings as any)?.requireApproval || false}
                  onChange={e =>
                    handleUpdateSettings({ requireApproval: e.target.checked })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">부그룹장 권한 활성화</span>
                <input
                  type="checkbox"
                  checked={(group.settings as any)?.enableViceOwner || false}
                  onChange={e =>
                    handleUpdateSettings({ enableViceOwner: e.target.checked })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">포인트 관리 기능 활성화</span>
                <input
                  type="checkbox"
                  checked={
                    (group.settings as any)?.enablePointsManagement || false
                  }
                  onChange={e =>
                    handleUpdateSettings({
                      enablePointsManagement: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">온라인 상태 최적화 모드</span>
                <input
                  type="checkbox"
                  checked={useOptimizedMode}
                  onChange={e => setUseOptimizedMode(e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80">실시간 온라인 상태</span>
                <button
                  onClick={() => {
                    // 즉시 온라인 상태 새로고침
                    if (members && members.length > 0) {
                      const updateOnlineStatus = async () => {
                        const statusUpdates: Record<string, boolean> = {};
                        const loginTimeUpdates: Record<string, Date | null> =
                          {};

                        const checkFunction = useOptimizedMode
                          ? checkOnlineStatusOptimized
                          : checkOnlineStatus;

                        const promises = members.map(async member => {
                          const { isOnline, lastLoginTime } =
                            await checkFunction(member.userId);
                          return {
                            userId: member.userId,
                            isOnline,
                            lastLoginTime,
                          };
                        });

                        const results = await Promise.all(promises);

                        results.forEach(
                          ({ userId, isOnline, lastLoginTime }) => {
                            statusUpdates[userId] = isOnline;
                            loginTimeUpdates[userId] = lastLoginTime;
                          }
                        );

                        setOnlineStatus(prev => ({
                          ...prev,
                          ...statusUpdates,
                        }));
                        setLastLoginTimes(prev => ({
                          ...prev,
                          ...loginTimeUpdates,
                        }));
                      };
                      updateOnlineStatus();
                      alert('온라인 상태를 새로고침했습니다!');
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  새로고침
                </button>
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  최대 멤버 수
                </label>
                <input
                  type="number"
                  value={(group.settings as any)?.maxMembers || 10}
                  onChange={e =>
                    handleUpdateSettings({
                      maxMembers: parseInt(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  min="2"
                  max="20"
                />
              </div>
              <WaveButton
                variant="primary"
                onClick={() => setShowSettingsModal(false)}
                className="w-full"
              >
                저장
              </WaveButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && group && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="medium" className="p-6 max-w-md w-full">
            <Typography.H3 className="text-white mb-4">그룹 편집</Typography.H3>
            <div className="space-y-4">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  그룹 이름
                </label>
                <input
                  type="text"
                  defaultValue={group.name}
                  id="groupNameInput"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="그룹 이름을 입력하세요"
                />
              </div>
              <div className="flex gap-3">
                <WaveButton
                  variant="ghost"
                  onClick={() => setShowEditGroupModal(false)}
                  className="flex-1"
                >
                  취소
                </WaveButton>
                <WaveButton
                  variant="primary"
                  onClick={() => {
                    const input = document.getElementById(
                      'groupNameInput'
                    ) as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleUpdateGroup({ name: input.value.trim() });
                    }
                  }}
                  className="flex-1"
                >
                  저장
                </WaveButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Edit Member Modal */}
      {showMemberEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="medium" className="p-6 max-w-md w-full">
            <Typography.H3 className="text-white mb-4">멤버 편집</Typography.H3>
            <div className="space-y-4">
              <div>
                <label className="text-white/80 text-sm mb-2 block">이름</label>
                <input
                  type="text"
                  defaultValue={
                    selectedMember.displayName || selectedMember.userName
                  }
                  id="memberNameInput"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="멤버 이름을 입력하세요"
                  disabled
                />
                <p className="text-white/60 text-xs mt-1">
                  이름 변경은 설정 페이지에서 가능합니다
                </p>
              </div>
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  이메일
                </label>
                <input
                  type="email"
                  defaultValue={selectedMember.email}
                  id="memberEmailInput"
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="이메일을 입력하세요"
                  disabled
                />
              </div>

              {/* 역할 선택 섹션 */}
              <div>
                <label className="text-white/80 text-sm mb-3 block">
                  역할 선택
                </label>
                <div className="space-y-3">
                  {/* 관리자 체크박스 */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="radio"
                      name="memberRole"
                      id="roleAdmin"
                      value="admin"
                      defaultChecked={selectedMember.role === 'admin'}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="roleAdmin"
                      className="text-white/90 font-pretendard cursor-pointer flex-1"
                    >
                      <div className="font-medium">관리자</div>
                      <div className="text-xs text-white/60">
                        그룹 설정 변경, 멤버 관리, 할일 관리 가능
                      </div>
                    </label>
                  </div>

                  {/* 부그룹장 체크박스 */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="radio"
                      name="memberRole"
                      id="roleViceOwner"
                      value="vice_owner"
                      defaultChecked={selectedMember.role === 'vice_owner'}
                      className="w-4 h-4 text-orange-600 bg-white/10 border-white/20 focus:ring-orange-500 focus:ring-2"
                    />
                    <label
                      htmlFor="roleViceOwner"
                      className="text-white/90 font-pretendard cursor-pointer flex-1"
                    >
                      <div className="font-medium">부그룹장</div>
                      <div className="text-xs text-white/60">
                        그룹장과 동일한 권한, 그룹장 부재 시 대행 가능
                      </div>
                    </label>
                  </div>

                  {/* 멤버 체크박스 */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="radio"
                      name="memberRole"
                      id="roleMember"
                      value="member"
                      defaultChecked={selectedMember.role === 'member'}
                      className="w-4 h-4 text-green-600 bg-white/10 border-white/20 focus:ring-green-500 focus:ring-2"
                    />
                    <label
                      htmlFor="roleMember"
                      className="text-white/90 font-pretendard cursor-pointer flex-1"
                    >
                      <div className="font-medium">멤버</div>
                      <div className="text-xs text-white/60">
                        할일 생성, 수정, 완료 가능
                      </div>
                    </label>
                  </div>

                  {/* 뷰어 체크박스 */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="radio"
                      name="memberRole"
                      id="roleViewer"
                      value="viewer"
                      defaultChecked={selectedMember.role === 'viewer'}
                      className="w-4 h-4 text-gray-600 bg-white/10 border-white/20 focus:ring-gray-500 focus:ring-2"
                    />
                    <label
                      htmlFor="roleViewer"
                      className="text-white/90 font-pretendard cursor-pointer flex-1"
                    >
                      <div className="font-medium">뷰어</div>
                      <div className="text-xs text-white/60">
                        읽기 전용, 할일 조회만 가능
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <WaveButton
                  variant="ghost"
                  onClick={() => setShowMemberEditModal(false)}
                  className="flex-1"
                >
                  취소
                </WaveButton>
                <WaveButton
                  variant="primary"
                  onClick={() => {
                    const selectedRole = document.querySelector(
                      'input[name="memberRole"]:checked'
                    ) as HTMLInputElement;

                    if (selectedRole) {
                      const updates: Partial<ExtendedGroupMember> = {};

                      if (selectedRole.value !== selectedMember.role) {
                        updates.role = selectedRole.value as
                          | 'admin'
                          | 'vice_owner'
                          | 'member'
                          | 'viewer';
                      }

                      if (Object.keys(updates).length > 0) {
                        handleUpdateMember(selectedMember.userId, updates);
                      }
                    }
                  }}
                  className="flex-1"
                >
                  저장
                </WaveButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Create New Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard variant="medium" className="p-6 max-w-md w-full">
            <Typography.H3 className="text-white mb-4">
              새 그룹 만들기
            </Typography.H3>

            {/* Error Message */}
            {createGroupError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-200 text-sm">{createGroupError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  그룹 이름 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => {
                    setNewGroupName(e.target.value);
                    if (formErrors.name) {
                      setFormErrors(prev => ({ ...prev, name: undefined }));
                    }
                  }}
                  className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 transition-colors ${
                    formErrors.name
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/20 focus:border-white/40'
                  }`}
                  placeholder="그룹 이름을 입력하세요"
                  maxLength={50}
                  disabled={isCreatingGroup}
                />
                {formErrors.name && (
                  <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  그룹 설명 (선택 사항)
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={e => {
                    setNewGroupDescription(e.target.value);
                    if (formErrors.description) {
                      setFormErrors(prev => ({
                        ...prev,
                        description: undefined,
                      }));
                    }
                  }}
                  className={`w-full p-3 bg-white/10 border rounded-lg text-white placeholder-white/50 transition-colors resize-none ${
                    formErrors.description
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/20 focus:border-white/40'
                  }`}
                  rows={3}
                  placeholder="그룹에 대한 설명을 입력하세요"
                  maxLength={200}
                  disabled={isCreatingGroup}
                />
                {formErrors.description && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
                <p className="text-white/50 text-xs mt-1">
                  {newGroupDescription.length}/200
                </p>
              </div>

              {/* 가족관리 설정 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="checkbox"
                    id="pointsManagement2"
                    checked={isPointsManagement}
                    onChange={e => setIsPointsManagement(e.target.checked)}
                    disabled={isCreatingGroup}
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label
                    htmlFor="pointsManagement2"
                    className="text-white/90 font-pretendard cursor-pointer"
                  >
                    포인트 관리 기능 활성화
                  </label>
                </div>

                {isPointsManagement && (
                  <div className="ml-7 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400 text-sm">✓</span>
                      <span className="text-green-400 text-sm font-pretendard font-medium">
                        포인트 관리 기능이 활성화됩니다
                      </span>
                    </div>
                    <p className="text-white/70 text-xs font-pretendard">
                      • 구성원별 할일 완료 시 포인트 적립
                      <br />
                      • 포인트 기반 리더보드 및 순위 표시
                      <br />• 포인트 히스토리 및 통계 관리
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <WaveButton
                  variant="ghost"
                  onClick={handleCloseCreateGroupModal}
                  className="flex-1"
                  disabled={isCreatingGroup}
                >
                  취소
                </WaveButton>
                <WaveButton
                  variant="primary"
                  onClick={handleCreateGroup}
                  disabled={isCreatingGroup || !newGroupName.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-out"
                >
                  {isCreatingGroup ? (
                    <div className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>생성 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Plus size={18} />
                      <span>그룹 생성</span>
                    </div>
                  )}
                </WaveButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* QR Invite Modal */}
      {showQRInviteModal && group && (
        <QRInviteModal
          isOpen={showQRInviteModal}
          onClose={() => setShowQRInviteModal(false)}
          inviteCode={(group as any)?.inviteCode || '코드 생성 필요'}
          groupName={group.name}
          inviteUrl={`${window.location.origin}/join/${
            (group as any)?.inviteCode || 'code'
          }`}
        />
      )}

      {/* QR Scanner Modal */}
      {showQRScannerModal && (
        <QRScannerModal
          isOpen={showQRScannerModal}
          onClose={() => setShowQRScannerModal(false)}
          onScanSuccess={handleQRScanSuccess}
          onScanError={handleQRScanError}
        />
      )}

      {/* 전체화면 채팅 모달 */}
      {showFullscreenChatModal && fullscreenChatData && (
        <div className="fixed inset-0 bg-black/95 z-[99999]">
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black overflow-hidden flex flex-col pt-16">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-center p-6 border-b border-white/10">
              <Typography.Caption className="text-white/40">
                ESC 키로 닫기 가능
              </Typography.Caption>
            </div>

            {/* 헤더 하단 간격 */}
            <div className="h-4 bg-gradient-to-b from-gray-900/50 to-transparent"></div>

            {/* 모달 채팅 영역 */}
            <div className="flex-1 overflow-hidden pb-0 h-full">
              <GroupChat
                groupId={fullscreenChatData.groupId}
                groupName={fullscreenChatData.groupName}
                members={fullscreenChatData.members}
                onOpenFullscreen={() => {
                  // 전체화면 모달에서는 전체화면 기능 비활성화
                  console.log('이미 전체화면 모드입니다');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FamilyManage;
