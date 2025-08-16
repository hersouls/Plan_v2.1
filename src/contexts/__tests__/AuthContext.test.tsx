// import React from 'react'; // Not needed in React 18+
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import * as firebaseAuth from 'firebase/auth';

// Firebase Auth 모킹
jest.mock('firebase/auth', () => ({
  signInAnonymously: jest.fn(),
  signOut: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// Firebase 앱 모킹
jest.mock('../../lib/firebase', () => ({
  auth: {},
}));

// 테스트용 컴포넌트
function TestComponent() {
  const { 
    user, 
    loading, 
    error, 
    signInAnonymously, 
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInWithGoogle,
    resetPassword,
    signOut 
  } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.uid : 'null'}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'null'}</div>
      <button onClick={signInAnonymously} data-testid="signin-anonymous">익명 로그인</button>
      <button 
        onClick={() => signInWithEmailAndPassword('test@test.com', 'password')} 
        data-testid="signin-email"
      >
        이메일 로그인
      </button>
      <button 
        onClick={() => signUpWithEmailAndPassword('test@test.com', 'password', 'Test User')} 
        data-testid="signup-email"
      >
        이메일 회원가입
      </button>
      <button onClick={signInWithGoogle} data-testid="signin-google">Google 로그인</button>
      <button 
        onClick={() => resetPassword('test@test.com')} 
        data-testid="reset-password"
      >
        비밀번호 재설정
      </button>
      <button onClick={signOut} data-testid="signout">로그아웃</button>
    </div>
  );
}

function TestComponentWithoutProvider() {
  try {
    useAuth();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
}

describe('AuthContext', () => {
  const mockUser = { uid: 'test-uid', email: 'test@test.com' };
  let mockOnAuthStateChanged: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChanged = firebaseAuth.onAuthStateChanged as jest.Mock;
    
    // 기본적으로 인증 상태 변화를 시뮬레이션
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // 초기에는 로딩 상태
      setTimeout(() => callback(null), 0);
      return jest.fn(); // unsubscribe 함수
    });
  });

  describe('Provider 없이 사용할 때', () => {
    it('useAuth hook이 에러를 던져야 한다', () => {
      render(<TestComponentWithoutProvider />);
      
      expect(screen.getByTestId('error')).toHaveTextContent(
        'useAuth must be used within an AuthProvider'
      );
    });
  });

  describe('초기 상태', () => {
    it('초기 로딩 상태여야 한다', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('인증 상태가 변경되면 로딩이 끝나야 한다', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('사용자 인증 상태', () => {
    it('로그인된 사용자가 설정되어야 한다', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockUser), 0);
        return jest.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test-uid');
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });
    });
  });

  describe('익명 로그인', () => {
    it('성공적으로 익명 로그인해야 한다', async () => {
      const mockSignInAnonymously = firebaseAuth.signInAnonymously as jest.Mock;
      mockSignInAnonymously.mockResolvedValue({ user: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signin-anonymous'));

      await waitFor(() => {
        expect(mockSignInAnonymously).toHaveBeenCalled();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('익명 로그인 실패 시 에러를 설정해야 한다', async () => {
      const mockSignInAnonymously = firebaseAuth.signInAnonymously as jest.Mock;
      mockSignInAnonymously.mockRejectedValue({ message: 'Anonymous sign in failed' });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signin-anonymous'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Anonymous sign in failed');
      });
    });
  });

  describe('이메일 로그인', () => {
    it('성공적으로 이메일 로그인해야 한다', async () => {
      const mockSignInWithEmail = firebaseAuth.signInWithEmailAndPassword as jest.Mock;
      mockSignInWithEmail.mockResolvedValue({ user: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signin-email'));

      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith({}, 'test@test.com', 'password');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('이메일 로그인 실패 시 에러를 던져야 한다', async () => {
      const mockSignInWithEmail = firebaseAuth.signInWithEmailAndPassword as jest.Mock;
      const error = { code: 'auth/invalid-credentials', message: 'Invalid credentials' };
      mockSignInWithEmail.mockRejectedValue(error);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signin-email'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('이메일 회원가입', () => {
    it('성공적으로 회원가입하고 프로필을 업데이트해야 한다', async () => {
      const mockCreateUser = firebaseAuth.createUserWithEmailAndPassword as jest.Mock;
      const mockUpdateProfile = firebaseAuth.updateProfile as jest.Mock;
      const mockUserResult = { user: mockUser };
      
      mockCreateUser.mockResolvedValue(mockUserResult);
      mockUpdateProfile.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signup-email'));

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith({}, 'test@test.com', 'password');
        expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('회원가입 실패 시 에러를 던져야 한다', async () => {
      const mockCreateUser = firebaseAuth.createUserWithEmailAndPassword as jest.Mock;
      const error = { code: 'auth/email-already-in-use', message: 'Email already in use' };
      mockCreateUser.mockRejectedValue(error);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signup-email'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already in use');
      });
    });
  });

  describe('Google 로그인', () => {
    it('성공적으로 Google 로그인해야 한다', async () => {
      const mockSignInWithPopup = firebaseAuth.signInWithPopup as jest.Mock;
      const mockGoogleProvider = firebaseAuth.GoogleAuthProvider as unknown as jest.Mock;
      
      mockGoogleProvider.mockImplementation(() => ({}));
      mockSignInWithPopup.mockResolvedValue({ user: mockUser });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signin-google'));

      await waitFor(() => {
        expect(mockGoogleProvider).toHaveBeenCalled();
        expect(mockSignInWithPopup).toHaveBeenCalled();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('Google 로그인 실패 시 에러를 던져야 한다', async () => {
      const mockSignInWithPopup = firebaseAuth.signInWithPopup as jest.Mock;
      const error = { message: 'Google sign in failed' };
      mockSignInWithPopup.mockRejectedValue(error);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signin-google'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Google sign in failed');
      });
    });
  });

  describe('비밀번호 재설정', () => {
    it('성공적으로 비밀번호 재설정 이메일을 보내야 한다', async () => {
      const mockSendPasswordReset = firebaseAuth.sendPasswordResetEmail as jest.Mock;
      mockSendPasswordReset.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('reset-password'));

      await waitFor(() => {
        expect(mockSendPasswordReset).toHaveBeenCalledWith({}, 'test@test.com');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('비밀번호 재설정 실패 시 에러를 던져야 한다', async () => {
      const mockSendPasswordReset = firebaseAuth.sendPasswordResetEmail as jest.Mock;
      const error = { message: 'User not found' };
      mockSendPasswordReset.mockRejectedValue(error);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('reset-password'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('비밀번호 재설정에 실패했습니다.');
      });
    });
  });

  describe('로그아웃', () => {
    it('성공적으로 로그아웃해야 한다', async () => {
      const mockSignOut = firebaseAuth.signOut as jest.Mock;
      mockSignOut.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signout'));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });

      expect(screen.getByTestId('error')).toHaveTextContent('null');
    });

    it('로그아웃 실패 시 에러를 설정해야 한다', async () => {
      const mockSignOut = firebaseAuth.signOut as jest.Mock;
      const error = { message: 'Sign out failed' };
      mockSignOut.mockRejectedValue(error);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signout'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('로그아웃에 실패했습니다.');
      });
    });
  });

  describe('에러 처리', () => {
    it('문자열이 아닌 에러도 적절히 처리해야 한다', async () => {
      const mockSignInAnonymously = firebaseAuth.signInAnonymously as jest.Mock;
      mockSignInAnonymously.mockRejectedValue('String error');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      fireEvent.click(screen.getByTestId('signin-anonymous'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('익명 로그인에 실패했습니다.');
      });
    });
  });
});