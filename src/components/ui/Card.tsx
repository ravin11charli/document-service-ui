import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, hover, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
        'shadow-sm transition-all duration-200',
        hover && 'hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
