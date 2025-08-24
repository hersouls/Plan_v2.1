import React from 'react';

export const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  return <div className="relative inline-block text-left">{children}</div>;
};

export const DropdownMenuTrigger = ({
  children,
  asChild: _asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) => {
  return <div>{children}</div>;
};

export const DropdownMenuContent = ({
  children,
  className,
  align,
}: {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}) => {
  return (
    <div className={className || ''} role="menu" data-align={align}>
      {children}
    </div>
  );
};

export const DropdownMenuItem = ({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler;
}) => {
  return (
    <div className={className || ''} role="menuitem" onClick={onClick}>
      {children}
    </div>
  );
};

export const DropdownMenuSeparator = ({
  className,
}: {
  className?: string;
}) => <div className={className || ''} role="separator" />;
