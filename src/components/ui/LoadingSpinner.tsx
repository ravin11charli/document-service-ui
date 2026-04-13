import clsx from 'clsx';

export function LoadingSpinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-blue-600',
          size === 'sm' && 'h-5 w-5',
          size === 'md' && 'h-8 w-8',
          size === 'lg' && 'h-12 w-12',
        )}
      />
    </div>
  );
}
