import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Gift,
  Shield,
  Star,
  Target,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Typography } from '../ui/typography';

interface PointsExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PointsExplanationModal({
  isOpen,
  onClose,
}: PointsExplanationModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      // 이벤트 리스너를 window에 추가하여 더 안정적으로 작동
      window.addEventListener('keydown', handleEscape, { capture: true });
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape, { capture: true });
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 모달 외부 클릭 시 닫기
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 backdrop-enter"
      onClick={handleBackdropClick}
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-modal-title"
      aria-describedby="points-modal-description"
    >
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto modal-enter">
        <GlassCard
          variant="strong"
          className="p-8 relative points-glow bg-white/5 backdrop-blur-xl"
        >
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <Typography.H1
              id="points-modal-title"
              className="text-3xl font-bold text-white mb-2 drop-shadow-sm"
            >
              🏆 포인트 시스템 가이드
            </Typography.H1>
            <Typography.Body
              id="points-modal-description"
              className="text-white/95 text-lg"
            >
              가족 구성원들의 동기부여를 위한 포인트 시스템을 알아보세요
            </Typography.Body>
          </div>

          {/* 포인트 가치 정보 */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded-xl p-6 border-2 border-green-400/50 shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-4">
                <DollarSign className="w-8 h-8 text-green-300" />
                <Typography.H2 className="text-2xl font-bold text-white drop-shadow-sm">
                  포인트 가치
                </Typography.H2>
              </div>
              <div className="text-center">
                <Typography.H3 className="text-4xl font-bold text-green-300 mb-2 drop-shadow-sm">
                  1 포인트 = 100원
                </Typography.H3>
                <Typography.Body className="text-white/95 text-lg">
                  획득한 포인트는 실제 가치로 환산되어 보상으로 사용됩니다
                </Typography.Body>
              </div>
            </div>
          </div>

          {/* 포인트 승인 권한 정보 */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl p-6 border-2 border-purple-400/50 shadow-lg">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-purple-300" />
                <Typography.H2 className="text-2xl font-bold text-white drop-shadow-sm">
                  포인트 승인 권한
                </Typography.H2>
              </div>
              <div className="text-center mb-4">
                <Typography.Body className="text-white/95 text-lg mb-4">
                  포인트는 승인 후에 실제로 지급됩니다
                </Typography.Body>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shadow-md">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                      그룹장
                    </Typography.H3>
                    <Typography.Body className="text-white/95 text-sm">
                      모든 포인트 승인 권한
                    </Typography.Body>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg">
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center shadow-md">
                    <UserCheck className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                      부그룹장
                    </Typography.H3>
                    <Typography.Body className="text-white/95 text-sm">
                      포인트 승인 권한
                    </Typography.Body>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <Typography.Body className="text-white/95 text-sm text-center">
                  <strong>중요:</strong> 일반 멤버는 포인트를 승인할 수 없으며,
                  그룹장과 부그룹장의 승인을 받아야 포인트가 실제로 지급됩니다.
                </Typography.Body>
              </div>
            </div>
          </div>

          {/* 1. 포인트 획득 방법 */}
          <div className="mb-8">
            <Typography.H2 className="text-2xl font-semibold text-white mb-6 text-center drop-shadow-sm">
              💡 포인트 획득 방법
            </Typography.H2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-white/15 rounded-xl backdrop-blur-sm border-l-4 border-green-500 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shadow-md">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                    할일 완료
                  </Typography.H3>
                </div>
                <Typography.Body className="text-white/95 text-sm mb-3 leading-relaxed">
                  할일을 완료하면 자동으로 포인트가 지급됩니다 (승인 대기)
                </Typography.Body>
                <Typography.Caption className="text-green-300 font-semibold text-lg drop-shadow-sm">
                  +5~20 포인트
                </Typography.Caption>
              </div>

              <div className="p-6 bg-white/15 rounded-xl backdrop-blur-sm border-l-4 border-blue-500 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-md">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                    연속 달성
                  </Typography.H3>
                </div>
                <Typography.Body className="text-white/95 text-sm mb-3 leading-relaxed">
                  연속으로 할일을 완료하면 보너스 포인트를 받습니다 (승인 대기)
                </Typography.Body>
                <Typography.Caption className="text-blue-300 font-semibold text-lg drop-shadow-sm">
                  +10~50 포인트
                </Typography.Caption>
              </div>

              <div className="p-6 bg-white/15 rounded-xl backdrop-blur-sm border-l-4 border-purple-500 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center shadow-md">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                    특별 행동
                  </Typography.H3>
                </div>
                <Typography.Body className="text-white/95 text-sm mb-3 leading-relaxed">
                  가족을 돕거나 특별한 행동을 하면 추가 포인트를 받을 수
                  있습니다 (승인 대기)
                </Typography.Body>
                <Typography.Caption className="text-purple-300 font-semibold text-lg drop-shadow-sm">
                  +15~30 포인트
                </Typography.Caption>
              </div>

              <div className="p-6 bg-white/15 rounded-xl backdrop-blur-sm border-l-4 border-yellow-500 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shadow-md">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                  <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                    주간 목표
                  </Typography.H3>
                </div>
                <Typography.Body className="text-white/95 text-sm mb-3 leading-relaxed">
                  주간 목표를 달성하면 큰 보상을 받을 수 있습니다 (승인 대기)
                </Typography.Body>
                <Typography.Caption className="text-yellow-300 font-semibold text-lg drop-shadow-sm">
                  +50~100 포인트
                </Typography.Caption>
              </div>

              <div className="p-6 bg-white/15 rounded-xl backdrop-blur-sm border-l-4 border-red-500 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shadow-md">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                  <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                    시간 관리
                  </Typography.H3>
                </div>
                <Typography.Body className="text-white/95 text-sm mb-3 leading-relaxed">
                  정해진 시간 내에 할일을 완료하면 추가 포인트를 받습니다 (승인
                  대기)
                </Typography.Body>
                <Typography.Caption className="text-red-300 font-semibold text-lg drop-shadow-sm">
                  +5~15 포인트
                </Typography.Caption>
              </div>

              <div className="p-6 bg-white/15 rounded-xl backdrop-blur-sm border-l-4 border-indigo-500 hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shadow-md">
                    <Gift className="w-6 h-6 text-indigo-600" />
                  </div>
                  <Typography.H3 className="font-semibold text-white drop-shadow-sm">
                    가족 도움
                  </Typography.H3>
                </div>
                <Typography.Body className="text-white/95 text-sm mb-3 leading-relaxed">
                  다른 가족 구성원의 할일을 도와주면 포인트를 받습니다 (승인
                  대기)
                </Typography.Body>
                <Typography.Caption className="text-indigo-300 font-semibold text-lg drop-shadow-sm">
                  +10~25 포인트
                </Typography.Caption>
              </div>
            </div>
          </div>

          {/* 2. 포인트 획득 예시 */}
          <div className="mb-8">
            <Typography.H2 className="text-2xl font-semibold text-white mb-6 text-center drop-shadow-sm">
              📝 포인트 획득 예시
            </Typography.H2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm shadow-lg">
                <Typography.H3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 drop-shadow-sm">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  일상 할일 완료
                </Typography.H3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">
                      아침 운동하기
                    </span>
                    <span className="text-green-300 font-semibold drop-shadow-sm">
                      +10 포인트 (1,000원)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">방 정리하기</span>
                    <span className="text-green-300 font-semibold drop-shadow-sm">
                      +15 포인트 (1,500원)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">
                      숙제 완료하기
                    </span>
                    <span className="text-green-300 font-semibold drop-shadow-sm">
                      +20 포인트 (2,000원)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">
                      연속 3일 달성 보너스
                    </span>
                    <span className="text-blue-300 font-semibold drop-shadow-sm">
                      +30 포인트 (3,000원)
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-500/30 rounded-lg border border-green-400/50 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold drop-shadow-sm">
                      총 획득
                    </span>
                    <span className="text-green-300 font-bold text-lg drop-shadow-sm">
                      75 포인트 (7,500원)
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <Typography.Body className="text-yellow-300 text-xs text-center">
                    ⏳ 승인 대기 중 - 그룹장/부그룹장 승인 필요
                  </Typography.Body>
                </div>
              </div>

              <div className="bg-white/15 rounded-xl p-6 backdrop-blur-sm shadow-lg">
                <Typography.H3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 drop-shadow-sm">
                  <Star className="w-5 h-5 text-yellow-300" />
                  특별 행동 보상
                </Typography.H3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">
                      동생 숙제 도와주기
                    </span>
                    <span className="text-purple-300 font-semibold drop-shadow-sm">
                      +25 포인트 (2,500원)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">
                      부모님 요리 도와주기
                    </span>
                    <span className="text-purple-300 font-semibold drop-shadow-sm">
                      +20 포인트 (2,000원)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">
                      주간 목표 달성
                    </span>
                    <span className="text-yellow-300 font-semibold drop-shadow-sm">
                      +100 포인트 (10,000원)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg shadow-sm">
                    <span className="text-white font-medium">
                      시간 내 완료 보너스
                    </span>
                    <span className="text-red-300 font-semibold drop-shadow-sm">
                      +10 포인트 (1,000원)
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-500/30 rounded-lg border border-yellow-400/50 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold drop-shadow-sm">
                      총 획득
                    </span>
                    <span className="text-yellow-300 font-bold text-lg drop-shadow-sm">
                      155 포인트 (15,500원)
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                  <Typography.Body className="text-yellow-300 text-xs text-center">
                    ⏳ 승인 대기 중 - 그룹장/부그룹장 승인 필요
                  </Typography.Body>
                </div>
              </div>
            </div>
          </div>

          {/* 포인트 활용 방법 */}
          <div className="mb-8">
            <Typography.H2 className="text-2xl font-semibold text-white mb-6 text-center drop-shadow-sm">
              🎁 포인트 활용 방법
            </Typography.H2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white/15 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Gift className="w-6 h-6 text-green-600" />
                </div>
                <Typography.H3 className="text-lg font-semibold text-white mb-2 drop-shadow-sm">
                  보상 교환
                </Typography.H3>
                <Typography.Body className="text-white/95 text-sm leading-relaxed">
                  승인된 포인트를 실제 보상으로 교환하여 동기부여를 높입니다
                </Typography.Body>
              </div>

              <div className="text-center p-6 bg-white/15 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <Typography.H3 className="text-lg font-semibold text-white mb-2 drop-shadow-sm">
                  성장 추적
                </Typography.H3>
                <Typography.Body className="text-white/95 text-sm leading-relaxed">
                  승인된 포인트 내역과 순위를 통해 개인과 가족의 성장을
                  확인합니다
                </Typography.Body>
              </div>

              <div className="text-center p-6 bg-white/15 rounded-xl backdrop-blur-sm hover:bg-white/20 transition-all duration-300 shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <Typography.H3 className="text-lg font-semibold text-white mb-2 drop-shadow-sm">
                  협력 촉진
                </Typography.H3>
                <Typography.Body className="text-white/95 text-sm leading-relaxed">
                  가족 구성원들이 함께 목표를 달성하고 서로를 격려하는 분위기를
                  만듭니다
                </Typography.Body>
              </div>
            </div>
          </div>

          {/* 하단 닫기 옵션 */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white transition-colors duration-200 text-sm underline font-medium"
                aria-label="나중에 다시 보기"
              >
                나중에 다시 보기
              </button>
              <span className="text-white/70 text-sm">•</span>
              <span className="text-white/70 text-sm">ESC 키로 닫기</span>
              <span className="text-white/70 text-sm">•</span>
              <span className="text-white/70 text-sm">외부 클릭으로 닫기</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
