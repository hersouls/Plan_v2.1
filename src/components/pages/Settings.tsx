import React from 'react';
import { SettingsModal } from '../settings';

interface SettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  enableCallback?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({ 
  isOpen = true, 
  onClose,
  enableCallback = false 
}) => {
  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      enableCallback={enableCallback}
    />
  );
};

export default Settings;