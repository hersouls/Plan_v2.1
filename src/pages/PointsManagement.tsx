import {
  Award,
  Brain,
  CheckCircle,
  HelpCircle,
  History,
  Plus,
  RefreshCw,
  Settings,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { WaveBackground } from '../components/layout/WaveBackground';

import { PointSettingsModal } from '../components/points/PointSettingsModal';
import { PointsExplanationModal } from '../components/points/PointsExplanationModal';
import { TaskDetailModal } from '../components/points/TaskDetailModal';

import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts/AuthContext';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { enhancedUserService } from '../lib/firestore-improved';
import { PointHistory, PointStats, pointsService } from '../lib/points';
import { pointsAnalyzer } from '../lib/pointsAnalyzer';
import { Task } from '../types/task';
import { User } from '../types/user';

function PointsManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [showPointSettingsModal, setShowPointSettingsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showApprovedHistoryModal, setShowApprovedHistoryModal] =
    useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

  // AI 분석 모달 상태
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisTarget, setAnalysisTarget] = useState<PointHistory | null>(
    null
  );

  // 즐겨찾기 그룹 관리
  const [favoriteGroups, setFavoriteGroups] = useState<string[]>([]);

  // 그룹 및 멤버 데이터
  const { groups = [] } = useUserGroups();
  const { members = [] } = useGroup({
    groupId: selectedGroupId || undefined,
    loadMembers: true,
    loadStats: true,
  });

  // 사용자 프로필 정보 상태 추가
  const [userProfiles, setUserProfiles] = useState<Record<string, User>>({});

  // 포인트 관련 상태
  const [unapprovedPointHistory, setUnapprovedPointHistory] = useState<
    PointHistory[]
  >([]);
  const [approvedPointHistory, setApprovedPointHistory] = useState<
    PointHistory[]
  >([]);
  const [memberStats, setMemberStats] = useState<Record<string, PointStats>>(
    {}
  );

  // 포인트 추가/차감 모달 상태
  const [pointAmount, setPointAmount] = useState<number>(0);
  const [pointReason, setPointReason] = useState<string>('');
  const [pointAction, setPointAction] = useState<'add' | 'deduct'>('add');

  // 로딩 상태
  const [loading, setLoading] = useState(false);
  const [approvingHistoryId, setApprovingHistoryId] = useState<string | null>(
    null
  );

  // 모달 상태 디버깅
  useEffect(() => {
    console.log('포인트 설정 모달 상태:', showPointSettingsModal);
  }, [showPointSettingsModal]);

  // 즐겨찾기 그룹 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteGroups');
    if (savedFavorites) {
      try {
        setFavoriteGroups(JSON.parse(savedFavorites));
      } catch {
        console.error('Failed to parse favorite groups');
        setFavoriteGroups([]);
      }
    }
  }, []);

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

  // 그룹 선택 시 자동으로 첫 번째 그룹과 멤버 선택 (즐겨찾기 우선)
  useEffect(() => {
    if (sortedGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(sortedGroups[0].id);
    }
  }, [sortedGroups, selectedGroupId]);

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

  // 그룹 선택 시 자동으로 첫 번째 멤버 선택 (로그인한 사용자 우선)
  useEffect(() => {
    if (members.length > 0 && !selectedMember) {
      // 로그인한 사용자가 멤버 목록에 있으면 우선 선택
      const currentUserMember = members.find(m => m.userId === user?.uid);
      if (currentUserMember) {
        setSelectedMember(currentUserMember.userId);
      } else {
        // 로그인한 사용자가 없으면 첫 번째 멤버 선택
        setSelectedMember(members[0].userId);
      }
    }
  }, [members, selectedMember, user?.uid]);

  // 미승인 포인트 내역 로드
  const loadUnapprovedPointHistory = async () => {
    if (!selectedGroupId || !selectedMember) return;

    setLoading(true);
    try {
      const history = await pointsService.getUnapprovedPointHistory(
        selectedMember,
        selectedGroupId
      );
      setUnapprovedPointHistory(history);
    } catch {
      console.error('미승인 포인트 내역 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // 승인된 포인트 내역 로드
  const loadApprovedPointHistory = async () => {
    if (!selectedGroupId || !selectedMember) return;

    setLoading(true);
    try {
      const history = await pointsService.getApprovedPointHistory(
        selectedMember,
        selectedGroupId
      );

      setApprovedPointHistory(history);
    } catch {
      console.error('승인된 포인트 내역 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  // 포인트 내역 승인 (AI 분석 결과 반영 가능)
  const handleApprovePointHistory = async (
    historyId: string,
    adjustedAmount?: number
  ) => {
    if (!user) return;

    // 권한 체크
    if (!hasPointManagementPermission) {
      alert(
        '포인트 내역 승인 권한이 없습니다. 그룹장과 부그룹장만 포인트 내역을 승인할 수 있습니다.'
      );
      return;
    }

    setApprovingHistoryId(historyId);
    try {
      // 조정된 금액이 있으면 먼저 포인트 내역 수정
      if (adjustedAmount && analysisTarget) {
        await pointsService.updatePointHistoryAmount(historyId, adjustedAmount);
      }

      await pointsService.approvePointHistory(historyId, user.uid);

      // 내역 새로고침
      await loadUnapprovedPointHistory();
      await loadApprovedPointHistory();
      await loadMemberStats();
    } catch {
      console.error('포인트 내역 승인 실패');
    } finally {
      setApprovingHistoryId(null);
    }
  };

  // AI 분석 후 승인
  const handleAnalysisApprove = async (adjustedAmount?: number) => {
    if (analysisTarget) {
      await handleApprovePointHistory(analysisTarget.id, adjustedAmount);
      setShowAnalysisModal(false);
      setAnalysisTarget(null);
    }
  };

  // 포인트 내역 승인 취소
  const handleRejectPointHistory = async (historyId: string) => {
    if (!user) return;

    // 권한 체크
    if (!hasPointManagementPermission) {
      alert(
        '포인트 내역 거부 권한이 없습니다. 그룹장과 부그룹장만 포인트 내역을 거부할 수 있습니다.'
      );
      return;
    }

    setApprovingHistoryId(historyId);
    try {
      await pointsService.rejectPointHistory(historyId, user.uid);

      // 내역 새로고침
      await loadUnapprovedPointHistory();
      await loadApprovedPointHistory();
      await loadMemberStats();
    } catch {
      console.error('포인트 내역 승인 취소 실패');
    } finally {
      setApprovingHistoryId(null);
    }
  };

  // 할일카드 클릭 시 수정 페이지로 이동
  const handleTaskCardClick = (taskId: string) => {
    try {
      navigate(`/tasks/${taskId}/edit`);
    } catch (error) {
      console.error('할일 수정 페이지 이동 실패:', error);
      // 오류 발생 시 사용자에게 알림
      alert('할일 수정 페이지로 이동할 수 없습니다. 다시 시도해주세요.');
    }
  };

  // 멤버별 포인트 통계 로드
  const loadMemberStats = async () => {
    if (!selectedGroupId || !members.length) return;

    try {
      const groupStats = await pointsService.getGroupPointStats(
        selectedGroupId
      );
      const statsMap: Record<string, PointStats> = {};

      groupStats.forEach(stat => {
        statsMap[stat.userId] = stat;
      });

      setMemberStats(statsMap);
    } catch {
      console.error('멤버 통계 로드 실패');
    }
  };

  // 사용자 프로필 정보 로드 함수
  const loadUserProfiles = async (memberIds: string[]) => {
    try {
      const profiles: Record<string, User> = {};

      for (const memberId of memberIds) {
        try {
          const profile = await enhancedUserService.getUserProfile(memberId);
          if (profile) {
            profiles[memberId] = profile as User;
          }
        } catch {
          console.error(`사용자 프로필 로드 실패 (${memberId})`);
        }
      }

      setUserProfiles(prev => ({ ...prev, ...profiles }));
    } catch {
      console.error('사용자 프로필 로드 실패');
    }
  };

  // 멤버 목록이 변경될 때 사용자 프로필 정보 로드
  useEffect(() => {
    if (members.length > 0) {
      const memberIds = members.map(member => member.userId);
      loadUserProfiles(memberIds);
    }
  }, [members]);

  // 아바타 이미지 URL 가져오기 함수
  const getAvatarUrl = (memberId: string): string | null => {
    const profile = userProfiles[memberId];
    if (!profile) return null;

    // photoURL 또는 avatarStorageUrl 중 사용 가능한 것 사용
    return profile.photoURL || profile.avatarStorageUrl || null;
  };

  // 아바타 컴포넌트 렌더링 함수
  const renderAvatar = (
    memberId: string,
    displayName: string,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const avatarUrl = getAvatarUrl(memberId);
    const sizeClasses = {
      sm: 'w-8 h-8 sm:w-10 sm:h-10',
      md: 'w-10 h-10 sm:w-12 sm:h-12',
      lg: 'w-12 h-12 sm:w-16 sm:h-16',
    };
    const textSizes = {
      sm: 'text-sm sm:text-base',
      md: 'text-base sm:text-lg',
      lg: 'text-lg sm:text-xl',
    };

    if (avatarUrl && avatarUrl !== null) {
      return (
        <div className="relative">
          <img
            src={avatarUrl}
            alt={`${displayName} 아바타`}
            className={`${sizeClasses[size]} rounded-full object-cover shadow-lg`}
            onError={e => {
              // 이미지 로드 실패 시 기본 아바타로 대체
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = parent.querySelector(
                  '.avatar-fallback'
                ) as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }
            }}
          />
          <div
            className={`${sizeClasses[size]} bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${textSizes[size]} shadow-lg avatar-fallback absolute inset-0`}
            style={{ display: 'none' }}
          >
            {displayName?.charAt(0) || 'U'}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${textSizes[size]} shadow-lg avatar-fallback`}
      >
        {displayName?.charAt(0) || 'U'}
      </div>
    );
  };

  useEffect(() => {
    if (selectedGroupId) {
      loadUnapprovedPointHistory();
      loadApprovedPointHistory();
      loadMemberStats();
    }
  }, [selectedGroupId, selectedMember]);

  // 포인트 수동 추가/차감
  const handleAddPoints = async (amount: number, reason: string) => {
    if (!selectedGroupId || !selectedMember) return;

    // 권한 체크
    if (!hasPointManagementPermission) {
      alert(
        '포인트 추가 권한이 없습니다. 그룹장과 부그룹장만 포인트를 추가할 수 있습니다.'
      );
      return;
    }

    try {
      await pointsService.manuallyAdjustPoints(
        selectedMember,
        selectedGroupId,
        amount,
        reason
      );

      // 데이터 새로고침 - 즉시 반영을 위해 순서 조정
      await loadMemberStats(); // 포인트 통계 먼저 업데이트
      await loadUnapprovedPointHistory();
      await loadApprovedPointHistory();
      setShowAddPointsModal(false);
    } catch {
      console.error('포인트 추가 실패');
    }
  };

  // 포인트 차감
  const handleDeductPoints = async (amount: number, reason: string) => {
    if (!selectedGroupId || !selectedMember) return;

    // 권한 체크
    if (!hasPointManagementPermission) {
      alert(
        '포인트 차감 권한이 없습니다. 그룹장과 부그룹장만 포인트를 차감할 수 있습니다.'
      );
      return;
    }

    try {
      // 음수로 변환하여 차감
      await pointsService.manuallyAdjustPoints(
        selectedMember,
        selectedGroupId,
        -Math.abs(amount),
        reason
      );

      // 데이터 새로고침 - 즉시 반영을 위해 순서 조정
      await loadMemberStats(); // 포인트 통계 먼저 업데이트
      await loadUnapprovedPointHistory();
      await loadApprovedPointHistory();
      setShowAddPointsModal(false);
    } catch {
      console.error('포인트 차감 실패');
    }
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  // 권한 체크 로직 추가
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const currentMember = members.find(m => m.userId === user.uid);
  const isGroupOwner = selectedGroup?.ownerId === user.uid;
  const isDeputyGroupLeader = currentMember?.role === 'vice_owner';
  const hasPointManagementPermission = isGroupOwner || isDeputyGroupLeader;

  const selectedMemberData = members.find(m => m.userId === selectedMember);
  const selectedMemberStats = selectedMemberData
    ? memberStats[selectedMemberData.userId]
    : null;

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
              <Typography.H2 className="text-white font-pretendard tracking-ko-tight text-xl sm:text-2xl lg:text-3xl break-keep-ko mb-2">
                포인트 관리
              </Typography.H2>
              <Typography.Body className="text-white/90 font-pretendard text-sm sm:text-base break-keep-ko">
                가족 구성원들의 포인트를 관리하고 동기부여를 제공하세요
              </Typography.Body>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              {/* Group Selection */}
              {sortedGroups.length > 0 && (
                <div className="flex items-center gap-2">
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
                  {selectedGroupId && (
                    <WaveButton
                      onClick={() => toggleFavorite(selectedGroupId)}
                      variant="ghost"
                      size="sm"
                      className="font-pretendard sm:size-md lg:size-lg"
                      title={
                        favoriteGroups.includes(selectedGroupId)
                          ? '즐겨찾기 해제'
                          : '즐겨찾기 추가'
                      }
                    >
                      <Star
                        size={16}
                        className={`sm:w-4 sm:h-4 lg:w-5 lg:h-5 ${
                          favoriteGroups.includes(selectedGroupId)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/60'
                        }`}
                      />
                    </WaveButton>
                  )}
                </div>
              )}

              <WaveButton
                onClick={() => setShowExplanationModal(true)}
                variant="ghost"
                size="sm"
                className="font-pretendard sm:size-md lg:size-lg"
                title="포인트 시스템 가이드"
              >
                <HelpCircle size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
              </WaveButton>

              {/* 포인트 설정 버튼 - 그룹장/부그룹장/관리자만 표시 */}
              {(() => {
                const selectedGroup = groups.find(
                  g => g.id === selectedGroupId
                );
                const currentMember = members.find(m => m.userId === user?.uid);

                // 권한 체크: 그룹장이거나 부그룹장/관리자 역할
                const hasPermission =
                  selectedGroup?.ownerId === user?.uid ||
                  currentMember?.role === 'vice_owner' ||
                  currentMember?.role === 'admin';

                if (hasPermission) {
                  return (
                    <WaveButton
                      onClick={() => setShowPointSettingsModal(true)}
                      variant="ghost"
                      size="sm"
                      className="font-pretendard sm:size-md lg:size-lg"
                      title="포인트 설정 (그룹장/부그룹장 전용)"
                    >
                      <Settings
                        size={16}
                        className="sm:w-4 sm:h-4 lg:w-5 lg:h-5"
                      />
                    </WaveButton>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        </div>

        {!selectedGroupId ? (
          <div className="text-center py-16">
            <GlassCard
              variant="medium"
              className="p-8 sm:p-12 lg:p-16 max-w-2xl mx-auto"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <Typography.H2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 font-pretendard">
                그룹을 선택해주세요
              </Typography.H2>
              <Typography.Body className="text-white/80 mb-6 text-base sm:text-lg font-pretendard">
                포인트를 관리할 가족 그룹을 선택하세요
              </Typography.Body>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <WaveButton
                  onClick={() => setShowExplanationModal(true)}
                  variant="secondary"
                  size="md"
                  className="font-pretendard bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-200"
                >
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  시스템 가이드 보기
                </WaveButton>
                {groups.length > 0 && (
                  <WaveButton
                    onClick={() => setSelectedGroupId(groups[0].id)}
                    variant="primary"
                    size="md"
                    className="font-pretendard bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    첫 번째 그룹 선택
                  </WaveButton>
                )}
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* 왼쪽: 멤버 목록 */}
            <div className="lg:col-span-1">
              <GlassCard variant="medium" className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <Typography.H3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white font-pretendard">
                    👥 구성원 목록
                  </Typography.H3>
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white/60" />
                </div>

                <div className="space-y-3">
                  {members
                    .sort((a, b) => {
                      // 로그인한 사용자를 맨 위로
                      if (a.userId === user?.uid) return -1;
                      if (b.userId === user?.uid) return 1;
                      // 그 외는 이름순 정렬
                      return (a.userName || '').localeCompare(
                        b.userName || '',
                        'ko'
                      );
                    })
                    .map(member => {
                      const stats = memberStats[member.userId];
                      const isSelected = selectedMember === member.userId;

                      return (
                        <button
                          key={member.userId}
                          onClick={() => setSelectedMember(member.userId)}
                          className={`
                           w-full p-4 rounded-xl cursor-pointer transition-all duration-300 text-left font-pretendard
                           ${
                             isSelected
                               ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-2 border-blue-400/50 shadow-lg'
                               : member.userId === user?.uid
                               ? 'bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-2 border-yellow-400/30 hover:bg-yellow-400/20 hover:border-yellow-400/50'
                               : 'bg-white/10 border-2 border-transparent hover:bg-white/20 hover:border-white/30'
                           }
                         `}
                          aria-label={`${member.userName || 'Unknown'} 선택`}
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {renderAvatar(
                                member.userId,
                                member.userName || 'Unknown',
                                'md'
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <Typography.Body className="font-semibold text-white text-sm sm:text-base">
                                    {member.userName || 'Unknown'}
                                  </Typography.Body>
                                  {member.userId === user?.uid && (
                                    <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 text-xs rounded-full font-medium border border-yellow-400/30">
                                      나
                                    </span>
                                  )}
                                </div>
                                <Typography.Caption className="text-white/60 text-xs sm:text-sm">
                                  {member.role || 'member'}
                                </Typography.Caption>
                              </div>
                            </div>
                            <div className="text-right">
                              <Typography.Body className="font-bold text-yellow-400 text-base sm:text-lg">
                                {stats?.totalPoints || 0}
                              </Typography.Body>
                              <Typography.Caption className="text-white/60 text-xs sm:text-sm">
                                포인트
                              </Typography.Caption>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </GlassCard>
            </div>

            {/* 오른쪽: 선택된 멤버 상세 정보 */}
            <div className="lg:col-span-2">
              {selectedMemberData && selectedMemberStats ? (
                <div className="space-y-6 lg:space-y-8">
                  {/* 멤버 통계 카드 */}
                  <GlassCard variant="medium" className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        {renderAvatar(
                          selectedMemberData.userId,
                          selectedMemberData.userName || 'Unknown',
                          'lg'
                        )}
                        <div>
                          <Typography.H3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white font-pretendard">
                            {selectedMemberData.userName || 'Unknown'}
                          </Typography.H3>
                          <Typography.Body className="text-white/80 text-sm sm:text-base font-pretendard">
                            {selectedMemberData.role || 'member'}
                          </Typography.Body>
                        </div>
                      </div>
                      <div className="text-right">
                        <Typography.H2 className="text-3xl font-bold text-white points-pulse">
                          {selectedMemberStats.totalPoints}
                        </Typography.H2>
                        <Typography.Body className="text-gray-400">
                          총 포인트
                        </Typography.Body>
                      </div>
                    </div>

                    {/* 포인트 관리 버튼들 - 오른쪽 정렬 */}
                    <div className="flex justify-end gap-2 mt-6">
                      {/* 포인트 추가/차감 버튼 - 권한이 있는 경우에만 표시 */}
                      {hasPointManagementPermission && (
                        <>
                          <WaveButton
                            onClick={() => {
                              setPointAction('add');
                              setPointAmount(0);
                              setPointReason('');
                              setShowAddPointsModal(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="wave-button wave-button-ghost wave-button-sm w-10 h-10 p-0 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-400/30 hover:border-green-400/50 shadow-lg hover:shadow-xl transition-all duration-200"
                            title="포인트 추가"
                          >
                            <Plus className="w-4 h-4" />
                          </WaveButton>
                          <WaveButton
                            onClick={() => {
                              setPointAction('deduct');
                              setPointAmount(0);
                              setPointReason('');
                              setShowAddPointsModal(true);
                            }}
                            variant="ghost"
                            size="sm"
                            className="wave-button wave-button-ghost wave-button-sm w-10 h-10 p-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-400/30 hover:border-red-400/50 shadow-lg hover:shadow-xl transition-all duration-200"
                            title="포인트 차감"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </WaveButton>
                        </>
                      )}
                    </div>

                    {/* 권한이 없는 경우 안내 메시지 */}
                    {!hasPointManagementPermission && (
                      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Typography.Body className="text-yellow-800 text-sm">
                          💡 포인트 추가/차감은 그룹장과 부그룹장만 가능합니다.
                        </Typography.Body>
                      </div>
                    )}

                    {/* 통계 그리드 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div
                        className="text-center p-3 bg-semantic-success-50 rounded-lg points-glow"
                        role="region"
                        aria-label="획득 포인트"
                      >
                        <Typography.Body className="text-lg font-bold text-semantic-success-600">
                          {selectedMemberStats.earnedPoints}
                        </Typography.Body>
                        <Typography.Caption className="text-semantic-success-500">
                          획득
                        </Typography.Caption>
                      </div>
                      <div
                        className="text-center p-3 bg-semantic-danger-50 rounded-lg points-glow"
                        role="region"
                        aria-label="차감 포인트"
                      >
                        <Typography.Body className="text-lg font-bold text-semantic-danger-600">
                          {selectedMemberStats.deductedPoints}
                        </Typography.Body>
                        <Typography.Caption className="text-semantic-danger-500">
                          차감
                        </Typography.Caption>
                      </div>
                      <div
                        className="text-center p-3 bg-semantic-warning-50 rounded-lg points-glow"
                        role="region"
                        aria-label="보너스 포인트"
                      >
                        <Typography.Body className="text-lg font-bold text-semantic-warning-600">
                          {selectedMemberStats.bonusPoints}
                        </Typography.Body>
                        <Typography.Caption className="text-semantic-warning-500">
                          보너스
                        </Typography.Caption>
                      </div>
                      <div
                        className="text-center p-3 bg-semantic-primary-50 rounded-lg points-glow"
                        role="region"
                        aria-label="순위"
                      >
                        <Typography.Body className="text-lg font-bold text-semantic-primary-600">
                          {selectedMemberStats.rank}/
                          {selectedMemberStats.totalMembers}
                        </Typography.Body>
                        <Typography.Caption className="text-semantic-primary-500">
                          순위
                        </Typography.Caption>
                      </div>
                    </div>
                  </GlassCard>

                  {/* 포인트 내역 */}
                  <GlassCard variant="light" className="p-6 points-glow">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-semantic-warning-500 to-semantic-danger-500 rounded-full flex items-center justify-center">
                          <History className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Typography.H3 className="text-lg font-semibold text-white">
                            미승인 포인트 내역
                          </Typography.H3>
                          <Typography.Caption className="text-white/70">
                            승인 대기 중인 활동 내역
                          </Typography.Caption>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <WaveButton
                          onClick={() => setShowHistoryModal(true)}
                          variant="secondary"
                          size="sm"
                          className="hover:points-glow transition-all duration-200 text-white border-white/30 hover:bg-white/10"
                          aria-label="전체 미승인 포인트 내역 보기"
                        >
                          <History className="w-4 h-4 mr-2" />
                          전체 보기
                        </WaveButton>
                        <WaveButton
                          onClick={async () => {
                            if (selectedGroupId && selectedMember) {
                              setLoading(true);
                              try {
                                await loadUnapprovedPointHistory();
                              } catch {
                                console.error(
                                  '미승인 포인트 내역 새로고침 실패'
                                );
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          variant="secondary"
                          size="sm"
                          disabled={loading}
                          className="hover:points-glow transition-all duration-200 text-white border-white/30 hover:bg-white/10"
                          aria-label="미승인 포인트 내역 새로고침"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              loading ? 'animate-spin' : ''
                            }`}
                          />
                        </WaveButton>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : unapprovedPointHistory.length > 0 ? (
                      <div
                        className="space-y-3"
                        role="list"
                        aria-label="미승인 포인트 내역 목록"
                      >
                        {unapprovedPointHistory.slice(0, 5).map(history => {
                          const isEarned =
                            history.type === 'earned' ||
                            history.type === 'bonus';
                          const isDeducted =
                            history.type === 'deducted' ||
                            history.type === 'penalty';

                          // 날짜 포맷팅 개선
                          const formatDate = (timestamp: any) => {
                            try {
                              const date = new Date(timestamp.seconds * 1000);
                              const now = new Date();
                              const diffTime = Math.abs(
                                now.getTime() - date.getTime()
                              );
                              const diffDays = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24)
                              );

                              if (diffDays === 1) {
                                return '오늘';
                              } else if (diffDays === 2) {
                                return '어제';
                              } else if (diffDays <= 7) {
                                return `${diffDays - 1}일 전`;
                              } else {
                                return date.toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                });
                              }
                            } catch {
                              return '날짜 없음';
                            }
                          };

                          return (
                            <div
                              key={history.id}
                              className={`
                                flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg point-history-card
                                ${
                                  history.taskId
                                    ? 'cursor-pointer hover:ring-2 hover:ring-blue-300'
                                    : 'cursor-default'
                                }
                                ${
                                  isEarned
                                    ? 'point-history-bg-earned'
                                    : isDeducted
                                    ? 'point-history-bg-deducted'
                                    : 'point-history-bg-manual'
                                }
                              `}
                              role="listitem"
                              onClick={
                                history.taskId
                                  ? () => handleTaskCardClick(history.taskId!)
                                  : undefined
                              }
                              onKeyDown={
                                history.taskId
                                  ? e => {
                                      if (e.key === 'Enter') {
                                        handleTaskCardClick(history.taskId!);
                                      }
                                    }
                                  : undefined
                              }
                              tabIndex={history.taskId ? 0 : -1}
                              aria-label={
                                history.taskId
                                  ? `${history.description} 할일 수정하기`
                                  : history.description
                              }
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`
                                    w-10 h-10 rounded-full flex items-center justify-center shadow-sm point-icon-animate
                                    ${
                                      isEarned
                                        ? 'point-earned'
                                        : isDeducted
                                        ? 'point-deducted'
                                        : 'point-manual'
                                    }
                                  `}
                                  aria-label={
                                    isEarned
                                      ? '획득'
                                      : isDeducted
                                      ? '차감'
                                      : '기타'
                                  }
                                >
                                  {isEarned ? (
                                    <Plus className="w-5 h-5" />
                                  ) : isDeducted ? (
                                    <TrendingUp className="w-5 h-5" />
                                  ) : (
                                    <Award className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Typography.Body className="font-semibold text-gray-800 truncate">
                                      {history.description}
                                    </Typography.Body>
                                    {history.taskId && (
                                      <span className="text-blue-500 text-xs font-medium flex items-center gap-1">
                                        <span>할일 수정</span>
                                        <span className="text-blue-400">→</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Typography.Caption className="text-gray-600">
                                      {formatDate(history.createdAt)}
                                    </Typography.Caption>
                                    {history.type === 'bonus' && (
                                      <span className="point-badge point-badge-bonus">
                                        보너스
                                      </span>
                                    )}
                                    <span className="px-2 py-1 bg-semantic-warning-50 text-semantic-warning-700 text-xs rounded-full font-medium">
                                      승인 대기
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Typography.Body
                                    className={`
                                      font-bold text-lg
                                      ${
                                        isEarned
                                          ? 'text-semantic-success-600'
                                          : isDeducted
                                          ? 'text-semantic-danger-600'
                                          : 'text-semantic-primary-600'
                                      }
                                    `}
                                  >
                                    {isEarned ? '+' : isDeducted ? '-' : ''}
                                    {history.amount}
                                  </Typography.Body>
                                  <Typography.Caption className="text-gray-600 font-medium">
                                    포인트
                                  </Typography.Caption>
                                </div>
                                <div className="flex gap-2">
                                  {pointsAnalyzer.isAvailable() && (
                                    <WaveButton
                                      onClick={e => {
                                        e.stopPropagation();
                                        setAnalysisTarget(history);
                                        setShowAnalysisModal(true);
                                      }}
                                      variant="secondary"
                                      size="sm"
                                      className="text-purple-600 border-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-200"
                                      aria-label="AI 분석"
                                      title="Claude AI로 포인트 분석"
                                    >
                                      <Brain className="w-3 h-3" />
                                    </WaveButton>
                                  )}
                                  <WaveButton
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleApprovePointHistory(history.id);
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    disabled={approvingHistoryId === history.id}
                                    className="text-semantic-success-600 border-semantic-success-600 hover:bg-semantic-success-600 hover:text-white transition-all duration-200"
                                    aria-label="포인트 내역 승인"
                                  >
                                    {approvingHistoryId === history.id ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      '승인'
                                    )}
                                  </WaveButton>
                                  <WaveButton
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleRejectPointHistory(history.id);
                                    }}
                                    variant="secondary"
                                    size="sm"
                                    disabled={approvingHistoryId === history.id}
                                    className="text-semantic-danger-600 border-semantic-danger-600 hover:bg-semantic-danger-600 hover:text-white transition-all duration-200"
                                    aria-label="포인트 내역 거부"
                                  >
                                    {approvingHistoryId === history.id ? (
                                      <LoadingSpinner size="sm" />
                                    ) : (
                                      '거부'
                                    )}
                                  </WaveButton>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="text-center py-12"
                        role="status"
                        aria-label="미승인 포인트 내역 없음"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Award className="w-8 h-8 text-gray-400" />
                        </div>
                        <Typography.H4 className="text-white font-semibold mb-2">
                          승인 대기 중인 포인트 내역이 없습니다
                        </Typography.H4>
                        <Typography.Body className="text-white/70">
                          모든 포인트가 승인되었거나 아직 포인트 내역이 없어요!
                        </Typography.Body>
                      </div>
                    )}
                  </GlassCard>

                  {/* 승인된 포인트 내역 */}
                  <GlassCard variant="light" className="p-6 points-glow">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-semantic-success-500 to-semantic-success-600 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <Typography.H3 className="text-lg font-semibold text-white">
                            승인된 포인트 내역
                          </Typography.H3>
                          <Typography.Caption className="text-white/70">
                            승인 완료된 활동 내역
                          </Typography.Caption>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <WaveButton
                          onClick={() => setShowApprovedHistoryModal(true)}
                          variant="secondary"
                          size="sm"
                          className="hover:points-glow transition-all duration-200 text-white border-white/30 hover:bg-white/10"
                          aria-label="전체 승인된 포인트 내역 보기"
                        >
                          <History className="w-4 h-4 mr-2" />
                          전체 보기
                        </WaveButton>
                        <WaveButton
                          onClick={async () => {
                            if (selectedGroupId && selectedMember) {
                              setLoading(true);
                              try {
                                await loadApprovedPointHistory();
                              } catch {
                                console.error(
                                  '승인된 포인트 내역 새로고침 실패'
                                );
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          variant="secondary"
                          size="sm"
                          disabled={loading}
                          className="hover:points-glow transition-all duration-200 text-white border-white/30 hover:bg-white/10"
                          aria-label="승인된 포인트 내역 새로고침"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${
                              loading ? 'animate-spin' : ''
                            }`}
                          />
                        </WaveButton>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : approvedPointHistory.length > 0 ? (
                      <div
                        className="space-y-3"
                        role="list"
                        aria-label="승인된 포인트 내역 목록"
                      >
                        {approvedPointHistory.slice(0, 5).map(history => {
                          const isEarned =
                            history.type === 'earned' ||
                            history.type === 'bonus';
                          const isDeducted =
                            history.type === 'deducted' ||
                            history.type === 'penalty';

                          // 날짜 포맷팅 개선
                          const formatDate = (timestamp: any) => {
                            try {
                              const date = new Date(timestamp.seconds * 1000);
                              const now = new Date();
                              const diffTime = Math.abs(
                                now.getTime() - date.getTime()
                              );
                              const diffDays = Math.ceil(
                                diffTime / (1000 * 60 * 60 * 24)
                              );

                              if (diffDays === 1) {
                                return '오늘';
                              } else if (diffDays === 2) {
                                return '어제';
                              } else if (diffDays <= 7) {
                                return `${diffDays - 1}일 전`;
                              } else {
                                return date.toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                });
                              }
                            } catch {
                              return '날짜 없음';
                            }
                          };

                          return (
                            <div
                              key={history.id}
                              className={`
                                flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg point-history-card
                                ${
                                  isEarned
                                    ? 'point-history-bg-earned'
                                    : isDeducted
                                    ? 'point-history-bg-deducted'
                                    : 'point-history-bg-manual'
                                }
                              `}
                              role="listitem"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`
                                    w-10 h-10 rounded-full flex items-center justify-center shadow-sm point-icon-animate
                                    ${
                                      isEarned
                                        ? 'point-earned'
                                        : isDeducted
                                        ? 'point-deducted'
                                        : 'point-manual'
                                    }
                                  `}
                                  aria-label={
                                    isEarned
                                      ? '획득'
                                      : isDeducted
                                      ? '차감'
                                      : '기타'
                                  }
                                >
                                  {isEarned ? (
                                    <Plus className="w-5 h-5" />
                                  ) : isDeducted ? (
                                    <TrendingUp className="w-5 h-5" />
                                  ) : (
                                    <Award className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Typography.Body className="font-semibold text-gray-800 truncate">
                                    {history.description}
                                  </Typography.Body>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Typography.Caption className="text-gray-600">
                                      {formatDate(history.createdAt)}
                                    </Typography.Caption>
                                    {history.type === 'bonus' && (
                                      <span className="point-badge point-badge-bonus">
                                        보너스
                                      </span>
                                    )}
                                    <span className="px-2 py-1 bg-semantic-success-50 text-semantic-success-700 text-xs rounded-full font-medium">
                                      승인 완료
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Typography.Body
                                  className={`
                                      font-bold text-lg
                                      ${
                                        isEarned
                                          ? 'text-semantic-success-600'
                                          : isDeducted
                                          ? 'text-semantic-danger-600'
                                          : 'text-semantic-primary-600'
                                      }
                                      `}
                                >
                                  {isEarned ? '+' : isDeducted ? '-' : ''}
                                  {history.amount}
                                </Typography.Body>
                                <Typography.Caption className="text-gray-600 font-medium">
                                  포인트
                                </Typography.Caption>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="text-center py-12"
                        role="status"
                        aria-label="승인된 포인트 내역 없음"
                      >
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <Typography.H4 className="text-white font-semibold mb-2">
                          승인된 포인트 내역이 없습니다
                        </Typography.H4>
                        <Typography.Body className="text-white/70">
                          아직 승인된 포인트 내역이 없어요!
                        </Typography.Body>
                      </div>
                    )}
                  </GlassCard>
                </div>
              ) : (
                <GlassCard
                  variant="strong"
                  className="text-center py-16 points-glow"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <Typography.H2 className="text-2xl font-bold text-white mb-4 points-shimmer">
                    구성원을 선택해주세요
                  </Typography.H2>
                  <Typography.Body className="text-white/80 text-lg">
                    포인트를 확인할 구성원을 선택하세요
                  </Typography.Body>
                </GlassCard>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 포인트 추가/차감 모달 */}
      {showAddPointsModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-points-modal-title"
        >
          <GlassCard
            variant="strong"
            className="w-full max-w-md p-6 modal-enter points-glow"
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  pointAction === 'add'
                    ? 'bg-gradient-to-br from-semantic-success-500 to-semantic-success-600'
                    : 'bg-gradient-to-br from-semantic-danger-500 to-semantic-danger-600'
                }`}
              >
                {pointAction === 'add' ? (
                  <Plus className="w-6 h-6 text-white" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <Typography.H3 className="text-lg font-semibold text-white">
                  {pointAction === 'add' ? '포인트 추가' : '포인트 차감'}
                </Typography.H3>
                <Typography.Caption className="text-white/70">
                  {selectedMemberData?.userName || 'Unknown'}님의 포인트를{' '}
                  {pointAction === 'add' ? '추가' : '차감'}합니다
                </Typography.Caption>
              </div>
            </div>

            <div className="space-y-4">
              {/* 포인트 수량 입력 */}
              <div>
                <label
                  htmlFor="pointAmount"
                  className="block text-sm font-medium text-white mb-2"
                >
                  포인트 수량
                </label>
                <input
                  id="pointAmount"
                  type="number"
                  min="1"
                  value={pointAmount}
                  onChange={e => setPointAmount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="포인트 수량을 입력하세요"
                />
              </div>

              {/* 사유 입력 */}
              <div>
                <label
                  htmlFor="pointReason"
                  className="block text-sm font-medium text-white mb-2"
                >
                  사유
                </label>
                <textarea
                  id="pointReason"
                  value={pointReason}
                  onChange={e => setPointReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  placeholder={`포인트 ${
                    pointAction === 'add' ? '추가' : '차감'
                  } 사유를 입력하세요`}
                />
              </div>

              {/* 현재 포인트 정보 */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">현재 포인트</span>
                  <span className="text-white font-semibold">
                    {selectedMemberStats?.totalPoints || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/70 text-sm">
                    {pointAction === 'add' ? '추가 후' : '차감 후'}
                  </span>
                  <span
                    className={`font-semibold ${
                      pointAction === 'add'
                        ? 'text-semantic-success-400'
                        : 'text-semantic-danger-400'
                    }`}
                  >
                    {(selectedMemberStats?.totalPoints || 0) +
                      (pointAction === 'add' ? pointAmount : -pointAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <WaveButton
                onClick={() => setShowAddPointsModal(false)}
                variant="secondary"
                className="flex-1"
                aria-label="포인트 추가/차감 취소"
              >
                취소
              </WaveButton>
              <WaveButton
                onClick={() => {
                  if (pointAmount > 0 && pointReason.trim()) {
                    if (pointAction === 'add') {
                      handleAddPoints(pointAmount, pointReason);
                    } else {
                      handleDeductPoints(pointAmount, pointReason);
                    }
                  }
                }}
                disabled={pointAmount <= 0 || !pointReason.trim()}
                className={`flex-1 ${
                  pointAction === 'add'
                    ? 'bg-gradient-to-r from-semantic-success-500 to-semantic-success-600 hover:from-semantic-success-600 hover:to-semantic-success-700'
                    : 'bg-gradient-to-r from-semantic-danger-500 to-semantic-danger-600 hover:from-semantic-danger-600 hover:to-semantic-danger-700'
                } text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200`}
                aria-label={`포인트 ${
                  pointAction === 'add' ? '추가' : '차감'
                } 확인`}
              >
                {pointAction === 'add' ? '추가' : '차감'}
              </WaveButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 포인트 설정 모달 */}
      {showPointSettingsModal && selectedGroupId && (
        <PointSettingsModal
          isOpen={showPointSettingsModal}
          onClose={() => setShowPointSettingsModal(false)}
          groupId={selectedGroupId}
        />
      )}

      {/* 포인트 내역 모달 */}
      {showHistoryModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
        >
          <GlassCard
            variant="strong"
            className="w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto modal-enter points-glow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-semantic-success-500 to-semantic-success-600 rounded-full flex items-center justify-center">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Typography.H3 className="text-xl font-semibold text-white">
                    전체 미승인 포인트 내역
                  </Typography.H3>
                  <Typography.Caption className="text-white/70">
                    모든 포인트 활동 기록
                  </Typography.Caption>
                </div>
              </div>
              <WaveButton
                onClick={() => setShowHistoryModal(false)}
                variant="secondary"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10"
                aria-label="포인트 내역 모달 닫기"
              >
                닫기
              </WaveButton>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : unapprovedPointHistory.length > 0 ? (
              <div
                className="space-y-4"
                role="list"
                aria-label="전체 포인트 내역 목록"
              >
                {unapprovedPointHistory.map(history => {
                  const isEarned =
                    history.type === 'earned' || history.type === 'bonus';
                  const isDeducted =
                    history.type === 'deducted' || history.type === 'penalty';

                  // 날짜 포맷팅 개선
                  const formatDate = (timestamp: any) => {
                    try {
                      const date = new Date(timestamp.seconds * 1000);
                      return date.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    } catch {
                      return '날짜 없음';
                    }
                  };

                  return (
                    <div
                      key={history.id}
                      className={`
                        flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-lg point-history-card
                        ${
                          isEarned
                            ? 'point-history-bg-earned'
                            : isDeducted
                            ? 'point-history-bg-deducted'
                            : 'point-history-bg-manual'
                        }
                      `}
                      role="listitem"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center shadow-sm point-icon-animate
                            ${
                              isEarned
                                ? 'point-earned'
                                : isDeducted
                                ? 'point-deducted'
                                : 'point-manual'
                            }
                          `}
                          aria-label={
                            isEarned ? '획득' : isDeducted ? '차감' : '기타'
                          }
                        >
                          {isEarned ? (
                            <Plus className="w-6 h-6" />
                          ) : isDeducted ? (
                            <TrendingUp className="w-6 h-6" />
                          ) : (
                            <Award className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Typography.Body className="font-semibold text-gray-900 text-lg">
                            {history.description}
                          </Typography.Body>
                          <div className="flex items-center gap-3 mt-2">
                            <Typography.Caption className="text-gray-500">
                              {formatDate(history.createdAt)}
                            </Typography.Caption>
                            {history.type === 'bonus' && (
                              <span className="point-badge point-badge-bonus">
                                보너스
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Typography.Body
                          className={`
                            font-bold text-xl
                            ${
                              isEarned
                                ? 'point-text-earned'
                                : isDeducted
                                ? 'point-text-deducted'
                                : 'point-text-manual'
                            }
                          `}
                        >
                          {isEarned ? '+' : isDeducted ? '-' : ''}
                          {history.amount}
                        </Typography.Body>
                        <Typography.Caption className="text-gray-400 font-medium">
                          포인트
                        </Typography.Caption>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="text-center py-16"
                role="status"
                aria-label="포인트 내역 없음"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200/50 to-gray-300/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="w-10 h-10 text-gray-400" />
                </div>
                <Typography.H4 className="text-white font-semibold mb-3">
                  아직 포인트 내역이 없습니다
                </Typography.H4>
                <Typography.Body className="text-white/70">
                  할일을 완료하면 포인트를 획득할 수 있어요!
                </Typography.Body>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* 포인트 시스템 설명 모달 */}
      <PointsExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
      />

      {/* 할일 상세 모달 */}
      <TaskDetailModal
        task={selectedTask}
        group={groups.find(g => g.id === selectedTask?.groupId) || null}
        isOpen={showTaskDetailModal}
        onClose={() => {
          setShowTaskDetailModal(false);
          setSelectedTask(null);
        }}
      />

      {/* 승인된 포인트 내역 모달 */}
      {showApprovedHistoryModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-enter"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approved-history-modal-title"
        >
          <GlassCard
            variant="strong"
            className="w-full max-w-4xl p-6 max-h-[80vh] overflow-y-auto modal-enter points-glow"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-semantic-success-500 to-semantic-success-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Typography.H3 className="text-xl font-semibold text-white">
                    전체 승인된 포인트 내역
                  </Typography.H3>
                  <Typography.Caption className="text-white/70">
                    모든 승인 완료된 포인트 활동 기록
                  </Typography.Caption>
                </div>
              </div>
              <WaveButton
                onClick={() => setShowApprovedHistoryModal(false)}
                variant="secondary"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10"
                aria-label="승인된 포인트 내역 모달 닫기"
              >
                닫기
              </WaveButton>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : approvedPointHistory.length > 0 ? (
              <div
                className="space-y-4"
                role="list"
                aria-label="전체 승인된 포인트 내역 목록"
              >
                {approvedPointHistory.map(history => {
                  const isEarned =
                    history.type === 'earned' || history.type === 'bonus';
                  const isDeducted =
                    history.type === 'deducted' || history.type === 'penalty';

                  // 날짜 포맷팅 개선
                  const formatDate = (timestamp: any) => {
                    try {
                      const date = new Date(timestamp.seconds * 1000);
                      return date.toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    } catch {
                      return '날짜 없음';
                    }
                  };

                  return (
                    <div
                      key={history.id}
                      className={`
                        flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-lg point-history-card
                        ${
                          isEarned
                            ? 'point-history-bg-earned'
                            : isDeducted
                            ? 'point-history-bg-deducted'
                            : 'point-history-bg-manual'
                        }
                      `}
                      role="listitem"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`
                            w-12 h-12 rounded-full flex items-center justify-center shadow-sm point-icon-animate
                            ${
                              isEarned
                                ? 'point-earned'
                                : isDeducted
                                ? 'point-deducted'
                                : 'point-manual'
                            }
                          `}
                          aria-label={
                            isEarned ? '획득' : isDeducted ? '차감' : '기타'
                          }
                        >
                          {isEarned ? (
                            <Plus className="w-6 h-6" />
                          ) : isDeducted ? (
                            <TrendingUp className="w-6 h-6" />
                          ) : (
                            <Award className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Typography.Body className="font-semibold text-gray-900 text-lg">
                            {history.description}
                          </Typography.Body>
                          <div className="flex items-center gap-3 mt-2">
                            <Typography.Caption className="text-gray-500">
                              {formatDate(history.createdAt)}
                            </Typography.Caption>
                            {history.type === 'bonus' && (
                              <span className="point-badge point-badge-bonus">
                                보너스
                              </span>
                            )}
                            <span className="px-3 py-1 bg-semantic-success-50 text-semantic-success-700 text-sm rounded-full font-medium">
                              승인 완료
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Typography.Body
                          className={`
                            font-bold text-xl
                            ${
                              isEarned
                                ? 'point-text-earned'
                                : isDeducted
                                ? 'point-text-deducted'
                                : 'point-text-manual'
                            }
                          `}
                        >
                          {isEarned ? '+' : isDeducted ? '-' : ''}
                          {history.amount}
                        </Typography.Body>
                        <Typography.Caption className="text-gray-400 font-medium">
                          포인트
                        </Typography.Caption>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="text-center py-16"
                role="status"
                aria-label="승인된 포인트 내역 없음"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200/50 to-gray-300/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-gray-400" />
                </div>
                <Typography.H4 className="text-white font-semibold mb-3">
                  승인된 포인트 내역이 없습니다
                </Typography.H4>
                <Typography.Body className="text-white/70">
                  아직 승인된 포인트 내역이 없어요!
                </Typography.Body>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* AI 포인트 분석 모달 */}
      {showAnalysisModal && analysisTarget && selectedMemberStats && (
        <PointAnalysisModal
          isOpen={showAnalysisModal}
          onClose={() => {
            setShowAnalysisModal(false);
            setAnalysisTarget(null);
          }}
          pointHistory={analysisTarget}
          userStats={selectedMemberStats}
          allHistories={unapprovedPointHistory}
          onApprove={handleAnalysisApprove}
          onReject={() => {
            handleRejectPointHistory(analysisTarget.id);
            setShowAnalysisModal(false);
            setAnalysisTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default PointsManagement;
