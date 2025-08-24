import { HelpCircle, Settings, Star } from 'lucide-react';
import React from 'react';
import type { FamilyGroup } from '../../types/group';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';

interface PointsHeaderProps {
  sortedGroups: FamilyGroup[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  isFavorite: (groupId?: string | null) => boolean;
  onToggleFavorite: (groupId: string) => void;
  canOpenSettings: boolean;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  currentUserId?: string;
  membersCount?: number;
}

export const PointsHeader: React.FC<PointsHeaderProps> = ({
  sortedGroups,
  selectedGroupId,
  onSelectGroup,
  isFavorite,
  onToggleFavorite,
  canOpenSettings,
  onOpenSettings,
  onOpenGuide,
}) => {
  return (
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

        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          {sortedGroups.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="points-group-select" className="sr-only">
                그룹 선택
              </label>
              <select
                id="points-group-select"
                value={selectedGroupId || ''}
                onChange={e => onSelectGroup(e.target.value)}
                className="px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base"
                aria-label="그룹 선택"
              >
                {sortedGroups.map(g => (
                  <option
                    key={g.id}
                    value={g.id}
                    className="bg-gray-800 text-white"
                  >
                    {g.name}
                  </option>
                ))}
              </select>
              {selectedGroupId && (
                <WaveButton
                  onClick={() => onToggleFavorite(selectedGroupId)}
                  variant="ghost"
                  size="sm"
                  className="font-pretendard"
                  title={
                    isFavorite(selectedGroupId)
                      ? '즐겨찾기 해제'
                      : '즐겨찾기 추가'
                  }
                  aria-label={
                    isFavorite(selectedGroupId)
                      ? '즐겨찾기 해제'
                      : '즐겨찾기 추가'
                  }
                >
                  <Star
                    size={16}
                    className={`${
                      isFavorite(selectedGroupId)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-white/60'
                    }`}
                  />
                </WaveButton>
              )}
            </div>
          )}

          <WaveButton
            onClick={onOpenGuide}
            variant="ghost"
            size="sm"
            className="font-pretendard"
            title="포인트 시스템 가이드"
            aria-label="포인트 시스템 가이드"
          >
            <HelpCircle size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          </WaveButton>

          {canOpenSettings && (
            <WaveButton
              onClick={onOpenSettings}
              variant="ghost"
              size="sm"
              className="font-pretendard"
              title="포인트 설정 (그룹장/부그룹장 전용)"
              aria-label="포인트 설정 (그룹장/부그룹장 전용)"
            >
              <Settings size={16} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            </WaveButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointsHeader;
