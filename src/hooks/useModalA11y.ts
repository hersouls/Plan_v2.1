import { useEffect, useRef } from 'react';

interface UseModalA11yOptions {
  isOpen: boolean;
  onClose: () => void;
}

// Focus trap + ESC to close + body scroll lock
export function useModalA11y({ isOpen, onClose }: UseModalA11yOptions) {
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    // Move focus to first focusable if available, otherwise container
    const timer = setTimeout(() => {
      const target = firstFocusableRef.current || modalContainerRef.current;
      target?.focus?.();
    }, 0);

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }

      if (e.key === 'Tab' && modalContainerRef.current) {
        const focusable =
          modalContainerRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
        const elements = Array.from(focusable).filter(
          el => !el.hasAttribute('data-focus-guard')
        );
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeydown, true);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeydown, true);
      body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  return { firstFocusableRef, modalContainerRef } as const;
}

export default useModalA11y;
