import { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Activity,
  ChevronRight,
  RefreshCw,
  X,
  Users,
  Award,
  Calendar
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';
import { Typography } from '../ui/typography';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { 
  statisticsAnalyzer, 
  StatisticsInsight,
  PerformancePrediction,
  TeamAnalysis,
  ActivityPattern
} from '../../lib/statisticsAnalyzer';
import { Task } from '../../types/task';
import { GroupMember } from '../../types/group';
import { PointStats } from '../../lib/points';

interface StatisticsInsightsProps {
  tasks: Task[];
  members: GroupMember[];
  pointStats: Record<string, PointStats>;
  period?: string;
  userId?: string;
  onRefresh?: () => void;
}

export function StatisticsInsights({
  tasks,
  members,
  pointStats,
  period = '30days',
  userId,
  onRefresh
}: StatisticsInsightsProps) {
  const [insights, setInsights] = useState<StatisticsInsight[]>([]);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [teamAnalysis, setTeamAnalysis] = useState<TeamAnalysis | null>(null);
  const [activityPattern, setActivityPattern] = useState<ActivityPattern | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<StatisticsInsight | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'prediction' | 'team' | 'pattern'>('insights');

  useEffect(() => {
    if (statisticsAnalyzer.isAvailable()) {
      loadInsights();
    }
  }, [tasks, members, pointStats, period]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // 기본 인사이트 로드
      const insightsData = await statisticsAnalyzer.analyzeStatistics(
        tasks,
        members,
        pointStats,
        period
      );
      setInsights(insightsData);

      // 성과 예측
      const predictionData = await statisticsAnalyzer.predictPerformance(
        tasks,
        tasks, // 실제로는 히스토리컬 데이터 사용
        '1month'
      );
      setPrediction(predictionData);

      // 팀 분석
      const teamData = await statisticsAnalyzer.analyzeTeamPerformance(
        members,
        tasks,
        pointStats
      );
      setTeamAnalysis(teamData);

      // 개인 활동 패턴 (userId가 제공된 경우)
      if (userId) {
        const patternData = await statisticsAnalyzer.detectActivityPatterns(
          tasks,
          userId
        );
        setActivityPattern(patternData);
      }
    } catch (error) {
      console.error('인사이트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="w-5 h-5" />;
      case 'pattern':
        return <Activity className="w-5 h-5" />;
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5" />;
      case 'prediction':
        return <Target className="w-5 h-5" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'from-blue-500 to-cyan-600';
      case 'pattern':
        return 'from-purple-500 to-indigo-600';
      case 'anomaly':
        return 'from-yellow-500 to-orange-600';
      case 'prediction':
        return 'from-green-500 to-emerald-600';
      case 'recommendation':
        return 'from-pink-500 to-rose-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  if (!statisticsAnalyzer.isAvailable()) {
    return (
      <GlassCard variant="light" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <Typography.H4 className="text-white">AI 인사이트</Typography.H4>
        </div>
        <Typography.Body className="text-white/70">
          Claude AI 설정이 필요합니다. API 키를 설정하면 상세한 통계 분석을 받아보실 수 있습니다.
        </Typography.Body>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <Typography.H3 className="text-xl font-semibold text-white">
                AI 통계 분석
              </Typography.H3>
              <Typography.Caption className="text-white/70">
                Claude AI가 데이터를 분석하여 인사이트를 제공합니다
              </Typography.Caption>
            </div>
          </div>
          <WaveButton
            onClick={() => {
              loadInsights();
              onRefresh?.();
            }}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </WaveButton>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'insights'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            인사이트
          </button>
          <button
            onClick={() => setActiveTab('prediction')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'prediction'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            성과 예측
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'team'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            팀 분석
          </button>
          {activityPattern && (
            <button
              onClick={() => setActiveTab('pattern')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'pattern'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              활동 패턴
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner />
            <Typography.Body className="text-white/70 mt-4">
              AI가 데이터를 분석하고 있습니다...
            </Typography.Body>
          </div>
        ) : (
          <>
            {/* 인사이트 탭 */}
            {activeTab === 'insights' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${getInsightColor(insight.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Typography.Body className="font-semibold text-white">
                            {insight.title}
                          </Typography.Body>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(insight.priority)}`}>
                            {insight.priority === 'high' ? '높음' : 
                             insight.priority === 'medium' ? '중간' : '낮음'}
                          </span>
                        </div>
                        <Typography.Caption className="text-white/70 line-clamp-2">
                          {insight.description}
                        </Typography.Caption>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-white/20 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-blue-400 to-purple-600 h-1 rounded-full"
                                style={{ width: `${insight.confidence}%` }}
                              />
                            </div>
                            <Typography.Caption className="text-white/50">
                              {insight.confidence}% 신뢰도
                            </Typography.Caption>
                          </div>
                          {insight.actionable && (
                            <ChevronRight className="w-4 h-4 text-white/50" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 성과 예측 탭 */}
            {activeTab === 'prediction' && prediction && (
              <div className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-green-400" />
                    <Typography.H4 className="text-white">
                      {prediction.period} 성과 예측
                    </Typography.H4>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Typography.Caption className="text-white/70">예상 완료 할일</Typography.Caption>
                      <Typography.H3 className="text-2xl font-bold text-green-400">
                        {prediction.predictedCompletion}개
                      </Typography.H3>
                    </div>
                    <div>
                      <Typography.Caption className="text-white/70">예상 획득 포인트</Typography.Caption>
                      <Typography.H3 className="text-2xl font-bold text-yellow-400">
                        {prediction.predictedPoints}점
                      </Typography.H3>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Typography.Caption className="text-white/70">예측 신뢰도</Typography.Caption>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-emerald-600 h-2 rounded-full"
                          style={{ width: `${prediction.confidence}%` }}
                        />
                      </div>
                      <Typography.Caption className="text-white">
                        {prediction.confidence}%
                      </Typography.Caption>
                    </div>
                  </div>
                  {prediction.factors.length > 0 && (
                    <div className="mt-4">
                      <Typography.Caption className="text-white/70 mb-2">영향 요인</Typography.Caption>
                      <ul className="space-y-1">
                        {prediction.factors.map((factor, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <Typography.Caption className="text-white/90">{factor}</Typography.Caption>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 팀 분석 탭 */}
            {activeTab === 'team' && teamAnalysis && (
              <div className="space-y-4">
                {/* 전체 점수 */}
                <div className="text-center p-6 bg-gradient-to-br from-purple-500/10 to-indigo-600/10 rounded-lg">
                  <Typography.Caption className="text-white/70">팀 성과 점수</Typography.Caption>
                  <Typography.H1 className="text-5xl font-bold text-white mt-2">
                    {teamAnalysis.overallScore}
                  </Typography.H1>
                  <Typography.Caption className="text-white/50">/ 100</Typography.Caption>
                </div>

                {/* SWOT 분석 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <Typography.Body className="font-semibold text-green-400 mb-2">강점</Typography.Body>
                    <ul className="space-y-1">
                      {teamAnalysis.strengths.map((item, index) => (
                        <li key={index} className="text-white/80 text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                    <Typography.Body className="font-semibold text-red-400 mb-2">약점</Typography.Body>
                    <ul className="space-y-1">
                      {teamAnalysis.weaknesses.map((item, index) => (
                        <li key={index} className="text-white/80 text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <Typography.Body className="font-semibold text-blue-400 mb-2">기회</Typography.Body>
                    <ul className="space-y-1">
                      {teamAnalysis.opportunities.map((item, index) => (
                        <li key={index} className="text-white/80 text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                    <Typography.Body className="font-semibold text-yellow-400 mb-2">위협</Typography.Body>
                    <ul className="space-y-1">
                      {teamAnalysis.threats.map((item, index) => (
                        <li key={index} className="text-white/80 text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 우수 성과자 */}
                {teamAnalysis.topPerformers.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <Typography.Body className="font-semibold text-white">우수 성과자</Typography.Body>
                    </div>
                    <div className="space-y-2">
                      {teamAnalysis.topPerformers.map((performer, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <div>
                            <Typography.Body className="text-white">{performer.userName}</Typography.Body>
                            <Typography.Caption className="text-white/60">{performer.reason}</Typography.Caption>
                          </div>
                          <Typography.Body className="text-yellow-400 font-bold">
                            {performer.score}점
                          </Typography.Body>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 활동 패턴 탭 */}
            {activeTab === 'pattern' && activityPattern && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <Typography.Caption className="text-white/70">최고 활동 시간</Typography.Caption>
                    <Typography.Body className="text-white font-semibold mt-1">
                      {activityPattern.peakHours.map(h => `${h}시`).join(', ')}
                    </Typography.Body>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <Typography.Caption className="text-white/70">최고 활동 요일</Typography.Caption>
                    <Typography.Body className="text-white font-semibold mt-1">
                      {activityPattern.peakDays.join(', ')}
                    </Typography.Body>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <Typography.Caption className="text-white/70">평균 완료 시간</Typography.Caption>
                    <Typography.Body className="text-white font-semibold mt-1">
                      {Math.round(activityPattern.avgCompletionTime)}분
                    </Typography.Body>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <Typography.Caption className="text-white/70">선호 카테고리</Typography.Caption>
                    <Typography.Body className="text-white font-semibold mt-1">
                      {activityPattern.preferredCategories.slice(0, 2).join(', ')}
                    </Typography.Body>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <Typography.Caption className="text-white/70">협업 점수</Typography.Caption>
                    <Typography.Body className="text-white font-semibold mt-1">
                      {activityPattern.collaborationScore}점
                    </Typography.Body>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <Typography.Caption className="text-white/70">일관성 점수</Typography.Caption>
                    <Typography.Body className="text-white font-semibold mt-1">
                      {activityPattern.consistencyScore}점
                    </Typography.Body>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* 상세 인사이트 모달 */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <GlassCard variant="strong" className="w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${getInsightColor(selectedInsight.type)} rounded-full flex items-center justify-center`}>
                  {getInsightIcon(selectedInsight.type)}
                </div>
                <Typography.H3 className="text-xl font-semibold text-white">
                  {selectedInsight.title}
                </Typography.H3>
              </div>
              <WaveButton
                onClick={() => setSelectedInsight(null)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </WaveButton>
            </div>

            <Typography.Body className="text-white/90 mb-4">
              {selectedInsight.description}
            </Typography.Body>

            {selectedInsight.actions && selectedInsight.actions.length > 0 && (
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <Typography.Body className="font-semibold text-blue-400 mb-2">
                  권장 조치사항
                </Typography.Body>
                <ul className="space-y-2">
                  {selectedInsight.actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5" />
                      <Typography.Caption className="text-white/80">{action}</Typography.Caption>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-xs rounded-full border ${getPriorityColor(selectedInsight.priority)}`}>
                  우선순위: {selectedInsight.priority === 'high' ? '높음' : 
                            selectedInsight.priority === 'medium' ? '중간' : '낮음'}
                </span>
                {selectedInsight.actionable && (
                  <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    실행 가능
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Typography.Caption className="text-white/50">신뢰도</Typography.Caption>
                <div className="w-20 bg-white/20 rounded-full h-1">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-purple-600 h-1 rounded-full"
                    style={{ width: `${selectedInsight.confidence}%` }}
                  />
                </div>
                <Typography.Caption className="text-white/70">
                  {selectedInsight.confidence}%
                </Typography.Caption>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default StatisticsInsights;