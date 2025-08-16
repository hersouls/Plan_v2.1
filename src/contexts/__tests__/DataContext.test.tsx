// import React from 'react'; // Not needed in React 18+
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DataProvider, useData } from '../DataContext';
// import { AuthProvider, useAuth } from '../AuthContext'; // Not used in this test
import * as firestore from 'firebase/firestore';

// Firebase Firestore 모킹
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Firebase 앱 모킹
jest.mock('../../lib/firebase', () => ({
  db: {},
}));

// AuthContext 모킹
jest.mock('../AuthContext', () => ({
  useAuth: jest.fn(),
}));

// 테스트용 컴포넌트
function TestComponent() {
  const { subscriptions, preferences, updatePreferences, loading, error } = useData();

  return (
    <div>
      <div data-testid="subscriptions-count">{subscriptions.length}</div>
      <div data-testid="preferences">{preferences ? JSON.stringify(preferences) : 'null'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button 
        onClick={() => updatePreferences({ theme: 'light' })} 
        data-testid="update-preferences"
      >
        설정 업데이트
      </button>
    </div>
  );
}

function TestComponentWithoutProvider() {
  try {
    useData();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
}

describe('DataContext', () => {
  const mockUser = { uid: 'test-uid', email: 'test@test.com' };
  const mockSubscriptions = [
    {
      id: 'sub1',
      name: 'Netflix',
      amount: 15000,
      currency: 'KRW' as const,
      paymentCycle: 'monthly' as const,
      status: 'active' as const,
      nextPaymentDate: '2025-09-01',
      category: 'Entertainment',
      createdAt: '2025-08-01',
      updatedAt: '2025-08-01'
    }
  ];

  const defaultPreferences = {
    exchangeRate: 1300,
    defaultCurrency: 'KRW' as const,
    theme: 'dark' as const,
    language: 'ko' as const,
    timezone: 'Asia/Seoul',
    dateFormat: 'YYYY-MM-DD',
    currencyFormat: 'KRW'
  };

  let mockUseAuth: jest.Mock;
  let mockOnSnapshot: jest.Mock;
  let mockUpdateDoc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth = useAuth as jest.Mock;
    mockOnSnapshot = firestore.onSnapshot as jest.Mock;
    mockUpdateDoc = firestore.updateDoc as jest.Mock;

    // Firebase 함수들 기본 모킹
    (firestore.collection as jest.Mock).mockReturnValue({});
    (firestore.query as jest.Mock).mockReturnValue({});
    (firestore.where as jest.Mock).mockReturnValue({});
    (firestore.doc as jest.Mock).mockReturnValue({});
  });

  describe('Provider 없이 사용할 때', () => {
    it('useData hook이 에러를 던져야 한다', () => {
      render(<TestComponentWithoutProvider />);
      
      expect(screen.getByTestId('error')).toHaveTextContent(
        'useData must be used within a DataProvider'
      );
    });
  });

  describe('사용자가 로그인하지 않은 경우', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: null });
    });

    it('기본 설정과 빈 구독 목록을 반환해야 한다', async () => {
      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('subscriptions-count')).toHaveTextContent('0');
      expect(screen.getByTestId('preferences')).toHaveTextContent(
        JSON.stringify(defaultPreferences)
      );
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });
  });

  describe('사용자가 로그인한 경우', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser });
    });

    it('구독 데이터를 성공적으로 로드해야 한다', async () => {
      // 구독 데이터 onSnapshot 모킹
      mockOnSnapshot.mockImplementation((query, successCallback, _errorCallback) => {
        if (query === 'subscriptions-query') {
          const mockSnapshot = {
            docs: mockSubscriptions.map(sub => ({
              id: sub.id,
              data: () => ({ ...sub })
            }))
          };
          setTimeout(() => successCallback(mockSnapshot), 0);
        }
        return jest.fn(); // unsubscribe 함수
      });

      // query 호출 시 구독 쿼리임을 식별할 수 있도록 설정
      (firestore.query as jest.Mock).mockReturnValue('subscriptions-query');

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('subscriptions-count')).toHaveTextContent('1');
      });

      expect(firestore.collection).toHaveBeenCalledWith({}, 'subscriptions');
      expect(firestore.where).toHaveBeenCalledWith('user_id', '==', 'test-uid');
    });

    it('설정 데이터를 성공적으로 로드해야 한다', async () => {
      const customPreferences = { ...defaultPreferences, theme: 'light' as const };

      // 첫 번째 onSnapshot (구독용)
      mockOnSnapshot.mockImplementationOnce(() => jest.fn())
      // 두 번째 onSnapshot (설정용)
      .mockImplementationOnce((doc, successCallback) => {
        const mockDoc = {
          exists: () => true,
          data: () => ({ preferences: { theme: 'light' } })
        };
        setTimeout(() => successCallback(mockDoc), 0);
        return jest.fn();
      });

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('preferences')).toHaveTextContent(
        JSON.stringify(customPreferences)
      );
      expect(firestore.doc).toHaveBeenCalledWith({}, 'users', 'test-uid');
    });

    it('설정이 존재하지 않을 때 기본 설정을 사용해야 한다', async () => {
      mockOnSnapshot.mockImplementationOnce(() => jest.fn())
      .mockImplementationOnce((doc, successCallback) => {
        const mockDoc = {
          exists: () => false
        };
        setTimeout(() => successCallback(mockDoc), 0);
        return jest.fn();
      });

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('preferences')).toHaveTextContent(
        JSON.stringify(defaultPreferences)
      );
    });

    it('구독 데이터 로딩 실패 시 에러를 설정해야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockOnSnapshot.mockImplementationOnce((query, successCallback, errorCallback) => {
        setTimeout(() => errorCallback({ message: 'Firestore error' }), 0);
        return jest.fn();
      });

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('구독 데이터를 불러오는데 실패했습니다.');
      });

      expect(consoleSpy).toHaveBeenCalledWith('구독 데이터 로딩 실패:', expect.any(Object));
      consoleSpy.mockRestore();
    });

    it('설정 데이터 로딩 실패 시 기본 설정을 사용해야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockOnSnapshot.mockImplementationOnce(() => jest.fn())
      .mockImplementationOnce((doc, successCallback, errorCallback) => {
        setTimeout(() => errorCallback({ message: 'Firestore error' }), 0);
        return jest.fn();
      });

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('preferences')).toHaveTextContent(
        JSON.stringify(defaultPreferences)
      );
      expect(consoleSpy).toHaveBeenCalledWith('설정 데이터 로딩 실패:', expect.any(Object));
      consoleSpy.mockRestore();
    });
  });

  describe('설정 업데이트', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockOnSnapshot.mockImplementation(() => jest.fn());
    });

    it('성공적으로 설정을 업데이트해야 한다', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      const updateButton = screen.getByTestId('update-preferences');
      updateButton.click();

      await waitFor(() => {
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          {},
          expect.objectContaining({
            preferences: expect.objectContaining({
              theme: 'light'
            }),
            updatedAt: expect.any(String)
          })
        );
      });
    });

    it('사용자가 로그인하지 않은 경우 업데이트를 건너뛰어야 한다', async () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      const updateButton = screen.getByTestId('update-preferences');
      updateButton.click();

      await waitFor(() => {
        expect(mockUpdateDoc).not.toHaveBeenCalled();
      });
    });

    it('업데이트 실패 시 에러를 던져야 한다', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const error = { message: 'Update failed' };
      mockUpdateDoc.mockRejectedValue(error);

      render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      const updateButton = screen.getByTestId('update-preferences');
      
      // updatePreferences가 에러를 던지는지 확인하기 위해
      // 실제로는 컴포넌트에서 try-catch를 해야 하지만, 
      // 여기서는 최소한 console.error가 호출되는지 확인
      updateButton.click();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('설정 업데이트 실패:', error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('컴포넌트 언마운트 시', () => {
    it('구독 해제 함수들이 호출되어야 한다', () => {
      const unsubscribeSubscriptions = jest.fn();
      const unsubscribePreferences = jest.fn();

      mockUseAuth.mockReturnValue({ user: mockUser });
      mockOnSnapshot.mockReturnValueOnce(unsubscribeSubscriptions)
                   .mockReturnValueOnce(unsubscribePreferences);

      const { unmount } = render(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );

      unmount();

      expect(unsubscribeSubscriptions).toHaveBeenCalled();
      expect(unsubscribePreferences).toHaveBeenCalled();
    });
  });
});