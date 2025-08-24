import { ReactNode } from 'react';
import { WaveButton } from '../WaveButton';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'travel' | 'default';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ResponsiveButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  iconSize?: 'responsive' | 'sm' | 'md' | 'lg';
  children?: ReactNode;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
}

export function ResponsiveButton({
  variant = 'ghost',
  size = 'sm',
  className,
  onClick,
  disabled,
  icon,
  children,
  ...aria
}: ResponsiveButtonProps) {
  return (
    <WaveButton
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...aria}
    >
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      {children}
    </WaveButton>
  );
}
