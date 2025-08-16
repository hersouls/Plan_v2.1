import { anthropic, claudeConfig } from './claude';
import { PointHistory, PointStats } from './points';

export interface PointAnalysis {
  score: number; // 0-100
  validity: 'valid' | 'suspicious' | 'invalid';
  reasoning: string;
  recommendations: string[];
  adjustedAmount?: number;
}

export interface UserPointPattern {
  userId: string;
  patterns: {
    averageDaily: number;
    peakHours: number[];
    taskCategories: string[];
    consistencyScore: number;
  };
}

export class PointsAnalyzer {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = claudeConfig.enabled && !!anthropic;
  }

  async analyzePointHistory(
    history: PointHistory,
    userStats: PointStats,
    allHistories: PointHistory[]
  ): Promise<PointAnalysis> {
    if (!this.isEnabled || !anthropic) {
      return this.getDefaultAnalysis();
    }

    try {
      const recentHistories = allHistories
        .slice(0, 10)
        .map(h => ({
          type: h.type,
          amount: h.amount,
          reason: h.reason,
          description: h.description,
          createdAt: h.createdAt.toDate().toISOString()
        }));

      const prompt = `포인트 내역을 분석하고 적절성을 평가해주세요.

현재 포인트 내역:
- 유형: ${history.type}
- 금액: ${history.amount}
- 사유: ${history.reason}
- 설명: ${history.description || '없음'}
- 할일 제목: ${history.taskTitle || '없음'}

사용자 통계:
- 총 포인트: ${userStats.totalPoints}
- 획득 포인트: ${userStats.earnedPoints}
- 차감 포인트: ${userStats.deductedPoints}
- 보너스 포인트: ${userStats.bonusPoints}
- 완료율: ${userStats.completionRate}%

최근 포인트 내역 (10개):
${JSON.stringify(recentHistories, null, 2)}

다음 형식의 JSON으로 응답해주세요:
{
  "score": 0-100 사이의 적절성 점수,
  "validity": "valid" | "suspicious" | "invalid",
  "reasoning": "평가 이유 설명 (한국어)",
  "recommendations": ["개선 제안 1", "개선 제안 2"],
  "adjustedAmount": 조정이 필요한 경우 제안 금액
}

평가 기준:
1. 포인트 금액이 활동에 적절한가?
2. 최근 패턴과 일치하는가?
3. 사유가 명확하고 타당한가?
4. 과도한 포인트 획득/차감은 아닌가?`;

      const response = await anthropic.messages.create({
        model: claudeConfig.model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const analysis = JSON.parse(content.text);
          return this.validateAnalysis(analysis);
        } catch (parseError) {
          console.error('Failed to parse analysis:', parseError);
          return this.getDefaultAnalysis();
        }
      }
    } catch (error) {
      console.error('Point analysis error:', error);
    }

    return this.getDefaultAnalysis();
  }

  async analyzeBulkPoints(
    histories: PointHistory[],
    groupId: string
  ): Promise<Map<string, PointAnalysis>> {
    const analysisMap = new Map<string, PointAnalysis>();

    if (!this.isEnabled || !anthropic) {
      histories.forEach(h => {
        analysisMap.set(h.id, this.getDefaultAnalysis());
      });
      return analysisMap;
    }

    try {
      const prompt = `다음 포인트 내역들을 일괄 분석하고 각각의 적절성을 평가해주세요.

포인트 내역들:
${histories.map((h, i) => `
${i + 1}. ID: ${h.id}
   유형: ${h.type}
   금액: ${h.amount}
   사유: ${h.reason}
   설명: ${h.description || '없음'}
`).join('\n')}

각 내역에 대해 다음 형식의 JSON 배열로 응답해주세요:
[
  {
    "id": "내역 ID",
    "score": 0-100 사이의 적절성 점수,
    "validity": "valid" | "suspicious" | "invalid",
    "reasoning": "평가 이유",
    "recommendations": ["제안사항"],
    "adjustedAmount": 조정 필요시 제안 금액
  }
]`;

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
          const analyses = JSON.parse(content.text);
          if (Array.isArray(analyses)) {
            analyses.forEach(analysis => {
              if (analysis.id) {
                analysisMap.set(analysis.id, this.validateAnalysis(analysis));
              }
            });
          }
        } catch (parseError) {
          console.error('Failed to parse bulk analysis:', parseError);
        }
      }
    } catch (error) {
      console.error('Bulk point analysis error:', error);
    }

    // Fill missing analyses with defaults
    histories.forEach(h => {
      if (!analysisMap.has(h.id)) {
        analysisMap.set(h.id, this.getDefaultAnalysis());
      }
    });

    return analysisMap;
  }

  async detectAnomalies(
    userId: string,
    histories: PointHistory[]
  ): Promise<string[]> {
    if (!this.isEnabled || !anthropic || histories.length === 0) {
      return [];
    }

    try {
      const prompt = `사용자의 포인트 획득 패턴을 분석하고 이상 징후를 감지해주세요.

포인트 내역 (최근 ${histories.length}개):
${histories.map(h => `
- ${h.createdAt.toDate().toLocaleDateString()} ${h.type}: ${h.amount}점 (${h.reason})
`).join('')}

다음과 같은 이상 패턴이 있다면 JSON 배열로 알려주세요:
1. 비정상적으로 빈번한 포인트 획득
2. 갑작스러운 대량 포인트 획득
3. 반복적인 동일 활동
4. 의심스러운 시간대 활동
5. 기타 이상 패턴

응답 형식: ["이상 징후 1", "이상 징후 2", ...]
이상 징후가 없으면 빈 배열 []을 반환하세요.`;

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
          const anomalies = JSON.parse(content.text);
          return Array.isArray(anomalies) ? anomalies : [];
        } catch {
          return [];
        }
      }
    } catch (error) {
      console.error('Anomaly detection error:', error);
    }

    return [];
  }

  async suggestPointAdjustment(
    taskTitle: string,
    taskDescription: string,
    taskCategory: string,
    completionTime?: number
  ): Promise<number> {
    if (!this.isEnabled || !anthropic) {
      return 10; // Default points
    }

    try {
      const prompt = `할일 완료에 대한 적절한 포인트를 제안해주세요.

할일 정보:
- 제목: ${taskTitle}
- 설명: ${taskDescription || '없음'}
- 카테고리: ${taskCategory}
- 완료 시간: ${completionTime ? `${completionTime}분` : '알 수 없음'}

난이도, 중요도, 소요 시간을 고려하여 1-100 사이의 포인트를 제안해주세요.
숫자만 응답하세요.`;

      const response = await anthropic.messages.create({
        model: claudeConfig.model,
        max_tokens: 50,
        messages: [{
          role: 'user',
          content: prompt
        }],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const points = parseInt(content.text.trim());
        return isNaN(points) ? 10 : Math.max(1, Math.min(100, points));
      }
    } catch (error) {
      console.error('Point suggestion error:', error);
    }

    return 10;
  }

  private validateAnalysis(analysis: any): PointAnalysis {
    return {
      score: typeof analysis.score === 'number' ? 
        Math.max(0, Math.min(100, analysis.score)) : 50,
      validity: ['valid', 'suspicious', 'invalid'].includes(analysis.validity) ? 
        analysis.validity : 'valid',
      reasoning: typeof analysis.reasoning === 'string' ? 
        analysis.reasoning : '분석 결과를 확인할 수 없습니다.',
      recommendations: Array.isArray(analysis.recommendations) ? 
        analysis.recommendations : [],
      adjustedAmount: typeof analysis.adjustedAmount === 'number' ? 
        analysis.adjustedAmount : undefined
    };
  }

  private getDefaultAnalysis(): PointAnalysis {
    return {
      score: 75,
      validity: 'valid',
      reasoning: 'AI 분석을 사용할 수 없어 기본 평가를 적용했습니다.',
      recommendations: []
    };
  }

  isAvailable(): boolean {
    return this.isEnabled;
  }
}

export const pointsAnalyzer = new PointsAnalyzer();