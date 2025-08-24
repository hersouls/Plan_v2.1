import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
// 전역 배경은 App 루트에서만 렌더합니다
import AdjustPointsModal from '../components/points/AdjustPointsModal';
import ApprovedHistoryCard from '../components/points/ApprovedHistoryCard';
import HistoryModal from '../components/points/HistoryModal';
import MemberList from '../components/points/MemberList';
import { PointSettingsModal } from '../components/points/PointSettingsModal';
import { PointsExplanationModal } from '../components/points/PointsExplanationModal';
import PointsHeader from '../components/points/PointsHeader';
import StatsSummary from '../components/points/StatsSummary';
import UnapprovedHistoryCard from '../components/points/UnapprovedHistoryCard';
import { GlassCard } from '../components/ui/GlassCard';
import { AvatarWrapper } from '../components/ui/avatar';
import { Typography } from '../components/ui/typography';
import { useToast } from '../components/ui/useToast';
import { useAuth } from '../contexts/AuthContext';
import { useFavoriteGroups } from '../hooks/useFavoriteGroups';
import { useGroup, useUserGroups } from '../hooks/useGroup';
import { useMemberStats } from '../hooks/useMemberStats';
import { usePointHistory } from '../hooks/usePointHistory';
import { pointsService } from '../lib/points';
import { logger } from '../lib/utils';

function PointsManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { groups = [] } = useUserGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { members = [] } = useGroup({
    groupId: selectedGroupId || undefined,
    loadMembers: true,
    loadStats: false,
  });

  const { sortedGroups, isFavorite, toggleFavorite } =
    useFavoriteGroups(groups);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  useEffect(() => {
    if (sortedGroups.length > 0 && !selectedGroupId)
      setSelectedGroupId(sortedGroups[0].id);
  }, [sortedGroups, selectedGroupId]);
  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      const me = members.find(m => m.userId === user?.uid);
      setSelectedMemberId(me?.userId || members[0].userId);
    }
  }, [members, selectedMemberId, user?.uid]);

  const { statsByUserId, refresh: refreshStats } = useMemberStats({
    groupId: selectedGroupId || undefined,
  });
  const { approved, unapproved, loading, refreshApproved, refreshUnapproved } =
    usePointHistory({
      groupId: selectedGroupId || undefined,
      userId: selectedMemberId || undefined,
    });

  const [showGuide, setShowGuide] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUnapprovedModal, setShowUnapprovedModal] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState<{
    open: boolean;
    action: 'add' | 'deduct';
  }>({ open: false, action: 'add' });
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    logger.debug('ui', 'Point settings modal state changed', {
      open: showSettings,
    });
  }, [showSettings]);

  const selectedMember = useMemo(
    () => members.find(m => m.userId === selectedMemberId) || null,
    [members, selectedMemberId]
  );
  const selectedStats = selectedMember
    ? statsByUserId[selectedMember.userId]
    : undefined;
  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;
  const currentMember = members.find(m => m.userId === user?.uid) || null;
  const canManagePoints = !!(
    selectedGroup &&
    user &&
    (selectedGroup.ownerId === user.uid ||
      currentMember?.role === 'vice_owner' ||
      currentMember?.role === 'admin')
  );
  const canOpenSettings = !!(
    selectedGroup &&
    user &&
    (selectedGroup.ownerId === user.uid ||
      currentMember?.role === 'vice_owner' ||
      currentMember?.role === 'admin')
  );

  const handleTaskCardClick = useCallback(
    (taskId: string) => {
      try {
        navigate(`/tasks/${taskId}/edit`);
      } catch (e) {
        logger.error('nav', 'Failed to navigate task edit', { taskId }, e);
        toast.error(
          '할일 수정 페이지로 이동할 수 없습니다. 다시 시도해주세요.'
        );
      }
    },
    [navigate, toast]
  );

  const handleApprove = useCallback(
    async (historyId: string) => {
      if (!user || !canManagePoints) return;
      setApprovingId(historyId);
      try {
        await pointsService.approvePointHistory(historyId, user.uid);
        await refreshUnapproved();
        await refreshApproved();
        await refreshStats();
        toast.success('포인트 내역을 승인했습니다.');
      } catch (e) {
        logger.error('points', 'Approve history failed', { historyId }, e);
        toast.error('포인트 내역 승인에 실패했습니다.');
      } finally {
        setApprovingId(null);
      }
    },
    [
      user,
      canManagePoints,
      refreshUnapproved,
      refreshApproved,
      refreshStats,
      toast,
    ]
  );

  const handleReject = useCallback(
    async (historyId: string) => {
      if (!user || !canManagePoints) return;
      setApprovingId(historyId);
      try {
        await pointsService.rejectPointHistory(historyId, user.uid);
        await refreshUnapproved();
        await refreshApproved();
        await refreshStats();
        toast.info('포인트 내역을 거부했습니다.');
      } catch (e) {
        logger.error('points', 'Reject history failed', { historyId }, e);
        toast.error('포인트 내역 거부에 실패했습니다.');
      } finally {
        setApprovingId(null);
      }
    },
    [
      user,
      canManagePoints,
      refreshUnapproved,
      refreshApproved,
      refreshStats,
      toast,
    ]
  );

  const handleAdjustConfirm = useCallback(
    async (amount: number, reason: string) => {
      if (!selectedGroupId || !selectedMemberId || !canManagePoints) return;
      try {
        const finalAmount =
          showAdjustModal.action === 'add' ? amount : -Math.abs(amount);
        await pointsService.manuallyAdjustPoints(
          selectedMemberId,
          selectedGroupId,
          finalAmount,
          reason
        );
        await refreshStats();
        await refreshUnapproved();
        await refreshApproved();
        toast.success(
          showAdjustModal.action === 'add'
            ? '포인트가 추가되었습니다.'
            : '포인트가 차감되었습니다.'
        );
      } catch (e) {
        logger.error(
          'points',
          'Manual adjust failed',
          { selectedGroupId, selectedMemberId },
          e
        );
        toast.error('포인트 조정에 실패했습니다.');
      } finally {
        setShowAdjustModal({ open: false, action: 'add' });
      }
    },
    [
      selectedGroupId,
      selectedMemberId,
      canManagePoints,
      showAdjustModal.action,
      refreshStats,
      refreshUnapproved,
      refreshApproved,
      toast,
    ]
  );

  if (!user) return <LoadingSpinner />;

  const renderAvatar = (
    _memberId: string,
    displayName: string,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => (
    <AvatarWrapper
      src={null}
      alt={`${displayName} 아바타`}
      fallback={displayName?.charAt(0) || 'U'}
      size={size}
    />
  );

  return (
    <div className="min-h-screen">
      <div
        className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 xl:py-16 fixed-header-spacing"
        style={{
          paddingTop: 'var(--header-height, 120px)',
          minHeight: 'calc(100vh - var(--header-height, 120px))',
        }}
      >
        <PointsHeader
          sortedGroups={sortedGroups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          canOpenSettings={canOpenSettings}
          onOpenSettings={() => setShowSettings(true)}
          onOpenGuide={() => setShowGuide(true)}
        />

        {!selectedGroupId ? (
          <GlassCard
            variant="medium"
            className="p-8 sm:p-12 lg:p-16 max-w-2xl mx-auto text-center"
          >
            <Typography.H2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 font-pretendard">
              그룹을 선택해주세요
            </Typography.H2>
            <Typography.Body className="text-white/80 mb-6 text-base sm:text-lg font-pretendard">
              포인트를 관리할 가족 그룹을 선택하세요
            </Typography.Body>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-1">
              <MemberList
                members={members}
                currentUserId={user.uid}
                selectedMemberId={selectedMemberId}
                onSelect={setSelectedMemberId}
                statsByUserId={statsByUserId}
                renderAvatar={renderAvatar}
              />
            </div>

            <div className="lg:col-span-2">
              {selectedMember && selectedStats ? (
                <div className="space-y-6 lg:space-y-8">
                  <StatsSummary
                    member={selectedMember}
                    stats={selectedStats}
                    hasPermission={canManagePoints}
                    onOpenAdd={() =>
                      setShowAdjustModal({ open: true, action: 'add' })
                    }
                    onOpenDeduct={() =>
                      setShowAdjustModal({ open: true, action: 'deduct' })
                    }
                    renderAvatar={renderAvatar}
                  />
                  <UnapprovedHistoryCard
                    histories={unapproved}
                    loading={loading.unapproved}
                    onOpenAll={() => setShowUnapprovedModal(true)}
                    onRefresh={refreshUnapproved}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    approvingId={approvingId}
                    onTaskClick={handleTaskCardClick}
                  />
                  <ApprovedHistoryCard
                    histories={approved}
                    loading={loading.approved}
                    onOpenAll={() => setShowApprovedModal(true)}
                    onRefresh={refreshApproved}
                  />
                </div>
              ) : (
                <GlassCard
                  variant="strong"
                  className="text-center py-16 points-glow"
                >
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

      {showAdjustModal.open && selectedMember && (
        <AdjustPointsModal
          isOpen={showAdjustModal.open}
          onClose={() => setShowAdjustModal({ open: false, action: 'add' })}
          action={showAdjustModal.action}
          onConfirm={handleAdjustConfirm}
          currentPoints={selectedStats?.totalPoints || 0}
          memberName={selectedMember.userName || 'Unknown'}
        />
      )}

      {showSettings && selectedGroupId && (
        <PointSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          groupId={selectedGroupId}
        />
      )}

      <HistoryModal
        isOpen={showUnapprovedModal}
        onClose={() => setShowUnapprovedModal(false)}
        title="전체 미승인 포인트 내역"
        histories={unapproved}
      />
      <HistoryModal
        isOpen={showApprovedModal}
        onClose={() => setShowApprovedModal(false)}
        title="전체 승인된 포인트 내역"
        histories={approved}
        approved
      />

      <PointsExplanationModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        groupId={selectedGroupId}
      />
    </div>
  );
}

export default PointsManagement;
