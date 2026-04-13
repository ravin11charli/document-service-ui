import { Eye, Info, Download } from 'lucide-react';

interface Props {
  onPreview?: () => void;
  onDetails?: () => void;
  onDownload?: () => void;
  /**
   * Show actions only on hover (default true). Set false to always show.
   */
  hoverOnly?: boolean;
}

/**
 * Inline icon-button row that appears on hover over a document card/row.
 * Buttons swallow click + contextmenu so they don't bubble up to the row's
 * own click/right-click handlers.
 */
export function DocRowActions({ onPreview, onDetails, onDownload, hoverOnly = true }: Props) {
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const baseCls =
    'p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors';

  return (
    <div
      onClick={stop}
      onContextMenu={stop}
      className={`flex items-center gap-0.5 shrink-0 ${
        hoverOnly ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''
      }`}
    >
      {onPreview && (
        <button type="button" onClick={(e) => { stop(e); onPreview(); }} className={baseCls} title="Preview">
          <Eye size={15} />
        </button>
      )}
      {onDetails && (
        <button type="button" onClick={(e) => { stop(e); onDetails(); }} className={baseCls} title="View Details">
          <Info size={15} />
        </button>
      )}
      {onDownload && (
        <button type="button" onClick={(e) => { stop(e); onDownload(); }} className={baseCls} title="Download">
          <Download size={15} />
        </button>
      )}
    </div>
  );
}
