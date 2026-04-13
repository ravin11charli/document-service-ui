import { useState } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Folder, FileText } from 'lucide-react';
import { useTrashList, useRestoreTrashItem, usePermanentDelete, useEmptyTrash } from '../hooks/useTrash';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';

export default function TrashPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useTrashList(page, 25);
  const restoreMut = useRestoreTrashItem();
  const deleteMut = usePermanentDelete();
  const emptyMut = useEmptyTrash();

  const items = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;
  const totalElements = data?.data?.totalElements || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trash</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Deleted items - restore or permanently remove</p>
        </div>
        {items.length > 0 && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => { if (confirm('Permanently delete ALL items in trash?')) emptyMut.mutate(); }}
            loading={emptyMut.isPending}
            icon={<AlertTriangle size={16} />}
          >
            Empty Trash
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Trash2 size={48} />}
          title="Trash is empty"
          description="Deleted items will appear here"
        />
      ) : (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.trashId} className="p-4 flex items-center gap-4">
                {item.isFolder ? (
                  <Folder className="text-amber-500 shrink-0" size={20} />
                ) : (
                  <FileText className="text-blue-500 shrink-0" size={20} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.name || item.originalFileName}</p>
                  <p className="text-xs text-gray-500">
                    {item.isFolder ? 'Folder' : item.type || 'Document'} &middot;
                    {item.displaySize} &middot;
                    Deleted: {new Date(item.deletedAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={item.isFolder ? 'warning' : 'default'}>
                  {item.isFolder ? 'Folder' : 'Document'}
                </Badge>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => restoreMut.mutate(item.documentId || item.trashId)}
                    loading={restoreMut.isPending}
                    icon={<RotateCcw size={14} />}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { if (confirm('Permanently delete?')) deleteMut.mutate(item.documentId || item.trashId); }}
                    loading={deleteMut.isPending}
                    icon={<Trash2 size={14} />}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
