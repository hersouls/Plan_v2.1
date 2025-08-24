import React from 'react';

type Align = 'start' | 'center' | 'end';

export const Popover = ({
  children,
  open: _open,
  onOpenChange: _onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  // 단순 래퍼: open/onOpenChange는 상위에서 제어만 하므로 타입만 수용
  return <div className="relative inline-block">{children}</div>;
};

export const PopoverTrigger = ({
  children,
  asChild: _asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) => {
  return <div>{children}</div>;
};

export const PopoverContent = ({
  children,
  className,
  align,
}: {
  children: React.ReactNode;
  className?: string;
  align?: Align;
}) => {
  return (
    <div className={className || ''} role="dialog" data-align={align}>
      {children}
    </div>
  );
};
