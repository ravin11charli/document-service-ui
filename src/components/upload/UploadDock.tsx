import { useEffect, useState, useRef } from 'react';
import { ChevronDown, ChevronUp, X, Pause, Play, RotateCw, Trash2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadQueue, type UploadItem } from '../../stores/uploadQueueStore';
import { Button } from '../ui/Button';
import clsx from 'clsx';

function statusColor(s: UploadItem['status']) {
  switch (s) {
    case 'success': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    case 'cancelled': return 'bg-gray-400';
    case 'paused': return 'bg-amber-500';
    default: return 'bg-blue-500';
  }
}

export function UploadDock() {
  const items = useUploadQueue((s) => s.items);
  const open = useUploadQueue((s) => s.open);
  const setOpen = useUploadQueue((s) => s.setOpen);
  const pause = useUploadQueue((s) => s.pause);
  const resume = useUploadQueue((s) => s.resume);
  const cancel = useUploadQueue((s) => s.cancel);
  const retry = useUploadQueue((s) => s.retry);
  const remove = useUploadQueue((s) => s.remove);
  const clearFinished = useUploadQueue((s) => s.clearFinished);
  const setConflictAndRetry = useUploadQueue((s) => s.setConflictAndRetry);

  const [expanded, setExpanded] = useState(true);
  const qc = useQueryClient();
  const prevSuccessCount = useRef(0);

  useEffect(() => {
    const successCount = items.filter((i) => i.status === 'success').length;
    if (successCount > prevSuccessCount.current) {
      qc.invalidateQueries({ queryKey: ['folders'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
    }
    prevSuccessCount.current = successCount;
  }, [items, qc]);

  if (items.length === 0 || !open) return null;

  const running = items.filter((i) => i.status === 'uploading' || i.status === 'queued').length;
  const success = items.filter((i) => i.status === 'success').length;
  const failed = items.filter((i) => i.status === 'error').length;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold">
          Uploads {running > 0 ? `(${running} in progress)` : `· ${success} done${failed ? `, ${failed} failed` : ''}`}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X size={16} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {items.map((it) => {
            const isConflict = it.error?.errorCode === 'CONFLICT';
            return (
              <div key={it.id} className="px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-gray-400 shrink-0" />
                  <span className="flex-1 truncate font-medium" title={it.file.name}>{it.file.name}</span>
                  <span className="text-xs text-gray-400">{(it.file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-500 capitalize">
                    {it.method} · {it.status}
                    {it.partInfo && it.status === 'uploading' && ` · part ${it.partInfo.current}/${it.partInfo.total}`}
                  </span>
                  <div className="flex-1" />
                  {it.status === 'success' && <CheckCircle size={14} className="text-green-500" />}
                  {it.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                </div>

                {/* Progress bar */}
                {(it.status === 'uploading' || it.status === 'paused' || it.status === 'success') && (
                  <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className={clsx('h-1.5 transition-all', statusColor(it.status))} style={{ width: `${it.progress}%` }} />
                  </div>
                )}

                {/* Error message */}
                {it.status === 'error' && (
                  <div className="mt-1.5 text-xs text-red-500">
                    <div className="font-semibold">{it.error?.title}</div>
                    {it.error?.detail && <div className="text-red-400">{it.error.detail}</div>}
                  </div>
                )}

                {/* Controls */}
                <div className="mt-2 flex gap-1 flex-wrap">
                  {it.status === 'uploading' && it.method === 'presigned' && (
                    <Button size="sm" variant="ghost" onClick={() => pause(it.id)} icon={<Pause size={12} />}>Pause</Button>
                  )}
                  {it.status === 'paused' && (
                    <Button size="sm" variant="ghost" onClick={() => resume(it.id)} icon={<Play size={12} />}>Resume</Button>
                  )}
                  {(it.status === 'uploading' || it.status === 'queued' || it.status === 'paused') && (
                    <Button size="sm" variant="ghost" onClick={() => cancel(it.id)} icon={<X size={12} />}>Cancel</Button>
                  )}
                  {it.status === 'error' && !isConflict && (
                    <Button size="sm" variant="ghost" onClick={() => retry(it.id)} icon={<RotateCw size={12} />}>Retry</Button>
                  )}
                  {isConflict && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setConflictAndRetry(it.id, 'REPLACE')}>Replace</Button>
                      <Button size="sm" variant="secondary" onClick={() => setConflictAndRetry(it.id, 'KEEP_BOTH')}>Keep Both</Button>
                      <Button size="sm" variant="ghost" onClick={() => cancel(it.id)}>Skip</Button>
                    </>
                  )}
                  {(it.status === 'success' || it.status === 'cancelled' || it.status === 'error') && (
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)} icon={<Trash2 size={12} />} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <Button size="sm" variant="ghost" onClick={clearFinished}>Clear finished</Button>
      </div>
    </div>
  );
}
