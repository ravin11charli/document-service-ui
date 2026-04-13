import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalElements?: number;
}

export function Pagination({ page, totalPages, onPageChange, totalElements }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {totalElements !== undefined && `${totalElements} total items`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          icon={<ChevronLeft size={16} />}
        >
          Prev
        </Button>
        <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
          {page + 1} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          icon={<ChevronRight size={16} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
