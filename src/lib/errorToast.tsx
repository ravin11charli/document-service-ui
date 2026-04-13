import toast from 'react-hot-toast';

interface ApiError {
  message?: string;
  title?: string;
  detail?: string | null;
  errorCode?: string | null;
  status?: number;
  details?: any;
}

/**
 * Display backend error with title (always visible) and a "See more" toggle
 * that reveals detail / errorCode / payload.
 */
export function showApiError(err: ApiError | any) {
  const title = err?.title || err?.message || 'Request failed';
  const detail = err?.detail || null;
  const errorCode = err?.errorCode || null;
  const status = err?.status;
  const payload = err?.details;

  toast.custom((t) => {
    const id = `err-more-${t.id}`;
    return (
      <div
        className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto border-l-4 border-red-500 p-3`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 break-words">
              {status ? `[${status}] ` : ''}{title}
            </p>
            {detail && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 break-words">{detail}</p>}
            {errorCode && <p className="text-xs text-gray-400 mt-0.5 font-mono">{errorCode}</p>}
            <button
              className="text-xs text-blue-500 hover:underline mt-1"
              onClick={() => {
                const el = document.getElementById(id);
                if (el) el.classList.toggle('hidden');
              }}
            >See more</button>
            <pre id={id} className="hidden mt-2 text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap break-words">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
          <button onClick={() => toast.dismiss(t.id)} className="text-gray-400 hover:text-gray-600 text-sm">×</button>
        </div>
      </div>
    );
  }, { duration: 8000 });
}
