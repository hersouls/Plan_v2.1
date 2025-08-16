import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { Login } from '../../pages/Login';
import * as firebase from '../../lib/firebase';

// Mock Firebase auth methods
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignUpWithEmailAndPassword = jest.fn();
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock('../../lib/firebase', () => ({
  auth: {
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockSignUpWithEmailAndPassword,
    signInWithPopup: mockSignInWithPopup,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
    currentUser: null,
  },
  googleProvider: {},
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Authentication Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnAuthStateChanged.mockImplementation((callback) => {
      // Simulate no user initially
      callback(null);
      return jest.fn(); // unsubscribe function
    });
  });

  describe('로그인 플로우', () => {
    it('이메일과 비밀번호로 로그인할 수 있어야 한다', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Fill in login form
      const emailInput = screen.getByRole('textbox', { name: /이메일/i }) ||
                        screen.getByPlaceholderText(/이메일/i) ||
                        screen.getByLabelText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i) ||
                           screen.getByPlaceholderText(/비밀번호/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(), // Firebase auth instance
          'test@example.com',
          'password123'
        );
      });
    });

    it('잘못된 로그인 정보로 로그인 시 에러 메시지를 표시해야 한다', async () => {
      const mockError = new Error('Invalid credentials');
      mockError.message = 'auth/invalid-credential';

      mockSignInWithEmailAndPassword.mockRejectedValue(mockError);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByRole('textbox', { name: /이메일/i }) ||
                        screen.getByPlaceholderText(/이메일/i);
      const passwordInput = screen.getByLabelText(/비밀번호/i) ||
                           screen.getByPlaceholderText(/비밀번호/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });

      fireEvent.change(emailInput, { target: { value: 'invalid@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/로그인에 실패했습니다/i)).toBeInTheDocument();
      });
    });

    it('빈 필드로 로그인 시도 시 검증 에러를 표시해야 한다', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const loginButton = screen.getByRole('button', { name: /로그인/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/이메일을 입력해주세요/i)).toBeInTheDocument();
      });
    });
  });

  describe('회원가입 플로우', () => {
    it('새 사용자가 회원가입할 수 있어야 한다', async () => {
      const mockUser = {
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        displayName: 'New User',
      };

      mockSignUpWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Switch to signup mode
      const signupTab = screen.getByText(/회원가입/i) || screen.getByRole('tab', { name: /회원가입/i });
      fireEvent.click(signupTab);

      // Fill signup form
      const emailInput = screen.getByRole('textbox', { name: /이메일/i });
      const passwordInput = screen.getByLabelText(/^비밀번호$/i);
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
      const signupButton = screen.getByRole('button', { name: /회원가입/i });

      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(mockSignUpWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'newuser@example.com',
          'password123'
        );
      });
    });

    it('비밀번호 확인이 일치하지 않으면 에러를 표시해야 한다', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      // Switch to signup mode
      const signupTab = screen.getByText(/회원가입/i);
      fireEvent.click(signupTab);

      const passwordInput = screen.getByLabelText(/^비밀번호$/i);
      const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
      const signupButton = screen.getByRole('button', { name: /회원가입/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('Google 로그인', () => {
    it('Google 계정으로 로그인할 수 있어야 한다', async () => {
      const mockUser = {
        uid: 'google-user-uid',
        email: 'googleuser@gmail.com',
        displayName: 'Google User',
        photoURL: 'https://example.com/photo.jpg',
      };

      mockSignInWithPopup.mockResolvedValue({
        user: mockUser,
      });

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const googleButton = screen.getByRole('button', { name: /Google/i }) ||
                          screen.getByText(/Google/i).closest('button');

      if (googleButton) {
        fireEvent.click(googleButton);

        await waitFor(() => {
          expect(mockSignInWithPopup).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything()
          );
        });
      }
    });

    it('Google 로그인 취소 시 에러를 적절히 처리해야 한다', async () => {
      const mockError = new Error('Google login cancelled');
      mockError.message = 'auth/popup-closed-by-user';

      mockSignInWithPopup.mockRejectedValue(mockError);

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const googleButton = screen.getByRole('button', { name: /Google/i }) ||
                          screen.getByText(/Google/i).closest('button');

      if (googleButton) {
        fireEvent.click(googleButton);

        await waitFor(() => {
          // Should not show error for user-cancelled action
          expect(screen.queryByText(/오류가 발생했습니다/i)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('폼 상태 관리', () => {
    it('로그인 중일 때 버튼이 비활성화되어야 한다', async () => {
      mockSignInWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByRole('textbox', { name: /이메일/i });
      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const loginButton = screen.getByRole('button', { name: /로그인/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Button should be disabled during login
      expect(loginButton).toBeDisabled();
    });

    it('비밀번호 표시/숨기기 토글이 작동해야 한다', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/비밀번호/i);
      const toggleButton = screen.getByRole('button', { name: /비밀번호 표시/i }) ||
                          screen.getByLabelText(/비밀번호 표시/i) ||
                          document.querySelector('[data-testid=\"password-toggle\"]');

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('접근성', () => {
    it('폼 필드에 적절한 레이블이 있어야 한다', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/비밀번호/i)).toBeInTheDocument();
    });

    it('에러 메시지가 스크린 리더에서 읽힐 수 있어야 한다', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue(new Error('Login failed'));

      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const loginButton = screen.getByRole('button', { name: /로그인/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert') || screen.getByText(/오류/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});