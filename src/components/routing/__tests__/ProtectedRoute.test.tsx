import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import '@testing-library/jest-dom';
import { ProtectedRoute, withProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to, state, replace }: { to: string; state?: any; replace?: boolean }) => (
    <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)} data-replace={replace}>
      Navigate to {to}
    </div>
  ),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockUser = {
  uid: 'user-1',
  email: 'test@example.com',
  displayName: 'Test User',
};

// Test components
const TestComponent: React.FC = () => (
  <div data-testid="protected-content">Protected Content</div>
);

const ProtectedTestComponent = withProtectedRoute(TestComponent);

const renderWithRouter = (
  component: React.ReactElement,
  initialEntries: string[] = ['/']
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {component}
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('인증이 필요한 라우트 (requireAuth=true)', () => {
    it('사용자가 로그인된 경우 자식 컴포넌트를 렌더링해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('사용자가 로그인되지 않은 경우 로그인 페이지로 리다이렉트해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>,
        ['/protected-page']
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toBeInTheDocument();
      expect(navigate).toHaveAttribute('data-to', '/login');
      expect(navigate).toHaveAttribute('data-replace', 'true');
      
      // 현재 위치가 state에 저장되는지 확인
      const state = JSON.parse(navigate.getAttribute('data-state') || '{}');
      expect(state.from.pathname).toBe('/protected-page');
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('커스텀 리다이렉트 경로를 사용할 수 있어야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute redirectTo="/custom-login">
          <TestComponent />
        </ProtectedRoute>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toHaveAttribute('data-to', '/custom-login');
    });

    it('로딩 중일 때 로딩 스피너를 표시해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('인증 확인 중...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('인증이 불필요한 라우트 (requireAuth=false)', () => {
    it('로그인하지 않은 사용자에게 자식 컴포넌트를 렌더링해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute requireAuth={false}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('로그인된 사용자가 로그인 페이지에 접근시 홈으로 리다이렉트해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute requireAuth={false}>
          <TestComponent />
        </ProtectedRoute>,
        ['/login']
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toBeInTheDocument();
      expect(navigate).toHaveAttribute('data-to', '/');
      expect(navigate).toHaveAttribute('data-replace', 'true');
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('로그인된 사용자가 로그인 페이지가 아닌 다른 페이지에 접근시 자식 컴포넌트를 렌더링해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute requireAuth={false}>
          <TestComponent />
        </ProtectedRoute>,
        ['/public-page']
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('로딩 중일 때도 로딩 스피너를 표시해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute requireAuth={false}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('인증 확인 중...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('withProtectedRoute HOC', () => {
    it('HOC로 래핑된 컴포넌트가 정상적으로 작동해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(<ProtectedTestComponent />);

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('HOC 옵션이 올바르게 전달되어야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      const CustomProtectedComponent = withProtectedRoute(TestComponent, {
        requireAuth: false
      });

      renderWithRouter(<CustomProtectedComponent />);

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('컴포넌트의 props가 올바르게 전달되어야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      interface TestProps {
        testProp: string;
      }

      const PropsTestComponent: React.FC<TestProps> = ({ testProp }) => (
        <div data-testid="props-content">{testProp}</div>
      );

      const ProtectedPropsComponent = withProtectedRoute(PropsTestComponent);

      renderWithRouter(
        <ProtectedPropsComponent testProp="test value" />
      );

      expect(screen.getByText('test value')).toBeInTheDocument();
    });
  });

  describe('로딩 상태 UI', () => {
    it('로딩 스피너에 올바른 props가 전달되어야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      // LoadingSpinner가 올바른 props로 렌더링되는지 확인
      expect(screen.getByText('인증 확인 중...')).toBeInTheDocument();
      
      // 백그라운드와 함께 렌더링되는지 확인
      const loadingContainer = screen.getByText('인증 확인 중...').closest('div');
      expect(loadingContainer).toHaveClass('min-h-screen');
    });
  });

  describe('에지 케이스', () => {
    it('user가 undefined인 경우를 올바르게 처리해야 한다', () => {
      mockUseAuth.mockReturnValue({
        user: undefined as any,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      const navigate = screen.getByTestId('navigate');
      expect(navigate).toBeInTheDocument();
      expect(navigate).toHaveAttribute('data-to', '/login');
    });

    it('loading이 true인 동안 여러 번 렌더링되어도 안정적이어야 한다', () => {
      const authState = {
        user: null,
        loading: true,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      };

      mockUseAuth.mockReturnValue(authState);

      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('인증 확인 중...')).toBeInTheDocument();

      // 다시 렌더링
      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByText('인증 확인 중...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('로그인 상태 변경 시 올바르게 리렌더링되어야 한다', () => {
      const { rerender } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      // 초기: 로그인되지 않음
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('navigate')).toBeInTheDocument();

      // 로그인됨
      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
        resetPassword: jest.fn(),
        signInAnonymously: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithEmailAndPassword: jest.fn(),
        signUpWithEmailAndPassword: jest.fn(),
      });

      rerender(
        <MemoryRouter>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });
});