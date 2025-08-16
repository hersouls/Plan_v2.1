const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Firebase Admin SDK 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/**
 * 기존 할일 데이터에 taskType 필드 추가
 */
async function migrateTaskTypes() {
  console.log('🚀 할일 타입 마이그레이션 시작...');
  
  try {
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.get();
    
    if (snapshot.empty) {
      console.log('📝 마이그레이션할 할일이 없습니다.');
      return;
    }
    
    console.log(`📊 총 ${snapshot.size}개의 할일을 마이그레이션합니다.`);
    
    const batch = db.batch();
    let count = 0;
    let personalCount = 0;
    let groupCount = 0;
    let errorCount = 0;
    
    snapshot.docs.forEach(doc => {
      try {
        const task = doc.data();
        
        // 기존에 taskType이 이미 있는지 확인
        if (task.taskType) {
          console.log(`⚠️  할일 ${doc.id}는 이미 taskType이 설정되어 있습니다: ${task.taskType}`);
          return;
        }
        
        // groupId 기반으로 taskType 결정
        const taskType = task.groupId ? 'group' : 'personal';
        
        // 업데이트할 데이터 준비
        const updateData = {
          taskType: taskType,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // 개인 할일인 경우 groupId를 null로 설정
        if (taskType === 'personal' && task.groupId) {
          updateData.groupId = null;
        }
        
        batch.update(doc.ref, updateData);
        
        if (taskType === 'personal') {
          personalCount++;
        } else {
          groupCount++;
        }
        
        count++;
        
        // 500개마다 배치 커밋
        if (count % 500 === 0) {
          await batch.commit();
          console.log(`✅ ${count}개 할일 마이그레이션 완료`);
          console.log(`   - 개인 할일: ${personalCount}개`);
          console.log(`   - 그룹 할일: ${groupCount}개`);
        }
        
      } catch (error) {
        console.error(`❌ 할일 ${doc.id} 마이그레이션 실패:`, error.message);
        errorCount++;
      }
    });
    
    // 남은 배치 커밋
    if (count % 500 !== 0) {
      await batch.commit();
    }
    
    console.log('\n🎉 마이그레이션 완료!');
    console.log(`📊 결과:`);
    console.log(`   - 총 처리된 할일: ${count}개`);
    console.log(`   - 개인 할일: ${personalCount}개`);
    console.log(`   - 그룹 할일: ${groupCount}개`);
    console.log(`   - 오류: ${errorCount}개`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 마이그레이션 결과 검증
 */
async function validateMigration() {
  console.log('\n🔍 마이그레이션 결과 검증 중...');
  
  try {
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.get();
    
    let personalCount = 0;
    let groupCount = 0;
    let errorCount = 0;
    let missingTaskType = 0;
    let invalidGroupId = 0;
    
    snapshot.docs.forEach(doc => {
      const task = doc.data();
      
      // taskType 필드 확인
      if (!task.taskType) {
        console.error(`❌ 할일 ${doc.id}: taskType 필드 누락`);
        missingTaskType++;
        errorCount++;
        return;
      }
      
      // taskType과 groupId 일관성 확인
      if (task.taskType === 'personal') {
        personalCount++;
        if (task.groupId) {
          console.error(`❌ 개인 할일 ${doc.id}: groupId가 설정되어 있음 (${task.groupId})`);
          invalidGroupId++;
          errorCount++;
        }
      } else if (task.taskType === 'group') {
        groupCount++;
        if (!task.groupId) {
          console.error(`❌ 그룹 할일 ${doc.id}: groupId가 누락됨`);
          invalidGroupId++;
          errorCount++;
        }
      } else {
        console.error(`❌ 할일 ${doc.id}: 잘못된 taskType (${task.taskType})`);
        errorCount++;
      }
    });
    
    console.log('\n📊 검증 결과:');
    console.log(`   - 총 할일: ${snapshot.size}개`);
    console.log(`   - 개인 할일: ${personalCount}개`);
    console.log(`   - 그룹 할일: ${groupCount}개`);
    console.log(`   - taskType 누락: ${missingTaskType}개`);
    console.log(`   - groupId 불일치: ${invalidGroupId}개`);
    console.log(`   - 총 오류: ${errorCount}개`);
    
    if (errorCount === 0) {
      console.log('✅ 모든 할일이 올바르게 마이그레이션되었습니다!');
    } else {
      console.log('⚠️  일부 할일에 문제가 있습니다. 수동으로 확인해주세요.');
    }
    
  } catch (error) {
    console.error('❌ 검증 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 롤백 스크립트 (필요시 사용)
 */
async function rollbackTaskTypes() {
  console.log('🔄 할일 타입 롤백 시작...');
  
  try {
    const tasksRef = db.collection('tasks');
    const snapshot = await tasksRef.get();
    
    const batch = db.batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      const task = doc.data();
      
      // taskType 필드 제거
      batch.update(doc.ref, {
        taskType: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      count++;
      
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`🔄 ${count}개 할일 롤백 완료`);
      }
    });
    
    if (count % 500 !== 0) {
      await batch.commit();
    }
    
    console.log(`✅ 롤백 완료! 총 ${count}개 할일 처리`);
    
  } catch (error) {
    console.error('❌ 롤백 중 오류 발생:', error);
    throw error;
  }
}

// 메인 실행 함수
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await migrateTaskTypes();
      break;
    case 'validate':
      await validateMigration();
      break;
    case 'rollback':
      await rollbackTaskTypes();
      break;
    case 'full':
      await migrateTaskTypes();
      await validateMigration();
      break;
    default:
      console.log('사용법:');
      console.log('  node migrate-task-types.js migrate   - 마이그레이션 실행');
      console.log('  node migrate-task-types.js validate  - 결과 검증');
      console.log('  node migrate-task-types.js rollback  - 롤백 실행');
      console.log('  node migrate-task-types.js full      - 마이그레이션 + 검증');
      break;
  }
  
  process.exit(0);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateTaskTypes,
  validateMigration,
  rollbackTaskTypes
};
