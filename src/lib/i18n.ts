import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 한국어 번역
const ko = {
  translation: {
    // 공통
    common: {
      save: '저장',
      cancel: '취소',
      delete: '삭제',
      edit: '수정',
      add: '추가',
      loading: '로딩 중...',
      error: '오류가 발생했습니다.',
      success: '성공적으로 처리되었습니다.',
      confirm: '확인',
      close: '닫기',
    },

    // 네비게이션
    navigation: {
      home: '홈',
      tasks: '할일',
      family: '가족',
      statistics: '통계',
      settings: '설정',
      profile: '프로필',
    },

    // 할일 관련
    tasks: {
      title: '할일 관리',
      personal: '나만 보는 할일',
      group: '그룹 할일',
      addTask: '할일 추가',
      editTask: '할일 수정',
      deleteTask: '할일 삭제',
      taskTitle: '제목',
      taskDescription: '설명',
      taskDueDate: '마감일',
      taskPriority: '우선순위',
      taskCategory: '카테고리',
      taskStatus: '상태',
      taskAssignee: '담당자',
      taskTags: '태그',
      quickAdd: '빠른 할일 추가',
      today: '오늘',
      tomorrow: '내일',
      thisWeek: '이번 주',
      completed: '완료됨',
      pending: '대기 중',
      inProgress: '진행 중',
      overdue: '기한 초과',
    },

    // 설정 관련
    settings: {
      title: '설정',
      appearance: '외관',
      profile: '프로필',
      notifications: '알림',
      privacy: '프라이버시',
      data: '데이터',
      language: '언어',
      theme: '테마',
      timezone: '시간대',
      dateFormat: '날짜 형식',
      weekStartsOn: '주 시작일',
      colorTheme: '색상 테마',
      light: '라이트',
      dark: '다크',
      auto: '자동',
      saveSettings: '설정 저장',
    },

    // 가족 관련
    family: {
      title: '가족 관리',
      createGroup: '그룹 생성',
      joinGroup: '그룹 참여',
      inviteCode: '초대 코드',
      members: '멤버',
      role: '역할',
      owner: '그룹장',
      admin: '관리자',
      member: '멤버',
      inviteMember: '멤버 초대',
      removeMember: '멤버 제거',
      leaveGroup: '그룹 나가기',
      deleteGroup: '그룹 삭제',
    },

    // 통계 관련
    statistics: {
      title: '통계',
      overview: '개요',
      taskCompletion: '할일 완료율',
      productivity: '생산성',
      weeklyProgress: '주간 진행률',
      monthlyProgress: '월간 진행률',
      completedTasks: '완료된 할일',
      pendingTasks: '대기 중인 할일',
      overdueTasks: '기한 초과 할일',
    },

    // 인증 관련
    auth: {
      login: '로그인',
      logout: '로그아웃',
      signup: '회원가입',
      email: '이메일',
      password: '비밀번호',
      confirmPassword: '비밀번호 확인',
      forgotPassword: '비밀번호 찾기',
      resetPassword: '비밀번호 재설정',
      googleLogin: 'Google로 로그인',
      emailLogin: '이메일로 로그인',
    },

    // 채팅 관련
    chat: {
      title: '그룹 채팅',
      subtitle: '구성원들과 실시간으로 소통하세요',
      realtime: '실시간',
      search: '메시지 검색',
      pinned: '고정된 메시지',
      fullscreenOpen: '전체화면으로 보기',
      fullscreenClose: '전체화면 닫기',
      noMessages: '아직 메시지가 없습니다',
      sendFirst: '첫 번째 메시지를 보내보세요!',
      replyingTo: '{{name}}님에게 답장',
      edited: '편집됨',
      pinnedMark: '고정됨',
      emoji: '이모지',
      camera: '카메라',
      photo: '사진',
      file: '파일',
      authChecking: '인증 상태를 확인하는 중...',
      loginRequired: '로그인이 필요합니다.',
      loginToSend: '메시지를 보내려면 로그인이 필요합니다.',
      inputPlaceholder: '메시지를 입력하세요...',
      hintEnterSend: 'Enter로 전송, Shift+Enter로 줄바꿈',
      toastCopied: '메시지가 복사되었습니다',
      toastCopyFailed: '복사에 실패했습니다.',
      errorSendFailed: '메시지 전송에 실패했습니다.',
      errorFileProcessFailed: '파일 처리에 실패했습니다.',
    },
  },
};

