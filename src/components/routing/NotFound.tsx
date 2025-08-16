import { Home, ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WaveBackground } from '../layout/WaveBackground';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';

export function NotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen">
      <WaveBackground />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <GlassCard variant="strong" className="max-w-md w-full text-center">
          <div className="p-8">
            {/* 404 Animation */}
            <div className="mb-8">
              <div className="text-8xl font-bold text-primary-500/20 mb-4 animate-bounce">
                404
              </div>
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="text-primary-500 animate-pulse" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl-ko font-bold text-white mb-4">
              페이지를 찾을 수 없습니다
            </h1>
            
            <p className="text-gray-300 mb-8 leading-relaxed">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.<br />
              URL을 확인하시거나 아래 버튼을 통해 다른 페이지로 이동해주세요.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <WaveButton
                onClick={handleGoHome}
                className="flex-1"
              >
                <Home size={16} />
                홈으로 가기
              </WaveButton>
              
              <WaveButton
                variant="ghost"
                onClick={handleGoBack}
                className="flex-1"
              >
                <ArrowLeft size={16} />
                이전 페이지
              </WaveButton>
            </div>

            {/* Help Links */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-gray-400 mb-3">도움이 필요하신가요?</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <button 
                  onClick={() => navigate('/about')}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  서비스 소개
                </button>
                <span className="text-gray-500">•</span>
                <button 
                  onClick={() => navigate('/settings')}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  설정
                </button>
                <span className="text-gray-500">•</span>
                <button 
                  onClick={() => navigate('/terms')}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  이용약관
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default NotFound;