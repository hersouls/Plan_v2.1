// 우주 배경 효과 - 단계별 재구성
// Step by Step으로 깔끔하게 구성된 우주 테마 배경

export function WaveBackground() {
  return (
    <div className="wave" data-testid="wave-background">
      {/* Step 1: 기본 우주 배경 */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />

      {/* Step 2: 깊이감을 위한 그라데이션 */}
      <div className="fixed inset-0 bg-gradient-to-t from-black/90 via-transparent to-gray-900/60" />

      {/* Step 3: 은하수 효과 */}
      <div className="fixed inset-0 opacity-40 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-pulse"
          style={{ transform: 'rotate(-12deg) scale(1.2)' }}
        />
      </div>

      {/* Step 4: 작은 별들 - 균등하게 분산 */}
      <div className="fixed inset-0 opacity-80 pointer-events-none overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => {
          const size = Math.random() * 2 + 1; // 1-3px 크기
          const colors = ['#ffffff', '#fbbf24', '#60a5fa', '#a855f7'];
          const color = colors[i % colors.length];

          return (
            <div
              key={`small-star-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: color,
                animation: `twinkle ${
                  Math.random() * 3 + 2
                }s ease-in-out infinite ${Math.random() * 2}s`,
                boxShadow: `0 0 ${size * 3}px ${color}`,
                filter: 'blur(0.2px)',
              }}
            />
          );
        })}
      </div>

      {/* Step 5: 큰 별들 - 적절한 크기로 균등 분산 */}
      <div className="fixed inset-0 opacity-90 pointer-events-none overflow-hidden">
        {Array.from({ length: 12 }).map((_, i) => {
          const size = Math.random() * 3 + 3; // 3-6px 크기
          const colors = ['#ffffff', '#fbbf24', '#60a5fa', '#f59e0b'];
          const color = colors[i % colors.length];

          return (
            <div
              key={`big-star-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: color,
                animation: `twinkle ${
                  Math.random() * 4 + 3
                }s ease-in-out infinite ${Math.random() * 3}s`,
                boxShadow: `0 0 ${size * 4}px ${color}`,
                filter: 'blur(0.3px)',
              }}
            />
          );
        })}
      </div>

      {/* Step 6: 유성 효과 - 적당한 크기와 개수 */}
      <div className="fixed inset-0 opacity-100 pointer-events-none overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => {
          const startPositions = [
            { left: '0%', top: '20%' },
            { left: '5%', top: '60%' },
            { left: '10%', top: '80%' },
            { left: '15%', top: '40%' },
            { left: '0%', top: '90%' },
            { left: '20%', top: '10%' },
          ];
          const pos = startPositions[i];

          return (
            <div
              key={`shooting-star-${i}`}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: pos.left,
                top: pos.top,
                animation: `shooting-star ${
                  Math.random() * 2 + 4
                }s linear infinite ${Math.random() * 3}s`,
                boxShadow: '0 0 15px #ffffff, 0 0 30px #ffffff',
                filter: 'blur(0.2px)',
              }}
            />
          );
        })}
      </div>

      {/* Step 7: 우주 먼지 효과 - 미세한 입자들 */}
      <div className="fixed inset-0 opacity-40 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => {
          const size = Math.random() * 1.5 + 0.5; // 0.5-2px 크기

          return (
            <div
              key={`dust-${i}`}
              className="absolute rounded-full bg-gray-300"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${
                  Math.random() * 6 + 8
                }s ease-in-out infinite ${Math.random() * 4}s`,
                filter: 'blur(0.3px)',
              }}
            />
          );
        })}
      </div>

      {/* Step 8: 최종 그라데이션 오버레이 */}
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-blue-900/3 to-purple-900/3" />
    </div>
  );
}

export default WaveBackground;
