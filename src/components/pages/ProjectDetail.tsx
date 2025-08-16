import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Mail, Globe, Music, CreditCard, Coins, Gift, TrendingUp, Crown } from 'lucide-react';
import { Header } from '../layout/Header';
import { WaveBackground } from '../layout/WaveBackground';
import { GlassCard } from '../ui/GlassCard';
import { WaveButton } from '../ui/WaveButton';

interface ProjectData {
  name: string;
  url: string;
  description: string;
  icon: any;
  color: string;
  longDescription: string;
  features: string[];
  technologies: string[];
  status: string;
  launchDate: string;
}

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();

  const projects: Record<string, ProjectData> = {
    'music-platform': {
      name: 'Music Platform',
      url: 'music.moonwave.kr',
      description: 'Moonwave만의 감성음악 제작',
      icon: Music,
      color: 'from-purple-500 to-pink-500',
      longDescription: 'Moonwave만의 독특한 감성과 철학을 담은 음악 제작 플랫폼입니다. AI 기술을 활용하여 개인만의 고유한 음악 파동을 만들어갑니다.',
      features: [
        'AI 기반 음악 생성 및 편집',
        '개인화된 플레이리스트 추천',
        '실시간 음악 공유 및 협업',
        '다양한 장르와 스타일 지원',
        '모바일 최적화 인터페이스'
      ],
      technologies: ['React', 'Node.js', 'Web Audio API', 'AI Music Generation', 'Cloud Storage'],
      status: '개발 중',
      launchDate: '2025년 Q2 예정'
    },
    'travel-service': {
      name: 'Travel Service',
      url: 'travel.moonwave.kr',
      description: 'Moonwave과 함께 세계여행',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
      longDescription: '세계 각지의 아름다운 여행지를 Moonwave만의 관점으로 소개하고, 개인화된 여행 경험을 제공합니다.',
      features: [
        '개인화된 여행 경로 추천',
        '실시간 여행 정보 업데이트',
        '여행 사진 및 메모 관리',
        '여행 커뮤니티 및 리뷰',
        '여행 예산 관리 도구'
      ],
      technologies: ['React Native', 'Firebase', 'Google Maps API', 'Image Recognition', 'Social Features'],
      status: '베타 서비스',
      launchDate: '2024년 12월'
    },
    'subscription-manager': {
      name: 'Subscription Manager',
      url: 'sub.moonwave.kr',
      description: 'AI 서비스 중심의 구독 관리',
      icon: CreditCard,
      color: 'from-green-500 to-emerald-500',
      longDescription: 'AI 서비스와 디지털 구독 서비스를 효율적으로 관리하고 최적화할 수 있는 스마트 구독 관리 플랫폼입니다.',
      features: [
        '구독 서비스 통합 관리',
        'AI 기반 비용 최적화 추천',
        '자동 갱신 알림 및 제어',
        '사용량 분석 및 리포트',
        '구독 서비스 비교 분석'
      ],
      technologies: ['Vue.js', 'Python', 'Machine Learning', 'Payment APIs', 'Analytics'],
      status: '계획 중',
      launchDate: '2025년 Q3 예정'
    },
    'crypto-trading': {
      name: 'Crypto Trading',
      url: 'btc.moonwave.kr',
      description: 'Moonwave와 함께하는 크립토 매매',
      icon: Coins,
      color: 'from-yellow-500 to-orange-500',
      longDescription: '크립토 자산의 안전하고 효율적인 거래를 위한 전문 플랫폼으로, Moonwave만의 전략적 접근 방식을 제공합니다.',
      features: [
        '실시간 시장 데이터 분석',
        'AI 기반 거래 신호 제공',
        '포트폴리오 관리 및 추적',
        '리스크 관리 도구',
        '다양한 거래소 연동'
      ],
      technologies: ['Next.js', 'WebSocket', 'Trading APIs', 'Blockchain', 'Data Analytics'],
      status: '개발 중',
      launchDate: '2025년 Q4 예정'
    },
    'music-album': {
      name: 'Music Album',
      url: 'oh.moonwave.kr',
      description: '국가대표 오안나 헌정 앨범',
      icon: Gift,
      color: 'from-pink-500 to-rose-500',
      longDescription: '국가대표 선수 오안나를 위한 특별한 헌정 앨범 프로젝트로, Moonwave만의 음악적 감성으로 스포츠 정신을 표현합니다.',
      features: [
        '독창적인 헌정 곡 작곡',
        '인터랙티브 음악 경험',
        '팬 참여형 콘텐츠',
        '스포츠 정신 표현',
        '특별한 음악 비주얼'
      ],
      technologies: ['Web Audio', 'Canvas API', 'Interactive Media', 'Sound Design', 'Visual Effects'],
      status: '완료',
      launchDate: '2024년 8월'
    },
    'financial-strategy': {
      name: 'Financial Strategy',
      url: 'financial.moonwave.kr',
      description: 'Moonwave와 함께하는 금융투자 전략',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-500',
      longDescription: '개인 투자자들을 위한 스마트한 금융 전략 플랫폼으로, Moonwave만의 분석적 접근으로 투자 성공률을 높입니다.',
      features: [
        'AI 기반 투자 전략 분석',
        '포트폴리오 최적화',
        '시장 트렌드 예측',
        '리스크 평가 도구',
        '투자 교육 콘텐츠'
      ],
      technologies: ['React', 'Python', 'Financial APIs', 'Machine Learning', 'Data Visualization'],
      status: '계획 중',
      launchDate: '2025년 Q1 예정'
    },
    'kids-platform': {
      name: 'Kids Platform',
      url: 'lego.moonwave.kr',
      description: '아이들과 함께 Lego 블럭 재사용 조립놀이',
      icon: Crown,
      color: 'from-indigo-500 to-purple-500',
      longDescription: '아이들의 창의력과 문제 해결 능력을 키우는 교육적 레고 플랫폼으로, 지속가능한 놀이 문화를 만들어갑니다.',
      features: [
        '가상 레고 조립 시뮬레이션',
        '교육적 퍼즐 및 도전 과제',
        '부모-자녀 협업 기능',
        '창작물 공유 커뮤니티',
        '진행 상황 추적 및 성취감'
      ],
      technologies: ['Three.js', 'WebGL', 'Game Engine', 'Educational Content', 'Social Features'],
      status: '개발 중',
      launchDate: '2025년 Q2 예정'
    }
  };

  const project = projects[projectId || ''];

  if (!project) {
    return (
      <div className="min-h-screen relative">
        <WaveBackground />
        <Header />
        <main className="pt-28 pb-6 relative z-10">
          <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <GlassCard variant="strong" className="p-8 text-center">
              <h1 className="text-3xl font-bold text-white mb-4">프로젝트를 찾을 수 없습니다</h1>
              <p className="text-white opacity-80 mb-6">요청하신 프로젝트 정보가 존재하지 않습니다.</p>
              <Link to="/about">
                <WaveButton variant="primary">About 페이지로 돌아가기</WaveButton>
              </Link>
            </GlassCard>
          </div>
        </main>
      </div>
    );
  }

  const IconComponent = project.icon;

  return (
    <div className="min-h-screen relative">
      <WaveBackground />
      <Header />
      
      <main className="pt-28 pb-6 relative z-10">
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          
          {/* Navigation */}
          <div className="mb-8">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-white hover:text-primary-400 transition-colors duration-200"
            >
              <ArrowLeft size={16} />
              <span>About 페이지로 돌아가기</span>
            </Link>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-8">
            <GlassCard variant="strong" className="p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-r ${project.color}`}>
                    <IconComponent size={32} className="text-white" />
                  </div>
                  <div className="text-left">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-normal">
                      {project.name}
                    </h1>
                    <p className="text-lg text-white opacity-80 tracking-normal">
                      {project.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-sm text-white tracking-normal">{project.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white opacity-60 tracking-normal">출시 예정:</span>
                    <span className="text-sm text-white tracking-normal">{project.launchDate}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-8">
            
            {/* Project Overview */}
            <GlassCard variant="light" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-r ${project.color}`}>
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-normal">
                      프로젝트 개요
                    </h2>
                    <p className="text-sm text-white tracking-normal opacity-80">
                      {project.url}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 text-base text-white tracking-normal leading-relaxed">
                  <p className="break-keep-ko text-lg">
                    {project.longDescription}
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Features */}
            <GlassCard variant="light" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-normal">
                      주요 기능
                    </h2>
                    <p className="text-sm text-white tracking-normal opacity-80">
                      프로젝트의 핵심 기능들
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.features.map((feature, index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg">
                      <p className="text-white text-sm font-medium tracking-normal">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Technologies */}
            <GlassCard variant="light" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Crown size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-normal">
                      사용 기술
                    </h2>
                    <p className="text-sm text-white tracking-normal opacity-80">
                      프로젝트 개발에 사용된 기술 스택
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-white/10 rounded-full text-white text-sm font-medium tracking-normal"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Contact & Links */}
            <GlassCard variant="strong" className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Mail size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white tracking-normal">
                      프로젝트 관련 문의
                    </h2>
                    <p className="text-sm text-white tracking-normal opacity-80">
                      궁금한 점이 있으시면 언제든 연락주세요
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <WaveButton
                    variant="primary"
                    onClick={() =>
                      (window.location.href = 'mailto:deasoung@gmail.com')
                    }
                    className="px-6 py-3"
                  >
                    <Mail className="w-5 h-5" />
                    프로젝트 문의하기
                  </WaveButton>

                  <WaveButton
                    variant="secondary"
                    onClick={() =>
                      window.open(`https://${project.url}`, '_blank')
                    }
                    className="px-6 py-3"
                  >
                    <ExternalLink className="w-5 h-5" />
                    프로젝트 방문하기
                  </WaveButton>
                </div>

                <div className="text-center space-y-3">
                  <p className="text-white text-sm opacity-60 tracking-normal">
                    Moonwave Plan HQ
                  </p>
                  <p className="text-white text-sm opacity-80 tracking-normal">
                    전략적 디지털 계획실에서 당신의 계획 파동을 기다립니다.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProjectDetail;
