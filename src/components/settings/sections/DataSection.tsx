import {
  AlertTriangle,
  Download,
  Key,
  LogOut,
  Play,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { BackupScheduler, BackupService } from '../../../lib/backup';
import logger from '../../../lib/logger';
import { cn } from '../../../lib/utils';
import { InlineLoading } from '../../common/LoadingSpinner';
import { WaveButton } from '../../ui/WaveButton';
import { Typography } from '../../ui/typography';
import type { SettingsSectionProps } from '../types';

export function DataSection({
  isActive,
  settings,
  onUpdate,
}: SettingsSectionProps) {
  const [signOut, setSignOut] = useState<(() => Promise<void>) | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backupStatus, setBackupStatus] = useState<
    'idle' | 'running' | 'completed' | 'error'
  >('idle');
  const [backupMessage, setBackupMessage] = useState('');
  const [backupList, setBackupList] = useState<
    Array<{
      name: string;
      timestamp: number | string;
      frequency: 'weekly' | 'monthly' | string;
      path: string;
    }>
  >([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  // AuthContext 접근을 안전하게 처리
  const authContext = useAuth();

  useEffect(() => {
    try {
      const fn = authContext.signOut;
      setSignOut(() =>
        fn
          ? async () => {
              await fn();
            }
          : async () => {}
      );
    } catch (error) {
      logger.error('DataSection', 'access auth context failed', error);
      // Auth context가 없어도 기본적으로 작동
    }
  }, [authContext.signOut]);

  const updateData = (field: keyof typeof settings.data, value: string | boolean | number) => {
    onUpdate({
      type: 'UPDATE_DATA',
      payload: {
        [field]: value,
      },
    });
  };

  const exportData = async () => {
    setExporting(true);
    try {
      // Export user data
      const data = {
        profile: settings.profile,
        notifications: settings.notifications,
        appearance: settings.appearance,
        privacy: settings.privacy,
        data: settings.data,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `moonwave-data-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('DataSection', 'export data failed', error);
      alert('데이터 내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 데이터 유효성 검사
      if (!data.profile || !data.notifications || !data.appearance) {
        throw new Error('유효하지 않은 데이터 형식입니다.');
      }

      // 데이터 복원
      onUpdate({ type: 'LOAD_SETTINGS', payload: data });
      alert('데이터를 성공적으로 가져왔습니다.');
    } catch (error) {
      logger.error('DataSection', 'import data failed', error);
      alert('데이터 가져오기에 실패했습니다. 파일 형식을 확인해주세요.');
    } finally {
      setImporting(false);
      // 파일 입력 리셋
      event.target.value = '';
    }
  };

  const clearAllData = async () => {
    const confirmed = window.confirm(
      '모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?'
    );

    if (confirmed) {
      const doubleConfirmed = window.confirm(
        '정말로 모든 데이터를 삭제하시겠습니까?\n\n마지막 확인입니다.'
      );

      if (doubleConfirmed) {
        try {
          // 앱 관련 데이터만 안전하게 삭제
          const appKeys = [
            'moonwave-settings',
            'moonwave-settings-tab',
            'moonwave-user-preferences',
            'moonwave-cache',
            'moonwave-backup',
          ];
          
          appKeys.forEach(key => {
            localStorage.removeItem(key);
          });

          // 설정 초기화
          onUpdate({ type: 'RESET_TO_DEFAULTS' });

          alert('모든 데이터가 삭제되었습니다.');
        } catch (error) {
          logger.error('DataSection', 'clear data failed', error);
          alert('데이터 삭제에 실패했습니다.');
        }
      }
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('로그아웃하시겠습니까?');
    if (confirmed && signOut) {
      try {
        await signOut();
      } catch (error) {
        logger.error('DataSection', 'sign out failed', error);
        alert('로그아웃에 실패했습니다.');
      }
    }
  };

  // 백업 관련 함수들
  const handleAutoBackupToggle = async (enabled: boolean) => {
    updateData('autoBackup', enabled);

    if (enabled && authContext.user?.uid) {
      // 자동 백업 활성화 시 스케줄 시작
      const scheduler = BackupScheduler.getInstance();
      scheduler.startScheduledBackup(
        authContext.user.uid,
        settings.data.backupFrequency as 'weekly' | 'monthly'
      );
      setBackupMessage('자동 백업이 활성화되었습니다.');
    } else if (!enabled && authContext.user?.uid) {
      // 자동 백업 비활성화 시 스케줄 중지
      const scheduler = BackupScheduler.getInstance();
      scheduler.stopScheduledBackup(
        authContext.user.uid,
        settings.data.backupFrequency as 'weekly' | 'monthly'
      );
      setBackupMessage('자동 백업이 비활성화되었습니다.');
    }
  };

  const handleBackupFrequencyChange = async (frequency: string) => {
    updateData('backupFrequency', frequency);

    if (settings.data.autoBackup && authContext.user?.uid) {
      // 기존 스케줄 중지 후 새로운 주기로 시작
      const scheduler = BackupScheduler.getInstance();
      scheduler.stopScheduledBackup(
        authContext.user.uid,
        settings.data.backupFrequency as 'weekly' | 'monthly'
      );
      scheduler.startScheduledBackup(
        authContext.user.uid,
        frequency as 'weekly' | 'monthly'
      );
      setBackupMessage(
        `백업 주기가 ${
          frequency === 'weekly' ? '매주' : '매월'
        }로 변경되었습니다.`
      );
    }
  };

  const createManualBackup = async () => {
    if (!authContext.user?.uid) {
      alert('로그인이 필요합니다.');
      return;
    }

    setBackupStatus('running');
    setBackupMessage('백업을 생성하고 있습니다...');

    try {
      const backupService = new BackupService(authContext.user.uid);
      await backupService.createAutoBackup(
        settings.data.backupFrequency as 'weekly' | 'monthly'
      );

      setBackupStatus('completed');
      setBackupMessage('백업이 성공적으로 생성되었습니다.');

      // 백업 목록 새로고침
      loadBackupList();

      setTimeout(() => {
        setBackupStatus('idle');
        setBackupMessage('');
      }, 3000);
    } catch (error) {
      logger.error('DataSection', 'backup failed', error);
      setBackupStatus('error');
      setBackupMessage('백업 생성에 실패했습니다.');

      setTimeout(() => {
        setBackupStatus('idle');
        setBackupMessage('');
      }, 3000);
    }
  };

  const loadBackupList = useCallback(async () => {
    if (!authContext.user?.uid) return;

    setLoadingBackups(true);
    try {
      const backupService = new BackupService(authContext.user.uid);
      const backups = await backupService.getBackupList();
      setBackupList(backups);
    } catch (error) {
      logger.error('DataSection', 'load backup list failed', error);
    } finally {
      setLoadingBackups(false);
    }
  }, [authContext.user?.uid]);

  const restoreFromBackup = async (backupPath: string) => {
    if (!authContext.user?.uid) {
      alert('로그인이 필요합니다.');
      return;
    }

    const confirmed = window.confirm(
      '백업에서 데이터를 복원하시겠습니까?\n\n현재 데이터는 덮어쓰여집니다.'
    );

    if (!confirmed) return;

    setBackupStatus('running');
    setBackupMessage('백업에서 데이터를 복원하고 있습니다...');

    try {
      const backupService = new BackupService(authContext.user.uid);
      const backupData = await backupService.restoreBackup(backupPath);

      // 백업 데이터를 설정에 적용
      onUpdate({ type: 'LOAD_SETTINGS', payload: backupData.data.settings });

      setBackupStatus('completed');
      setBackupMessage('데이터가 성공적으로 복원되었습니다.');

      setTimeout(() => {
        setBackupStatus('idle');
        setBackupMessage('');
      }, 3000);
    } catch (error) {
      logger.error('DataSection', 'restore failed', error);
      setBackupStatus('error');
      setBackupMessage('데이터 복원에 실패했습니다.');

      setTimeout(() => {
        setBackupStatus('idle');
        setBackupMessage('');
      }, 3000);
    }
  };

  const deleteBackup = async (backupPath: string) => {
    if (!authContext.user?.uid) return;

    const confirmed = window.confirm('이 백업을 삭제하시겠습니까?');

    if (!confirmed) return;

    try {
      const backupService = new BackupService(authContext.user.uid);
      await backupService.deleteBackup(backupPath);

      // 백업 목록 새로고침
      loadBackupList();
      alert('백업이 삭제되었습니다.');
    } catch (error) {
      logger.error('DataSection', 'delete backup failed', error);
      alert('백업 삭제에 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 백업 목록 로드
  useEffect(() => {
    if (isActive && authContext.user?.uid) {
      loadBackupList();
    }
  }, [isActive, authContext.user?.uid, loadBackupList]);

  if (!isActive) return null;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Data Backup Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          데이터 백업
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          설정과 데이터를 안전하게 백업하세요
        </Typography.Caption>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <RefreshCw size={20} className="text-green-400" />
              </div>
              <div>
                <Typography.Body className="text-white font-semibold">
                  자동 백업
                </Typography.Body>
                <Typography.Caption className="text-white/70">
                  설정을 자동으로 백업합니다
                </Typography.Caption>
              </div>
            </div>
            <button
              onClick={() => handleAutoBackupToggle(!settings.data.autoBackup)}
              className={cn(
                'relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-400/30',
                settings.data.autoBackup
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg'
                  : 'bg-white/20 border border-white/30 hover:bg-white/30'
              )}
              role="switch"
              aria-checked={settings.data.autoBackup}
            >
              <div
                className={cn(
                  'absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 top-1',
                  settings.data.autoBackup ? 'translate-x-7' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {settings.data.autoBackup && (
            <div className="ml-8 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="space-y-4">
                <div className="group">
                  <Typography.Label className="text-white/90 mb-2 block">
                    백업 주기
                  </Typography.Label>
                  <select
                    value={settings.data.backupFrequency}
                    onChange={e => handleBackupFrequencyChange(e.target.value)}
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-xl',
                      'bg-background/95 backdrop-blur-sm',
                      'text-foreground',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                      'group-hover:shadow-md'
                    )}
                  >
                    <option value="weekly">매주</option>
                    <option value="monthly">매월</option>
                  </select>
                </div>

                <div className="group">
                  <Typography.Label className="text-white/90 mb-2 block">
                    데이터 보관 기간
                  </Typography.Label>
                  <select
                    value={settings.data.dataRetention}
                    onChange={e =>
                      updateData('dataRetention', parseInt(e.target.value))
                    }
                    className={cn(
                      'w-full px-4 py-3 border-2 rounded-xl',
                      'bg-background/95 backdrop-blur-sm',
                      'text-foreground',
                      'transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-400/30 focus:border-primary-400',
                      'group-hover:shadow-md'
                    )}
                  >
                    <option value={30}>30일</option>
                    <option value={90}>90일</option>
                    <option value={180}>180일</option>
                    <option value={365}>1년</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 백업 상태 메시지 */}
          {backupMessage && (
            <div
              className={cn(
                'p-3 rounded-lg text-sm',
                backupStatus === 'completed' &&
                  'bg-green-500/20 text-green-200',
                backupStatus === 'error' && 'bg-red-500/20 text-red-200',
                backupStatus === 'running' && 'bg-blue-500/20 text-blue-200',
                backupStatus === 'idle' && 'bg-white/10 text-white/80'
              )}
            >
              {backupMessage}
            </div>
          )}

          {/* 수동 백업 버튼 */}
          <div className="flex justify-center pt-4">
            <WaveButton
              onClick={createManualBackup}
              disabled={backupStatus === 'running'}
              variant="ghost"
              className="text-white/80 hover:text-white border border-white/20 hover:border-white/40"
            >
              {backupStatus === 'running' ? (
                <InlineLoading />
              ) : (
                <>
                  <Play size={18} className="mr-2" />
                  지금 백업하기
                </>
              )}
            </WaveButton>
          </div>
        </div>
      </div>

      {/* 백업 목록 섹션 */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          백업 목록
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          생성된 백업 파일들을 확인하고 관리할 수 있습니다
        </Typography.Caption>

        {loadingBackups ? (
          <div className="flex items-center justify-center py-8">
            <InlineLoading />
          </div>
        ) : backupList.length > 0 ? (
          <div className="space-y-3">
            {backupList.map((backup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Download size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <Typography.Body className="text-white font-semibold">
                      {backup.name}
                    </Typography.Body>
                    <Typography.Caption className="text-white/70">
                      {new Date(backup.timestamp).toLocaleString('ko-KR')} •{' '}
                      {backup.frequency === 'weekly' ? '주간' : '월간'} 백업
                    </Typography.Caption>
                  </div>
                </div>
                <div className="flex gap-2">
                  <WaveButton
                    size="sm"
                    variant="ghost"
                    onClick={() => restoreFromBackup(backup.path)}
                    className="text-green-400 hover:text-green-300"
                  >
                    복원
                  </WaveButton>
                  <WaveButton
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteBackup(backup.path)}
                    className="text-red-400 hover:text-red-300"
                  >
                    삭제
                  </WaveButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Typography.Caption className="text-white/60">
              아직 생성된 백업이 없습니다.
            </Typography.Caption>
          </div>
        )}
      </div>

      {/* Data Management Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          데이터 관리
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          데이터를 내보내거나 가져올 수 있습니다
        </Typography.Caption>

        <div className="space-y-6">
          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <Typography.Body className="text-white font-semibold mb-3">
              내보내기
            </Typography.Body>
            <Typography.Caption className="text-white/70 mb-4 block">
              내 설정과 데이터를 JSON 파일로 내보냅니다. 이 파일을 통해 다른
              기기에서 설정을 복원할 수 있습니다.
            </Typography.Caption>
            <WaveButton
              onClick={exportData}
              disabled={exporting}
              variant="ghost"
              className="text-white/80 hover:text-white border border-white/20 hover:border-white/40"
            >
              {exporting ? (
                <InlineLoading />
              ) : (
                <>
                  <Download size={18} className="mr-2" />
                  데이터 내보내기
                </>
              )}
            </WaveButton>
          </div>

          <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <Typography.Body className="text-white font-semibold mb-3">
              가져오기
            </Typography.Body>
            <Typography.Caption className="text-white/70 mb-4 block">
              이전에 내보낸 설정 파일을 가져와서 설정을 복원합니다. 현재 설정은
              덮어쓰여집니다.
            </Typography.Caption>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                disabled={importing}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <WaveButton
                disabled={importing}
                variant="ghost"
                className="text-white/80 hover:text-white border border-white/20 hover:border-white/40 pointer-events-none"
              >
                {importing ? (
                  <InlineLoading />
                ) : (
                  <>
                    <Upload size={18} className="mr-2" />
                    데이터 가져오기
                  </>
                )}
              </WaveButton>
            </div>
          </div>
        </div>
      </div>

      {/* Account Management Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          계정 관리
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          계정과 관련된 작업을 수행할 수 있습니다
        </Typography.Caption>

        <div className="space-y-4">
          <WaveButton
            variant="ghost"
            className="w-full justify-start p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg text-white/80 hover:text-white"
            onClick={() => alert('비밀번호 변경 기능은 준비 중입니다.')}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mr-4">
              <Key size={20} className="text-white/60" />
            </div>
            <div className="text-left">
              <Typography.Body className="text-white font-semibold">
                비밀번호 변경
              </Typography.Body>
              <Typography.Caption className="text-white/70">
                계정 보안을 위해 비밀번호를 변경하세요
              </Typography.Caption>
            </div>
          </WaveButton>

          <WaveButton
            variant="ghost"
            className="w-full justify-start p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg text-blue-400 hover:text-blue-300"
            onClick={handleSignOut}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
              <LogOut size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
              <Typography.Body className="text-white font-semibold">
                로그아웃
              </Typography.Body>
              <Typography.Caption className="text-white/70">
                현재 계정에서 로그아웃합니다
              </Typography.Caption>
            </div>
          </WaveButton>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="space-y-6">
        <Typography.H4 className="text-white font-pretendard">
          위험 구역
        </Typography.H4>

        <Typography.Caption className="text-white/80">
          주의가 필요한 작업들입니다
        </Typography.Caption>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl border-2 border-red-400/30 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={20} className="text-red-400" />
              <Typography.Body className="text-red-200 font-semibold">
                경고
              </Typography.Body>
            </div>
            <Typography.Caption className="text-red-300/80">
              아래 작업들은 되돌릴 수 없습니다. 신중히 결정하세요.
            </Typography.Caption>
          </div>

          <WaveButton
            variant="ghost"
            className="w-full justify-start p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-black/40 transition-all duration-200 hover:shadow-lg text-red-400 hover:text-red-300"
            onClick={clearAllData}
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mr-4">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <div className="text-left">
              <Typography.Body className="text-white font-semibold">
                모든 데이터 삭제
              </Typography.Body>
              <Typography.Caption className="text-white/70">
                모든 설정과 데이터를 영구적으로 삭제합니다
              </Typography.Caption>
            </div>
          </WaveButton>

          <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <Typography.Caption className="text-white/60">
              계정을 완전히 삭제하려면 관리자에게 문의해주세요. 이메일:
              support@moonwave.app
            </Typography.Caption>
          </div>
        </div>
      </div>
    </div>
  );
}
