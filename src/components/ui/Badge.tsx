import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
        variant === 'success' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        variant === 'warning' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        variant === 'danger' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        variant === 'info' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        className
      )}
    >
      {children}
    </span>
  );
}
