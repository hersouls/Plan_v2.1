#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';

console.log('🔍 Vite 응답 확인 중...\n');

const urls = [
  'http://localhost:3005/@vite/client',
  'http://localhost:3005/src/pages/TodoHome.tsx',
];

async function checkViteResponse() {
  for (const url of urls) {
    try {
      console.log(`📡 ${url} 확인 중...`);

      let command;
      if (os.platform() === 'win32') {
        // Windows PowerShell
        command = `powershell -Command "try { $response = Invoke-WebRequest -Uri '${url}' -UseBasicParsing -TimeoutSec 5; Write-Host 'Status:' $response.StatusCode; Write-Host 'Content-Type:' $response.Headers.'Content-Type'; if ($response.Content.Length -lt 1000) { Write-Host 'Content:' $response.Content } } catch { Write-Host 'Error:' $_.Exception.Message }"`;
      } else {
        // macOS/Linux
        command = `curl -I -s "${url}" | head -5`;
      }

      const output = execSync(command, { encoding: 'utf8', timeout: 10000 });
      console.log('응답:', output);

      // 응답 타입 확인
      if (
        output.includes('Content-Type: application/javascript') ||
        output.includes('Content-Type: text/javascript') ||
        output.includes('javascript') ||
        output.includes('export') ||
        output.includes('import')
      ) {
        console.log('✅ JS 모듈 응답 확인됨\n');
      } else if (
        output.includes('Content-Type: text/html') ||
        output.includes('<!DOCTYPE html>') ||
        output.includes('<html>')
      ) {
        console.log('❌ HTML 응답 - 프록시/서버가 가로채는 중\n');
      } else {
        console.log('⚠️  응답 타입 확인 필요\n');
      }
    } catch (error) {
      console.log(`❌ 오류: ${error.message}\n`);
    }
  }

  console.log('💡 확인 완료!');
  console.log('- JS 모듈 응답: Vite가 정상 작동 중');
  console.log('- HTML 응답: 프록시/서버가 가로채는 중 (포트 정리 필요)');
}

// 스크립트 실행
checkViteResponse();
