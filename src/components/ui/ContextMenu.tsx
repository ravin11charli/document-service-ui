import { useEffect, useRef, type ReactNode } from 'react';

export interface ContextMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
}

export function ContextMenu({ open, x, y, onClose, items }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleScroll = () => onClose();
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Adjust position to keep menu on-screen
  const menuWidth = 220;
  const menuHeight = items.length * 36 + 8;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={ref}
      style={{ top: adjustedY, left: adjustedX, width: menuWidth }}
      className="fixed z-[100] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 animate-fade-slide-up"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, idx) => (
        <div key={idx}>
          {item.divider && idx > 0 && <div className="my-1 border-t border-gray-100 dark:border-gray-700" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm text-left transition-colors ${
              item.disabled
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : item.danger
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60'
            }`}
          >
            {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
