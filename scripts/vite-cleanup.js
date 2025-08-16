#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Vite 캐시 정리 중...');

const cacheDirs = ['node_modules/.vite', 'dist', '.vite'];

const filesToRemove = [
  'vite.config.ts.timestamp-*',
  'vite.config.ts.meta.json',
];

let cleanedCount = 0;

// 캐시 디렉토리 정리
cacheDirs.forEach(dir => {
  const fullPath = path.resolve(dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ ${dir} 삭제 완료`);
      cleanedCount++;
    } catch (error) {
      console.log(`⚠️  ${dir} 삭제 실패:`, error.message);
    }
  } else {
    console.log(`ℹ️  ${dir} 존재하지 않음`);
  }
});

// 파일 정리 (glob 대신 간단한 방식 사용)
const rootDir = path.resolve(__dirname, '..');
const viteConfigPath = path.join(rootDir, 'vite.config.ts');

if (fs.existsSync(viteConfigPath)) {
  try {
    // 타임스탬프 파일들 정리
    const dir = path.dirname(viteConfigPath);
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (
        file.startsWith('vite.config.ts.timestamp-') ||
        file === 'vite.config.ts.meta.json'
      ) {
        const filePath = path.join(dir, file);
        fs.unlinkSync(filePath);
        console.log(`✅ ${file} 삭제 완료`);
        cleanedCount++;
      }
    });
  } catch (error) {
    console.log(`⚠️  타임스탬프 파일 정리 실패:`, error.message);
  }
}

if (cleanedCount > 0) {
  console.log(`\n🎉 ${cleanedCount}개의 캐시 항목이 정리되었습니다.`);
} else {
  console.log('\nℹ️  정리할 캐시가 없습니다.');
}

console.log('\n💡 이제 다음 명령어로 개발 서버를 실행하세요:');
console.log('   npm run dev:clean');
