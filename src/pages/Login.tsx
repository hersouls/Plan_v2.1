import { Eye, EyeOff, Lock, LogIn, Mail, UserPlus } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { WaveButton } from '../components/ui/WaveButton';
import { Typography } from '../components/ui/typography';
import { useAuth } from '../contexts';

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const {
    signInWithEmailAndPassword,
    signUpWithEmailAndPassword,
    signInWithGoogle,
    resetPassword,
    signInAnonymously,
  } = useAuth();

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('먼저 이메일을 입력해주세요.');
      return;
    }

    try {
      setError('');
      await resetPassword(email);
      alert(
        '비밀번호 재설정 링크를 이메일로 발송했습니다. 이메일을 확인해주세요.'
      );
    } catch (err: any) {
      let errorMessage = '비밀번호 재설정에 실패했습니다.';

      if (err.code === 'auth/user-not-found') {
        errorMessage = '존재하지 않는 이메일입니다.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 주소를 입력해주세요.';
      }

      setError(errorMessage);
    }
  };

  const validateForm = () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return false;
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        setError('이름을 입력해주세요.');
        return false;
      }

      if (password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
        return false;
      }

      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmailAndPassword(email, password, displayName);
      } else {
        await signInWithEmailAndPassword(email, password);
      }
      navigate('/');
    } catch (err: any) {
      // Firebase 에러 메시지 한국어 변환
      let errorMessage = err.message || '오류가 발생했습니다.';

      if (err.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = '존재하지 않는 계정입니다.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 틀렸습니다.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 주소를 입력해주세요.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = '비활성화된 계정입니다.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google 로그인에 실패했습니다.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInAnonymously();
      navigate('/');
    } catch (err: any) {
      setError(err.message || '익명 로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center responsive-px">
      <div className="w-full max-w-md lg:max-w-lg mx-auto relative z-10">
        <GlassCard variant="medium" className="p-6 lg:p-8 animate-fade-in">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl lg:text-7xl mb-6 animate-float">🌊</div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 font-pretendard tracking-ko-tight text-glow">
              Moonwave Plan
            </h1>
            <p className="text-white/80 text-lg lg:text-xl font-pretendard leading-ko-normal">
              일정관리의 모든 순간을 담다
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex mb-8 glass-light rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setPassword('');
                setConfirmPassword('');
                setDisplayName('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 text-sm lg:text-base font-medium font-pretendard ${
                !isSignUp
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <LogIn className="w-4 h-4 lg:w-5 lg:h-5 inline mr-2" />
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setPassword('');
                setConfirmPassword('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 text-sm lg:text-base font-medium font-pretendard ${
                isSignUp
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4 lg:w-5 lg:h-5 inline mr-2" />
              회원가입
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <GlassCard
              variant="light"
              className="p-4 mb-6 border-l-4 border-red-500 bg-red-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="text-red-400 text-xl">⚠️</div>
                <Typography.Body className="text-white">
                  {error}
                </Typography.Body>
              </div>
            </GlassCard>
          )}

          {/* Google Login Button */}
          <WaveButton
            type="button"
            variant="secondary"
            size="lg"
            className="w-full mb-4 font-pretendard"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 lg:w-6 lg:h-6">
                <svg viewBox="0 0 24 24" className="w-5 h-5 lg:w-6 lg:h-6">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </div>
              <Typography.Body className="font-pretendard">
                {isGoogleLoading ? 'Google 로그인 중...' : 'Google로 로그인'}
              </Typography.Body>
            </div>
          </WaveButton>

          {/* Anonymous Login Button */}
          <WaveButton
            type="button"
            variant="ghost"
            size="lg"
            className="w-full mb-6 font-pretendard"
            onClick={handleAnonymousLogin}
            disabled={isLoading || isGoogleLoading}
            data-testid="anonymous-login"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl lg:text-3xl">👤</span>
              <Typography.Body className="font-pretendard">
                {isLoading ? '익명 로그인 중...' : '익명으로 시작하기'}
              </Typography.Body>
            </div>
          </WaveButton>

          {/* Divider */}
          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm lg:text-base">
              <Typography.Body className="bg-transparent px-4 text-white font-pretendard">
                또는
              </Typography.Body>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field (회원가입 시만 표시) */}
            {isSignUp && (
              <div>
                <Typography.Label className="block text-white mb-3 font-pretendard">
                  이름
                </Typography.Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 lg:h-6 lg:w-6 text-white/70" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="
                      glass-light w-full pl-12 pr-4 py-4 lg:py-5 rounded-xl lg:rounded-2xl 
                      text-base lg:text-lg text-white placeholder-white/50 
                      focus:outline-none focus:ring-2 
                      focus:ring-blue-500/50 focus:border-transparent
                      transition-all duration-200 font-pretendard
                    "
                    placeholder="이름을 입력하세요"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <Typography.Label className="block text-white mb-3 font-pretendard">
                이메일
              </Typography.Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 lg:h-6 lg:w-6 text-white/70" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="
                    glass-light w-full pl-12 pr-4 py-4 lg:py-5 rounded-xl lg:rounded-2xl 
                    text-base lg:text-lg text-white placeholder-white/50 
                    focus:outline-none focus:ring-2 
                    focus:ring-blue-500/50 focus:border-transparent
                    transition-all duration-200 font-pretendard
                  "
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <Typography.Label className="block text-white mb-3 font-pretendard">
                비밀번호
              </Typography.Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 lg:h-6 lg:w-6 text-white/70" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="
                    glass-light w-full pl-12 pr-14 py-4 lg:py-5 rounded-xl lg:rounded-2xl 
                    text-base lg:text-lg text-white placeholder-white/50 
                    focus:outline-none focus:ring-2 
                    focus:ring-blue-500/50 focus:border-transparent
                    transition-all duration-200 font-pretendard
                  "
                  placeholder={
                    isSignUp ? '비밀번호 (최소 6자)' : '비밀번호를 입력하세요'
                  }
                  required
                  minLength={isSignUp ? 6 : undefined}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/20 transition-all duration-200 min-w-[44px] min-h-[44px] rounded-r-xl lg:rounded-r-2xl"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || isGoogleLoading}
                  aria-label={
                    showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 lg:h-6 lg:w-6 text-white hover:text-white/60 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 lg:h-6 lg:w-6 text-white hover:text-white/60 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (회원가입 시만 표시) */}
            {isSignUp && (
              <div>
                <Typography.Label className="block text-white mb-3 font-pretendard">
                  비밀번호 확인
                </Typography.Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 lg:h-6 lg:w-6 text-white/70" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="
                      glass-light w-full pl-12 pr-14 py-4 lg:py-5 rounded-xl lg:rounded-2xl 
                      text-base lg:text-lg text-white placeholder-white/50 
                      focus:outline-none focus:ring-2 
                      focus:ring-blue-500/50 focus:border-transparent
                      transition-all duration-200 font-pretendard
                    "
                    placeholder="비밀번호를 다시 입력하세요"
                    required={isSignUp}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-white/20 transition-all duration-200 min-w-[44px] min-h-[44px] rounded-r-xl lg:rounded-r-2xl"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading || isGoogleLoading}
                    aria-label={
                      showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 lg:h-6 lg:w-6 text-white hover:text-white/60 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 lg:h-6 lg:w-6 text-white hover:text-white/60 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <WaveButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-pretendard"
              disabled={isLoading}
            >
              <div className="flex items-center justify-center gap-3">
                {isSignUp ? (
                  <UserPlus size={20} className="lg:w-6 lg:h-6" />
                ) : (
                  <LogIn size={20} className="lg:w-6 lg:h-6" />
                )}
                <Typography.Body className="font-pretendard">
                  {isLoading
                    ? isSignUp
                      ? '회원가입 중...'
                      : '로그인 중...'
                    : isSignUp
                    ? '회원가입'
                    : '로그인'}
                </Typography.Body>
              </div>
            </WaveButton>
          </form>

          {/* Forgot Password Link (로그인 모드에서만 표시) */}
          {!isSignUp && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-white/70 hover:text-white hover:underline transition-colors font-pretendard"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default Login;
