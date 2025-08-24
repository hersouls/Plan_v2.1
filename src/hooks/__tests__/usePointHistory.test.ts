import { act, renderHook, waitFor } from '@testing-library/react';
import { pointsService } from '../../lib/points';
import { usePointHistory } from '../usePointHistory';

// utils 모듈이 import.meta 경로를 참조하므로 훅 테스트에서는 모킹하여 경량화
jest.mock('../../lib/utils', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../lib/points');

const mockPointsService = pointsService as jest.Mocked<typeof pointsService>;

describe('usePointHistory', () => {
  const groupId = 'group_1';
  const userId = 'user_1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('초기 로딩 시 승인/미승인 내역을 불러온다', async () => {
    mockPointsService.getUnapprovedPointHistory.mockResolvedValue([
      { id: 'h1' } as any,
    ]);
    mockPointsService.getApprovedPointHistory.mockResolvedValue([
      { id: 'h2' } as any,
    ]);

    const { result } = renderHook(() => usePointHistory({ groupId, userId }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.unapproved).toHaveLength(1);
      expect(result.current.approved).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  it('에러 발생 시 에러 상태를 설정한다', async () => {
    mockPointsService.getUnapprovedPointHistory.mockRejectedValue(
      new Error('fail')
    );
    mockPointsService.getApprovedPointHistory.mockRejectedValue(
      new Error('fail')
    );

    const { result } = renderHook(() => usePointHistory({ groupId, userId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });

  it('refresh 함수로 각각 다시 불러온다', async () => {
    mockPointsService.getUnapprovedPointHistory.mockResolvedValueOnce([
      { id: 'a1' } as any,
    ]);
    mockPointsService.getApprovedPointHistory.mockResolvedValueOnce([
      { id: 'b1' } as any,
    ]);

    const { result } = renderHook(() => usePointHistory({ groupId, userId }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    mockPointsService.getApprovedPointHistory.mockResolvedValueOnce([
      { id: 'b2' } as any,
    ]);
    mockPointsService.getUnapprovedPointHistory.mockResolvedValueOnce([
      { id: 'a2' } as any,
    ]);

    await act(async () => {
      await result.current.refreshApproved();
      await result.current.refreshUnapproved();
    });

    expect(result.current.approved[0].id).toBe('b2');
    expect(result.current.unapproved[0].id).toBe('a2');
  });
});