// 영어 번역
const en = {
  translation: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      loading: 'Loading...',
      error: 'An error occurred.',
      success: 'Successfully processed.',
      confirm: 'Confirm',
      close: 'Close',
    },

    // Navigation
    navigation: {
      home: 'Home',
      tasks: 'Tasks',
      family: 'Family',
      statistics: 'Statistics',
      settings: 'Settings',
      profile: 'Profile',
    },

    // Tasks
    tasks: {
      title: 'Task Management',
      personal: 'Personal task',
      group: 'Group task',
      addTask: 'Add Task',
      editTask: 'Edit Task',
      deleteTask: 'Delete Task',
      taskTitle: 'Title',
      taskDescription: 'Description',
      taskDueDate: 'Due Date',
      taskPriority: 'Priority',
      taskCategory: 'Category',
      taskStatus: 'Status',
      taskAssignee: 'Assignee',
      taskTags: 'Tags',
      quickAdd: 'Quick Add Task',
      today: 'Today',
      tomorrow: 'Tomorrow',
      thisWeek: 'This Week',
      completed: 'Completed',
      pending: 'Pending',
      inProgress: 'In Progress',
      overdue: 'Overdue',
    },

    // Settings
    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      profile: 'Profile',
      notifications: 'Notifications',
      privacy: 'Privacy',
      data: 'Data',
      language: 'Language',
      theme: 'Theme',
      timezone: 'Timezone',
      dateFormat: 'Date Format',
      weekStartsOn: 'Week Starts On',
      colorTheme: 'Color Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      saveSettings: 'Save Settings',
    },

    // Family
    family: {
      title: 'Family Management',
      createGroup: 'Create Group',
      joinGroup: 'Join Group',
      inviteCode: 'Invite Code',
      members: 'Members',
      role: 'Role',
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      inviteMember: 'Invite Member',
      removeMember: 'Remove Member',
      leaveGroup: 'Leave Group',
      deleteGroup: 'Delete Group',
    },

    // Statistics
    statistics: {
      title: 'Statistics',
      overview: 'Overview',
      taskCompletion: 'Task Completion Rate',
      productivity: 'Productivity',
      weeklyProgress: 'Weekly Progress',
      monthlyProgress: 'Monthly Progress',
      completedTasks: 'Completed Tasks',
      pendingTasks: 'Pending Tasks',
      overdueTasks: 'Overdue Tasks',
    },

    // Auth
    auth: {
      login: 'Login',
      logout: 'Logout',
      signup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password',
      resetPassword: 'Reset Password',
      googleLogin: 'Login with Google',
      emailLogin: 'Login with Email',
    },

    // Chat
    chat: {
      title: 'Group Chat',
      subtitle: 'Chat with members in real time',
      realtime: 'Realtime',
      search: 'Search messages',
      pinned: 'Pinned messages',
      fullscreenOpen: 'Open fullscreen',
      fullscreenClose: 'Close fullscreen',
      noMessages: 'No messages yet',
      sendFirst: 'Be the first to send a message!',
      replyingTo: 'Replying to {{name}}',
      edited: 'Edited',
      pinnedMark: 'Pinned',
      emoji: 'Emoji',
      camera: 'Camera',
      photo: 'Photo',
      file: 'File',
      authChecking: 'Checking authentication...',
      loginRequired: 'Login required.',
      loginToSend: 'Login to send messages.',
      inputPlaceholder: 'Type a message...',
      hintEnterSend: 'Press Enter to send, Shift+Enter for newline',
      toastCopied: 'Message copied',
      toastCopyFailed: 'Failed to copy.',
      errorSendFailed: 'Failed to send message.',
      errorFileProcessFailed: 'Failed to process file.',
    },
  },
};

// 일본어 번역
const ja = {
  translation: {
    // 共通
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      add: '追加',
      loading: '読み込み中...',
      error: 'エラーが発生しました。',
      success: '正常に処理されました。',
      confirm: '確認',
      close: '閉じる',
    },

    // ナビゲーション
    navigation: {
      home: 'ホーム',
      tasks: 'タスク',
      family: '家族',
      statistics: '統計',
      settings: '設定',
      profile: 'プロフィール',
    },

    // タスク
    tasks: {
      title: 'タスク管理',
      addTask: 'タスク追加',
      editTask: 'タスク編集',
      deleteTask: 'タスク削除',
      taskTitle: 'タイトル',
      taskDescription: '説明',
      taskDueDate: '期限',
      taskPriority: '優先度',
      taskCategory: 'カテゴリ',
      taskStatus: 'ステータス',
      taskAssignee: '担当者',
      taskTags: 'タグ',
      quickAdd: 'クイック追加',
      today: '今日',
      tomorrow: '明日',
      thisWeek: '今週',
      completed: '完了',
      pending: '保留中',
      inProgress: '進行中',
      overdue: '期限超過',
    },

    // 設定
    settings: {
      title: '設定',
      appearance: '外観',
      profile: 'プロフィール',
      notifications: '通知',
      privacy: 'プライバシー',
      data: 'データ',
      language: '言語',
      theme: 'テーマ',
      timezone: 'タイムゾーン',
      dateFormat: '日付形式',
      weekStartsOn: '週の開始日',
      colorTheme: 'カラーテーマ',
      light: 'ライト',
      dark: 'ダーク',
      auto: '自動',
      saveSettings: '設定保存',
    },

    // 家族
    family: {
      title: '家族管理',
      createGroup: 'グループ作成',
      joinGroup: 'グループ参加',
      inviteCode: '招待コード',
      members: 'メンバー',
      role: '役割',
      owner: 'オーナー',
      admin: '管理者',
      member: 'メンバー',
      inviteMember: 'メンバー招待',
      removeMember: 'メンバー削除',
      leaveGroup: 'グループ退出',
      deleteGroup: 'グループ削除',
    },

    // 統計
    statistics: {
      title: '統計',
      overview: '概要',
      taskCompletion: 'タスク完了率',
      productivity: '生産性',
      weeklyProgress: '週間進捗',
      monthlyProgress: '月間進捗',
      completedTasks: '完了タスク',
      pendingTasks: '保留タスク',
      overdueTasks: '期限超過タスク',
    },

    // 認証
    auth: {
      login: 'ログイン',
      logout: 'ログアウト',
      signup: 'サインアップ',
      email: 'メールアドレス',
      password: 'パスワード',
      confirmPassword: 'パスワード確認',
      forgotPassword: 'パスワードを忘れた',
      resetPassword: 'パスワードリセット',
      googleLogin: 'Googleでログイン',
      emailLogin: 'メールでログイン',
    },
  },
};

