import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from '../Login';

// React Router 모킹
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// AuthContext 모킹
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignUpWithEmailAndPassword = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockResetPassword = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    signUpWithEmailAndPassword: mockSignUpWithEmailAndPassword,
    signInWithGoogle: mockSignInWithGoogle,
    resetPassword: mockResetPassword,
  }),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // window.alert 모킹
    window.alert = jest.fn();
  });

  describe('초기 렌더링', () => {
    it('로그인 폼이 표시되어야 한다', () => {
      renderWithRouter(<Login />);

      expect(screen.getByText('Moonwave Plan')).toBeInTheDocument();
      expect(screen.getByText('여행의 모든 순간을 담다')).toBeInTheDocument();
      expect(screen.getAllByText('로그인').length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText('이메일을 입력하세요')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
    });

    it('회원가입 탭으로 전환할 수 있어야 한다', () => {
      renderWithRouter(<Login />);

      fireEvent.click(screen.getByText('회원가입'));

      expect(screen.getByText('회원가입')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('이름을 입력하세요')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('비밀번호를 다시 입력하세요')).toBeInTheDocument();
    });

    it('탭 전환 시 에러 메시지가 초기화되어야 한다', () => {
      renderWithRouter(<Login />);

      // 임의로 에러를 발생시키기 위해 빈 폼 제출
      fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

      expect(screen.getByText('이메일과 비밀번호를 입력해주세요.')).toBeInTheDocument();

      // 회원가입 탭으로 전환
      fireEvent.click(screen.getByText('회원가입'));

      // 에러 메시지가 사라져야 함
      expect(screen.queryByText('이메일과 비밀번호를 입력해주세요.')).not.toBeInTheDocument();
    });
  });

  describe('로그인 기능', () => {
    beforeEach(() => {
      renderWithRouter(<Login />);
    });

    it('성공적으로 로그인하고 홈으로 리다이렉트해야 한다', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'test-uid' } });

      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith('test@test.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('로그인 실패 시 에러 메시지를 표시해야 한다', async () => {
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      mockSignInWithEmailAndPassword.mockRejectedValue(error);

      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'wrongpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

      await waitFor(() => {
        expect(screen.getByText('존재하지 않는 계정입니다.')).toBeInTheDocument();
      });
    });

    it('빈 폼 제출 시 유효성 검사 에러를 표시해야 한다', () => {
      fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

      expect(screen.getByText('이메일과 비밀번호를 입력해주세요.')).toBeInTheDocument();
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('다양한 Firebase 에러 코드를 한국어로 변환해야 한다', async () => {
      const errorCases = [
        { code: 'auth/wrong-password', expected: '비밀번호가 틀렸습니다.' },
        { code: 'auth/invalid-email', expected: '올바른 이메일 주소를 입력해주세요.' },
        { code: 'auth/user-disabled', expected: '비활성화된 계정입니다.' },
      ];

      for (const errorCase of errorCases) {
        jest.clearAllMocks();
        mockSignInWithEmailAndPassword.mockRejectedValue({ code: errorCase.code });

        fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
          target: { value: 'test@test.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
          target: { value: 'password' },
        });

        fireEvent.click(screen.getByRole('button', { name: /로그인/i }));

        await waitFor(() => {
          expect(screen.getByText(errorCase.expected)).toBeInTheDocument();
        });
      }
    });
  });

  describe('회원가입 기능', () => {
    beforeEach(() => {
      renderWithRouter(<Login />);
      fireEvent.click(screen.getByText('회원가입'));
    });

    it('성공적으로 회원가입하고 홈으로 리다이렉트해야 한다', async () => {
      mockSignUpWithEmailAndPassword.mockResolvedValue({ user: { uid: 'test-uid' } });

      fireEvent.change(screen.getByPlaceholderText('이름을 입력하세요'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 다시 입력하세요'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /가입하기/i }));

      await waitFor(() => {
        expect(mockSignUpWithEmailAndPassword).toHaveBeenCalledWith(
          'test@test.com',
          'password123',
          'Test User'
        );
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('회원가입 폼 유효성 검사를 수행해야 한다', () => {
      // 이름 없이 제출
      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /가입하기/i }));

      expect(screen.getByText('이름을 입력해주세요.')).toBeInTheDocument();
    });

    it('비밀번호가 6자 미만일 때 에러를 표시해야 한다', () => {
      fireEvent.change(screen.getByPlaceholderText('이름을 입력하세요'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: '123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /가입하기/i }));

      expect(screen.getByText('비밀번호는 최소 6자 이상이어야 합니다.')).toBeInTheDocument();
    });

    it('비밀번호 확인이 일치하지 않을 때 에러를 표시해야 한다', () => {
      fireEvent.change(screen.getByPlaceholderText('이름을 입력하세요'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 다시 입력하세요'), {
        target: { value: 'differentpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /가입하기/i }));

      expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
    });

    it('회원가입 실패 시 에러 메시지를 표시해야 한다', async () => {
      const error = { code: 'auth/email-already-in-use', message: 'Email already in use' };
      mockSignUpWithEmailAndPassword.mockRejectedValue(error);

      fireEvent.change(screen.getByPlaceholderText('이름을 입력하세요'), {
        target: { value: 'Test User' },
      });
      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'existing@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 다시 입력하세요'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /가입하기/i }));

      await waitFor(() => {
        expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument();
      });
    });
  });

  describe('Google 로그인', () => {
    beforeEach(() => {
      renderWithRouter(<Login />);
    });

    it('성공적으로 Google 로그인하고 홈으로 리다이렉트해야 한다', async () => {
      mockSignInWithGoogle.mockResolvedValue({ user: { uid: 'google-uid' } });

      fireEvent.click(screen.getByText('Google로 계속하기'));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('Google 로그인 실패 시 에러 메시지를 표시해야 한다', async () => {
      mockSignInWithGoogle.mockRejectedValue({ message: 'Google login failed' });

      fireEvent.click(screen.getByText('Google로 계속하기'));

      await waitFor(() => {
        expect(screen.getByText('Google login failed')).toBeInTheDocument();
      });
    });
  });

  describe('비밀번호 재설정', () => {
    beforeEach(() => {
      renderWithRouter(<Login />);
    });

    it('이메일이 입력된 상태에서 비밀번호 재설정을 성공해야 한다', async () => {
      mockResetPassword.mockResolvedValue(undefined);

      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });

      fireEvent.click(screen.getByText('비밀번호를 잊으셨나요?'));

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('test@test.com');
        expect(window.alert).toHaveBeenCalledWith(
          '비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.'
        );
      });
    });

    it('이메일이 입력되지 않은 상태에서 에러를 표시해야 한다', () => {
      fireEvent.click(screen.getByText('비밀번호를 잊으셨나요?'));

      expect(screen.getByText('먼저 이메일을 입력해주세요.')).toBeInTheDocument();
      expect(mockResetPassword).not.toHaveBeenCalled();
    });

    it('비밀번호 재설정 실패 시 에러 메시지를 표시해야 한다', async () => {
      const error = { code: 'auth/user-not-found' };
      mockResetPassword.mockRejectedValue(error);

      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'nonexistent@test.com' },
      });

      fireEvent.click(screen.getByText('비밀번호를 잊으셨나요?'));

      await waitFor(() => {
        expect(screen.getByText('존재하지 않는 이메일입니다.')).toBeInTheDocument();
      });
    });
  });

  describe('사용자 인터페이스', () => {
    beforeEach(() => {
      renderWithRouter(<Login />);
    });

    it('비밀번호 가시성을 토글할 수 있어야 한다', () => {
      const passwordInput = screen.getByPlaceholderText('비밀번호를 입력하세요');
      const toggleButton = screen.getByLabelText('비밀번호 표시');

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('비밀번호 숨기기')).toBeInTheDocument();
    });

    it('회원가입 모드에서 비밀번호 확인 가시성을 토글할 수 있어야 한다', () => {
      fireEvent.click(screen.getByText('회원가입'));

      const confirmPasswordInput = screen.getByPlaceholderText('비밀번호를 다시 입력하세요');
      const toggleButtons = screen.getAllByLabelText('비밀번호 표시');
      const confirmToggleButton = toggleButtons[1]; // 두 번째 토글 버튼

      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      fireEvent.click(confirmToggleButton);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });

    it('로딩 중일 때 버튼이 비활성화되어야 한다', async () => {
      // 로그인이 오래 걸리도록 설정
      mockSignInWithEmailAndPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'password123' },
      });

      const loginButton = screen.getByRole('button', { name: /로그인/i });
      fireEvent.click(loginButton);

      // 로딩 중에는 버튼이 비활성화되어야 함
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });
    });

    it('Google 로그인 로딩 중일 때 버튼이 비활성화되어야 한다', async () => {
      mockSignInWithGoogle.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const googleButton = screen.getByText('Google로 계속하기');
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(googleButton.closest('button')).toBeDisabled();
      });
    });
  });

  describe('접근성', () => {
    it('적절한 ARIA 라벨이 설정되어야 한다', () => {
      renderWithRouter(<Login />);

      expect(screen.getByLabelText('로그인 페이지')).toBeInTheDocument();
      expect(screen.getByLabelText('비밀번호 표시')).toBeInTheDocument();
    });

    it('폼 제출이 Enter 키로 작동해야 한다', () => {
      renderWithRouter(<Login />);

      fireEvent.change(screen.getByPlaceholderText('이메일을 입력하세요'), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력하세요'), {
        target: { value: 'password123' },
      });

      fireEvent.keyDown(screen.getByPlaceholderText('비밀번호를 입력하세요'), { key: 'Enter', code: 'Enter' });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
    });
  });
});