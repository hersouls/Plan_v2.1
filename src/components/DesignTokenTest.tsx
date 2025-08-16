import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GlassCard } from './ui/GlassCard';

export const DesignTokenTest: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 lg:mb-8 text-center">디자인 토큰 테스트</h1>
        
        {/* CSS Variables Test */}
        <GlassCard variant="default" className="p-4 sm:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground mb-4">CSS 변수 테스트</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--semantic-primary-500)' }}>
              <span className="text-white text-sm sm:text-base font-medium">Primary</span>
            </div>
            <div className="p-3 sm:p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--semantic-success-500)' }}>
              <span className="text-white text-sm sm:text-base font-medium">Success</span>
            </div>
            <div className="p-3 sm:p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--semantic-warning-500)' }}>
              <span className="text-white text-sm sm:text-base font-medium">Warning</span>
            </div>
            <div className="p-3 sm:p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--semantic-danger-500)' }}>
              <span className="text-white text-sm sm:text-base font-medium">Danger</span>
            </div>
          </div>
        </GlassCard>

        {/* Tailwind Color Classes Test */}
        <GlassCard variant="default" className="p-6 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Tailwind 색상 클래스 테스트</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-primary text-primary-foreground">
              Primary
            </div>
            <div className="p-4 rounded-lg bg-success text-white">
              Success
            </div>
            <div className="p-4 rounded-lg bg-warning text-white">
              Warning
            </div>
            <div className="p-4 rounded-lg bg-error text-white">
              Error
            </div>
          </div>
        </GlassCard>

        {/* Spacing Test */}
        <GlassCard variant="default" className="p-6 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">스페이싱 토큰 테스트</h2>
          <div className="space-y-4">
            <div className="bg-primary-light p-xs rounded-lg">
              padding-xs (8px)
            </div>
            <div className="bg-primary-light p-sm rounded-lg">
              padding-sm (16px)
            </div>
            <div className="bg-primary-light p-md rounded-lg">
              padding-md (24px)
            </div>
            <div className="bg-primary-light p-lg rounded-lg">
              padding-lg (32px)
            </div>
            <div className="bg-primary-light p-xl rounded-lg">
              padding-xl (48px)
            </div>
          </div>
        </GlassCard>

        {/* Button Component Test */}
        <GlassCard variant="default" className="p-4 sm:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground mb-4">버튼 컴포넌트 테스트</h2>
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              <Button variant="primary" size="sm" className="text-sm">Primary Small</Button>
              <Button variant="primary" size="default">Primary Default</Button>
              <Button variant="primary" size="lg" className="hidden sm:block">Primary Large</Button>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
              <Button variant="secondary" size="default">Secondary</Button>
              <Button variant="destructive" size="default">Destructive</Button>
              <Button variant="outline" size="default">Outline</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              <Button variant="task-complete" size="default">완료</Button>
              <Button variant="task-pending" size="default">대기중</Button>
              <Button variant="task-progress" size="default">진행중</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <Button variant="category-home" size="default">집안일</Button>
              <Button variant="category-work" size="default">업무</Button>
              <Button variant="category-personal" size="default">개인</Button>
              <Button variant="category-shopping" size="default">쇼핑</Button>
            </div>
          </div>
        </GlassCard>

        {/* Input Component Test */}
        <GlassCard variant="default" className="p-4 sm:p-6 mb-6 lg:mb-8">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground mb-4">입력 컴포넌트 테스트</h2>
          <div className="space-y-3 sm:space-y-4">
            <Input variant="default" placeholder="Small input" className="h-8" />
            <Input variant="default" placeholder="Default input" />
            <Input variant="default" placeholder="Large input" className="hidden sm:block h-12" />
            <Input variant="family-friendly" placeholder="Family-friendly input" />
            <Input variant="solid" placeholder="Solid input" />
          </div>
        </GlassCard>

        {/* Glass Card Variants Test */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <GlassCard variant="light" className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Light Glass</h3>
            <p className="text-sm sm:text-base text-muted-foreground">가벼운 글래스 카드 효과입니다.</p>
          </GlassCard>
          <GlassCard variant="medium" className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Medium Glass</h3>
            <p className="text-sm sm:text-base text-muted-foreground">중간 강도의 글래스 카드 효과입니다.</p>
          </GlassCard>
          <GlassCard variant="strong" className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Strong Glass</h3>
            <p className="text-sm sm:text-base text-muted-foreground">강한 글래스 카드 효과입니다.</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default DesignTokenTest;