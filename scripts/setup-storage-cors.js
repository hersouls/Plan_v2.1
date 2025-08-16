#!/usr/bin/env node

/**
 * Firebase Storage CORS 설정 스크립트
 * 
 * 사용법:
 * node scripts/setup-storage-cors.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS 설정 JSON
const corsConfig = [
  {
    origin: [
      "http://localhost:3000",
      "http://localhost:3018", 
      "http://localhost:5173",
      "https://plan-e7bc6.web.app",
      "https://plan-e7bc6.firebaseapp.com"
    ],
    method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    maxAgeSeconds: 3600,
    responseHeader: [
      "Content-Type",
      "Authorization", 
      "Content-Length",
      "User-Agent",
      "x-goog-*"
    ]
  }
];

async function setupStorageCORS() {
  try {
    console.log('🔄 Firebase Storage CORS 설정을 업데이트하는 중...');
    
    // 임시 CORS 설정 파일 생성
    const corsFilePath = path.join(__dirname, 'cors.json');
    fs.writeFileSync(corsFilePath, JSON.stringify(corsConfig, null, 2));
    
    console.log('📝 CORS 설정 파일 생성됨:', corsFilePath);
    
    // Firebase Storage CORS 설정 적용
    const command = `gsutil cors set ${corsFilePath} gs://plan-e7bc6.firebasestorage.app`;
    
    console.log('🚀 CORS 설정 적용 중...');
    console.log('실행할 명령어:', command);
    
    try {
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Firebase Storage CORS 설정이 성공적으로 업데이트되었습니다!');
    } catch (error) {
      console.error('❌ CORS 설정 적용 실패:', error.message);
      console.log('\n📋 수동 설정 방법:');
      console.log('1. Google Cloud Console에 로그인');
      console.log('2. Firebase 프로젝트 선택');
      console.log('3. Storage > Rules로 이동');
      console.log('4. CORS 설정 추가');
      console.log('\n또는 다음 명령어를 직접 실행:');
      console.log(command);
    }
    
    // 임시 파일 삭제
    fs.unlinkSync(corsFilePath);
    console.log('🧹 임시 파일 정리 완료');
    
  } catch (error) {
    console.error('❌ CORS 설정 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
setupStorageCORS();
