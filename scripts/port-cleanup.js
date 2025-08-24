#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';
import readline from 'readline';

console.log('🔍 3005 포트 점유 프로세스 확인 중...');

async function cleanupPort() {
  try {
    let command;
    const pids = [];

    if (os.platform() === 'win32') {
      // Windows
      command = 'netstat -ano | findstr :3005';
      const output = execSync(command, { encoding: 'utf8' });

      if (output.trim()) {
        console.log('발견된 프로세스:');
        console.log(output);

        // PID 추출
        const lines = output.trim().split('\n');
        lines.forEach(line => {
          const match = line.match(/\s+(\d+)$/);
          if (match) {
            pids.push(match[1]);
          }
        });
      }
    } else {
      // macOS/Linux
      command = 'lsof -i :3005';
      const output = execSync(command, { encoding: 'utf8' });

      if (output.trim()) {
        console.log('발견된 프로세스:');
        console.log(output);

        // PID 추출 (두 번째 줄부터)
        const lines = output.trim().split('\n').slice(1);
        lines.forEach(line => {
          const parts = line.split(/\s+/);
          if (parts[1]) {
            pids.push(parts[1]);
          }
        });
      }
    }

    if (pids.length === 0) {
      console.log('✅ 3005 포트를 점유하는 프로세스가 없습니다.');
      return;
    }

    console.log(
      `\n🚨 ${pids.length}개의 프로세스가 3005 포트를 점유하고 있습니다.`
    );
    console.log('PID 목록:', pids.join(', '));

    // 사용자 확인
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question('\n이 프로세스들을 종료하시겠습니까? (y/N): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\n🔄 프로세스 종료 중...');

      pids.forEach(pid => {
        try {
          if (os.platform() === 'win32') {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' });
          } else {
            execSync(`kill -9 ${pid}`, { stdio: 'pipe' });
          }
          console.log(`✅ PID ${pid} 종료 완료`);
        } catch (error) {
          console.log(`❌ PID ${pid} 종료 실패:`, error.message);
        }
      });

      console.log('\n🎉 포트 정리 완료! 이제 Vite를 실행할 수 있습니다.');
    } else {
      console.log('\n❌ 프로세스 종료를 취소했습니다.');
    }
  } catch (error) {
    if (error.status === 1) {
      console.log('✅ 3005 포트를 점유하는 프로세스가 없습니다.');
    } else {
      console.error('❌ 오류 발생:', error.message);
    }
  }
}

// 스크립트 실행
cleanupPort();
