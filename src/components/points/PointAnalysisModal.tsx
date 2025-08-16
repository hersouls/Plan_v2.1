import { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, TrendingUp, Brain } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { PointHistory, PointStats } from '../../lib/points';
import { pointsAnalyzer, PointAnalysis } from '../../lib/pointsAnalyzer';

interface PointAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointHistory: PointHistory;
  userStats: PointStats;
  allHistories: PointHistory[];
  onApprove?: (adjustedAmount?: number) => void;
  onReject?: () => void;
}

export function PointAnalysisModal({
  isOpen,
  onClose,
  pointHistory,
  userStats,
  allHistories,
  onApprove,
  onReject
}: PointAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<PointAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [useAdjustedAmount, setUseAdjustedAmount] = useState(false);

  useEffect(() => {
    if (isOpen && pointHistory) {
      analyzePoint();
    }
  }, [isOpen, pointHistory]);

  const analyzePoint = async () => {
    setLoading(true);
    try {
      const result = await pointsAnalyzer.analyzePointHistory(
        pointHistory,
        userStats,
        allHistories
      );
      setAnalysis(result);
    } catch (error) {
      console.error('포인트 분석 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getValidityIcon = (validity: string) => {
    switch (validity) {
      case 'valid':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'suspicious':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'invalid':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getValidityColor = (validity: string) => {
    switch (validity) {
      case 'valid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'suspicious':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'invalid':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleApprove = () => {
    if (onApprove) {
      const amount = useAdjustedAmount && analysis?.adjustedAmount 
        ? analysis.adjustedAmount 
        : undefined;
      onApprove(amount);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <GlassCard variant="strong" className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <Typography.H3 className="text-xl font-semibold text-white">
                AI 포인트 분석
              </Typography.H3>
              <Typography.Caption className="text-white/70">
                Claude AI가 포인트 적절성을 분석합니다
              </Typography.Caption>
            </div>
          </div>
          <WaveButton
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </WaveButton>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner />
            <Typography.Body className="text-white/70 mt-4">
              AI가 포인트를 분석하고 있습니다...
            </Typography.Body>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* 포인트 정보 */}
            <div className="p-4 bg-white/10 rounded-lg">
              <Typography.H4 className="text-white mb-3">포인트 내역</Typography.H4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Typography.Caption className="text-white/70">유형</Typography.Caption>
                  <Typography.Body className="text-white">{pointHistory.type}</Typography.Body>
                </div>
                <div className="flex justify-between">
                  <Typography.Caption className="text-white/70">금액</Typography.Caption>
                  <Typography.Body className="text-white font-semibold">
                    {pointHistory.amount}점
                  </Typography.Body>
                </div>
                <div className="flex justify-between">
                  <Typography.Caption className="text-white/70">사유</Typography.Caption>
                  <Typography.Body className="text-white">{pointHistory.reason}</Typography.Body>
                </div>
                {pointHistory.description && (
                  <div className="flex justify-between">
                    <Typography.Caption className="text-white/70">설명</Typography.Caption>
                    <Typography.Body className="text-white text-right max-w-xs">
                      {pointHistory.description}
                    </Typography.Body>
                  </div>
                )}
              </div>
            </div>

            {/* 분석 결과 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Typography.H4 className="text-white">분석 결과</Typography.H4>
                <div className="flex items-center gap-2">
                  {getValidityIcon(analysis.validity)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getValidityColor(analysis.validity)}`}>
                    {analysis.validity === 'valid' ? '적절함' : 
                     analysis.validity === 'suspicious' ? '의심스러움' : '부적절함'}
                  </span>
                </div>
              </div>

              {/* 점수 표시 */}
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Typography.Caption className="text-white/70">적절성 점수</Typography.Caption>
                  <Typography.H3 className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}점
                  </Typography.H3>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.score}%` }}
                  />
                </div>
              </div>

              {/* 분석 이유 */}
              <div className="p-4 bg-white/5 rounded-lg">
                <Typography.Caption className="text-white/70 mb-2">분석 이유</Typography.Caption>
                <Typography.Body className="text-white">
                  {analysis.reasoning}
                </Typography.Body>
              </div>

              {/* 권장사항 */}
              {analysis.recommendations.length > 0 && (
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <Typography.Caption className="text-blue-400">권장사항</Typography.Caption>
                  </div>
                  <ul className="space-y-1">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <Typography.Body className="text-white/90">{rec}</Typography.Body>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 조정 금액 제안 */}
              {analysis.adjustedAmount && analysis.adjustedAmount !== pointHistory.amount && (
                <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <Typography.Caption className="text-yellow-400">
                      권장 조정 금액
                    </Typography.Caption>
                    <div className="flex items-center gap-2">
                      <Typography.Body className="text-white/70 line-through">
                        {pointHistory.amount}점
                      </Typography.Body>
                      <Typography.Body className="text-yellow-400 font-semibold">
                        → {analysis.adjustedAmount}점
                      </Typography.Body>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAdjustedAmount}
                      onChange={(e) => setUseAdjustedAmount(e.target.checked)}
                      className="w-4 h-4 text-yellow-400 bg-white/10 border-yellow-400/50 rounded focus:ring-yellow-400"
                    />
                    <Typography.Caption className="text-white/70">
                      조정된 금액으로 승인
                    </Typography.Caption>
                  </label>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            {(onApprove || onReject) && (
              <div className="flex gap-3 pt-4 border-t border-white/10">
                {onReject && (
                  <WaveButton
                    onClick={() => {
                      onReject();
                      onClose();
                    }}
                    variant="secondary"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    거부
                  </WaveButton>
                )}
                {onApprove && (
                  <WaveButton
                    onClick={handleApprove}
                    variant="primary"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {useAdjustedAmount && analysis.adjustedAmount ? 
                      `${analysis.adjustedAmount}점으로 승인` : 
                      '승인'}
                  </WaveButton>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Typography.Body className="text-white/70">
              분석 결과를 불러올 수 없습니다.
            </Typography.Body>
          </div>
        )}

        {/* AI 사용 안내 */}
        {pointsAnalyzer.isAvailable() && (
          <div className="mt-6 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-400 mt-0.5" />
              <Typography.Caption className="text-purple-300">
                이 분석은 Claude AI를 사용하여 포인트의 적절성을 평가합니다.
                AI의 제안은 참고용이며, 최종 결정은 관리자가 내려주세요.
              </Typography.Caption>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default PointAnalysisModal;