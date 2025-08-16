import { anthropic, claudeConfig } from './claude';
import { PointStats } from './points';
import { Task } from '../types/task';
import { GroupMember } from '../types/group';

export interface StatisticsInsight {
  type: 'trend' | 'pattern' | 'anomaly' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  actions?: string[];
  data?: any;
}

export interface PerformancePrediction {
  period: string;
  predictedCompletion: number;
  predictedPoints: number;
  confidence: number;
  factors: string[];
}

export interface TeamAnalysis {
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  topPerformers: Array<{
    userId: string;
    userName: string;
    score: number;
    reason: string;
  }>;
  needsSupport: Array<{
    userId: string;
    userName: string;
    issues: string[];
    recommendations: string[];
  }>;
}

export interface ActivityPattern {
  peakHours: number[];
  peakDays: string[];
  avgCompletionTime: number;
  preferredCategories: string[];
  collaborationScore: number;
  consistencyScore: number;
}

export class StatisticsAnalyzer {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = claudeConfig.enabled && !!anthropic;
  }

  async analyzeStatistics(
    tasks: Task[],
    members: GroupMember[],
    pointStats: Record<string, PointStats>,
    period: string = '30days'
  ): Promise<StatisticsInsight[]> {
    if (!this.isEnabled || !anthropic) {
      return this.getDefaultInsights();
    }

    try {
      // 데이터 준비
      const completedTasks = tasks.filter(t => t.status === 'completed');
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

      // 멤버별 통계
      const memberStats = members.map(member => ({
        name: member.userName,
        completedTasks: completedTasks.filter(t => t.assignedTo === member.userId).length,
        points: pointStats[member.userId]?.totalPoints || 0,
        streak: pointStats[member.userId]?.currentStreak || 0
      }));

      // 카테고리별 분석
      const categoryStats = this.getCategoryDistribution(tasks);
      
      // 시간대별 분석
      const timePatterns = this.getTimePatterns(completedTasks);

      const prompt = `통계 데이터를 분석하고 인사이트를 제공해주세요.

기간: ${period}
전체 할일: ${totalTasks}개
완료된 할일: ${completedTasks.length}개
완료율: ${completionRate.toFixed(1)}%

멤버별 통계:
${JSON.stringify(memberStats, null, 2)}

카테고리별 분포:
${JSON.stringify(categoryStats, null, 2)}

시간대별 패턴:
${JSON.stringify(timePatterns, null, 2)}

다음 형식의 JSON 배열로 5-8개의 인사이트를 제공해주세요:
[
  {
    "type": "trend" | "pattern" | "anomaly" | "prediction" | "recommendation",
    "title": "인사이트 제목",
    "description": "상세 설명",
    "confidence": 0-100 사이의 신뢰도,
    "priority": "low" | "medium" | "high",
    "actionable": true/false,
    "actions": ["구체적인 행동 제안 1", "제안 2"] (선택적)
  }
]

인사이트 생성 시 고려사항:
1. 긍정적인 트렌드와 개선이 필요한 부분 균형있게 포함
2. 구체적이고 실행 가능한 제안 포함
3. 팀워크 향상 방안 제시
4. 효율성 개선 기회 식별
5. 미래 예측 포함`;

      const response = await anthropic.messages.create({
        model: claudeConfig.model,
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: prompt
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const insights = JSON.parse(content.text);
          return Array.isArray(insights) ? 
            insights.map(i => this.validateInsight(i)) : 
            this.getDefaultInsights();
        } catch (parseError) {
          console.error('Failed to parse insights:', parseError);
          return this.getDefaultInsights();
        }
      }
    } catch (error) {
      console.error('Statistics analysis error:', error);
    }

    return this.getDefaultInsights();
  }

  async predictPerformance(
    tasks: Task[],
    historicalData: Task[],
    targetPeriod: '1week' | '1month' | '3months'
  ): Promise<PerformancePrediction> {
    if (!this.isEnabled || !anthropic) {
      return this.getDefaultPrediction(targetPeriod);
    }

    try {
      const recentTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return taskDate > thirtyDaysAgo;
      });

      const completionTrend = this.calculateCompletionTrend(recentTasks);
      const avgPointsPerTask = this.calculateAvgPoints(recentTasks);

      const prompt = `할일 완료 데이터를 기반으로 미래 성과를 예측해주세요.

최근 30일 데이터:
- 총 할일: ${recentTasks.length}개
- 완료된 할일: ${recentTasks.filter(t => t.status === 'completed').length}개
- 완료율 트렌드: ${completionTrend}
- 평균 포인트/할일: ${avgPointsPerTask}

예측 기간: ${targetPeriod}

다음 형식의 JSON으로 응답해주세요:
{
  "period": "${targetPeriod}",
  "predictedCompletion": 예상 완료 할일 수,
  "predictedPoints": 예상 획득 포인트,
  "confidence": 0-100 사이의 신뢰도,
  "factors": ["예측에 영향을 준 요인 1", "요인 2", ...]
}

예측 시 고려사항:
1. 최근 트렌드 반영
2. 계절적 요인 고려
3. 팀 성장률 반영
4. 현실적인 예측`;

      const response = await anthropic.messages.create({
        model: claudeConfig.model,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: prompt
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          return this.getDefaultPrediction(targetPeriod);
        }
      }
    } catch (error) {
      console.error('Performance prediction error:', error);
    }

    return this.getDefaultPrediction(targetPeriod);
  }

  async analyzeTeamPerformance(
    members: GroupMember[],
    tasks: Task[],
    pointStats: Record<string, PointStats>
  ): Promise<TeamAnalysis> {
    if (!this.isEnabled || !anthropic) {
      return this.getDefaultTeamAnalysis();
    }

    try {
      const memberPerformance = members.map(member => {
        const memberTasks = tasks.filter(t => t.assignedTo === member.userId);
        const completedTasks = memberTasks.filter(t => t.status === 'completed');
        const stats = pointStats[member.userId];
        
        return {
          id: member.userId,
          name: member.userName,
          role: member.role,
          tasksAssigned: memberTasks.length,
          tasksCompleted: completedTasks.length,
          completionRate: memberTasks.length > 0 ? 
            (completedTasks.length / memberTasks.length) * 100 : 0,
          points: stats?.totalPoints || 0,
          streak: stats?.currentStreak || 0,
          avgCompletionTime: this.calculateAvgCompletionTime(completedTasks)
        };
      });

      const prompt = `팀 성과를 분석하고 개선 방안을 제시해주세요.

팀 구성원 성과:
${JSON.stringify(memberPerformance, null, 2)}

다음 형식의 JSON으로 응답해주세요:
{
  "overallScore": 0-100 사이의 전체 팀 점수,
  "strengths": ["팀의 강점 1", "강점 2", ...],
  "weaknesses": ["개선이 필요한 부분 1", "부분 2", ...],
  "opportunities": ["성장 기회 1", "기회 2", ...],
  "threats": ["주의해야 할 위험 요소 1", "요소 2", ...],
  "topPerformers": [
    {
      "userId": "사용자 ID",
      "userName": "사용자 이름",
      "score": 0-100,
      "reason": "선정 이유"
    }
  ],
  "needsSupport": [
    {
      "userId": "사용자 ID",
      "userName": "사용자 이름",
      "issues": ["문제점 1", "문제점 2"],
      "recommendations": ["개선 제안 1", "제안 2"]
    }
  ]
}

분석 시 고려사항:
1. 개인별 성과 균형
2. 팀워크 수준
3. 성장 잠재력
4. 동기부여 요소`;

      const response = await anthropic.messages.create({
        model: claudeConfig.model,
        max_tokens: 1536,
        messages: [{
          role: 'user',
          content: prompt
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          return this.getDefaultTeamAnalysis();
        }
      }
    } catch (error) {
      console.error('Team analysis error:', error);
    }

    return this.getDefaultTeamAnalysis();
  }

  async detectActivityPatterns(
    tasks: Task[],
    userId: string
  ): Promise<ActivityPattern> {
    if (!this.isEnabled || !anthropic) {
      return this.getDefaultActivityPattern();
    }

    try {
      const userTasks = tasks.filter(t => t.assignedTo === userId);
      const completedTasks = userTasks.filter(t => t.status === 'completed');

      // 시간대별 분석
      const hourDistribution = this.getHourDistribution(completedTasks);
      // 요일별 분석
      const dayDistribution = this.getDayDistribution(completedTasks);
      // 카테고리 선호도
      const categoryPreference = this.getCategoryPreference(completedTasks);

      const prompt = `사용자의 활동 패턴을 분석해주세요.

할일 데이터:
- 총 할일: ${userTasks.length}개
- 완료된 할일: ${completedTasks.length}개
- 시간대별 분포: ${JSON.stringify(hourDistribution)}
- 요일별 분포: ${JSON.stringify(dayDistribution)}
- 카테고리 선호도: ${JSON.stringify(categoryPreference)}

다음 형식의 JSON으로 응답해주세요:
{
  "peakHours": [가장 활발한 시간대 배열 (0-23)],
  "peakDays": ["가장 활발한 요일 배열"],
  "avgCompletionTime": 평균 완료 시간 (분),
  "preferredCategories": ["선호 카테고리 배열"],
  "collaborationScore": 0-100 사이의 협업 점수,
  "consistencyScore": 0-100 사이의 일관성 점수
}`;

      const response = await anthropic.messages.create({
        model: claudeConfig.model,
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: prompt
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          return this.getDefaultActivityPattern();
        }
      }
    } catch (error) {
      console.error('Activity pattern detection error:', error);
    }

    return this.getDefaultActivityPattern();
  }

  private validateInsight(insight: any): StatisticsInsight {
    return {
      type: ['trend', 'pattern', 'anomaly', 'prediction', 'recommendation'].includes(insight.type) ? 
        insight.type : 'recommendation',
      title: typeof insight.title === 'string' ? insight.title : '인사이트',
      description: typeof insight.description === 'string' ? 
        insight.description : '분석 결과를 확인해주세요.',
      confidence: typeof insight.confidence === 'number' ? 
        Math.max(0, Math.min(100, insight.confidence)) : 75,
      priority: ['low', 'medium', 'high'].includes(insight.priority) ? 
        insight.priority : 'medium',
      actionable: typeof insight.actionable === 'boolean' ? 
        insight.actionable : false,
      actions: Array.isArray(insight.actions) ? insight.actions : undefined,
      data: insight.data
    };
  }

  private getDefaultInsights(): StatisticsInsight[] {
    return [
      {
        type: 'recommendation',
        title: 'AI 분석 사용 가능',
        description: 'Claude AI를 활용한 상세 분석이 가능합니다.',
        confidence: 100,
        priority: 'low',
        actionable: false
      }
    ];
  }

  private getDefaultPrediction(period: string): PerformancePrediction {
    return {
      period,
      predictedCompletion: 0,
      predictedPoints: 0,
      confidence: 0,
      factors: ['AI 분석을 사용할 수 없습니다']
    };
  }

  private getDefaultTeamAnalysis(): TeamAnalysis {
    return {
      overallScore: 0,
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      topPerformers: [],
      needsSupport: []
    };
  }

  private getDefaultActivityPattern(): ActivityPattern {
    return {
      peakHours: [],
      peakDays: [],
      avgCompletionTime: 0,
      preferredCategories: [],
      collaborationScore: 0,
      consistencyScore: 0
    };
  }

  // 유틸리티 메서드들
  private getCategoryDistribution(tasks: Task[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    tasks.forEach(task => {
      const category = task.category || 'uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  private getTimePatterns(tasks: Task[]): Record<number, number> {
    const patterns: Record<number, number> = {};
    tasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        patterns[hour] = (patterns[hour] || 0) + 1;
      }
    });
    return patterns;
  }

  private calculateCompletionTrend(tasks: Task[]): string {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    
    if (rate >= 80) return '매우 좋음';
    if (rate >= 60) return '좋음';
    if (rate >= 40) return '보통';
    if (rate >= 20) return '개선 필요';
    return '주의 필요';
  }

  private calculateAvgPoints(tasks: Task[]): number {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return 0;
    // 기본 포인트 10점으로 계산
    return 10;
  }

  private calculateAvgCompletionTime(tasks: Task[]): number {
    const timeDiffs = tasks
      .filter(t => t.createdAt && t.completedAt)
      .map(t => {
        const created = new Date(t.createdAt).getTime();
        const completed = new Date(t.completedAt!).getTime();
        return (completed - created) / (1000 * 60); // 분 단위
      });
    
    if (timeDiffs.length === 0) return 0;
    return timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
  }

  private getHourDistribution(tasks: Task[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    tasks.forEach(task => {
      if (task.completedAt) {
        const hour = new Date(task.completedAt).getHours();
        distribution[hour] = (distribution[hour] || 0) + 1;
      }
    });
    return distribution;
  }

  private getDayDistribution(tasks: Task[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    
    tasks.forEach(task => {
      if (task.completedAt) {
        const dayIndex = new Date(task.completedAt).getDay();
        const dayName = days[dayIndex];
        distribution[dayName] = (distribution[dayName] || 0) + 1;
      }
    });
    return distribution;
  }

  private getCategoryPreference(tasks: Task[]): Record<string, number> {
    return this.getCategoryDistribution(tasks);
  }

  isAvailable(): boolean {
    return this.isEnabled;
  }
}

export const statisticsAnalyzer = new StatisticsAnalyzer();