// 중국어 번역
const zh = {
  translation: {
    // 通用
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      loading: '加载中...',
      error: '发生错误。',
      success: '处理成功。',
      confirm: '确认',
      close: '关闭',
    },

    // 导航
    navigation: {
      home: '首页',
      tasks: '任务',
      family: '家庭',
      statistics: '统计',
      settings: '设置',
      profile: '个人资料',
    },

    // 任务
    tasks: {
      title: '任务管理',
      addTask: '添加任务',
      editTask: '编辑任务',
      deleteTask: '删除任务',
      taskTitle: '标题',
      taskDescription: '描述',
      taskDueDate: '截止日期',
      taskPriority: '优先级',
      taskCategory: '类别',
      taskStatus: '状态',
      taskAssignee: '负责人',
      taskTags: '标签',
      quickAdd: '快速添加',
      today: '今天',
      tomorrow: '明天',
      thisWeek: '本周',
      completed: '已完成',
      pending: '待处理',
      inProgress: '进行中',
      overdue: '逾期',
    },

    // 设置
    settings: {
      title: '设置',
      appearance: '外观',
      profile: '个人资料',
      notifications: '通知',
      privacy: '隐私',
      data: '数据',
      language: '语言',
      theme: '主题',
      timezone: '时区',
      dateFormat: '日期格式',
      weekStartsOn: '周起始日',
      colorTheme: '颜色主题',
      light: '浅色',
      dark: '深色',
      auto: '自动',
      saveSettings: '保存设置',
    },

    // 家庭
    family: {
      title: '家庭管理',
      createGroup: '创建群组',
      joinGroup: '加入群组',
      inviteCode: '邀请码',
      members: '成员',
      role: '角色',
      owner: '群主',
      admin: '管理员',
      member: '成员',
      inviteMember: '邀请成员',
      removeMember: '移除成员',
      leaveGroup: '退出群组',
      deleteGroup: '删除群组',
    },

    // 统计
    statistics: {
      title: '统计',
      overview: '概览',
      taskCompletion: '任务完成率',
      productivity: '生产力',
      weeklyProgress: '周进度',
      monthlyProgress: '月进度',
      completedTasks: '已完成任务',
      pendingTasks: '待处理任务',
      overdueTasks: '逾期任务',
    },

    // 认证
    auth: {
      login: '登录',
      logout: '登出',
      signup: '注册',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      forgotPassword: '忘记密码',
      resetPassword: '重置密码',
      googleLogin: '使用Google登录',
      emailLogin: '使用邮箱登录',
    },
  },
};

// i18n 초기화
i18n.use(initReactI18next).init({
  resources: {
    ko,
    en,
    ja,
    zh,
  },
  lng: 'ko', // 기본 언어
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false, // React는 이미 XSS를 방지하므로 false
  },
  react: {
    useSuspense: false, // React 18 Suspense 호환성
  },
});

// 언어 변경 함수
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
  // HTML lang 속성도 함께 변경
  document.documentElement.lang = language;
  // localStorage에 저장
  localStorage.setItem('moonwave-language', language);
};

// 저장된 언어 불러오기
export const loadSavedLanguage = () => {
  const savedLanguage = localStorage.getItem('moonwave-language');
  if (savedLanguage && ['ko', 'en', 'ja', 'zh'].includes(savedLanguage)) {
    changeLanguage(savedLanguage);
  }
};

// 초기 언어 로드
loadSavedLanguage();

export default i18n;
